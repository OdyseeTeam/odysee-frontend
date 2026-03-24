// @flow
import React from 'react';
import Page from 'component/page';
import Card from 'component/common/card';
import Button from 'component/button';
import Icon from 'component/common/icon';
import * as PAGES from 'constants/pages';
import * as ICONS from 'constants/icons';
import './style.scss';

const CareersPage = () => {
  return (
    <Page>
      <Card
        className="careers-overview-page"
        body={
          <>
            <div className="careers-hero">
              <h1>Work at Odysee</h1>
              <p className="careers-subtitle">Join the revolution in decentralized media</p>
            </div>

            <section className="section card--section">
              <h2 className="card__title">
                We're redefining online media because the current paradigm sucks.
                <br />
                If you share our passion and want to help we'd love to hear from you!
              </h2>

              <div className="careers-perks">
                <div className="perk-item">
                  <Icon icon={ICONS.GLOBE} size={24} />
                  <span>Remote-first culture</span>
                </div>
                <div className="perk-item">
                  <Icon icon={ICONS.TRENDING} size={24} />
                  <span>Cutting-edge technology</span>
                </div>
                <div className="perk-item">
                  <Icon icon={ICONS.FIRE} size={24} />
                  <span>Mission-driven team</span>
                </div>
              </div>

              <div className="job-listings">
                <h3 className="openings-title">Current Openings</h3>

                <div className="job-listing-item">
                  <Button
                    label={'Frontend Developer – Decentralized Media Ecosystem'}
                    navigate={`https://odysee.com/@careers:4/frontenddev:8`}
                    className="job-listing frontend-job"
                  />
                  <p className="job-description">Help build the future of content creation and discovery</p>
                </div>

                <div className="job-listing-item">
                  <Button
                    label={'Senior Backend Engineer'}
                    navigate={`/$/${PAGES.CAREERS_SENIOR_BACKEND_ENGINEER}`}
                    className="job-listing backend-job"
                  />
                  <p className="job-description">Scale our infrastructure for millions of creators</p>
                </div>
              </div>

              <div className="careers-cta">
                <p className="cta-text">
                  Don't see a perfect fit? We're always looking for talented people who believe in our mission.
                </p>
                <p className="cta-contact">
                  <Icon icon={ICONS.SEND} size={16} />
                  Drop us a line at <span className="email-highlight">careers@odysee.com</span>
                </p>
              </div>
            </section>
          </>
        }
      />
    </Page>
  );
};

export default CareersPage;
