// @flow
import { SITE_NAME, DOMAIN } from 'config';
import * as PAGES from 'constants/pages';
import SUPPORTED_LANGUAGES from 'constants/supported_languages';
import React from 'react';
import Page from 'component/page';
import Button from 'component/button';
import Card from 'component/common/card';
import I18nMessage from 'component/i18nMessage';
import { Form, FormField } from 'component/common/form';
import { INVALID_NAME_ERROR } from 'constants/claim';
import { isNameValid } from 'util/lbryURI';
import { Lbryio } from 'lbryinc';
import { useHistory } from 'react-router';
import Nag from 'component/nag';
import { lazyImport } from 'util/lazyImport';
import { getDefaultLanguage, sortLanguageMap } from 'util/default-languages';

const YoutubeTransferStatus = lazyImport(() =>
  import('component/youtubeTransferStatus' /* webpackChunkName: "youtubeTransferStatus" */)
);

const STATUS_TOKEN_PARAM = 'status_token';
const ERROR_PARAM = 'error';
const ERROR_MESSAGE_PARAM = 'error_message';
const NEW_CHANNEL_PARAM = 'new_channel';
const AUTO_OPEN_SYNC_PARAM = 'open_in_sync';
const AUTO_OPEN_SYNC_PARAM_ALT = 'open_app';

function isTruthyQueryValue(value: ?string): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  if (value === '') {
    return true;
  }

  const normalizedValue = value.toLowerCase();
  return normalizedValue !== '0' && normalizedValue !== 'false' && normalizedValue !== 'no';
}

type Props = {
  youtubeChannels: ?Array<{ transfer_state: string, sync_status: string }>,
  doUserFetch: () => void,
  inSignUpFlow?: boolean,
  doToggleInterestedInYoutubeSync: () => void,
};

