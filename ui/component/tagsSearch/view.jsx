// @flow
import React, { useState } from 'react';
import Button from 'component/button';
import { Form, FormField } from 'component/common/form';
import Tag from 'component/tag';
import { setUnion, setDifference } from 'util/set-operations';
import I18nMessage from 'component/i18nMessage';
import analytics from 'analytics';
import {
  CONTROL_TAGS,
  INTERNAL_TAGS,
  INTERNAL_TAG_PREFIX,
  PURCHASE_TAG,
  RENTAL_TAG,
  RENTAL_TAG_OLD,
  PURCHASE_TAG_OLD,
  DISABLE_SUPPORT_TAG,
  DISABLE_DOWNLOAD_BUTTON_TAG,
  DISABLE_REACTIONS_VIDEO_TAG,
  DISABLE_REACTIONS_COMMENTS_TAG,
  DISABLE_SLIMES_VIDEO_TAG,
  DISABLE_SLIMES_COMMENTS_TAG,
  AGE_RESTRICED_CONTENT_TAG,
} from 'constants/tags';
import { removeInternalTags } from 'util/tags';

type Props = {
  tagsPassedIn: Array<Tag>,
  unfollowedTags: Array<Tag>,
  followedTags: Array<Tag>,
  doToggleTagFollowDesktop: (string) => void,
  doAddTag: (string) => void,
  onSelect?: (Tag) => void,
  hideSuggestions?: boolean,
  hideInputField?: boolean,
  suggestMature?: boolean,
  disableAutoFocus?: boolean,
  onRemove: (Tag) => void,
  placeholder?: string,
  label?: string,
  labelAddNew?: string,
  labelSuggestions?: string,
  disabled?: boolean,
  limitSelect?: number,
  limitShow?: number,
  user: User,
  disableControlTags?: boolean,
  help?: string,
};

const UNALLOWED_TAGS = ['lbry-first'];

/*
 We display tagsPassedIn
 onClick gets the tag when a tag is clicked
 onSubmit gets an array of tags in object form
 We suggest tags based on followed, unfollowed, and passedIn
 */

