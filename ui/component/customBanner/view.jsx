import React, { useState, useRef, useEffect } from 'react';
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
    return !isBannerClosed;
  });

  // State to control the visibility of the context menu
  const [isMenuOpen, setIsMenuOpen] = useState(false);

   // Function to close the banner
  const menuRef = useRef(null);

  const handleCloseBanner = () => {
    setIsVisible(false);
    LocalStorage.setItem(bannerKey, 'closed');
  };

  // Function to toggle the visibility of the context menu
  const toggleMenu = (e) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isMenuOpen]);

  if (!isVisible) return null;

  /* If you want the banner to appear again after some time or in a new session, you can clear the saved state in localStorage. For example:
// Clear the status of all banners
Object.keys(localStorage).forEach((key) => {
  if (key.startsWith("banner-")) {
    localStorage.removeItem(key);
  }
}); */

  return (
    <div className={`banner-container ${isSecondary ? 'banner-secondary variant-1' : 'banner-primary'}`}>
      <div className="banner-context-menu" ref={menuRef}>
        <button className="banner-menu-button" onClick={toggleMenu} aria-label="More options">
          <Icon icon={ICONS.MORE} />
        </button>
        {isMenuOpen && (
          <div className="banner-menu-dropdown">
            <button className="banner-menu-item" onClick={handleCloseBanner}>
              Close the banner
            </button>
          </div>
        )}
      </div>

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