export default function YoutubeSync(props: Props) {
  const { youtubeChannels, doUserFetch, inSignUpFlow = false, doToggleInterestedInYoutubeSync } = props;
  const {
    location: { search, pathname },
    push,
    replace,
  } = useHistory();
  const urlParams = new URLSearchParams(search);
  const statusToken = urlParams.get(STATUS_TOKEN_PARAM);
  const hasErrorParam = urlParams.get(ERROR_PARAM) === 'true';
  const errorMessage = urlParams.get(ERROR_MESSAGE_PARAM);
  const newChannelParam = urlParams.get(NEW_CHANNEL_PARAM);
  const hasAutoOpenSyncPrimaryParam = urlParams.has(AUTO_OPEN_SYNC_PARAM);
  const autoOpenSyncParam = hasAutoOpenSyncPrimaryParam
    ? urlParams.get(AUTO_OPEN_SYNC_PARAM)
    : urlParams.get(AUTO_OPEN_SYNC_PARAM_ALT);
  const shouldAutoOpenSync = isTruthyQueryValue(autoOpenSyncParam);
  const [channel, setChannel] = React.useState('');
  const [language, setLanguage] = React.useState(getDefaultLanguage());
  const [nameError, setNameError] = React.useState(undefined);
  const [acknowledgedTerms, setAcknowledgedTerms] = React.useState(false);
  const [addingNewChannel, setAddingNewChannel] = React.useState(Boolean(newChannelParam));
  const hasYoutubeAuthError = hasErrorParam || Boolean(errorMessage);
  const youtubeAuthErrorMessage =
    hasYoutubeAuthError && !errorMessage
      ? __('There was a problem connecting this YouTube channel. Please try again.')
      : errorMessage;
  const hasYoutubeChannels = youtubeChannels && youtubeChannels.length > 0;
  const showYoutubeTransferStatus = hasYoutubeChannels && !addingNewChannel && !hasYoutubeAuthError;

  React.useEffect(() => {
    const urlParamsInEffect = new URLSearchParams(search);
    if (!urlParamsInEffect.get('reset_scroll')) {
      urlParamsInEffect.append('reset_scroll', 'youtube');
    }

    replace(`?${urlParamsInEffect.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- @see TODO_NEED_VERIFICATION
  }, [pathname, search]);

  React.useEffect(() => {
    if (statusToken && !hasYoutubeChannels) {
      doUserFetch();
    }
  }, [statusToken, hasYoutubeChannels, doUserFetch]);

  React.useEffect(() => {
    setAddingNewChannel(Boolean(newChannelParam));
  }, [newChannelParam]);

  function handleCreateChannel() {
    Lbryio.call('yt', 'new', {
      type: 'sync',
      immediate_sync: true,
      channel_language: language,
      desired_lbry_channel_name: `@${channel}`,
      return_url: `https://${DOMAIN}/$/${inSignUpFlow ? PAGES.AUTH : PAGES.YOUTUBE_SYNC}`,
    }).then((ytAuthUrl) => {
      // react-router isn't needed since it's a different domain
      window.location.href = ytAuthUrl;
    });
  }

  function handleChannelChange(e) {
    const { value } = e.target;
    setChannel(value);
    if (!isNameValid(value)) {
      setNameError(INVALID_NAME_ERROR);
    } else {
      setNameError();
    }
  }

  function handleNewChannel() {
    urlParams.set('new_channel', 'true');
    push(`${pathname}?${urlParams.toString()}`);
    setAddingNewChannel(true);
  }

  const Wrapper = (props: { children: any }) => {
    return inSignUpFlow ? (
      <>{props.children}</>
    ) : (
      <Page noSideNavigation authPage>
        {props.children}
      </Page>
    );
  };

  return (
    <Wrapper>
      <div className="main__channel-creation">
        {showYoutubeTransferStatus ? (
          <React.Suspense fallback={null}>
            <YoutubeTransferStatus alwaysShow addNewChannel={handleNewChannel} autoOpenSync={shouldAutoOpenSync} />
          </React.Suspense>
        ) : (
          <Card
            className="card--youtube-sync"
            title={__('Sync your YouTube channel to %site_name%', { site_name: IS_WEB ? SITE_NAME : 'Odysee' })}
            subtitle={__(
              `Don't want to manually upload? Get your YouTube videos in front of the %site_name% audience.`,
              {
                site_name: IS_WEB ? SITE_NAME : 'Odysee',
              }
            )}
            actions={
              <Form onSubmit={handleCreateChannel}>
                <fieldset-group class="fieldset-group--smushed fieldset-group--disabled-prefix">
                  <fieldset-section>
                    <label htmlFor="auth_first_channel">
                      {nameError ? (
                        <span className="error__text">{nameError}</span>
                      ) : (
                        __('Your desired %site_name% channel name', { site_name: IS_WEB ? SITE_NAME : 'Odysee' })
                      )}
                    </label>
                    <div className="form-field__prefix">@</div>
                  </fieldset-section>

                  <FormField
                    autoFocus
                    placeholder={__('channel')}
                    type="text"
                    name="yt_sync_channel"
                    className="form-field--short"
                    value={channel}
                    onChange={handleChannelChange}
                  />
                </fieldset-group>
                <FormField
                  name="language_select"
                  type="select"
                  label={__('Channel language')}
                  onChange={(event) => setLanguage(event.target.value)}
                  value={language}
                >
                  {sortLanguageMap(SUPPORTED_LANGUAGES).map(([langKey, langName]) => (
                    <option key={langKey} value={langKey}>
                      {langName}
                    </option>
                  ))}
                </FormField>
                <FormField
                  type="checkbox"
                  name="yt_sync_terms"
                  checked={acknowledgedTerms}
                  onChange={() => setAcknowledgedTerms(!acknowledgedTerms)}
                  label={
                    <I18nMessage
                      tokens={{
                        terms: (
                          <Button button="link" label={__('these terms')} href="https://odysee.com/$/youtubetos" />
                        ),
                        faq: (
                          <Button
                            button="link"
                            label={__('how the program works')}
                            href="https://help.odysee.tv/category-syncprogram/whatisyoutubesync/"
                          />
                        ),
                        site_name: SITE_NAME,
                      }}
                    >
                      I want to sync my content to %site_name%. I have also read and understand %faq%.
                    </I18nMessage>
                  }
                />

                <div className="section__actions">
                  <Button
                    button="primary"
                    type="submit"
                    disabled={nameError || !channel || !acknowledgedTerms}
                    label={__('Claim Now')}
                  />

                  {inSignUpFlow && !hasYoutubeAuthError && (
                    <Button button="link" label={__('Skip')} onClick={() => doToggleInterestedInYoutubeSync()} />
                  )}

                  {hasYoutubeAuthError && (
                    <Button
                      button="link"
                      label={__('Skip')}
                      navigate={`/$/${PAGES.YOUTUBE_SYNC}?reset_scroll=youtube`}
                    />
                  )}
                </div>
                <div className="help--card-actions">
                  <I18nMessage
                    tokens={{
                      learn_more: (
                        <Button
                          button="link"
                          label={__('Learn more')}
                          href="https://help.odysee.tv/category-syncprogram/"
                        />
                      ),
                      community_guidelines: (
                        <Button
                          button="link"
                          label={__('Community Guidelines')}
                          href="https://help.odysee.tv/communityguidelines/"
                        />
                      ),
                    }}
                  >
                    Enrollment in the Odysee Sync Program is based on a manual assessment which requires a channel to
                    have at least 50,000 monthly views on YouTube, and to be in compliance with Odysee's
                    %community_guidelines%. %learn_more%.
                  </I18nMessage>
                </div>
              </Form>
            }
            nag={youtubeAuthErrorMessage && <Nag message={youtubeAuthErrorMessage} type="error" relative />}
          />
        )}
      </div>
    </Wrapper>
  );
}
