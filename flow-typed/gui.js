
declare type ListInjectedItemCallback = (index: number, lastVisibleIndex: ?number, pageSize: ?number) => Node;

declare type ListInjectedItem = {
  node: Node | ListInjectedItemCallback, // The element to inject, or a callback to retrieve the element(s) to inject.
  index?: number, // The location to inject the item. Not applicable in callback-mode.
  disableCountCompensation?: boolean, // By default, the list compensates (reduces) the number of items shown per page
                                      // to ensure the original item-per-page count stays the same. This flag disables
                                      // that -- useful if the injected item is a css-block, or for whatever reason.
};
