// @flow

/**
 * Used by a list render-function to retrieve the injected item (if any) at a
 * particular index, based on the given `injectedItem` definition.
 *
 * @param index The current index of interest.
 * @param pageSize The page size setting of the list.
 * @param injectedItem The injection definition given by the client.
 * @param lastVisibleIndex The index of the last visible item in the current page.
 * @returns {null|Node|ListInjectedItemCallback|*} The element to render at the current index.
 */
export const getInjectedItem = (
  index: number,
  pageSize: ?number,
  injectedItem: ?ListInjectedItem,
  lastVisibleIndex: ?number
) => {
  if (injectedItem && injectedItem.node) {
    if (typeof injectedItem.node === 'function') {
      return injectedItem.node(index, lastVisibleIndex, pageSize);
    } else {
      if (injectedItem.index === undefined || injectedItem.index === null) {
        return index === lastVisibleIndex ? injectedItem.node : null;
      } else {
        return index === injectedItem.index ? injectedItem.node : null;
      }
    }
  }

  return null;
};
