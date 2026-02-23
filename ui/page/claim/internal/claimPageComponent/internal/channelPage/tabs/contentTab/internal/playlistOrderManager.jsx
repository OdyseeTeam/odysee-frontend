// @flow
import React from 'react';
import classnames from 'classnames';
// $FlowFixMe[prop-missing] Flow's react-redux defs in this repo are stale; useSelector exists at runtime.
import { useSelector } from 'react-redux';
import Lbry from 'lbry';
import ClaimList from 'component/claimList';
import Spinner from 'component/spinner';
import Button from 'component/button';
import Icon from 'component/common/icon';
import { FormField } from 'component/common/form';
import * as ICONS from 'constants/icons';
import { SECTION_TAGS } from 'constants/collections';
import { getThumbnailFromClaim } from 'util/claim';
import { getThumbnailCdnUrl } from 'util/thumbnail';
import { selectCollectionHasEditsForId, selectCountForCollectionId } from 'redux/selectors/collections';
import {
  normalizePlaylistOrder,
  serializePlaylistOrderSections,
  PLAYLIST_ORDER_SORT,
  getPlaylistClaimId,
  getPlaylistTitle,
  getPlaylistUri,
  sortPlaylistIds,
} from 'util/playlist-order';

const PLAYLIST_FETCH_PAGE_SIZE = 50;
const PLAYLIST_FETCH_MAX_PAGES = 20;
const AUTO_RECENT_SECTION_ID = 'playlist-order-auto-recent';
const DEFAULT_SECTION_ID = 'playlist-order-default';
const SECTION_DROPPABLE_ID = 'playlist-order-sections';
const ITEM_DROPPABLE_PREFIX = 'playlist-order-items-';

// prettier-ignore
const Lazy = {
  DragDropContext: React.lazy(() => import('react-beautiful-dnd' /* webpackChunkName: "dnd" */).then((module) => ({ default: module.DragDropContext }))),
  Droppable: React.lazy(() => import('react-beautiful-dnd' /* webpackChunkName: "dnd" */).then((module) => ({ default: module.Droppable }))),
  Draggable: React.lazy(() => import('react-beautiful-dnd' /* webpackChunkName: "dnd" */).then((module) => ({ default: module.Draggable }))),
};

const SORT_OPTIONS = Object.freeze([
  { key: PLAYLIST_ORDER_SORT.NEWEST, label: __('Newest First') },
  { key: PLAYLIST_ORDER_SORT.OLDEST, label: __('Oldest First') },
  { key: PLAYLIST_ORDER_SORT.TITLE_ASC, label: __('Title (A-Z)') },
  { key: PLAYLIST_ORDER_SORT.TITLE_DESC, label: __('Title (Z-A)') },
]);

type DraftSection = {
  id: string,
  title: string,
  itemIds: Array<string>,
  isAuto?: boolean,
};

type Props = {
  channelClaim: ?Claim,
  channelSettings: ?PerChannelSettings,
  tileLayout: boolean,
  viewHiddenChannels: boolean,
  empty: any,
  isEditing: boolean,
  onCloseEditing: () => void,
  onUnsavedChangesUpdate?: (boolean) => void,
  doUpdateCreatorSettings: (ChannelClaim, PerChannelSettings) => void,
};

function cloneSections(sections: Array<DraftSection>): Array<DraftSection> {
  return sections.map((section) => ({
    ...section,
    itemIds: section.itemIds.slice(),
  }));
}

