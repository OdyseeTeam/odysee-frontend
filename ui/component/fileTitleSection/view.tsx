import * as React from 'react';
import { normalizeURI } from 'util/lbryURI';
import FilePrice from 'component/filePrice';
import GeoRestrictionInfo from 'component/geoRestictionInfo';
import ClaimInsufficientCredits from 'component/claimInsufficientCredits';
import FileSubtitle from 'component/fileSubtitle';
import ClaimAuthor from 'component/claimAuthor';
import Card from 'component/common/card';
import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import Icon from 'component/common/icon';
import I18nMessage from 'component/i18nMessage';
import Button from 'component/button';
import FileDescription from 'component/fileDescription';
import { ENABLE_MATURE } from 'config';
import { useIsMobile } from 'effects/use-screensize';
import { escapeHtmlProperty } from 'util/web';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { doFetchSubCount, selectSubCountForUri } from 'lbryinc';
import { selectClaimForUri } from 'redux/selectors/claims';
import { getClaimTitle } from 'util/claim';

type Props = {
  uri: string;
  nsfw: boolean;
  isNsfwBlocked: boolean;
  livestream?: boolean;
  hideDescription?: boolean;
  accessStatus?: string;
};
export default function FileTitleSection(props: Props) {
  const { uri, nsfw, isNsfwBlocked, livestream = false, hideDescription, accessStatus } = props;
  const dispatch = useAppDispatch();
  const claim = useAppSelector((state) => selectClaimForUri(state, uri));
  const { signing_channel: channel } = claim || {};
  const channelUri = channel && channel.canonical_url;
  const channelClaimId = channel && channel.claim_id;
  const title = getClaimTitle(claim);
  const subCount = useAppSelector((state) => channelUri && selectSubCountForUri(state, channelUri));
  const doFetchSubCount_ = (...args: Parameters<typeof doFetchSubCount>) => dispatch(doFetchSubCount(...args));
  const isMobile = useIsMobile();
  React.useEffect(() => {
    if (channelClaimId) doFetchSubCount_(channelClaimId);
  }, [channelClaimId, doFetchSubCount_]);
  return (
    <Card
      isPageTitle
      noTitleWrap
      title={
        <>
          {escapeHtmlProperty(title)}
          {nsfw && (
            <span className="media__title-badge">
              <span className="badge badge--tag-mature">{__('Mature')}</span>
            </span>
          )}
          <GeoRestrictionInfo uri={uri} />
        </>
      }
      titleActions={<FilePrice uri={normalizeURI(uri)} type="filepage" hideFree />}
      body={
        <>
          <ClaimInsufficientCredits uri={uri} />
          <FileSubtitle uri={uri} />
        </>
      }
      actions={
        isNsfwBlocked ? (
          <div className="main--empty">
            <h2>
              <>
                <Icon className="icon--hidden" icon={ICONS.EYE_OFF} />
                {ENABLE_MATURE ? __('Mature content blocked.') : __('Mature content is not supported.')}
              </>
            </h2>
            <div>
              {ENABLE_MATURE ? (
                <I18nMessage
                  tokens={{
                    content_settings: (
                      <Button button="link" label={__('content settings')} navigate={`/$/${PAGES.SETTINGS}`} />
                    ),
                  }}
                >
                  Change this in your %content_settings%.
                </I18nMessage>
              ) : (
                <I18nMessage
                  tokens={{
                    download_url: <Button label={__('lbry.com')} button="link" href="https://lbry.com/get" />,
                  }}
                >
                  You can download the LBRY Desktop or Android app on %download_url% and enable mature content in
                  Settings.
                </I18nMessage>
              )}
            </div>
          </div>
        ) : (
          <>
            <ClaimAuthor channelSubCount={subCount} uri={uri} />
            {!hideDescription && <FileDescription expandOverride={isMobile && livestream} uri={uri} />}
          </>
        )
      }
      accessStatus={accessStatus}
    />
  );
}
