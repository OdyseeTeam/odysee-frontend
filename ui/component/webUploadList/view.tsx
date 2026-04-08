import * as React from 'react';
import * as ICONS from 'constants/icons';
import Icon from 'component/common/icon';
import Card from 'component/common/card';
import FileThumbnail from 'component/fileThumbnail';
import WebUploadItem from './internal/web-upload-item';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { doOpenModal as doOpenModalAction } from 'redux/actions/app';
import {
  doPublishResume as doPublishResumeAction,
  doUpdateUploadRemove as doUpdateUploadRemoveAction,
} from 'redux/actions/publish';
import { selectCurrentUploads, selectUploadCount, selectActivePipelineItems } from 'redux/selectors/publish';
import { doUpdatePipelineItem } from 'redux/actions/publishPipeline';
import type { PipelineItem } from 'redux/actions/publishPipeline';

const STAGE_LABELS: Record<string, string> = {
  queued: 'Queued',
  converting: 'Converting',
  optimizing: 'Optimizing',
  uploading: 'Uploading',
  ready: 'Ready to publish',
  processing: 'Processing',
  published: 'Published',
  paused: 'Paused',
  error: 'Error',
};

function formatSpeed(bytesPerSecond: number) {
  if (bytesPerSecond >= 1e9) return `${(bytesPerSecond / 1e9).toFixed(1)} GB/s`;
  if (bytesPerSecond >= 1e6) return `${(bytesPerSecond / 1e6).toFixed(1)} MB/s`;
  if (bytesPerSecond >= 1e3) return `${(bytesPerSecond / 1e3).toFixed(0)} KB/s`;
  return `${Math.round(bytesPerSecond)} B/s`;
}

function canPause(item: PipelineItem) {
  return !['error', 'published', 'paused', 'pausing', 'queued', 'processing', 'ready'].includes(item.stage);
}

function getProgressText(item: PipelineItem) {
  if (item.stage === 'published') return __('Published');
  if (item.stage === 'error') return __('Failed');
  if (item.stage === 'queued') return __('Queued');
  const pct = Math.round(item.progress);
  const label = STAGE_LABELS[item.stage] || item.stage;
  return `${__(label)}... (${pct}%)`;
}

export default function WebUploadList() {
  const dispatch = useAppDispatch();
  const currentUploads = useAppSelector(selectCurrentUploads);
  const uploadCount = useAppSelector(selectUploadCount);
  const allPipelineItems = useAppSelector(selectActivePipelineItems) as PipelineItem[];
  const pipelineItems = allPipelineItems.filter((item) => item.stage !== 'published');
  const doPublishResume = (arg0: any) => dispatch(doPublishResumeAction(arg0));
  const doUpdateUploadRemove = (arg0: string, arg1: any) => dispatch(doUpdateUploadRemoveAction(arg0, arg1));
  const doOpenModal = (arg0: string, arg1: {}) => dispatch(doOpenModalAction(arg0, arg1));

  const hasActivity = !!uploadCount || pipelineItems.length > 0;

  if (!hasActivity) return null;

  return (
    <Card
      title={__('Currently Uploading')}
      subtitle={__('Leave the app running until upload is complete')}
      body={
        <section>
          {pipelineItems.map((item: PipelineItem) => (
            <li
              key={item.id}
              className="claim-preview__wrapper claim-preview__wrapper--row web-upload-item claim-preview claim-preview--inactive card--inline"
            >
              <FileThumbnail thumbnail={item.thumbnail} />
              <div className="claim-preview-metadata">
                <div className="claim-preview-info">
                  <div className="claim-preview__title">{item.title || item.filename}</div>
                  {canPause(item) && (
                    <button
                      className="web-upload-item__round-btn"
                      title={__('Pause')}
                      onClick={async () => {
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
                            doUpdatePipelineItem(item.id, {
                              previousStage: item.previousStage || stage,
                              stage: 'paused',
                            })
                          );
                        }
                      }}
                    >
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="4" width="4" height="16" />
                        <rect x="14" y="4" width="4" height="16" />
                      </svg>
                    </button>
                  )}
                  {item.stage === 'paused' && (
                    <button
                      className="web-upload-item__round-btn"
                      title={__('Resume')}
                      onClick={() => {
                        if (item.previousStage === 'uploading') {
                          (window as any).__earlyUploadHandles?.[item.id]?.resume();
                        } else {
                          const ph = (window as any).__pipelineHandles?.[item.id];
                          ph?.handleRef?.current?.resume?.();
                          ph?.resume?.();
                        }
                        dispatch(doUpdatePipelineItem(item.id, { stage: item.previousStage || 'converting' }));
                      }}
                    >
                      <Icon icon={ICONS.PLAY} size={14} />
                    </button>
                  )}
                </div>
                <div className="claim-upload__progress--label">{item.filename}</div>
                <div className="web-upload-item__stats">
                  <span>
                    {item.stage === 'paused' || item.stage === 'pausing'
                      ? formatSpeed(0)
                      : item.stage === 'uploading' && item.uploadSpeed
                        ? formatSpeed(item.uploadSpeed)
                        : ''}
                  </span>
                  <span>
                    {item.stage !== 'published' && item.stage !== 'error' && item.stage !== 'queued'
                      ? `${Math.round(item.progress)}%`
                      : ''}
                  </span>
                </div>
                <div className="claim-upload__progress--outer card--inline">
                  <div className="claim-upload__progress--inner" style={{ width: `${Math.round(item.progress)}%` }}>
                    <span className="claim-upload__progress--inner-text">{getProgressText(item)}</span>
                  </div>
                </div>
              </div>
            </li>
          ))}
          {Object.values(currentUploads).map((uploadItem: any) => (
            <WebUploadItem
              key={`upload${uploadItem.params.name}`}
              uploadItem={uploadItem}
              doPublishResume={doPublishResume}
              doUpdateUploadRemove={doUpdateUploadRemove}
              doOpenModal={doOpenModal}
            />
          ))}
        </section>
      }
    />
  );
}
