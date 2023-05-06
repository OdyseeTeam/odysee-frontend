// @flow
import * as MODALS from 'constants/modal_types';
import * as ICONS from 'constants/icons';
import React from 'react';
import classnames from 'classnames';
import { FormField } from 'component/common/form';
import Button from 'component/button';
import TagsSearch from 'component/tagsSearch';
import { FF_MAX_CHARS_IN_DESCRIPTION } from 'constants/form-field';
import ErrorText from 'component/common/error-text';
import ChannelThumbnail from 'component/channelThumbnail';
import { isNameValid, parseURI } from 'util/lbryURI';
import ClaimAbandonButton from 'component/claimAbandonButton';
import { useHistory } from 'react-router-dom';
import { MINIMUM_PUBLISH_BID, INVALID_NAME_ERROR, ESTIMATED_FEE } from 'constants/claim';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'component/common/tabs';
import Card from 'component/common/card';
import * as PAGES from 'constants/pages';
import * as PUBLISH from 'constants/publish';
import analytics from 'analytics';
import LbcSymbol from 'component/common/lbc-symbol';
import SUPPORTED_LANGUAGES from 'constants/supported_languages';
import WalletSpendableBalanceHelp from 'component/walletSpendableBalanceHelp';
import { SIMPLE_SITE, THUMBNAIL_CDN_SIZE_LIMIT_BYTES } from 'config';
import { sortLanguageMap } from 'util/default-languages';
import ThumbnailBrokenImage from 'component/selectThumbnail/thumbnail-broken.png';
import Gerbil from 'component/channelThumbnail/gerbil.png';
import Icon from 'component/common/icon';

const MAX_TAG_SELECT = 5;

type Props = {
  uri: string,
  onDone: () => void,
  disabled: boolean,
  openModal: (
    id: string,
    { onUpdate: (string, boolean) => void, assetName: string, helpText: string, currentValue: string, title: string }
  ) => void,
  // --- redux ---
  claim: ChannelClaim,
  title: string,
  amount: number,
  coverUrl: string,
  thumbnailUrl: string,
  description: string,
  website: string,
  email: string,
  balance: number,
  tags: Array<string>,
  locations: Array<string>,
  languages: Array<string>,
  updateChannel: (any) => Promise<any>,
  updatingChannel: boolean,
  updateError: string,
  createChannel: (any) => Promise<any>,
  createError: string,
  creatingChannel: boolean,
  clearChannelErrors: () => void,
  claimInitialRewards: () => void,
  isClaimingInitialRewards: boolean,
  hasClaimedInitialRewards: boolean,
};

