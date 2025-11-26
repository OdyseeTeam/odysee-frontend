// @flow
import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';

type HomepageOrder = { active: ?Array<string>, hidden: ?Array<string> };

const FYP_SECTION: RowDataItem = {
  id: 'FYP',
  title: 'Recommended',
  icon: ICONS.GLOBE,
  link: `/$/${PAGES.FYP}`,
};

function pushAllValidCategories(rowData: Array<RowDataItem>, isAuthenticated: ?boolean) {
  const x: Array<RowDataItem> = [];

  rowData.forEach((data: RowDataItem) => {
    console.log(data);
    if (!data.hideByDefault) {
      x.push(data);
    }

    if (data.id === 'FOLLOWING' && isAuthenticated) {
      x.push(FYP_SECTION);
    }
  });

  return x;
}

export function getSortedRowData(
  authenticated: boolean,
  homepageOrder: HomepageOrder,
  homepageData: any,
  rowData: Array<RowDataItem>
) {
  let sortedRowData: Array<RowDataItem> = [];
  const hasBanner = Boolean(homepageData?.featured);

  if (authenticated) {
    if (homepageOrder.active) {
      homepageOrder.active.forEach((key) => {
        const dataIndex = rowData.findIndex((data) => data.id === key);
        if (dataIndex !== -1) {
          sortedRowData.push(rowData[dataIndex]);
          rowData.splice(dataIndex, 1);
        } else if (key === 'FYP') {
          sortedRowData.push(FYP_SECTION);
        } else if (key === 'BANNER' && hasBanner) {
          sortedRowData.push({ id: 'BANNER', title: undefined });
        } else if (key === 'UPCOMING') {
          let followingIndex = sortedRowData.indexOf('FOLLOWING');
          if (followingIndex !== -1) sortedRowData.splice(followingIndex, 0, { id: 'UPCOMING', title: 'Upcoming' });
          else sortedRowData.push({ id: 'UPCOMING', title: 'Upcoming' });
        }
      });

      let discoveryChannel;
      rowData.forEach((data: RowDataItem) => {
        if (!data.hideByDefault) {
          if (!homepageOrder.hidden || !homepageOrder.hidden.includes(data.id)) {
            if (data.id === 'EXPLORABLE_CHANNEL') {
              discoveryChannel = data;
            } else {
              sortedRowData.push(data);
            }
          }
        }
      });

      if (discoveryChannel) {
        const followingIndex = sortedRowData.findIndex((item) => item.id === 'FOLLOWING');
        if (followingIndex !== -1) {
          sortedRowData.splice(followingIndex + 1, 0, discoveryChannel);
        } else {
          sortedRowData.push(discoveryChannel);
        }
      }

      if (!homepageOrder.active.includes('FYP') && !homepageOrder.hidden.includes('FYP')) {
        let followingIndex = homepageOrder.active.indexOf('FOLLOWING');
        if (followingIndex !== -1) sortedRowData.splice(followingIndex + 1, 0, FYP_SECTION);
      }

      if (
        homepageOrder.active &&
        !homepageOrder.active.includes('BANNER') &&
        homepageOrder.hidden &&
        !homepageOrder.hidden.includes('BANNER')
      ) {
        sortedRowData.unshift({ id: 'BANNER', title: undefined });
      }
    } else {
      if (hasBanner) rowData.unshift({ id: 'BANNER', title: undefined });
      sortedRowData = pushAllValidCategories(rowData, authenticated);
      if (authenticated) sortedRowData.splice(1, 0, { id: 'UPCOMING', title: 'Upcoming' });
    }
  } else {
    if (hasBanner) rowData.unshift({ id: 'BANNER', title: undefined });
    sortedRowData = pushAllValidCategories(rowData, authenticated);
  }

  return sortedRowData;
}