export default function TagsSearch(props: Props) {
  const TAG_FOLLOW_MAX = 1000;
  const {
    tagsPassedIn = [],
    unfollowedTags = [],
    followedTags = [],
    doToggleTagFollowDesktop,
    doAddTag,
    onSelect,
    onRemove,
    hideSuggestions,
    hideInputField,
    suggestMature,
    disableAutoFocus,
    placeholder,
    label,
    labelAddNew,
    labelSuggestions,
    disabled,
    limitSelect = TAG_FOLLOW_MAX,
    limitShow = 5,
    disableControlTags,
    help,
  } = props;
  const [newTag, setNewTag] = useState('');
  const doesTagMatch = (name) => {
    const nextTag = newTag.substr(newTag.lastIndexOf(',') + 1, newTag.length).trim();
    return newTag ? name.toLowerCase().includes(nextTag.toLowerCase()) : true;
  };

  // Make sure there are no duplicates, then trim
  // suggestedTags = (followedTags - tagsPassedIn) + unfollowedTags
  const followedTagsSet = new Set(followedTags.map((tag) => tag.name));
  const selectedTagsSet = new Set(tagsPassedIn.map((tag) => tag.name));
  const unfollowedTagsSet = new Set(unfollowedTags.map((tag) => tag.name));
  const remainingFollowedTagsSet = setDifference(followedTagsSet, selectedTagsSet);
  const remainingUnfollowedTagsSet = setDifference(unfollowedTagsSet, selectedTagsSet);
  const suggestedTagsSet = setUnion(remainingFollowedTagsSet, remainingUnfollowedTagsSet);

  let countWithoutSpecialTags = selectedTagsSet.size;

  const SPECIAL_TAGS = [...INTERNAL_TAGS, 'mature'];
  SPECIAL_TAGS.forEach((t) => {
    if (selectedTagsSet.has(t)) {
      countWithoutSpecialTags--;
    }
  });

  const INTERNAL_PREFIXES = [PURCHASE_TAG, PURCHASE_TAG_OLD, RENTAL_TAG, RENTAL_TAG_OLD];
  for (const tag of selectedTagsSet) {
    INTERNAL_PREFIXES.forEach((prefix) => {
      if (tag.startsWith(prefix)) {
        --countWithoutSpecialTags;
      }
    });
  }

  const controlTagLabels = {};
  CONTROL_TAGS.map((t) => {
    let label;
    if (t === DISABLE_SUPPORT_TAG) {
      label = __('Disable Tipping and Boosting');
    } else if (t === DISABLE_DOWNLOAD_BUTTON_TAG) {
      label = __('Hide Download Button');
    } else if (t === DISABLE_REACTIONS_VIDEO_TAG) {
      label = __('Disable Likes/Dislikes - Content');
    } else if (t === DISABLE_REACTIONS_COMMENTS_TAG) {
      label = __('Disable Likes/Dislikes - Comments');
    } else if (t === DISABLE_SLIMES_VIDEO_TAG) {
      label = __('Disable Dislikes - Content');
    } else if (t === DISABLE_SLIMES_COMMENTS_TAG) {
      label = __('Disable Dislikes - Comments');
    } else if (t === AGE_RESTRICED_CONTENT_TAG) {
      label = (
        <I18nMessage
          tokens={{
            community_guidelines: (
              <Button
                button="link"
                href="https://help.odysee.tv/communityguidelines/"
                label={__('Community Guidelines')}
              />
            ),
          }}
        >
          Contains nudity, violence or other allowed 18+ content. See %community_guidelines%
        </I18nMessage>
      );
    } else {
      label = __(
        t
          .replace(INTERNAL_TAG_PREFIX, '')
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      );
    }
    controlTagLabels[t] = label;
  });

  // const countWithoutLbryFirst = selectedTagsSet.has('lbry-first') ? selectedTagsSet.size - 1 : selectedTagsSet.size;
  const maxed = Boolean(limitSelect && countWithoutSpecialTags >= limitSelect);
  const suggestedTags = Array.from(suggestedTagsSet).filter(doesTagMatch).slice(0, limitShow);

  // tack 'mature' onto the end if it's not already in the list
  if (!newTag && suggestMature && !suggestedTags.some((tag) => tag === 'mature')) {
    suggestedTags.push('mature');
  }

  function onChange(e) {
    setNewTag(e.target.value);
  }

  function handleSubmit(e) {
    e.preventDefault();
    let tags = newTag.trim();

    if (tags.length === 0) {
      return;
    }

    setNewTag('');

    const newTagsArr = Array.from(
      new Set(
        tags
          .split(',')
          .slice(0, limitSelect - countWithoutSpecialTags)
          .map((newTag) => newTag.trim().toLowerCase())
          .filter((newTag) => !UNALLOWED_TAGS.includes(newTag))
      )
    );

    // Split into individual tags, normalize the tags, and remove duplicates with a set.
    if (onSelect) {
      const arrOfObjectTags = newTagsArr.map((tag) => {
        return { name: tag };
      });
      onSelect(arrOfObjectTags);
    } else {
      newTagsArr.forEach((tag) => {
        if (!unfollowedTags.some(({ name }) => name === tag)) {
          doAddTag(tag);
        }

        if (!followedTags.some(({ name }) => name === tag)) {
          doToggleTagFollowDesktop(tag);
        }
      });
    }
  }

  function handleTagClick(tag: string) {
    if (onSelect) {
      onSelect([{ name: tag }]);
    } else {
      const wasFollowing = followedTags.map((t) => t.name).includes(tag);
      doToggleTagFollowDesktop(tag);
      analytics.event.tagFollow(tag, !wasFollowing);
    }
  }
  function handleUtilityTagCheckbox(tag: string) {
    const selectedTag = tagsPassedIn.find((te) => te.name === tag);
    if (selectedTag) {
      onRemove(selectedTag);
    } else if (onSelect) {
      onSelect([{ name: tag }]);
    }
  }
  return (
    <React.Fragment>
      <Form className="tags__input-wrapper" onSubmit={handleSubmit}>
        <fieldset-section>
          <label style={{ marginTop: 0 }}>
            {limitSelect < TAG_FOLLOW_MAX ? (
              <I18nMessage
                tokens={{
                  number: limitSelect - countWithoutSpecialTags,
                  selectTagsLabel: label,
                }}
              >
                %selectTagsLabel% (%number% left)
              </I18nMessage>
            ) : (
              label || __('Following --[button label indicating a channel has been followed]--')
            )}
          </label>
          <ul className="tags--remove">
            {countWithoutSpecialTags === 0 && <Tag key={`placeholder-tag`} name={'example'} disabled type={'remove'} />}
            {Boolean(tagsPassedIn.length) &&
              removeInternalTags(tagsPassedIn).map((tag) => (
                <Tag
                  key={`passed${tag.name}`}
                  name={tag.name}
                  type="remove"
                  onClick={() => {
                    onRemove(tag);
                  }}
                />
              ))}
          </ul>
          {!hideInputField && (
            <FormField
              autoFocus={!disableAutoFocus}
              className="tag__input"
              onChange={onChange}
              placeholder={placeholder || __('gaming, crypto')}
              type="text"
              value={newTag}
              disabled={disabled}
              label={labelAddNew || __('Add Tags')}
            />
          )}
          {!hideSuggestions && (
            <section>
              <label>{labelSuggestions || (newTag.length ? __('Matching') : __('Known Tags'))}</label>
              <ul className="tags">
                {Boolean(newTag.length) && !suggestedTags.includes(newTag) && (
                  <Tag
                    disabled={newTag !== 'mature' && maxed}
                    key={`entered${newTag}`}
                    name={newTag}
                    type="add"
                    onClick={newTag.includes('') ? (e) => handleSubmit(e) : (e) => handleTagClick(newTag)}
                  />
                )}
                {suggestedTags.map((tag) => (
                  <Tag
                    disabled={tag !== 'mature' && maxed}
                    key={`suggested${tag}`}
                    name={tag}
                    type="add"
                    onClick={() => handleTagClick(tag)}
                  />
                ))}
              </ul>
              <div className="form-field__hint mt-m">{help}</div>
            </section>
          )}
        </fieldset-section>
        {!disableControlTags &&
          onSelect && ( // onSelect ensures this does not appear on TagFollow
            <fieldset-section>
              <label>{__('Control Tags')}</label>
              {CONTROL_TAGS.map((t) => (
                <FormField
                  key={t}
                  name={t}
                  type="checkbox"
                  blockWrap={false}
                  label={controlTagLabels[t]}
                  checked={tagsPassedIn.some((te) => te.name === t)}
                  onChange={() => handleUtilityTagCheckbox(t)}
                />
              ))}
            </fieldset-section>
          )}
      </Form>
    </React.Fragment>
  );
}
