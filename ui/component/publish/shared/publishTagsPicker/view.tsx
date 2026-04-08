import React, { useState, useMemo, useEffect } from 'react';
import Tag from 'component/tag';
import { FormField } from 'component/common/form';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectUnfollowedTags, selectFollowedTags } from 'redux/selectors/tags';
import { selectMyStreamClaims } from 'redux/selectors/claims';
import { selectActiveChannelClaim } from 'redux/selectors/app';
import { doFetchClaimListMine } from 'redux/actions/claims';
import { setUnion } from 'util/set-operations';
import { removeInternalTags } from 'util/tags';
import './style.scss';

type Props = {
  tags: Array<Tag>;
  limitSelect: number;
  onAdd: (tags: Array<Tag>) => void;
  onRemove: (tag: Tag) => void;
};

export default function PublishTagsPicker({ tags, limitSelect, onAdd, onRemove }: Props) {
  const [search, setSearch] = useState('');
  const dispatch = useAppDispatch();
  const followedTags = useAppSelector(selectFollowedTags);
  const unfollowedTags = useAppSelector(selectUnfollowedTags);
  const myStreamClaims = useAppSelector(selectMyStreamClaims);
  const activeChannelClaim = useAppSelector(selectActiveChannelClaim);

  useEffect(() => {
    if (activeChannelClaim?.claim_id) {
      dispatch(doFetchClaimListMine(1, 50, true, ['stream'], false, [activeChannelClaim.claim_id]));
    }
  }, [activeChannelClaim?.claim_id, dispatch]);

  const selectedSet = new Set(tags.map((t) => t.name));
  const maxed = removeInternalTags(tags).length >= limitSelect;

  const channelTags = useMemo(() => {
    if (!activeChannelClaim || !myStreamClaims) return [];
    const channelId = activeChannelClaim.claim_id;
    const tagCounts: Record<string, number> = {};

    const channelClaims = myStreamClaims
      .filter((claim: any) => claim.signing_channel?.claim_id === channelId && claim.value?.tags)
      .toSorted((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, 50);

    channelClaims.forEach((claim: any) => {
      removeInternalTags(claim.value.tags.map((t: string) => ({ name: t }))).forEach((tag) => {
        tagCounts[tag.name] = (tagCounts[tag.name] || 0) + 1;
      });
    });

    return Object.entries(tagCounts)
      .toSorted((a, b) => b[1] - a[1])
      .map(([name]) => name);
  }, [activeChannelClaim, myStreamClaims]);

  const fallbackTags = useMemo(() => {
    const followedSet = new Set(followedTags.map((t: Tag) => t.name));
    const unfollowedSet = new Set((unfollowedTags || []).map((t: Tag) => t.name));
    return Array.from(setUnion(followedSet, unfollowedSet));
  }, [followedTags, unfollowedTags]);

  const suggestions = useMemo(() => {
    const channelSet = new Set(channelTags);
    const combined = [...channelTags, ...fallbackTags.filter((name) => !channelSet.has(name))];
    return combined
      .filter((name) => !selectedSet.has(name))
      .filter((name) => (search ? name.toLowerCase().includes(search.toLowerCase()) : true))
      .slice(0, 30);
  }, [channelTags, fallbackTags, selectedSet, search]);

  function handleAdd(name: string) {
    if (!maxed) {
      onAdd([{ name }]);
      setSearch('');
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = search.trim().toLowerCase();
    if (trimmed && !maxed) {
      onAdd([{ name: trimmed }]);
      setSearch('');
    }
  }

  return (
    <div className="publish-tags-picker">
      <div className="publish-tags-picker__selected">
        <div className="publish-tags-picker__label">
          {__('Selected')} ({removeInternalTags(tags).length}/{limitSelect})
        </div>
        <ul className="publish-tags-picker__list">
          {removeInternalTags(tags).length === 0 && (
            <span className="publish-tags-picker__empty">{__('No tags added')}</span>
          )}
          {removeInternalTags(tags).map((tag) => (
            <Tag key={tag.name} name={tag.name} type="remove" onClick={() => onRemove(tag)} />
          ))}
        </ul>
      </div>
      <div className="publish-tags-picker__suggestions">
        <form onSubmit={handleSubmit}>
          <FormField
            type="text"
            name="tag_search"
            placeholder={__('Search or add tags...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            label={false}
          />
        </form>
        <ul className="publish-tags-picker__list">
          {search.trim() && !suggestions.includes(search.trim().toLowerCase()) && !maxed && (
            <Tag name={search.trim().toLowerCase()} type="add" onClick={() => handleAdd(search.trim().toLowerCase())} />
          )}
          {suggestions.map((name) => (
            <Tag key={name} name={name} type="add" disabled={maxed} onClick={() => handleAdd(name)} />
          ))}
        </ul>
      </div>
    </div>
  );
}
