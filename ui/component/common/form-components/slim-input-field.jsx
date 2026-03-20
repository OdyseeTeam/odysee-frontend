// @flow
import React from 'react';
import Drawer from '@mui/material/Drawer';
import CommentSelectors from 'component/commentCreate/internal/comment-selectors';

type TextareaWrapperProps = {
  slimInput?: boolean,
  slimInputButtonRef?: any,
  children: any,
  isDrawerOpen: boolean,
  showSelectors?: boolean,
  commentSelectorsProps?: any,
  tipModalOpen?: boolean,
  onSlimInputClose?: () => void,
  toggleDrawer: () => void,
  closeSelector?: () => void,
};

export const TextareaWrapper = (wrapperProps: TextareaWrapperProps) => {
  const {
    children,
    slimInput,
    slimInputButtonRef,
    isDrawerOpen,
    commentSelectorsProps,
    showSelectors,
    tipModalOpen,
    onSlimInputClose,
    toggleDrawer,
    closeSelector,
  } = wrapperProps;

  // $FlowFixMe
  const fullscreenEl = document.fullscreenElement;

  function handleCloseAll() {
    toggleDrawer();
    if (closeSelector) closeSelector();
    if (onSlimInputClose) onSlimInputClose();
  }

  return slimInput ? (
    !isDrawerOpen ? (
      <div ref={slimInputButtonRef} role="button" onClick={toggleDrawer}>
        {children}
      </div>
    ) : (
      <Drawer
        className="comment-create--drawer"
        anchor="bottom"
        open
        onClose={handleCloseAll}
        ModalProps={{ disableEnforceFocus: tipModalOpen, ...(fullscreenEl ? { container: fullscreenEl } : {}) }}
      >
        {children}

        {showSelectors && <CommentSelectors closeSelector={closeSelector} {...commentSelectorsProps} />}
      </Drawer>
    )
  ) : (
    children
  );
};
