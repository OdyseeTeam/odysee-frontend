import React from 'react';
import './style.scss';
import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import Icon from 'component/common/icon';
import Button from 'component/button';
import Tooltip from 'component/common/tooltip';
import { Menu as MuiMenu } from '@mui/material';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import { NavLink, useNavigate } from 'react-router-dom';
import { formatLbryUrlForWeb } from 'util/url';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectActivePipelineItems, selectPublishFormValue } from 'redux/selectors/publish';
import { doRemovePipelineItem, doUpdatePipelineItem } from 'redux/actions/publishPipeline';
import { dequeue } from 'util/pipeline-queue';
import { doSwitchPublishForm } from 'redux/actions/publish';
import type { PipelineItem } from 'redux/actions/publishPipeline';

const STAGE_LABELS: Record<string, string> = {
  queued: 'Queued',
  converting: 'Converting',
  optimizing: 'Optimizing',
  uploading: 'Uploading',
  ready: 'Ready to publish',
  processing: 'Processing',
  pausing: 'Pausing',
  published: 'Published',
  paused: 'Paused',
  error: 'Error',
};

const STEP_LABELS: Record<string, string> = {
  converting: 'Convert',
  optimizing: 'Optimize',
  uploading: 'Upload',
  processing: 'Publish',
};

const formatPipelineProgress = (progress: number) => {
  const rounded = Math.max(0, Math.min(100, progress));
  return String(Math.round(rounded));
};

const formatSpeed = (bytesPerSecond: number) => {
  if (bytesPerSecond >= 1e9) return `${(bytesPerSecond / 1e9).toFixed(1)} GB/s`;
  if (bytesPerSecond >= 1e6) return `${(bytesPerSecond / 1e6).toFixed(1)} MB/s`;
  if (bytesPerSecond >= 1e3) return `${(bytesPerSecond / 1e3).toFixed(0)} KB/s`;
  return `${Math.round(bytesPerSecond)} B/s`;
};

type Props = {
  hasActivity: boolean;
  onUploadClick: () => void;
};

