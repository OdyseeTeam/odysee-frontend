// @flow

export const PLAYLIST_ORDER_VERSION = 1;

export const PLAYLIST_ORDER_SORT = Object.freeze({
  NEWEST: 'newest',
  OLDEST: 'oldest',
  TITLE_ASC: 'title_asc',
  TITLE_DESC: 'title_desc',
});

type PlaylistOrderSection = {
  id: string,
  title: string,
  itemIds: Array<string>,
};

type PlaylistOrderPayload = {
  version: number,
  sections: Array<PlaylistOrderSection>,
};

function toUniqueStringList(input: any): Array<string> {
  if (!Array.isArray(input)) {
    return [];
  }

  const seen = new Set();
  const output = [];

  input.forEach((item) => {
    if (typeof item !== 'string') return;
    const value = item.trim();
    if (!value || seen.has(value)) return;

    seen.add(value);
    output.push(value);
  });

  return output;
}

function toPlaylistSection(rawSection: any, fallbackIndex: number): ?PlaylistOrderSection {
  if (!rawSection || typeof rawSection !== 'object') {
    return null;
  }

  const id =
    typeof rawSection.id === 'string' && rawSection.id.trim()
      ? rawSection.id.trim()
      : `playlist-section-${fallbackIndex}`;

  const title = typeof rawSection.title === 'string' ? rawSection.title : '';
  const itemIds = toUniqueStringList(rawSection.item_ids || rawSection.itemIds || rawSection.claim_ids);

  return {
    id,
    title,
    itemIds,
  };
}

function normalizeSectionIds(sections: Array<PlaylistOrderSection>): Array<PlaylistOrderSection> {
  const seen = new Set();

  return sections.map((section, index) => {
    let id = section.id || `playlist-section-${index}`;
    if (seen.has(id)) {
      id = `${id}-${index}`;
    }
    seen.add(id);

    return {
      ...section,
      id,
    };
  });
}

export function normalizePlaylistOrder(rawPlaylistOrder: any): PlaylistOrderPayload {
  if (!rawPlaylistOrder) {
    return {
      version: PLAYLIST_ORDER_VERSION,
      sections: [],
    };
  }

  let raw = rawPlaylistOrder;

  if (typeof rawPlaylistOrder === 'string') {
    try {
      raw = JSON.parse(rawPlaylistOrder);
    } catch (e) {
      return {
        version: PLAYLIST_ORDER_VERSION,
        sections: [],
      };
    }
  }

  if (Array.isArray(raw)) {
    return {
      version: PLAYLIST_ORDER_VERSION,
      sections: [
        {
          id: 'playlist-section-default',
          title: '',
          itemIds: toUniqueStringList(raw),
        },
      ],
    };
  }

  if (!raw || typeof raw !== 'object') {
    return {
      version: PLAYLIST_ORDER_VERSION,
      sections: [],
    };
  }

  if (Array.isArray(raw.sections)) {
    const sections = raw.sections.map((section, index) => toPlaylistSection(section, index)).filter(Boolean);

    return {
      version: PLAYLIST_ORDER_VERSION,
      sections: normalizeSectionIds(sections),
    };
  }

  const fallbackIds = toUniqueStringList(raw.item_ids || raw.itemIds || raw.claim_ids);
  if (fallbackIds.length) {
    return {
      version: PLAYLIST_ORDER_VERSION,
      sections: [
        {
          id: 'playlist-section-default',
          title: '',
          itemIds: fallbackIds,
        },
      ],
    };
  }

  return {
    version: PLAYLIST_ORDER_VERSION,
    sections: [],
  };
}

export function serializePlaylistOrderSections(
  sections: Array<{ id: string, title?: string, itemIds: Array<string> }>
): { version: number, sections: Array<{ id: string, title: string, item_ids: Array<string> }> } {
  const sanitized = normalizeSectionIds(
    (sections || []).map((section, index) => {
      const id = typeof section.id === 'string' && section.id.trim() ? section.id.trim() : `playlist-section-${index}`;
      return {
        id,
        title: typeof section.title === 'string' ? section.title : '',
        itemIds: toUniqueStringList(section.itemIds),
      };
    })
  );
  const serializedSections: Array<{ id: string, title: string, item_ids: Array<string> }> = sanitized.map(
    (section) => ({
      id: section.id,
      title: section.title,
      item_ids: section.itemIds,
    })
  );

  return {
    version: PLAYLIST_ORDER_VERSION,
    sections: serializedSections,
  };
}

export function getPlaylistClaimId(claim: any): ?string {
  const id = claim && claim.claim_id;
  return typeof id === 'string' && id ? id : null;
}

export function getPlaylistUri(claim: any): ?string {
  const uri = claim && (claim.canonical_url || claim.permanent_url);
  return typeof uri === 'string' && uri ? uri : null;
}

export function getPlaylistTitle(claim: any): string {
  if (!claim || typeof claim !== 'object') return '';
  const valueTitle = claim.value && typeof claim.value.title === 'string' ? claim.value.title : null;
  if (valueTitle && valueTitle.trim()) return valueTitle.trim();
  const name = typeof claim.name === 'string' ? claim.name : '';
  return name;
}

export function getPlaylistTimestamp(claim: any): number {
  const releaseTime = Number(claim && claim.value && claim.value.release_time);
  if (Number.isFinite(releaseTime) && releaseTime > 0) {
    return releaseTime;
  }

  const creationTime = Number(claim && claim.meta && claim.meta.creation_timestamp);
  if (Number.isFinite(creationTime) && creationTime > 0) {
    return creationTime;
  }

  const timestamp = Number(claim && claim.timestamp);
  if (Number.isFinite(timestamp) && timestamp > 0) {
    return timestamp;
  }

  return 0;
}

export function sortPlaylistIds(
  ids: Array<string>,
  playlistById: { [string]: any },
  sortBy: string = PLAYLIST_ORDER_SORT.NEWEST
): Array<string> {
  const output = (ids || []).slice();

  output.sort((a, b) => {
    const claimA = playlistById[a];
    const claimB = playlistById[b];
    const titleA = getPlaylistTitle(claimA).toLowerCase();
    const titleB = getPlaylistTitle(claimB).toLowerCase();
    const tsA = getPlaylistTimestamp(claimA);
    const tsB = getPlaylistTimestamp(claimB);

    switch (sortBy) {
      case PLAYLIST_ORDER_SORT.OLDEST:
        return tsA === tsB ? titleA.localeCompare(titleB) : tsA - tsB;
      case PLAYLIST_ORDER_SORT.TITLE_ASC:
        return titleA === titleB ? tsB - tsA : titleA.localeCompare(titleB);
      case PLAYLIST_ORDER_SORT.TITLE_DESC:
        return titleA === titleB ? tsB - tsA : titleB.localeCompare(titleA);
      case PLAYLIST_ORDER_SORT.NEWEST:
      default:
        return tsA === tsB ? titleA.localeCompare(titleB) : tsB - tsA;
    }
  });

  return output;
}
