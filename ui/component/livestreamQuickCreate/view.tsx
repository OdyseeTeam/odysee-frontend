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
import './style.scss';

const DEFAULT_THUMBNAIL = '/public/img/livestream-default-thumb.svg';

// Invalid URI characters replaced with hyphens
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
  const [publishing, setPublishing] = React.useState(false);

  const channelName = activeChannel?.name;
  const canPublish = title.trim().length > 0 && balance >= 0.001 && !publishing;

  async function handleCreate() {
    if (!canPublish || !activeChannel) return;

    setPublishing(true);

    const name = titleToName(title) || 'livestream';
    const releaseTime = scheduled ? dateToLinux(scheduleDate) : undefined;
    const thumbUrl = thumbnail || DEFAULT_THUMBNAIL;

    // Populate the redux publish form
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
      <h2 className="quick-create__heading">{__('Quick Stream Setup')}</h2>
      <p className="quick-create__subtitle">
        {__('Create a stream claim so you can go live. Only a title is required.')}
      </p>

      {/* Title */}
      <div className="quick-create__field">
        <label className="quick-create__label">{__('Title')}</label>
        <input
          className="quick-create__input"
          type="text"
          placeholder={__('My Livestream')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          autoFocus
        />
        {title && (
          <span className="quick-create__uri-preview">
            {channelName}/{titleToName(title) || 'livestream'}
          </span>
        )}
      </div>

      {/* Schedule */}
      <div className="quick-create__field">
        <label className="quick-create__label">{__('When do you want to go live?')}</label>
        <div className="quick-create__radio-row">
          <label className="quick-create__radio">
            <input type="radio" checked={!scheduled} onChange={() => setScheduled(false)} />
            <span>{__('Anytime')}</span>
          </label>
          <label className="quick-create__radio">
            <input type="radio" checked={scheduled} onChange={() => setScheduled(true)} />
            <span>{__('Scheduled')}</span>
          </label>
          {scheduled && (
            <div className="quick-create__date-picker">
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
        </div>
      </div>

      {/* Tags */}
      <div className="quick-create__field">
        <label className="quick-create__label">{__('Tags')}</label>
        <TagsSearch
          onSelect={(newTags) => setTags(newTags)}
          onRemove={(tag) => setTags((prev) => prev.filter((t) => (typeof t === 'string' ? t : t.name) !== (typeof tag === 'string' ? tag : tag.name)))}
          tagsPassedIn={tags}
          limitSelect={5}
          placeholder={__('Add tags...')}
          hideSuggestions
        />
      </div>

      {/* Thumbnail (optional) */}
      <div className="quick-create__field">
        <label className="quick-create__label">
          {__('Thumbnail')} <span className="quick-create__optional">({__('optional')})</span>
        </label>
        <input
          className="quick-create__input"
          type="text"
          placeholder={__('Paste image URL or leave blank for default')}
          value={thumbnail}
          onChange={(e) => setThumbnail(e.target.value)}
        />
        <div className="quick-create__thumb-preview">
          <img
            src={thumbnail || DEFAULT_THUMBNAIL}
            alt=""
            onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_THUMBNAIL; }}
          />
        </div>
      </div>

      {/* Create button */}
      <button
        className="quick-create__submit"
        onClick={handleCreate}
        disabled={!canPublish}
      >
        {publishing ? __('Creating...') : __('Create Stream')}
      </button>
    </div>
  );
}
