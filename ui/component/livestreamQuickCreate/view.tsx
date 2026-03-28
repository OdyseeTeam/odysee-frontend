import React from 'react';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectActiveChannelClaim } from 'redux/selectors/app';
import { selectBalance } from 'redux/selectors/wallet';
import { doClearPublish, doUpdatePublishForm, doPublishDesktop } from 'redux/actions/publish';
import { doToast } from 'redux/actions/notifications';
import TagsSearch from 'component/tagsSearch';
import DatePicker from 'react-datepicker';
import * as PUBLISH_TYPES from 'constants/publish_types';
import * as SETTINGS from 'constants/settings';
import { selectClientSetting, selectLanguage } from 'redux/selectors/settings';
import classnames from 'classnames';
import './style.scss';

const DEFAULT_THUMBNAIL = '/public/img/livestream-default-thumb.svg';

const INVALID_URI_REGEX =
  /[ =&#:$@%?;/\\\n"<>%{}|^~[\]`\u{0000}-\u{0008}\u{000b}-\u{000c}\u{000e}-\u{001F}\u{D800}-\u{DFFF}\u{FFFE}-\u{FFFF}]/gu;

function titleToName(title: string): string {
  return title.replace(INVALID_URI_REGEX, '-').toLowerCase().replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

function dateToLinux(date: Date): number {
  return Math.round(date.getTime() / 1000);
}

function getDefaultScheduledDate(): Date {
  const d = new Date();
  d.setHours(d.getHours() + 1);
  d.setMinutes(0, 0, 0);
  return d;
}

type Props = {
  onCreated?: () => void;
};

export default function LivestreamQuickCreate({ onCreated }: Props) {
  const dispatch = useAppDispatch();
  const activeChannel = useAppSelector(selectActiveChannelClaim);
  const balance = useAppSelector(selectBalance);
  const clock24h = useAppSelector((state) => selectClientSetting(state, SETTINGS.CLOCK_24H));
  const appLanguage = useAppSelector((state) => selectLanguage(state));

  const [title, setTitle] = React.useState('');
  const [tags, setTags] = React.useState<Array<Tag>>([]);
  const [scheduled, setScheduled] = React.useState(false);
  const [scheduleDate, setScheduleDate] = React.useState<Date>(getDefaultScheduledDate);
  const [thumbnail, setThumbnail] = React.useState('');
  const [showThumb, setShowThumb] = React.useState(false);
  const [publishing, setPublishing] = React.useState(false);

  const channelName = activeChannel?.name;
  const canPublish = title.trim().length > 0 && balance >= 0.001 && !publishing;
  const generatedName = titleToName(title) || 'livestream';

  async function handleCreate() {
    if (!canPublish || !activeChannel) return;
    setPublishing(true);

    const name = generatedName;
    const releaseTime = scheduled ? dateToLinux(scheduleDate) : undefined;
    const thumbUrl = thumbnail || DEFAULT_THUMBNAIL;

    dispatch(doClearPublish());
    dispatch(
      doUpdatePublishForm({
        type: PUBLISH_TYPES.LIVESTREAM,
        liveCreateType: 'new_placeholder',
        title: title.trim(),
        name,
        channel: channelName,
        bid: 0.001,
        tags: tags.map((t) => (typeof t === 'string' ? { name: t } : t)),
        thumbnail_url: thumbUrl,
        thumbnail: thumbUrl,
        releaseTime,
        language: appLanguage || 'en',
        description: '',
        nsfw: false,
        contentIsFree: true,
      })
    );

    try {
      await dispatch(doPublishDesktop(undefined, false));
      dispatch(doToast({ message: __('Stream claim created!') }));
      onCreated?.();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      dispatch(doToast({ isError: true, message: msg || __('Failed to create stream claim.') }));
    } finally {
      setPublishing(false);
    }
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  return (
    <div className="quick-create">
      <div className="quick-create__card">
        {/* Header */}
        <div className="quick-create__header">
          <div className="quick-create__icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" />
            </svg>
          </div>
          <div>
            <h2 className="quick-create__title">{__('Quick Stream Setup')}</h2>
            <p className="quick-create__subtitle">
              {__('Create a stream claim to go live. Only a title is required.')}
            </p>
          </div>
        </div>

        {/* Title */}
        <div className="quick-create__section">
          <label className="quick-create__label">{__('Stream Title')}</label>
          <input
            className="quick-create__input"
            type="text"
            placeholder={__('Enter a title for your stream...')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            autoFocus
          />
          {title && (
            <span className="quick-create__uri">
              {channelName}/{generatedName}
            </span>
          )}
        </div>

        {/* When to go live */}
        <div className="quick-create__section">
          <label className="quick-create__label">{__('When do you want to go live?')}</label>
          <div className="quick-create__schedule">
            <button
              className={classnames('quick-create__schedule-btn', {
                'quick-create__schedule-btn--active': !scheduled,
              })}
              onClick={() => setScheduled(false)}
              type="button"
            >
              {__('Anytime')}
            </button>
            <button
              className={classnames('quick-create__schedule-btn', {
                'quick-create__schedule-btn--active': scheduled,
              })}
              onClick={() => setScheduled(true)}
              type="button"
            >
              {__('Scheduled')}
            </button>
          </div>
          {scheduled && (
            <div className="quick-create__date-row">
              <DatePicker
                selected={scheduleDate}
                onChange={(d: Date | null) => d && setScheduleDate(d)}
                showTimeSelect
                dateFormat={clock24h ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd h:mm aa'}
                timeFormat={clock24h ? 'HH:mm' : 'h:mm aa'}
                className="quick-create__input quick-create__input--date"
                minDate={todayStart}
              />
            </div>
          )}
          <p className="quick-create__hint">
            {!scheduled
              ? __('Your stream will be ready anytime you start broadcasting.')
              : __('Scheduled streams appear on your channel page and for followers.')}
          </p>
        </div>

        {/* Tags */}
        <div className="quick-create__section">
          <label className="quick-create__label">{__('Tags')}</label>
          <TagsSearch
            onSelect={(newTags) => setTags(newTags)}
            onRemove={(tag) =>
              setTags((prev) =>
                prev.filter(
                  (t) =>
                    (typeof t === 'string' ? t : t.name) !==
                    (typeof tag === 'string' ? tag : tag.name)
                )
              )
            }
            tagsPassedIn={tags}
            limitSelect={5}
            placeholder={__('Add up to 5 tags...')}
            hideSuggestions
          />
        </div>

        {/* Thumbnail toggle */}
        <div className="quick-create__section">
          <button
            className="quick-create__expand-btn"
            onClick={() => setShowThumb(!showThumb)}
            type="button"
          >
            <svg
              className={classnames('quick-create__chevron', { 'quick-create__chevron--open': showThumb })}
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
            {__('Custom Thumbnail')}
            <span className="quick-create__optional">{__('optional')}</span>
          </button>

          {showThumb && (
            <div className="quick-create__thumb-section">
              <input
                className="quick-create__input"
                type="text"
                placeholder={__('Paste image URL...')}
                value={thumbnail}
                onChange={(e) => setThumbnail(e.target.value)}
              />
              <div className="quick-create__thumb-preview">
                <img
                  src={thumbnail || DEFAULT_THUMBNAIL}
                  alt=""
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = DEFAULT_THUMBNAIL;
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          className={classnames('quick-create__submit', {
            'quick-create__submit--publishing': publishing,
          })}
          onClick={handleCreate}
          disabled={!canPublish}
          type="button"
        >
          {publishing ? (
            <>
              <span className="quick-create__spinner" />
              {__('Creating...')}
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" />
              </svg>
              {__('Create Stream')}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
