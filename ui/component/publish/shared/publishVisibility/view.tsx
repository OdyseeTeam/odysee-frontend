import React from 'react';
import './style.scss';
import Icon from 'component/common/icon';
import * as ICONS from 'constants/icons';
import { FormField } from 'component/common/form';
import PublishReleaseDate from 'component/publish/shared/publishReleaseDate';
import { MS } from 'constants/date-time';
import { getClaimScheduledState, isClaimPrivate, isClaimUnlisted } from 'util/claim';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectIsNonPublicVisibilityAllowed, selectPublishFormValue } from 'redux/selectors/publish';
import { doUpdatePublishForm } from 'redux/actions/publish';

const PublishVisibility = () => {
  const dispatch = useAppDispatch();
  const visibility: Visibility = useAppSelector((state) => selectPublishFormValue(state, 'visibility'));
  const scheduledShow: boolean = useAppSelector((state) => selectPublishFormValue(state, 'scheduledShow'));
  const ce: StreamClaim | null | undefined = useAppSelector((state) => selectPublishFormValue(state, 'claimToEdit'));
  const isNonPublicAllowed = useAppSelector(selectIsNonPublicVisibilityAllowed);
  let showEditWarning = false;

  if (ce) {
    const pastScheduledState = getClaimScheduledState(ce);
    const wasPublic = pastScheduledState === 'non-scheduled' && !isClaimUnlisted(ce) && !isClaimPrivate(ce);
    showEditWarning = wasPublic && visibility !== 'public';
  }

  function setVisibility(v: Visibility) {
    dispatch(doUpdatePublishForm({ visibility: v }));
  }

  return (
    <div className="publish-visibility">
      <h3 className="publish-details__title">{__('Visibility')}</h3>
      <div className="publish-visibility__options">
        <button
          type="button"
          className={
            'publish-visibility__option' + (visibility === 'public' ? ' publish-visibility__option--selected' : '')
          }
          onClick={() => setVisibility('public')}
        >
          <div className="publish-visibility__option-header">
            <Icon icon={ICONS.GLOBE} size={18} />
            <span>{__('Public')}</span>
          </div>
          <p className="publish-visibility__option-desc">{__(HELP.public)}</p>
        </button>

        <button
          type="button"
          className={
            'publish-visibility__option' + (visibility === 'unlisted' ? ' publish-visibility__option--selected' : '')
          }
          onClick={() => isNonPublicAllowed && setVisibility('unlisted')}
          disabled={!isNonPublicAllowed}
        >
          <div className="publish-visibility__option-header">
            <Icon icon={ICONS.EYE_OFF} size={18} />
            <span>{__('Unlisted')}</span>
          </div>
          <p className="publish-visibility__option-desc">{__(HELP.unlisted)}</p>
          {visibility === 'unlisted' && showEditWarning && (
            <p className="publish-visibility__caution">{__(HELP.edit_warning)}</p>
          )}
        </button>

        <button
          type="button"
          className={
            'publish-visibility__option' + (visibility === 'scheduled' ? ' publish-visibility__option--selected' : '')
          }
          onClick={() => isNonPublicAllowed && setVisibility('scheduled')}
          disabled={!isNonPublicAllowed}
        >
          <div className="publish-visibility__option-header">
            <Icon icon={ICONS.TIMERCHECK} size={18} />
            <span>{__('Scheduled')}</span>
          </div>
          <p className="publish-visibility__option-desc">{__(HELP.scheduled)}</p>
          {visibility === 'scheduled' && (
            <div className="publish-visibility__scheduled" onClick={(e) => e.stopPropagation()}>
              {showEditWarning && <p className="publish-visibility__caution">{__(HELP.edit_warning)}</p>}
              <FormField
                type="checkbox"
                name="scheduled::show"
                label={__("Show this on my channel's Upcoming section.")}
                checked={scheduledShow}
                onChange={() => dispatch(doUpdatePublishForm({ scheduledShow: !scheduledShow }))}
              />
              <PublishReleaseDate minDate={new Date(Date.now() + 30 * MS.MINUTE)} />
            </div>
          )}
        </button>
      </div>
      <p className="publish-visibility__note">{__(HELP.chain_warning)}</p>
    </div>
  );
};

const HELP = {
  public: 'Content is visible to everyone.',
  unlisted: 'The content cannot be viewed without a special link.',
  scheduled: 'Set a date to make the content public.',
  chain_warning:
    'Note: The title, description, and other metadata are still public for unlisted and scheduled content.',
  edit_warning:
    'Editing previously public content may still allow it to be accessed by some applications if the data is being shared by others on the network. If you want to make sure the content is not accessible, you should delete and re-upload it.',
};

export default PublishVisibility;
