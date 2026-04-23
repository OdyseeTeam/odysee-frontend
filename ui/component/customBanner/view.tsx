import React, { useState } from 'react';
import './style.scss';
import Icon from 'component/common/icon';
import * as ICONS from 'constants/icons';
import { LocalStorage } from 'util/storage';

type Props = {
  image: { url: string; alt: string };
  label: string;
  description: string;
  tag?: string;
  button: { text: string; link: string };
  background: { url: string; alt: string };
  isSecondary?: boolean;
};

const CustomBanner = ({ image, label, description, tag, button, background, isSecondary = false }: Props) => {
  // Generate a unique key for the banner based on its content (e.g., the tag)
  const bannerKey = `banner-${label.replace(/\s+/g, '-').toLowerCase()}`;
  // State to control the visibility of the banner
  const [isVisible, setIsVisible] = useState(() => {
    // Check if the banner was previously closed (using localStorage)
    const isBannerClosed = LocalStorage.getItem(bannerKey) === 'closed';
    return !isBannerClosed;
  });
  const handleCloseBanner = () => {
    setIsVisible(false);
    LocalStorage.setItem(bannerKey, 'closed');
  };
  if (!isVisible) return null;

  /* If you want the banner to appear again after some time or in a new session, you can clear the saved state in localStorage. For example:
  // Clear the status of all banners
  Object.keys(localStorage).forEach((key) => {
  if (key.startsWith("banner-")) {
    localStorage.removeItem(key);
  }
  }); */
  return (
    <div className={`banner-container ${isSecondary ? 'banner-secondary' : 'banner-primary'}`}>
      <button className="banner-close-button" onClick={handleCloseBanner} aria-label="Close banner">
        <Icon icon={ICONS.REMOVE} />
      </button>

      <div className="banner-content-wrapper">
        <img loading="lazy" className="banner-image" src={image.url} alt={image.alt} />
        <div className="banner-text-container">
          <div className="banner-label">{label}</div>
          <div className="banner-description">{description}</div>
          {tag && <div className="banner-tag">{tag}</div>}
          <a className="banner-button" href={button.link} target="_blank" rel="noopener noreferrer">
            {button.text}
          </a>
        </div>
        <img loading="lazy" className="banner-background" src={background.url} alt={background.alt} />
      </div>
    </div>
  );
};

export default CustomBanner;
