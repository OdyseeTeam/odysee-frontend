import React from 'react';
import Button from 'component/button'; // Allow screen reader users ( or keyboard navigation )
// to jump to main content

const skipNavigation = (e) => {
  // Match any focusable element
  const focusableElementQuery = `
    #main-content [tabindex]:not([tabindex="-1"]):not(:disabled),
    #main-content a:not([aria-hidden]):not([tabindex="-1"]):not(:disabled),
    #main-content button:not([aria-hidden]):not([tabindex="-1"]):not(:disabled)
  `;
  // Find first focusable element
  const element = document.querySelector(focusableElementQuery);

  // Trigger focus to skip navigation
  if (element && element.focus) {
    element.focus();
  }
};

export default function SkipNavigationButton() {
  return <Button className={'skip-button'} onClick={skipNavigation} label={__('Skip Navigation')} button={'link'} />;
}
