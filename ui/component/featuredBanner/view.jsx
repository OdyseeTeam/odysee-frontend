// @flow
import React from 'react';
import { NavLink, withRouter } from 'react-router-dom';
import './style.scss';
type Props = {
  featured: any,
};

export default function FeaturedBanner(props: Props) {
  const { featured } = props;

  console.log('featured: ', featured);
  return <div className="featured-banner-wrapper">dsfsd</div>;
}