export default function UploadManagerMenu(props: Props) {
  const { hasActivity, onUploadClick } = props;
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const pipelineItems = useAppSelector(selectActivePipelineItems) as PipelineItem[];
  const uploadEntries: any[] = [];
  const activeFormId = useAppSelector((state) => selectPublishFormValue(state, 'activeFormId'));

  function handleEntryClick(itemId: string, step?: number) {
    dispatch({ type: 'PUBLISH_SET_ACTIVE_FORM', data: { id: itemId } });
    if (step !== undefined) {
      dispatch({ type: 'PUBLISH_SAVE_STEP', data: { formId: itemId, activeStep: step } });
    }
    navigate(`/$/${PAGES.UPLOAD}`);
    handleClose();
  }

  const [anchorEl, setAnchorEl] = React.useState(null);
  const [clicked, setClicked] = React.useState(false);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    if (hasActivity) {
      setAnchorEl(!anchorEl ? event.currentTarget : null);
    } else {
      onUploadClick();
    }
  };

  const handleClose = () => setAnchorEl(null);

  const handleClickAway = () => {
    if (!clicked) {
      if (open) setClicked(true);
    } else {
      setAnchorEl(null);
      setClicked(false);
    }
  };

  React.useEffect(() => {
    if (!open) setClicked(false);
  }, [open]);

  const menuProps = {
    id: 'upload-manager-menu',
    anchorEl,
    open,
    onClose: handleClose,
    MenuListProps: {
      'aria-labelledby': 'upload-manager-button',
      sx: { padding: 0 },
    },
    className: 'menu__list--header menu__list--upload-manager',
    anchorOrigin: { vertical: 'bottom' as const, horizontal: 'center' as const },
    transformOrigin: { vertical: 'top' as const, horizontal: 'center' as const },
    sx: { 'z-index': 2 },
    PaperProps: { className: 'MuiMenu-list--paper' },
    disableScrollLock: true,
  };

  function renderPipelineEntry(item: PipelineItem) {
    return (
      <div
        className="upload-manager__item"
        key={item.id}
        onClick={() => {
          if (item.stage === 'published' && item.uri) {
            navigate(formatLbryUrlForWeb(item.uri));
            handleClose();
          } else {
            handleEntryClick(item.formId || item.id);
          }
        }}
      >
        <div className={'upload-manager__icon' + (item.stage === 'ready' ? ' upload-manager__icon--ready' : '')}>
          <Icon
            sectionIcon
            icon={(() => {
              const s = item.stage === 'paused' || item.stage === 'pausing' ? item.previousStage : item.stage;
              return item.stage === 'published'
                ? ICONS.COMPLETED
                : s === 'queued'
                  ? ICONS.TIME
                  : s === 'converting'
                    ? ICONS.REFRESH
                    : s === 'optimizing'
                      ? ICONS.SETTINGS
                      : s === 'processing'
                        ? ICONS.REFRESH
                        : item.stage === 'error'
                          ? ICONS.ALERT
                          : ICONS.PUBLISH;
            })()}
          />
        </div>
        <div className="upload-manager__info">
          <div className="upload-manager__name-row">
            <div className="upload-manager__name">{item.filename}</div>
            {item.stage === 'uploading' && item.uploadSpeed ? (
              <span className="upload-manager__speed">{formatSpeed(item.uploadSpeed)}</span>
            ) : null}
          </div>
          {(() => {
            const displaySteps = [...(item.steps || ['uploading']), 'processing'];
            const activeStage = item.stage === 'paused' || item.stage === 'pausing' ? item.previousStage : item.stage;
            const stepIndex = displaySteps.indexOf(activeStage);
            const allDone = item.stage === 'published';
            const isReady = item.stage === 'ready';
            return (
              <div className="upload-manager__stage">
                <div className="upload-manager__steps">
                  {displaySteps.map((step, i) => {
                    const isDone = allDone || (isReady && step !== 'processing') || (stepIndex >= 0 && i < stepIndex);
                    const isActive = (!allDone && !isReady && i === stepIndex) || (isReady && step === 'processing');
                    return (
                      <React.Fragment key={step}>
                        {i > 0 && <span className="upload-manager__step-separator">›</span>}
                        <span
                          className={
                            'upload-manager__step' +
                            (isDone ? ' upload-manager__step--done' : '') +
                            (isActive ? ' upload-manager__step--active' : '')
                          }
                        >
                          {__(STEP_LABELS[step] || step)}
                        </span>
                      </React.Fragment>
                    );
                  })}
                </div>
                {item.stage === 'ready' ? (
                  <span className="upload-manager__ready-badge">{__('Action required')}</span>
                ) : (
                  item.stage !== 'error' &&
                  item.stage !== 'published' &&
                  item.stage !== 'queued' && (
                    <span className="upload-manager__percent">{formatPipelineProgress(item.progress)}%</span>
                  )
                )}
              </div>
            );
          })()}
          {item.stage !== 'error' && item.stage !== 'published' && (
            <div className="upload-manager__progress">
              <div className="upload-manager__progress-bar" style={{ width: `${item.progress}%` }} />
            </div>
          )}
        </div>
        <div className="upload-manager__actions">
          {item.stage !== 'error' &&
            item.stage !== 'published' &&
            item.stage !== 'paused' &&
            item.stage !== 'pausing' &&
            item.stage !== 'queued' &&
            item.stage !== 'processing' &&
            item.stage !== 'ready' && (
              <button
                className="upload-manager__pause"
                onClick={async (e) => {
                  e.stopPropagation();
                  const stage = item.stage;
                  dispatch(doUpdatePipelineItem(item.id, { previousStage: stage, stage: 'pausing' }));
                  if (stage === 'uploading') {
                    (window as any).__earlyUploadHandles?.[item.id]?.pause();
                    dispatch(doUpdatePipelineItem(item.id, { previousStage: stage, stage: 'paused' }));
                  } else {
                    const ph = (window as any).__pipelineHandles?.[item.id];
                    await ph?.handleRef?.current?.pause?.();
                    ph?.pause?.();
                    dispatch(
                      doUpdatePipelineItem(item.id, { previousStage: item.previousStage || stage, stage: 'paused' })
                    );
                  }
                }}
                title={__('Pause')}
              >
                <span className="upload-manager__pause-icon" />
              </button>
            )}
          {item.stage === 'pausing' && (
            <button className="upload-manager__pause" disabled title={__('Pausing')}>
              <span className="upload-manager__pause-icon" />
            </button>
          )}
          {item.stage === 'paused' && (
            <button
              className="upload-manager__pause"
              onClick={(e) => {
                e.stopPropagation();
                if (item.previousStage === 'uploading') {
                  (window as any).__earlyUploadHandles?.[item.id]?.resume();
                } else {
                  const ph = (window as any).__pipelineHandles?.[item.id];
                  ph?.handleRef?.current?.resume?.();
                  ph?.resume?.();
                }
                dispatch(doUpdatePipelineItem(item.id, { stage: item.previousStage || 'converting' }));
              }}
              title={__('Resume')}
            >
              <Icon icon={ICONS.PLAY} size={14} />
            </button>
          )}
          {(item.stage === 'error' || item.stage === 'queued' || item.stage === 'published') && (
            <button
              className="upload-manager__remove"
              onClick={(e) => {
                e.stopPropagation();
                if (item.stage === 'queued') dequeue(item.id);
                dispatch(doRemovePipelineItem(item.id));
              }}
              title={item.stage === 'published' ? __('Dismiss') : __('Remove')}
            >
              <Icon icon={ICONS.REMOVE} size={14} />
            </button>
          )}
        </div>
      </div>
    );
  }

  function renderUploadEntry(upload: any) {
    return (
      <div className="upload-manager__item" key={upload.params?.guid}>
        <div className="upload-manager__icon">
          <Icon icon={ICONS.PUBLISH} sectionIcon />
        </div>
        <div className="upload-manager__info">
          <div className="upload-manager__name">{upload.params?.name || __('Uploading...')}</div>
          <div className="upload-manager__stage">
            {upload.status === 'error' ? __('Error') : __('Uploading %progress%%', { progress: upload.progress || 0 })}
          </div>
        </div>
      </div>
    );
  }

  const overallProgress = React.useMemo(() => {
    const items: number[] = [];
    pipelineItems.forEach((item) => {
      if (item.stage !== 'error' && item.stage !== 'published') {
        items.push(item.progress);
      }
    });
    uploadEntries.forEach((upload: any) => {
      if (upload.status !== 'error') {
        items.push(upload.progress || 0);
      }
    });
    if (items.length === 0) return 0;
    return Math.round(items.reduce((a, b) => a + b, 0) / items.length);
  }, [pipelineItems, uploadEntries]);

  const progressSnapshotsRef = React.useRef<Map<string, { time: number; progress: number }>>(new Map());

  const remainingTime = React.useMemo(() => {
    const now = Date.now();
    const snapshots = progressSnapshotsRef.current;
    let totalSecondsLeft = 0;
    let hasEstimate = false;

    pipelineItems.forEach((item) => {
      if (item.stage === 'error' || item.stage === 'published') {
        snapshots.delete(item.id);
        return;
      }

      if (item.stage === 'paused' || item.stage === 'pausing' || item.stage === 'ready' || item.stage === 'queued') {
        snapshots.delete(item.id);
        return;
      }

      if (item.stage === 'uploading' && item.uploadSpeed && item.uploadSpeed > 0 && item.fileSize) {
        const remainingBytes = item.fileSize * (1 - item.progress / 100);
        totalSecondsLeft += remainingBytes / item.uploadSpeed;
        hasEstimate = true;
        snapshots.set(item.id, { time: now, progress: item.progress });
        return;
      }

      const snap = snapshots.get(item.id);
      if (!snap || snap.progress > item.progress) {
        snapshots.set(item.id, { time: now, progress: item.progress });
        return;
      }
      const elapsed = (now - snap.time) / 1000;
      const delta = item.progress - snap.progress;
      if (elapsed >= 2 && delta >= 1) {
        const rate = delta / elapsed;
        totalSecondsLeft += (100 - item.progress) / rate;
        hasEstimate = true;
      }
    });

    uploadEntries.forEach((upload: any) => {
      if (upload.status === 'error') return;
      const id = `upload-${upload.params?.guid}`;
      const snap = snapshots.get(id);
      const progress = upload.progress || 0;
      if (!snap || snap.progress > progress) {
        snapshots.set(id, { time: now, progress });
        return;
      }
      const elapsed = (now - snap.time) / 1000;
      const delta = progress - snap.progress;
      if (elapsed >= 2 && delta >= 1) {
        const rate = delta / elapsed;
        totalSecondsLeft += (100 - progress) / rate;
        hasEstimate = true;
      }
    });

    if (!hasEstimate) return null;
    const s = Math.round(totalSecondsLeft);
    if (s < 60) return __('%seconds%s left', { seconds: s });
    if (s < 3600) return __('%minutes%m left', { minutes: Math.round(s / 60) });
    return __('%hours%h %minutes%m left', { hours: Math.floor(s / 3600), minutes: Math.round((s % 3600) / 60) });
  }, [pipelineItems, uploadEntries]);

  const allComplete =
    pipelineItems.length > 0 && pipelineItems.every((item) => item.stage === 'published' || item.stage === 'error');

  const [pulsing, setPulsing] = React.useState(false);
  const pulseSeenRef = React.useRef(false);

  React.useEffect(() => {
    if (allComplete && !pulseSeenRef.current) {
      setPulsing(true);
    }
    if (!allComplete) {
      pulseSeenRef.current = false;
      setPulsing(false);
    }
  }, [allComplete]);

  React.useEffect(() => {
    if (open && pulsing) {
      setPulsing(false);
      pulseSeenRef.current = true;
    }
  }, [open, pulsing]);

  const readyCount = pipelineItems.filter((item) => item.stage === 'ready').length;

  const ringStroke = 8;
  const ringRadius = 50 - ringStroke / 2;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (overallProgress / 100) * ringCircumference;

  return (
    <>
      <Tooltip title={hasActivity ? __('Upload Progress') : __('Upload')}>
        <Button
          id="upload-manager-button"
          className={'header__navigationItem--icon' + (pulsing ? ' upload-manager__complete-pulse' : '')}
          onClick={handleClick}
        >
          {hasActivity && overallProgress > 0 && (
            <svg className="upload-manager__ring" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="upload-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--color-primary)" />
                  <stop offset="100%" stopColor="#f77937" />
                </linearGradient>
              </defs>
              <circle
                className="upload-manager__ring-progress"
                cx="50"
                cy="50"
                r={ringRadius}
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
              />
            </svg>
          )}
          <Icon size={18} icon={ICONS.PUBLISH} aria-hidden />
          {readyCount > 0 && (
            <span className="notification__bubble">
              <span className={'notification__count' + (readyCount > 9 ? ' notification__bubble--small' : '')}>
                {readyCount}
              </span>
            </span>
          )}
        </Button>
      </Tooltip>

      {hasActivity && (
        <ClickAwayListener onClickAway={handleClickAway}>
          <MuiMenu {...menuProps}>
            {pipelineItems.length + uploadEntries.length > 1 &&
              (() => {
                let totalSpeed = 0;
                const stageCounts: Record<string, number> = {};
                pipelineItems.forEach((item) => {
                  if (
                    item.uploadSpeed &&
                    item.stage !== 'paused' &&
                    item.stage !== 'pausing' &&
                    item.stage !== 'ready' &&
                    item.stage !== 'queued'
                  )
                    totalSpeed += item.uploadSpeed;
                  const stage =
                    item.stage === 'paused' || item.stage === 'pausing' ? item.previousStage || item.stage : item.stage;
                  if (stage !== 'published' && stage !== 'error' && stage !== 'ready') {
                    stageCounts[stage] = (stageCounts[stage] || 0) + 1;
                  }
                });
                if (uploadEntries.length > 0) {
                  stageCounts['uploading'] = (stageCounts['uploading'] || 0) + uploadEntries.length;
                }
                const summary = Object.entries(stageCounts)
                  .map(([stage, count]) =>
                    __('%count% %stage%', { count, stage: __(STAGE_LABELS[stage] || stage).toLowerCase() })
                  )
                  .join(', ');
                return (
                  <div className="upload-manager__header">
                    <span>
                      {summary || __('%count% uploads', { count: pipelineItems.length + uploadEntries.length })}
                      {totalSpeed > 0 && (
                        <span className="upload-manager__header-speed"> · {formatSpeed(totalSpeed)}</span>
                      )}
                      {remainingTime && <span className="upload-manager__header-speed"> · {remainingTime}</span>}
                    </span>
                    <span className="upload-manager__header-progress">{overallProgress}%</span>
                  </div>
                );
              })()}
            <div className="upload-manager__list">
              {pipelineItems.map(renderPipelineEntry)}
              {uploadEntries.map(renderUploadEntry)}
            </div>

            <div
              className="upload-manager__more"
              onClick={() => {
                dispatch({ type: 'PUBLISH_SET_ACTIVE_FORM', data: { id: '__new__' } });
                navigate(`/$/${PAGES.UPLOAD}`);
                handleClose();
              }}
            >
              {__('Upload More')}
            </div>
          </MuiMenu>
        </ClickAwayListener>
      )}
    </>
  );
}