function createSectionId() {
  return `playlist-section-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function moveArrayItem<T>(list: Array<T>, from: number, to: number): Array<T> {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) {
    return list.slice();
  }

  const next = list.slice();
  const [removed] = next.splice(from, 1);
  next.splice(to, 0, removed);
  return next;
}

function sanitizeDraftSections(sections: Array<DraftSection>): Array<DraftSection> {
  const seenItemIds = new Set();

  return sections.map((section) => {
    const sanitizedIds = [];

    section.itemIds.forEach((itemId) => {
      if (seenItemIds.has(itemId)) return;
      seenItemIds.add(itemId);
      sanitizedIds.push(itemId);
    });

    return {
      ...section,
      itemIds: sanitizedIds,
    };
  });
}

function getItemDroppableId(sectionId: string) {
  return `${ITEM_DROPPABLE_PREFIX}${sectionId}`;
}

function getSectionIdFromItemDroppableId(droppableId: string): ?string {
  if (!droppableId || !droppableId.startsWith(ITEM_DROPPABLE_PREFIX)) {
    return null;
  }

  return droppableId.replace(ITEM_DROPPABLE_PREFIX, '');
}

function getSectionLabel(section: DraftSection, index: number): string {
  if (section.title && section.title.trim()) {
    return section.title.trim();
  }

  if (section.isAuto) {
    return __('Recent additions');
  }

  return __('Section %number%', {
    number: index + 1,
  });
}

function getPlaylistDescriptionSnippet(claim: any, maxLen: number = 130): string {
  const raw = (claim && claim.value && claim.value.description) || '';
  const normalized = String(raw || '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) {
    return __('No description available.');
  }

  if (normalized.length <= maxLen) {
    return normalized;
  }

  return `${normalized.slice(0, maxLen - 1).trim()}…`;
}

function getDraftSignature(sections: Array<DraftSection>) {
  const serialized = serializePlaylistOrderSections(
    sections.map((section) => ({
      id: section.id,
      title: section.title,
      itemIds: section.itemIds,
    }))
  );

  return JSON.stringify(serialized);
}

function buildInitialDraftSections(
  hasSavedPlaylistOrder: boolean,
  normalizedOrderSections: Array<{ id: string, title: string, itemIds: Array<string> }>,
  newestPlaylistIds: Array<string>,
  unassignedIds: Array<string>
): Array<DraftSection> {
  let sections = [];

  if (hasSavedPlaylistOrder) {
    sections = normalizedOrderSections.map((section) => ({
      id: section.id,
      title: section.title || '',
      itemIds: section.itemIds.slice(),
    }));
  } else if (newestPlaylistIds.length > 0) {
    sections = [
      {
        id: DEFAULT_SECTION_ID,
        title: '',
        itemIds: newestPlaylistIds.slice(),
      },
    ];
  }

  if (hasSavedPlaylistOrder && unassignedIds.length > 0) {
    const hasCollision = sections.some((section) => section.id === AUTO_RECENT_SECTION_ID);
    sections.unshift({
      id: hasCollision ? createSectionId() : AUTO_RECENT_SECTION_ID,
      title: __('Recent additions'),
      itemIds: unassignedIds.slice(),
      isAuto: true,
    });
  }

  if (!sections.length) {
    sections = [
      {
        id: DEFAULT_SECTION_ID,
        title: '',
        itemIds: [],
      },
    ];
  }

  return sections;
}

function PlaylistOrderManager(props: Props) {
  const {
    channelClaim,
    channelSettings,
    tileLayout,
    viewHiddenChannels,
    empty,
    isEditing,
    onCloseEditing,
    onUnsavedChangesUpdate,
    doUpdateCreatorSettings,
  } = props;

  const channelId = channelClaim && channelClaim.claim_id;
  const normalizedPlaylistOrder = React.useMemo(
    () => normalizePlaylistOrder(channelSettings && channelSettings.playlist_order),
    [channelSettings]
  );
  const hasSavedPlaylistOrder = normalizedPlaylistOrder.sections.length > 0;
  const shouldLoadPlaylists = isEditing || hasSavedPlaylistOrder;

  const [playlistClaims, setPlaylistClaims] = React.useState([]);
  const [loadingPlaylists, setLoadingPlaylists] = React.useState(false);
  const [playlistLoadError, setPlaylistLoadError] = React.useState();
  const [reloadToken, setReloadToken] = React.useState(0);

  React.useEffect(() => {
    if (!shouldLoadPlaylists || !channelId) {
      return;
    }

    let isCancelled = false;

    async function loadPlaylists() {
      setLoadingPlaylists(true);
      setPlaylistLoadError(undefined);

      try {
        const fetchedClaims = [];
        for (let page = 1; page <= PLAYLIST_FETCH_MAX_PAGES; page++) {
          const result = await Lbry.claim_search({
            channel_ids: [channelId],
            claim_type: ['collection'],
            not_tags: [SECTION_TAGS.FEATURED_CHANNELS],
            page,
            page_size: PLAYLIST_FETCH_PAGE_SIZE,
            no_totals: true,
            order_by: ['release_time'],
            include_is_my_output: true,
          });

          const items = Array.isArray(result && result.items) ? result.items : [];
          fetchedClaims.push(...items);

          if (items.length < PLAYLIST_FETCH_PAGE_SIZE) {
            break;
          }
        }

        if (isCancelled) return;

        const seen = new Set();
        const deduped = [];

        fetchedClaims.forEach((claim) => {
          const id = getPlaylistClaimId(claim);
          if (!id || seen.has(id)) return;
          seen.add(id);
          deduped.push(claim);
        });

        setPlaylistClaims(deduped);
      } catch (error) {
        if (isCancelled) return;
        setPlaylistLoadError(error && error.message ? error.message : __('Failed to load playlists.'));
      } finally {
        if (!isCancelled) {
          setLoadingPlaylists(false);
        }
      }
    }

    loadPlaylists();

    return () => {
      isCancelled = true;
    };
  }, [channelId, shouldLoadPlaylists, reloadToken]);

  const playlistById = React.useMemo(() => {
    const map = {};
    playlistClaims.forEach((claim) => {
      const id = getPlaylistClaimId(claim);
      if (!id) return;
      map[id] = claim;
    });
    return map;
  }, [playlistClaims]);

  const allKnownPlaylistIds = React.useMemo(() => Object.keys(playlistById), [playlistById]);
  const newestPlaylistIds = React.useMemo(
    () => sortPlaylistIds(allKnownPlaylistIds, playlistById, PLAYLIST_ORDER_SORT.NEWEST),
    [allKnownPlaylistIds, playlistById]
  );
  const orderedIdsInSettings = React.useMemo(
    () => normalizedPlaylistOrder.sections.reduce((all, section) => all.concat(section.itemIds), []),
    [normalizedPlaylistOrder]
  );
  const orderedIdSetInSettings = React.useMemo(() => new Set(orderedIdsInSettings), [orderedIdsInSettings]);
  const unassignedIds = React.useMemo(
    () => newestPlaylistIds.filter((id) => !orderedIdSetInSettings.has(id)),
    [newestPlaylistIds, orderedIdSetInSettings]
  );

  const initialDraftSections = React.useMemo(
    () =>
      buildInitialDraftSections(
        hasSavedPlaylistOrder,
        normalizedPlaylistOrder.sections,
        newestPlaylistIds,
        unassignedIds
      ),
    [hasSavedPlaylistOrder, normalizedPlaylistOrder, newestPlaylistIds, unassignedIds]
  );

  const [draftSections, setDraftSections] = React.useState([]);
  const [draftBaseline, setDraftBaseline] = React.useState('');
  const [sortMode, setSortMode] = React.useState(PLAYLIST_ORDER_SORT.NEWEST);
  const [showSortControls, setShowSortControls] = React.useState(false);
  const [dragMode, setDragMode] = React.useState(true);
  const [hasUsedDrag, setHasUsedDrag] = React.useState(false);

  React.useEffect(() => {
    if (!isEditing) return;

    const nextDraft = sanitizeDraftSections(cloneSections(initialDraftSections));
    setDraftSections(nextDraft);
    setDraftBaseline(getDraftSignature(nextDraft));
    setSortMode(PLAYLIST_ORDER_SORT.NEWEST);
    setShowSortControls(false);
    setHasUsedDrag(false);
  }, [isEditing, initialDraftSections]);

  const displaySections = React.useMemo(() => {
    const sections = [];

    if (unassignedIds.length > 0) {
      sections.push({
        id: AUTO_RECENT_SECTION_ID,
        title: hasSavedPlaylistOrder ? __('Recent additions') : '',
        uris: unassignedIds.map((id) => getPlaylistUri(playlistById[id])).filter(Boolean),
      });
    }

    normalizedPlaylistOrder.sections.forEach((section) => {
      const uris = section.itemIds.map((id) => getPlaylistUri(playlistById[id])).filter(Boolean);

      if (uris.length > 0) {
        sections.push({
          id: section.id,
          title: section.title,
          uris,
        });
      }
    });

    if (!hasSavedPlaylistOrder && sections.length === 0 && newestPlaylistIds.length > 0) {
      sections.push({
        id: DEFAULT_SECTION_ID,
        title: '',
        uris: newestPlaylistIds.map((id) => getPlaylistUri(playlistById[id])).filter(Boolean),
      });
    }

    return sections;
  }, [hasSavedPlaylistOrder, newestPlaylistIds, normalizedPlaylistOrder, playlistById, unassignedIds]);

  const draftSignature = React.useMemo(() => getDraftSignature(draftSections), [draftSections]);
  const hasDraftChanges = draftSignature !== draftBaseline;
  const draftMissingCount = React.useMemo(
    () => draftSections.reduce((count, section) => count + section.itemIds.filter((id) => !playlistById[id]).length, 0),
    [draftSections, playlistById]
  );

  React.useEffect(() => {
    if (onUnsavedChangesUpdate) {
      onUnsavedChangesUpdate(isEditing ? hasDraftChanges : false);
    }
  }, [onUnsavedChangesUpdate, isEditing, hasDraftChanges]);

  const playlistItemCountById = useSelector((state) => {
    const counts = {};

    allKnownPlaylistIds.forEach((id) => {
      const selectorCount = selectCountForCollectionId(state, id);
      const fallbackCount = Array.isArray(playlistById[id]?.value?.claims) ? playlistById[id].value.claims.length : 0;
      counts[id] = typeof selectorCount === 'number' ? selectorCount : fallbackCount;
    });

    return counts;
  });

  const playlistHasUnpublishedChangesById = useSelector((state) => {
    const edits = {};

    allKnownPlaylistIds.forEach((id) => {
      edits[id] = Boolean(selectCollectionHasEditsForId(state, id));
    });

    return edits;
  });

  const requestCloseEditor = React.useCallback(() => {
    if (
      hasDraftChanges &&
      !window.confirm(
        __('You have unsaved playlist order changes. If you close now, those changes will be lost. Continue?')
      )
    ) {
      return;
    }

    onCloseEditing();
  }, [hasDraftChanges, onCloseEditing]);

  const handleMoveSection = React.useCallback((sectionId: string, dir: number) => {
    setDraftSections((prev) => {
      const from = prev.findIndex((section) => section.id === sectionId);
      const to = from + dir;

      if (from < 0 || to < 0 || to >= prev.length) {
        return prev;
      }

      return moveArrayItem(prev, from, to);
    });
  }, []);

  const handleMovePlaylistWithinSection = React.useCallback(
    (sectionId: string, from: number, dir: number) => {
      setDraftSections((prev) => {
        return prev.map((section) => {
          if (section.id !== sectionId) return section;

          const existingIds = section.itemIds.filter((id) => playlistById[id]);
          const missingIds = section.itemIds.filter((id) => !playlistById[id]);
          const to = from + dir;

          if (to < 0 || to >= existingIds.length) {
            return section;
          }

          return {
            ...section,
            itemIds: moveArrayItem(existingIds, from, to).concat(missingIds),
          };
        });
      });
    },
    [playlistById]
  );

  const handleMovePlaylistToSection = React.useCallback(
    (fromSectionId: string, toSectionId: string, itemId: string) => {
      if (!toSectionId || fromSectionId === toSectionId) {
        return;
      }

      setDraftSections((prev) => {
        const next = cloneSections(prev);

        const fromSection = next.find((section) => section.id === fromSectionId);
        const toSection = next.find((section) => section.id === toSectionId);

        if (!fromSection || !toSection) {
          return prev;
        }

        fromSection.itemIds = fromSection.itemIds.filter((id) => id !== itemId);
        if (!toSection.itemIds.includes(itemId)) {
          toSection.itemIds.push(itemId);
        }

        return sanitizeDraftSections(next);
      });
    },
    []
  );

  const handleDragEnd = React.useCallback(
    (result: any) => {
      const { source, destination, type } = result || {};

      if (!destination) return;

      if (type === 'SECTION') {
        setDraftSections((prev) => {
          if (source.index === destination.index) return prev;
          return moveArrayItem(prev, source.index, destination.index);
        });
        return;
      }

      const sourceSectionId = getSectionIdFromItemDroppableId(source.droppableId);
      const destinationSectionId = getSectionIdFromItemDroppableId(destination.droppableId);

      if (!sourceSectionId || !destinationSectionId) return;

      setDraftSections((prev) => {
        const next = cloneSections(prev);
        const sourceSection = next.find((section) => section.id === sourceSectionId);
        const destinationSection = next.find((section) => section.id === destinationSectionId);

        if (!sourceSection || !destinationSection) {
          return prev;
        }

        const sourceExisting = sourceSection.itemIds.filter((id) => playlistById[id]);
        const sourceMissing = sourceSection.itemIds.filter((id) => !playlistById[id]);

        if (sourceSectionId === destinationSectionId) {
          sourceSection.itemIds = moveArrayItem(sourceExisting, source.index, destination.index).concat(sourceMissing);
        } else {
          const destinationExisting = destinationSection.itemIds.filter((id) => playlistById[id]);
          const destinationMissing = destinationSection.itemIds.filter((id) => !playlistById[id]);

          if (source.index < 0 || source.index >= sourceExisting.length) {
            return prev;
          }

          const [movedItem] = sourceExisting.splice(source.index, 1);
          if (!movedItem) return prev;

          destinationExisting.splice(destination.index, 0, movedItem);
          sourceSection.itemIds = sourceExisting.concat(sourceMissing);
          destinationSection.itemIds = destinationExisting.concat(destinationMissing);
        }

        return sanitizeDraftSections(next);
      });
    },
    [playlistById]
  );

  const handleSortAllSections = React.useCallback(() => {
    setDraftSections((prev) =>
      prev.map((section) => {
        const existing = section.itemIds.filter((id) => playlistById[id]);
        const missing = section.itemIds.filter((id) => !playlistById[id]);

        return {
          ...section,
          itemIds: sortPlaylistIds(existing, playlistById, sortMode).concat(missing),
        };
      })
    );
  }, [playlistById, sortMode]);

  const handleClearDeletedItems = React.useCallback(() => {
    setDraftSections((prev) =>
      prev.map((section) => ({
        ...section,
        itemIds: section.itemIds.filter((id) => playlistById[id]),
      }))
    );
  }, [playlistById]);

  const handleSaveOrder = React.useCallback(() => {
    if (!channelClaim || channelClaim.value_type !== 'channel') return;
    const resolvedChannelClaim: ChannelClaim = (channelClaim: any);

    const sectionsToSave = draftSections
      .map((section) => ({
        id: section.id,
        title: section.title,
        itemIds: section.itemIds,
      }))
      .filter((section) => section.itemIds.length > 0 || (section.title && section.title.trim()));

    doUpdateCreatorSettings(resolvedChannelClaim, {
      playlist_order: serializePlaylistOrderSections(sectionsToSave),
    });

    onCloseEditing();
  }, [channelClaim, doUpdateCreatorSettings, draftSections, onCloseEditing]);

  function renderPlaylistRow(
    section: DraftSection,
    itemId: string,
    index: number,
    existingCount: number,
    draggableProvided?: any,
    draggableSnapshot?: any
  ) {
    const claim = playlistById[itemId];
    const title = getPlaylistTitle(claim) || itemId;
    const thumbnail = claim ? getThumbnailFromClaim(claim) : null;
    const thumbnailUrl =
      thumbnail &&
      getThumbnailCdnUrl({
        thumbnail,
        width: 320,
        height: 180,
        quality: 70,
      });
    const description = getPlaylistDescriptionSnippet(claim);
    const playlistCount = playlistItemCountById[itemId] || 0;
    const hasUnpublishedChanges = Boolean(playlistHasUnpublishedChangesById[itemId]);
    const canMoveToOtherSection = draftSections.length > 1;

    return (
      <li
        className={classnames('playlist-order-editor__playlist-item', {
          'playlist-order-editor__playlist-item--dragging': draggableSnapshot && draggableSnapshot.isDragging,
        })}
        key={`${section.id}-${itemId}`}
        ref={draggableProvided ? draggableProvided.innerRef : undefined}
        {...(draggableProvided ? draggableProvided.draggableProps : {})}
      >
        <div className="playlist-order-editor__playlist-meta">
          <div className="playlist-order-editor__playlist-visual">
            {dragMode && draggableProvided && (
              <div
                className="playlist-order-editor__drag-handle playlist-order-editor__drag-handle--playlist"
                {...draggableProvided.dragHandleProps}
              >
                <Icon icon={ICONS.MENU} title={__('Drag playlist')} size={16} />
              </div>
            )}
            <div
              className={classnames('playlist-order-editor__playlist-thumb', {
                'playlist-order-editor__playlist-thumb--empty': !thumbnailUrl,
              })}
              style={thumbnailUrl ? { backgroundImage: `url(${thumbnailUrl})` } : undefined}
            >
              {!thumbnailUrl && <Icon icon={ICONS.PLAYLIST} size={18} />}
            </div>
          </div>
          <div className="playlist-order-editor__playlist-info">
            <div className="playlist-order-editor__playlist-title-row">
              <div className="playlist-order-editor__playlist-title">{title}</div>
              <div className="playlist-order-editor__playlist-count">
                {playlistCount === 1
                  ? __('1 item')
                  : __('%count% items', {
                      count: playlistCount,
                    })}
              </div>
            </div>
            <div className="playlist-order-editor__playlist-description">{description}</div>
            {hasUnpublishedChanges && (
              <div className="playlist-order-editor__playlist-unpublished">
                <Icon icon={ICONS.PUBLISH} size={14} />
                <span>{__('Unpublished updates')}</span>
              </div>
            )}
          </div>
        </div>
        <div className="playlist-order-editor__playlist-actions">
          {!dragMode && (
            <>
              <Button
                button="alt"
                icon={ICONS.UP}
                title={__('Move up')}
                onClick={() => handleMovePlaylistWithinSection(section.id, index, -1)}
                disabled={index === 0}
              />
              <Button
                button="alt"
                icon={ICONS.DOWN}
                title={__('Move down')}
                onClick={() => handleMovePlaylistWithinSection(section.id, index, 1)}
                disabled={index === existingCount - 1}
              />
            </>
          )}
          <FormField
            name={`move_playlist_${section.id}_${itemId}`}
            type="select"
            className="playlist-order-editor__move-select"
            value={section.id}
            disabled={!canMoveToOtherSection}
            onChange={(e) => {
              const value = e.target && e.target.value;
              if (value) {
                handleMovePlaylistToSection(section.id, value, itemId);
              }
            }}
          >
            {draftSections.map((draftSection, draftIndex) => (
              <option key={draftSection.id} value={draftSection.id}>
                {__('Move to: %section%', {
                  section: getSectionLabel(draftSection, draftIndex),
                })}
              </option>
            ))}
          </FormField>
        </div>
      </li>
    );
  }

  function renderSection(
    section: DraftSection,
    sectionIndex: number,
    sectionDraggableProvided?: any,
    sectionDraggableSnapshot?: any
  ) {
    const existingItemIds = section.itemIds.filter((itemId) => playlistById[itemId]);
    const missingItemIds = section.itemIds.filter((itemId) => !playlistById[itemId]);

    return (
      <section
        className={classnames('playlist-order-editor__section', {
          'playlist-order-editor__section--dragging': sectionDraggableSnapshot && sectionDraggableSnapshot.isDragging,
        })}
        key={section.id}
        ref={sectionDraggableProvided ? sectionDraggableProvided.innerRef : undefined}
        {...(sectionDraggableProvided ? sectionDraggableProvided.draggableProps : {})}
      >
        <div className="playlist-order-editor__section-header">
          {dragMode && sectionDraggableProvided && (
            <div
              className="playlist-order-editor__drag-handle playlist-order-editor__drag-handle--section"
              {...sectionDraggableProvided.dragHandleProps}
            >
              <Icon icon={ICONS.MENU} title={__('Drag section')} size={16} />
            </div>
          )}
          <FormField
            name={`playlist_order_section_title_${section.id}`}
            type="text"
            value={section.title}
            placeholder={__('Section Title')}
            onChange={(e) => {
              const value = e.target ? e.target.value : '';
              setDraftSections((prev) =>
                prev.map((prevSection) =>
                  prevSection.id === section.id ? { ...prevSection, title: value } : prevSection
                )
              );
            }}
          />

          <div className="playlist-order-editor__section-actions">
            {!dragMode && (
              <>
                <Button
                  button="alt"
                  icon={ICONS.UP}
                  title={__('Move section up')}
                  onClick={() => handleMoveSection(section.id, -1)}
                  disabled={sectionIndex === 0}
                />
                <Button
                  button="alt"
                  icon={ICONS.DOWN}
                  title={__('Move section down')}
                  onClick={() => handleMoveSection(section.id, 1)}
                  disabled={sectionIndex === draftSections.length - 1}
                />
              </>
            )}
            <Button
              button="alt"
              icon={ICONS.DELETE}
              title={__('Remove section')}
              onClick={() =>
                setDraftSections((prev) => {
                  if (prev.length <= 1) {
                    return prev;
                  }

                  const next = cloneSections(prev);
                  const indexToRemove = next.findIndex((s) => s.id === section.id);
                  if (indexToRemove === -1) {
                    return prev;
                  }

                  const [removed] = next.splice(indexToRemove, 1);
                  const targetIndex = Math.max(0, indexToRemove - 1);

                  if (removed && removed.itemIds.length > 0) {
                    if (next[targetIndex]) {
                      const merged = next[targetIndex].itemIds.concat(removed.itemIds);
                      next[targetIndex].itemIds = Array.from(new Set(merged));
                    } else {
                      next.push({
                        id: createSectionId(),
                        title: '',
                        itemIds: removed.itemIds.slice(),
                      });
                    }
                  }

                  return sanitizeDraftSections(next);
                })
              }
              disabled={draftSections.length <= 1}
            />
          </div>
        </div>

        {dragMode ? (
          <Lazy.Droppable droppableId={getItemDroppableId(section.id)} type="ITEM">
            {(dropProvided, dropSnapshot) => (
              <ul
                className={classnames('ul--no-style', 'playlist-order-editor__playlist-list', {
                  'playlist-order-editor__playlist-list--drag-over': dropSnapshot.isDraggingOver,
                })}
                ref={dropProvided.innerRef}
                {...dropProvided.droppableProps}
              >
                {existingItemIds.map((itemId, index) => (
                  <Lazy.Draggable key={itemId} draggableId={`playlist-order-item-${itemId}`} index={index}>
                    {(draggableProvided, draggableSnapshot) =>
                      renderPlaylistRow(
                        section,
                        itemId,
                        index,
                        existingItemIds.length,
                        draggableProvided,
                        draggableSnapshot
                      )
                    }
                  </Lazy.Draggable>
                ))}
                {existingItemIds.length === 0 && (
                  <li className="playlist-order-editor__empty-section playlist-order-editor__empty-section--drop">
                    {__('Drop playlists here')}
                  </li>
                )}
                {dropProvided.placeholder}
              </ul>
            )}
          </Lazy.Droppable>
        ) : existingItemIds.length > 0 ? (
          <ul className={classnames('ul--no-style', 'playlist-order-editor__playlist-list')}>
            {existingItemIds.map((itemId, index) => renderPlaylistRow(section, itemId, index, existingItemIds.length))}
          </ul>
        ) : (
          <div className="playlist-order-editor__empty-section">{__('No playlists in this section.')}</div>
        )}

        {missingItemIds.length > 0 && (
          <div className="playlist-order-editor__missing">
            <div className="playlist-order-editor__missing-title">{__('Deleted or missing entries')}</div>
            <ul className="ul--no-style">
              {missingItemIds.map((itemId) => (
                <li className="playlist-order-editor__missing-item" key={`${section.id}-missing-${itemId}`}>
                  <span>{itemId}</span>
                  <Button
                    button="link"
                    label={__('Remove')}
                    onClick={() =>
                      setDraftSections((prev) =>
                        prev.map((prevSection) =>
                          prevSection.id === section.id
                            ? {
                                ...prevSection,
                                itemIds: prevSection.itemIds.filter((id) => id !== itemId),
                              }
                            : prevSection
                        )
                      )
                    }
                  />
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    );
  }

  if (!isEditing && !hasSavedPlaylistOrder) {
    return null;
  }

  if (loadingPlaylists) {
    return <Spinner text={__('Loading playlists...')} />;
  }

  if (playlistLoadError && !playlistClaims.length) {
    return (
      <section className="card card--section playlist-order-state">
        <p>{playlistLoadError}</p>
        <div className="section__actions">
          <Button button="primary" label={__('Retry')} onClick={() => setReloadToken(Date.now())} />
          {isEditing && <Button button="link" label={__('Cancel')} onClick={requestCloseEditor} />}
        </div>
      </section>
    );
  }

  if (!isEditing) {
    if (displaySections.length === 0) {
      return empty || <section className="main--empty">{__('No Playlists found')}</section>;
    }

    return (
      <div className="playlist-order-display">
        {displaySections.map((section) => {
          const hasTitle = section.title && section.title.trim();
          return (
            <section
              className={classnames('playlist-order-display__section', {
                'playlist-order-display__section--untitled': !hasTitle,
              })}
              key={section.id}
            >
              {hasTitle && <h2 className="playlist-order-display__title">{section.title}</h2>}
              <ClaimList
                uris={section.uris}
                tileLayout={tileLayout}
                showHiddenByUser={viewHiddenChannels}
                header={false}
                noEmpty
              />
            </section>
          );
        })}
      </div>
    );
  }

  return (
    <div className="card card--section playlist-order-editor">
      <div className="playlist-order-editor__header">
        <h2 className="playlist-order-editor__title">{__('Edit Playlist Order')}</h2>
        <p className="playlist-order-editor__subtitle">
          {__(
            'Reorder playlists, create sections, and decide where new playlists appear. New playlists default to the top until you place them.'
          )}
        </p>
        <div className="playlist-order-editor__meta">
          <span
            className={classnames('playlist-order-editor__meta-item', {
              'playlist-order-editor__meta-item--active': hasDraftChanges,
            })}
          >
            {hasDraftChanges ? __('Unsaved changes') : __('All changes saved')}
          </span>
          {dragMode && <span className="playlist-order-editor__meta-item">{__('Drag handles are enabled')}</span>}
        </div>
      </div>

      <div className="playlist-order-editor__toolbar">
        <div className="playlist-order-editor__toolbar-group">
          <Button
            button={showSortControls ? 'secondary' : 'alt'}
            icon={ICONS.OPTIONS}
            label={__('Sort')}
            onClick={() => setShowSortControls((prev) => !prev)}
          />
          <Button
            button={dragMode ? 'secondary' : 'alt'}
            icon={ICONS.DRAG}
            label={dragMode ? __('Drag & Drop On') : __('Drag & Drop Off')}
            onClick={() => setDragMode((prev) => !prev)}
          />
        </div>

        <div className="playlist-order-editor__toolbar-group">
          <Button
            button="alt"
            icon={ICONS.ADD}
            label={__('Add Section')}
            onClick={() =>
              setDraftSections((prev) =>
                sanitizeDraftSections(
                  prev.concat({
                    id: createSectionId(),
                    title: __('New Section'),
                    itemIds: [],
                  })
                )
              )
            }
          />
          <Button
            button="alt"
            icon={ICONS.REFRESH}
            label={__('Reset')}
            onClick={() => setDraftSections(sanitizeDraftSections(cloneSections(initialDraftSections)))}
          />
          {draftMissingCount > 0 && (
            <Button
              button="alt"
              label={__('Clear Deleted (%count%)', {
                count: draftMissingCount,
              })}
              onClick={handleClearDeletedItems}
            />
          )}
        </div>
      </div>

      {showSortControls && (
        <div className="playlist-order-editor__sort-panel">
          <FormField
            name="playlist_order_sort"
            type="select"
            value={sortMode}
            onChange={(e) => {
              const value = e.target && e.target.value;
              if (value) setSortMode(value);
            }}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </FormField>
          <Button
            button="primary"
            label={__('Apply Sort')}
            onClick={() => {
              handleSortAllSections();
              setShowSortControls(false);
            }}
          />
          <Button button="link" label={__('Close')} onClick={() => setShowSortControls(false)} />
        </div>
      )}

      {dragMode && !hasUsedDrag && (
        <div className="playlist-order-editor__drag-hint">
          <Icon icon={ICONS.DRAG} size={14} />
          <span>{__('Tip: Drag section and playlist handles to reorder quickly.')}</span>
        </div>
      )}

      {dragMode ? (
        <React.Suspense fallback={null}>
          <Lazy.DragDropContext
            onDragStart={() => {
              setHasUsedDrag(true);
            }}
            onDragEnd={handleDragEnd}
          >
            <Lazy.Droppable droppableId={SECTION_DROPPABLE_ID} type="SECTION">
              {(dropProvided) => (
                <div
                  className="playlist-order-editor__sections"
                  ref={dropProvided.innerRef}
                  {...dropProvided.droppableProps}
                >
                  {draftSections.map((section, sectionIndex) => (
                    <Lazy.Draggable
                      key={section.id}
                      draggableId={`playlist-order-section-${section.id}`}
                      index={sectionIndex}
                    >
                      {(sectionDraggableProvided, sectionDraggableSnapshot) =>
                        renderSection(section, sectionIndex, sectionDraggableProvided, sectionDraggableSnapshot)
                      }
                    </Lazy.Draggable>
                  ))}
                  {dropProvided.placeholder}
                </div>
              )}
            </Lazy.Droppable>
          </Lazy.DragDropContext>
        </React.Suspense>
      ) : (
        <div className="playlist-order-editor__sections">
          {draftSections.map((section, sectionIndex) => renderSection(section, sectionIndex))}
        </div>
      )}

      <div className={classnames('section__actions', 'playlist-order-editor__footer')}>
        <Button
          button="primary"
          label={__('Save Playlist Order')}
          onClick={handleSaveOrder}
          disabled={!hasDraftChanges}
        />
        <Button button="link" label={__('Cancel')} onClick={requestCloseEditor} />
      </div>
    </div>
  );
}

export default PlaylistOrderManager;
