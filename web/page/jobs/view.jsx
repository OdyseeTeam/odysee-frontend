// @flow
import React from 'react';
import Page from 'component/page';
import Card from 'component/common/card';
import SectionDivider from 'component/common/section-divider';

const JobsPage = () => {
  return (
    <Page>
      <Card
        title={__('Work With Us')}
        body={
          <>
            <section className="section card--section">
              <h1 className="card__title">Who We Are</h1>
              <p>
                Were a cast of characters working to shine a spotlight on anime. Crunchyroll is an international
                business focused on creating both online and offline experiences for fans through content (licensed,
                co-produced, originals, distribution), merchandise, events, gaming, news, and more. Visit our About Us
                pages for more information about our collection of brands.
              </p>
            </section>

            <section className="section card--section">
              <h1 className="card__title">About the Team</h1> The Crunchyroll Accounting Team is a global organization
              <p>
                of nearly 50 professionals working together to support all of our critical business functions and ensure
                compliance with accounting standards, company policy, and regulatory bodies. As part of the accounting
                leadership team, this individual is joining during a period of significant transformation and will have
                an opportunity to help build out a highly collaborative team and processes to help the company achieve
                our ambitious goals for global growth in both the near and long term.
              </p>
            </section>

            <section className="section card--section">
              <h1 className="card__title">About You:</h1>
              <ul>
                <li>Experience in accounting in Japan for at least 3 years.</li>
                <li>Knowledge of general accounting principles (equivalent to 2nd grade of Nissho-boki ).</li>
                <li>Proficiency in English (business level in reading, writing, and speaking), and Japanese.</li>
                <li>Intermediate skills in using Microsoft Word and Excel.</li>
                <li>
                  Ability to work with uncertainty and be flexible in order to build up a new process by communicating
                  with related people.
                </li>
              </ul>
            </section>

            <section className="section card--section">
              <h1 className="card__title">Pluses:</h1>
              <ul>
                <li>Expertise in preparation of royalty/dividend reports in Japanese entertainment industries.</li>
                <li>Experience in using NetSuite.</li>
                <li>Experience working for a Japanese branch/subsidiary of a foreign global company.</li>
              </ul>
            </section>

            <section className="section card--section">
              <h1 className="card__title">A day in the life of our Senior Accountant:</h1>
              <ul>
                <li>
                  Prepare error-free royalty/dividend reports invested by Crunchyroll in accordance with agreements and
                  in collaboration with the co-production team.
                </li>
                <li>
                  {
                    'Read and interpret licensing & production agreements, partnering with the content production teams and legal department to ensure reporting is in compliance with contract terms and conditions.'
                  }
                </li>
                <li>Process payments of royalty and dividend, and correspond with inquiries from external partners.</li>
                <li>Keep track of accounts receivable and accounts payable.</li>
                <li>
                  Process month-end and year-end close, by posting journal entries and preparing account
                  reconciliations.
                </li>
                <li>Support US financial audits by preparing requests from internal/external auditors.</li>
                <li>
                  Manage administrative tasks related to the operation and regulatory needs, such as paper
                  record-keeping.
                </li>
                <li>Coordinate with a tax consultant, and facilitate statutory required tax returns.</li>
                <li>Perform other duties and ad hoc requests.</li>
              </ul>
            </section>

            <section className="section card--section">
              <h1 className="card__title">Benefits: Tokyo Office:</h1>
              <ul>
                <li>Competitive salary.</li>
                <li>Social Health Insurances, 401k, and Commuter benefits.</li>
                <li>{'Meal & Gym Allowances'}.</li>
                <li>{'Weekly Luncheon & Quarterly Outing Trip.'}</li>
              </ul>
            </section>

            <SectionDivider />

            <section className="section card--section">
              <h1 className="card__title">About Crunchyroll</h1>
              <p>
                Crunchyroll connects anime and manga fans across 200+ countries and territories with the content and
                experiences they love. In addition to free ad-supported and subscription premium content, Crunchyroll
                serves the anime community across events, theatrical, games, consumer products, collectibles and manga
                publishing.
              </p>
              <p>
                Anime fans have access to one of the largest collections of licensed anime through Crunchyroll and
                translated in multiple languages for viewers worldwide. Viewers can also access simulcasts — top series
                available immediately after Japanese broadcast.
              </p>
              <p>The Crunchyroll app is available on over 15 platforms, including all gaming consoles.</p>
              <p>
                Crunchyroll, LLC is an independently operated joint venture between US-based Sony Pictures
                Entertainment, and Japan’s Aniplex, a subsidiary of Sony Music Entertainment (Japan) Inc., both
                subsidiaries of Tokyo-based Sony Group Corporation.
              </p>
            </section>

            <section className="section card--section">
              <h1 className="card__title">Our Company Values</h1>
              <p>You’ll see these in action if we’re lucky enough to have you:</p>
              <ul>
                <li>Courage - When we overcome fear, we enable our best selves.</li>
                <li>Curiosity - We are curious, which is the gateway to empathy, inclusion, and understanding.</li>
                <li>Service - We serve our community with humility, enabling joy and belonging for others.</li>
                <li>Kaizen - We have a growth mindset committed to constant forward progress.</li>
              </ul>
            </section>
          </>
        }
      />
    </Page>
  );
};

export default JobsPage;