function ChannelForm(props: Props) {
  const {
    uri,
    claim,
    amount,
    title,
    description,
    website,
    email,
    thumbnailUrl,
    coverUrl,
    tags,
    locations,
    languages = [],
    onDone,
    updateChannel,
    updateError,
    updatingChannel,
    createChannel,
    creatingChannel,
    createError,
    clearChannelErrors,
    claimInitialRewards,
    openModal,
    disabled,
    isClaimingInitialRewards,
    hasClaimedInitialRewards,
  } = props;

  const [nameError, setNameError] = React.useState(undefined);
  const [bidError, setBidError] = React.useState('');
  const [isUpload, setIsUpload] = React.useState({ cover: false, thumbnail: false });
  const [coverError, setCoverError] = React.useState(false);
  const [thumbError, setThumbError] = React.useState(false);

  const { claim_id: claimId } = claim || {};
  const [params, setParams]: [any, (any) => void] = React.useState(getChannelParams());
  const { channelName } = parseURI(uri);
  const name = params.name;
  const isNewChannel = !uri;
  const { replace } = useHistory();

  const languageParam = params.languages;
  const primaryLanguage = Array.isArray(languageParam) && languageParam.length && languageParam[0];
  const secondaryLanguage = Array.isArray(languageParam) && languageParam.length >= 2 && languageParam[1];
  const submitLabel = React.useMemo(() => {
    if (isClaimingInitialRewards) {
      return __('Claiming credits...');
    }
    return creatingChannel || updatingChannel ? __('Saving...') : __('Save');
  }, [isClaimingInitialRewards, creatingChannel, updatingChannel]);

  const submitDisabled = React.useMemo(() => {
    return (
      isClaimingInitialRewards ||
      creatingChannel ||
      updatingChannel ||
      coverError ||
      bidError ||
      (isNewChannel && !params.name)
    );
  }, [isClaimingInitialRewards, creatingChannel, updatingChannel, bidError, isNewChannel, coverError, params.name]);

  const errorMsg = resolveErrorMsg();
  const coverSrc = coverError ? ThumbnailBrokenImage : params.coverUrl;
  const thumbnailPreview = resolveThumbnailPreview();

  const [scrollPast, setScrollPast] = React.useState(0);
  const onScroll = () => {
    if (window.pageYOffset > 240) {
      setScrollPast(true);
    } else {
      setScrollPast(false);
    }
  };
  React.useEffect(() => {
    window.addEventListener('scroll', onScroll, {
      passive: true,
    });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function getChannelParams() {
    // fill this in with sdk data
    const channelParams: {
      website: string,
      email: string,
      coverUrl: string,
      thumbnailUrl: string,
      description: string,
      title: string,
      amount: number,
      languages: ?Array<string>,
      locations: ?Array<string>,
      tags: ?Array<{ name: string }>,
      claim_id?: string,
    } = {
      website,
      email,
      coverUrl,
      thumbnailUrl,
      description,
      title,
      amount: amount || 0.001,
      languages: languages || [],
      locations: locations || [],
      tags: tags
        ? tags.map((tag) => {
            return { name: tag };
          })
        : [],
    };

    if (claimId) {
      channelParams['claim_id'] = claimId;
    }

    return channelParams;
  }

  function handleBidChange(bid: number) {
    const { balance, amount } = props;
    const totalAvailableBidAmount = (parseFloat(amount) || 0.0) + (parseFloat(balance) || 0.0);

    setParams({ ...params, amount: bid });

    if (bid <= 0.0 || isNaN(bid)) {
      setBidError(__('Deposit cannot be 0'));
    } else if (totalAvailableBidAmount < bid) {
      setBidError(
        __('Deposit cannot be higher than your available balance: %balance%', { balance: totalAvailableBidAmount })
      );
    } else if (totalAvailableBidAmount - bid < ESTIMATED_FEE) {
      setBidError(__('Please decrease your deposit to account for transaction fees'));
    } else if (bid < MINIMUM_PUBLISH_BID) {
      setBidError(__('Your deposit must be higher'));
    } else {
      setBidError('');
    }
  }

  function handleLanguageChange(index, code) {
    let langs = [...languageParam];
    if (index === 0) {
      if (code === PUBLISH.LANG_NONE) {
        // clear all
        langs = [];
      } else {
        langs[0] = code;
      }
    } else {
      if (code === PUBLISH.LANG_NONE || code === langs[0]) {
        langs.splice(1, 1);
      } else {
        langs[index] = code;
      }
    }
    setParams({ ...params, languages: langs });
  }

  function handleThumbnailChange(thumbnailUrl: string, uploadSelected: boolean) {
    setParams({ ...params, thumbnailUrl });
    setIsUpload({ ...isUpload, thumbnail: uploadSelected });
    setThumbError(false);
  }

  function handleCoverChange(coverUrl: string, uploadSelected: boolean) {
    setParams({ ...params, coverUrl });
    setIsUpload({ ...isUpload, cover: uploadSelected });
    setCoverError(false);
  }

  function handleSubmit() {
    if (uri) {
      updateChannel(params).then((success) => {
        if (success) {
          onDone();
        }
      });
    } else {
      createChannel(params).then((success) => {
        if (success) {
          analytics.apiLog.publish(success);
          onDone();
        }
      });
    }
  }

  function resolveErrorMsg() {
    const LIMIT_ERR_PARTIAL_MSG = 'bad-txns-claimscriptsize-toolarge (code 16)';
    let errorMsg = updateError || createError;
    if (errorMsg && errorMsg.includes(LIMIT_ERR_PARTIAL_MSG)) {
      errorMsg = __('Transaction limit reached. Try reducing the Description length.');
    }
    if ((!isUpload.thumbnail && thumbError) || (!isUpload.cover && coverError)) {
      errorMsg = __('Invalid %error_type%', {
        error_type: (thumbError && 'thumbnail') || (coverError && 'cover image'),
      });
    }
    return errorMsg;
  }

  function resolveThumbnailPreview() {
    if (!params.thumbnailUrl) {
      return Gerbil;
    } else if (thumbError) {
      return ThumbnailBrokenImage;
    } else {
      return params.thumbnailUrl;
    }
  }

  React.useEffect(() => {
    let nameError;
    if (!name && name !== undefined) {
      nameError = __('A name is required for your url');
    } else if (!isNameValid(name)) {
      nameError = INVALID_NAME_ERROR;
    }

    setNameError(nameError);
  }, [name]);

  React.useEffect(() => {
    clearChannelErrors();
  }, [clearChannelErrors]);

  React.useEffect(() => {
    if (!hasClaimedInitialRewards) {
      claimInitialRewards();
    }
  }, [hasClaimedInitialRewards, claimInitialRewards]);

  const [tabIndex, setTabIndex] = React.useState(0);
  function onTabChange(index) {
    setTabIndex(index);
  }

  // TODO clear and bail after submit
  return (
    <>
      <div className={classnames({ 'card--disabled': disabled })}>
        <header className="channel-cover" style={{ backgroundImage: 'url(' + coverSrc + ')' }}>
          <div className="channel-header-content">
            <div className="channel__quick-actions">
              <Button
                button="alt"
                title={__('Cover')}
                onClick={() =>
                  openModal(MODALS.IMAGE_UPLOAD, {
                    onUpdate: (coverUrl, isUpload) => handleCoverChange(coverUrl, isUpload),
                    title: __('Edit Cover Image'),
                    helpText: __('(Recommmended: 2048x320 px)'),
                    assetName: __('Cover Image'),
                    currentValue: params.coverUrl,
                    otherValue: params.thumbnailUrl,
                  })
                }
                icon={ICONS.CAMERA}
                iconSize={18}
              />
            </div>
            {params.coverUrl && coverError && isUpload.cover && (
              <div className="channel-cover__custom--waiting">
                <p>{__('Uploaded image will be visible in a few minutes after you submit this form.')}</p>
              </div>
            )}
            <div className="channel__primary-info">
              <h1 className="channel__title">
                {params.title || (channelName && '@' + channelName) || (params.name && '@' + params.name)}
              </h1>
            </div>
          </div>
        </header>

        <Tabs index={tabIndex}>
          <div className={classnames('tab__wrapper', { 'tab__wrapper-fixed': scrollPast })}>
            <div onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <ChannelThumbnail
                className={classnames('channel__thumbnail--channel-page', {
                  'channel__thumbnail--channel-page-fixed': scrollPast,
                })}
                uri={uri}
                thumbnailPreview={thumbnailPreview}
                allowGifs
                setThumbUploadError={setThumbError}
                thumbUploadError={thumbError}
              />
              <div className="channel__edit-thumb">
                <Button
                  button="alt"
                  title={__('Edit')}
                  onClick={() =>
                    openModal(MODALS.IMAGE_UPLOAD, {
                      onUpdate: (thumbnailUrl, isUpload) => handleThumbnailChange(thumbnailUrl, isUpload),
                      title: __('Edit Thumbnail Image'),
                      helpText: __('(1:1 ratio)', {
                        max_size: THUMBNAIL_CDN_SIZE_LIMIT_BYTES / (1024 * 1024),
                      }),
                      assetName: __('Thumbnail'),
                      currentValue: params.thumbnailUrl,
                      otherValue: params.coverUrl,
                    })
                  }
                  icon={ICONS.CAMERA}
                  iconSize={18}
                />
              </div>
            </div>

            <TabList className="tabs__list--channel-page">
              <Tab aria-selected={tabIndex === 0} onClick={() => onTabChange(0)}>
                {__('About')}
              </Tab>
              <Tab aria-selected={tabIndex === 1} onClick={() => onTabChange(1)}>
                {!isNewChannel && __('Other')}
              </Tab>
            </TabList>
          </div>
          <TabPanels>
            <TabPanel>
              <Card
                background
                title={__('General')}
                body={
                  <div className="settings-row">
                    {isNewChannel && (
                      <Button
                        button="primary"
                        label={__('Sync YouTube Channel')}
                        icon={ICONS.YOUTUBE}
                        navigate={`/$/${PAGES.YOUTUBE_SYNC}`}
                      />
                    )}

                    {isNewChannel && (
                      <fieldset-group
                        class="fieldset-group--smushed fieldset-group--disabled-prefix"
                        style={{ marginTop: 'var(--spacing-m)' }}
                      >
                        <fieldset-section>
                          <label htmlFor="channel_name">{__('Name')}</label>
                          <div className="form-field__prefix">@</div>
                        </fieldset-section>

                        <FormField
                          autoFocus={isNewChannel}
                          type="text"
                          name="channel_name"
                          placeholder={__('MyAwesomeChannel')}
                          value={params.name || channelName}
                          error={nameError}
                          disabled={!isNewChannel}
                          onChange={(e) => setParams({ ...params, name: e.target.value })}
                        />
                      </fieldset-group>
                    )}

                    <fieldset-section style={{ marginTop: 'var(--spacing-m)' }}>
                      <FormField
                        type="text"
                        name="channel_title2"
                        label={__('Title')}
                        placeholder={__('My Awesome Channel')}
                        value={params.title}
                        onChange={(e) => setParams({ ...params, title: e.target.value })}
                      />
                    </fieldset-section>
                    <FormField
                      type="markdown"
                      name="content_description2"
                      label={__('Description')}
                      placeholder={__('Description of your content')}
                      value={params.description}
                      onChange={(text) => setParams({ ...params, description: text })}
                      textAreaMaxLength={FF_MAX_CHARS_IN_DESCRIPTION}
                    />
                  </div>
                }
              />

              <Card
                background
                title={__('Contact')}
                body={
                  <div className="settings-row publish-row--no-margin">
                    <FormField
                      type="text"
                      name="content_email2"
                      label={__('Email')}
                      placeholder={__('yourstruly@example.com')}
                      disabled={false}
                      value={params.email}
                      onChange={(e) => setParams({ ...params, email: e.target.value })}
                    />
                    <FormField
                      type="text"
                      name="channel_website2"
                      label={__('Website')}
                      placeholder={__('aprettygoodsite.com')}
                      disabled={false}
                      value={params.website}
                      onChange={(e) => setParams({ ...params, website: e.target.value })}
                    />
                  </div>
                }
              />

              <Card
                background
                title={__('Tags')}
                className="card--tags"
                body={
                  <div className="settings-row">
                    <TagsSearch
                      suggestMature={!SIMPLE_SITE}
                      disableAutoFocus
                      disableControlTags
                      limitSelect={MAX_TAG_SELECT}
                      tagsPassedIn={params.tags || []}
                      label={__('Selected Tags')}
                      onRemove={(clickedTag) => {
                        const newTags = params.tags.slice().filter((tag) => tag.name !== clickedTag.name);
                        setParams({ ...params, tags: newTags });
                      }}
                      onSelect={(newTags) => {
                        newTags.forEach((newTag) => {
                          if (!params.tags.map((savedTag) => savedTag.name).includes(newTag.name)) {
                            setParams({ ...params, tags: [...params.tags, newTag] });
                          } else {
                            // If it already exists and the user types it in, remove it
                            setParams({ ...params, tags: params.tags.filter((tag) => tag.name !== newTag.name) });
                          }
                        });
                      }}
                    />
                  </div>
                }
              />

              <Card
                background
                title={__('Languages')}
                body={
                  <div className="settings-row">
                    <fieldset-section style={{ marginTop: 'calc(var(--spacing-m) * -1)' }}>
                      <FormField
                        name="language_select"
                        type="select"
                        label={__('Primary Language')}
                        onChange={(event) => handleLanguageChange(0, event.target.value)}
                        value={primaryLanguage}
                        helper={__('Your main content language')}
                      >
                        <option key={'pri-langNone'} value={PUBLISH.LANG_NONE}>
                          {__('None selected')}
                        </option>
                        {sortLanguageMap(SUPPORTED_LANGUAGES).map(([langKey, langName]) => (
                          <option key={langKey} value={langKey}>
                            {langName}
                          </option>
                        ))}
                      </FormField>
                    </fieldset-section>
                    <FormField
                      name="language_select2"
                      type="select"
                      label={__('Secondary Language')}
                      onChange={(event) => handleLanguageChange(1, event.target.value)}
                      value={secondaryLanguage}
                      disabled={!languageParam[0]}
                      helper={__('Your other content language')}
                    >
                      <option key={'sec-langNone'} value={PUBLISH.LANG_NONE}>
                        {__('None selected')}
                      </option>
                      {sortLanguageMap(SUPPORTED_LANGUAGES).map(([langKey, langName]) => (
                        <option key={langKey} value={langKey} disabled={langKey === languageParam[0]}>
                          {langName}
                        </option>
                      ))}
                    </FormField>
                  </div>
                }
              />
            </TabPanel>
            <TabPanel>
              <Card
                background
                title={__('Credit Details')}
                body={
                  <FormField
                    className="form-field--price-amount"
                    type="number"
                    name="content_bid2"
                    step="any"
                    label={<LbcSymbol postfix={__('Deposit')} size={14} />}
                    value={params.amount}
                    error={bidError}
                    min="0.0"
                    disabled={false}
                    onChange={(event) => handleBidChange(parseFloat(event.target.value))}
                    placeholder={0.1}
                    helper={
                      <>
                        {__('Increasing your deposit can help your channel be discovered more easily.')}
                        <WalletSpendableBalanceHelp inline />
                      </>
                    }
                  />
                }
              />
              {!isNewChannel && (
                <>
                  <h2 className="card__title">{__('Delete Channel')}</h2>
                  <Card
                    body={
                      <ClaimAbandonButton uri={uri} abandonActionCallback={() => replace(`/$/${PAGES.CHANNELS}`)} />
                    }
                  />
                </>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>

        <div className="card-fixed-bottom">
          <Card
            className="card--after-tabs tab__panel"
            actions={
              <>
                <div className="section__actions">
                  <Button button="primary" disabled={submitDisabled} label={submitLabel} onClick={handleSubmit} />
                  <Button button="link" label={__('Cancel')} onClick={onDone} />
                  {errorMsg ? (
                    <ErrorText>{errorMsg}</ErrorText>
                  ) : (
                    <p className="help">
                      <Icon icon={ICONS.INFO} />
                      {__('After submitting, it will take a few minutes for your changes to be live for everyone.')}
                    </p>
                  )}
                </div>
              </>
            }
          />
        </div>
      </div>
    </>
  );
}

export default ChannelForm;
