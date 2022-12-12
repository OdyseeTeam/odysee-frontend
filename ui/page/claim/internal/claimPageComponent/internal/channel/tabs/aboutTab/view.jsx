// @flow
import { SIMPLE_SITE } from 'config';
import React from 'react';
import MarkdownPreview from 'component/common/markdown-preview';
import ClaimTags from 'component/claimTags';
import CreditAmount from 'component/common/credit-amount';
import Button from 'component/button';
import * as PAGES from 'constants/pages';
import DateTime from 'component/dateTime';
import YoutubeBadge from 'component/youtubeBadge';
import SUPPORTED_LANGUAGES from 'constants/supported_languages';

type Props = {
  claim: ChannelClaim,
  uri: string,
  description: ?string,
  email: ?string,
  website: ?string,
  languages: Array<string>,
  user: ?User,
  channelIsBlackListed: boolean,
};

const formatEmail = (email: string) => {
  if (email) {
    const protocolRegex = new RegExp('^mailto:', 'i');
    const protocol = protocolRegex.exec(email);
    return protocol ? email : `mailto:${email}`;
  }
  return null;
};

function AboutTab(props: Props) {
  const { claim, uri, description, email, website, languages, user, channelIsBlackListed } = props;
  const claimId = claim && claim.claim_id;
  const canView = user && user.global_mod;

  return (
    <div className="card">
      {channelIsBlackListed && (
        <section className="card--section dmca-info">
          <p>
            {__(
              'In response to a complaint we received under the US Digital Millennium Copyright Act, we have blocked access to this channel from our applications. Content may also be blocked due to DMCA Red Flag rules which are obvious copyright violations we come across, are discussed in public channels, or reported to us.'
            )}
          </p>
          <div className="section__actions">
            <Button button="link" href="https://help.odysee.tv/copyright/" label={__('Read More')} />
          </div>
        </section>
      )}
      <section className="section card--section">
        <>
          {description && (
            <>
              <label>{__('Description')}</label>
              <div className="media__info-text media__info-text--constrained">
                <MarkdownPreview content={description} />
              </div>
            </>
          )}
          {email && (
            <>
              <label>{__('Contact')}</label>
              <div className="media__info-text">
                <MarkdownPreview content={formatEmail(email)} simpleLinks />
              </div>
            </>
          )}
          {website && (
            <>
              <label>{__('Site')}</label>
              <div className="media__info-text">
                <MarkdownPreview content={website} simpleLinks />
              </div>
            </>
          )}

          <label>{__('Tags')}</label>
          <div className="media__info-text">
            <ClaimTags uri={uri} type="large" />
          </div>

          {languages && languages.length && (
            <>
              <label>{__('Languages')}</label>
              <div className="media__info-text">
                {languages.reduce((acc, lang, i) => {
                  return acc + `${SUPPORTED_LANGUAGES[lang]}` + ' ';
                }, '')}
              </div>
            </>
          )}

          <label>{__('Total Uploads')}</label>
          <div className="media__info-text">{claim.meta.claims_in_channel}</div>

          <label>{__('Created At')}</label>
          <div className="media__info-text">
            <DateTime timeAgo uri={uri} />
          </div>

          <label>{__('URL')}</label>
          <div className="media__info-text">
            <div className="media__info-text media__info-text--constrained">{claim.canonical_url}</div>
          </div>

          <label>{__('Claim ID')}</label>
          <div className="media__info-text">
            <div className="media__info-text media__info-text--constrained">{claim.claim_id}</div>
          </div>

          <label>{__('Staked Credits')}</label>
          <div className="media__info-text">
            <CreditAmount
              badge={false}
              amount={parseFloat(claim.amount) + parseFloat(claim.meta.support_amount)}
              precision={8}
            />{' '}
            {SIMPLE_SITE && (
              <Button
                button="link"
                label={__('view other claims at lbry://%name%', {
                  name: claim.name,
                })}
                navigate={`/$/${PAGES.TOP}?name=${claim.name}`}
              />
            )}
          </div>
          {canView && <YoutubeBadge channelClaimId={claimId} />}
        </>
      </section>
    </div>
  );
}

export default AboutTab;
