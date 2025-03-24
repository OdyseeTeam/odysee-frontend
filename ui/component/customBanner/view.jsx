import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './style.scss';
import Icon from 'component/common/icon';
import * as ICONS from 'constants/icons';
import { LocalStorage } from 'util/storage';

const CustomBanner = ({ image, label, description, tag, button, background, isSecondary }) => {
  // Generate a unique key for the banner based on its content (e.g., the tag)
  const bannerKey = `banner-${label.replace(/\s+/g, '-').toLowerCase()}`;

  // State to control the visibility of the banner
  const [isVisible, setIsVisible] = useState(() => {
    // Check if the banner was previously closed (using localStorage)
    const isBannerClosed = LocalStorage.getItem(bannerKey) === 'closed';
    return !isBannerClosed; // Show the banner if it is not closed
  });

  // State to control the visibility of the context menu
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Function to close the banner
  const handleCloseBanner = () => {
    setIsVisible(false); // Hide the banner
    LocalStorage.setItem(bannerKey, 'closed'); // Save the state to localStorage
  };

  // Function to toggle the visibility of the context menu
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // If the banner is not visible, do not render anything.
  if (!isVisible) return null;

  // Clear the status of a specific banner
  LocalStorage.removeItem(bannerKey);

  /* If you want the banner to appear again after some time or in a new session, you can clear the saved state in localStorage. For example:

// Clear the status of all banners
Object.keys(localStorage).forEach((key) => {
  if (key.startsWith("banner-")) {
    localStorage.removeItem(key);
  }
}); */

  return (
    <div className={`banner-container ${isSecondary ? 'banner-secondary' : 'banner-primary'}`}>
      {/* Context menu */}
      <div className="banner-context-menu">
        <button className="banner-menu-button" onClick={toggleMenu}>
          <Icon icon={ICONS.MORE} />
        </button>
        {isMenuOpen && (
          <div className="banner-menu-dropdown">
            <button className="banner-menu-item" onClick={handleCloseBanner}>
              Close banner
            </button>
          </div>
        )}
      </div>

      {/* Banner content */}
      <div className="banner-content-wrapper">
        <img className="banner-image" src={image.url} alt={image.alt} />
        <div className="banner-text-container">
          <div className="banner-label">{label}</div>
          <div className="banner-description">{description}</div>
          {tag && <div className="banner-tag">{tag}</div>}
          <a className="banner-button" href={button.link}>
            {button.text}
          </a>
        </div>
        <img className="banner-background" src={background.url} alt={background.alt} />
      </div>
    </div>
  );
};

CustomBanner.propTypes = {
  image: PropTypes.shape({
    url: PropTypes.string.isRequired,
    alt: PropTypes.string.isRequired,
  }).isRequired,
  label: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  tag: PropTypes.string,
  button: PropTypes.shape({
    text: PropTypes.string.isRequired,
    link: PropTypes.string.isRequired,
  }).isRequired,
  background: PropTypes.shape({
    url: PropTypes.string.isRequired,
    alt: PropTypes.string.isRequired,
  }).isRequired,
  isSecondary: PropTypes.bool,
};

CustomBanner.defaultProps = {
  isSecondary: false,
};

export default CustomBanner;
