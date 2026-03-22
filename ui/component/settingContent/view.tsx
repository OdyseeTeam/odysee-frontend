import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import React from 'react';
import * as SETTINGS from 'constants/settings';
import * as COLLECTIONS from 'constants/collections';
import { Lbryio } from 'lbryinc';
import { SIMPLE_SITE } from 'config';
import * as MODALS from 'constants/modal_types';
import { SETTINGS_GRP } from 'constants/settings';
import Button from 'component/button';
import Card from 'component/common/card';
import { FormField, FormFieldPrice } from 'component/common/form';
import MaxPurchasePrice from 'component/maxPurchasePrice';
import SettingsRow from 'component/settingsRow';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { doOpenModal } from 'redux/actions/app';
import { doSetClientSetting } from 'redux/actions/settings';
import { selectShowMatureContent, selectClientSetting } from 'redux/selectors/settings';
import { selectUserVerifiedEmail } from 'redux/selectors/user';

type Price = {
  currency: string;
  amount: number;
};

export default function SettingContent() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectUserVerifiedEmail);
  const hideMembersOnlyContent = useAppSelector((state) => selectClientSetting(state, SETTINGS.HIDE_MEMBERS_ONLY_CONTENT));
  const hideReposts = useAppSelector((state) => selectClientSetting(state, SETTINGS.HIDE_REPOSTS));
  const hideShorts = useAppSelector((state) => selectClientSetting(state, SETTINGS.HIDE_SHORTS));
  const hideLivestreams = useAppSelector((state) => selectClientSetting(state, SETTINGS.HIDE_LIVESTREAMS_IN_CATEGORIES));
  const defaultCollectionAction = useAppSelector((state) => selectClientSetting(state, SETTINGS.DEFAULT_COLLECTION_ACTION));
  const showNsfw = useAppSelector(selectShowMatureContent);
  const instantPurchaseEnabled = useAppSelector((state) => selectClientSetting(state, SETTINGS.INSTANT_PURCHASE_ENABLED));
  const instantPurchaseMax: Price = useAppSelector((state) => selectClientSetting(state, SETTINGS.INSTANT_PURCHASE_MAX));
  const enablePublishPreview = useAppSelector((state) => selectClientSetting(state, SETTINGS.ENABLE_PUBLISH_PREVIEW));

  const setClientSetting = (key: string, value: boolean | string | number) => dispatch(doSetClientSetting(key, value));
  const openModal = (id: string) => dispatch(doOpenModal(id));

  return <>
      <Card id={SETTINGS_GRP.CONTENT} background isBodyList title={__('Content settings')} body={<>
            <SettingsRow title={__('Hide members-only content')} subtitle={__(HELP.HIDE_MEMBERS_ONLY_CONTENT)}>
              <FormField type="checkbox" name="hide_members_only_content" checked={hideMembersOnlyContent} onChange={() => setClientSetting(SETTINGS.HIDE_MEMBERS_ONLY_CONTENT, !hideMembersOnlyContent)} />
            </SettingsRow>

            <SettingsRow title={__('Hide reposts')} subtitle={__(HELP.HIDE_REPOSTS)}>
              <FormField type="checkbox" name="hide_reposts" checked={hideReposts} onChange={(e) => {
          if (isAuthenticated) {
            let param = e.target.checked ? {
              add: 'noreposts'
            } : {
              remove: 'noreposts'
            };
            Lbryio.call('user_tag', 'edit', param);
          }

          setClientSetting(SETTINGS.HIDE_REPOSTS, !hideReposts);
        }} />
            </SettingsRow>

            <SettingsRow title={__('Hide short content')} subtitle={__(HELP.HIDE_SHORTS)}>
              <FormField type="checkbox" name="hide_shorts" checked={hideShorts} onChange={() => setClientSetting(SETTINGS.HIDE_SHORTS, !hideShorts)} />
            </SettingsRow>

            <SettingsRow title={__('Hide livestreams in categories')} subtitle={__(HELP.HIDE_LIVESTREAMS)}>
              <FormField type="checkbox" name="hide_livestreams" checked={hideLivestreams} onChange={() => setClientSetting(SETTINGS.HIDE_LIVESTREAMS_IN_CATEGORIES, !hideLivestreams)} />
            </SettingsRow>

            <SettingsRow title={__('Default playlist action')} subtitle={__(HELP.DEFAULT_PLAYLIST_ACTION)}>
              <fieldset-section>
                <FormField name="default_playlist_action_select" type="select" onChange={(e) => setClientSetting(SETTINGS.DEFAULT_COLLECTION_ACTION, e.target.value)} value={defaultCollectionAction}>
                  {COLLECTIONS.DEFAULT_COLLECTION_ACTIONS.map(action => <option key={action} value={action}>
                      {action === COLLECTIONS.DEFAULT_ACTION_VIEW ? __('View') : __('Play')}
                    </option>)}
                </FormField>
              </fieldset-section>
            </SettingsRow>

            {!SIMPLE_SITE && <>
                <SettingsRow title={__('Show mature content')} subtitle={__(HELP.SHOW_MATURE)}>
                  <FormField type="checkbox" name="show_nsfw" checked={showNsfw} onChange={() => !IS_WEB || showNsfw ? setClientSetting(SETTINGS.SHOW_MATURE, !showNsfw) : openModal(MODALS.CONFIRM_AGE)} />
                </SettingsRow>
              </>}

            {(isAuthenticated || !IS_WEB) && <>
                <SettingsRow title={__('Notifications')}>
                  <Button button="inverse" label={__('Manage')} icon={ICONS.ARROW_RIGHT} navigate={`/$/${PAGES.SETTINGS_NOTIFICATIONS}`} />
                </SettingsRow>

                <SettingsRow title={__('Blocked and hidden channels')}>
                  <Button button="inverse" label={__('Manage')} icon={ICONS.ARROW_RIGHT} navigate={`/$/${PAGES.SETTINGS_BLOCKED_MUTED}`} />
                </SettingsRow>
              </>}

            <SettingsRow title={__('Publish confirmation')} subtitle={__(HELP.PUBLISH_PREVIEW)}>
              <FormField type="checkbox" name="sync_toggle" label={__('')} checked={enablePublishPreview} onChange={() => setClientSetting(SETTINGS.ENABLE_PUBLISH_PREVIEW, !enablePublishPreview)} />
            </SettingsRow>

            {
        /* @if TARGET='app' */
      }
            <SettingsRow title={__('Max purchase price')} subtitle={__(HELP.MAX_PURCHASE_PRICE)} multirow>
              <MaxPurchasePrice />
            </SettingsRow>
            {
        /* @endif */
      }

            <SettingsRow title={__('Purchase and tip confirmations')} multirow>
              <FormField type="radio" name="confirm_all_purchases" checked={!instantPurchaseEnabled} label={__('Always confirm before purchasing content or tipping')} onChange={() => setClientSetting(SETTINGS.INSTANT_PURCHASE_ENABLED, false)} />
              <FormField type="radio" name="instant_purchases" checked={instantPurchaseEnabled} label={__('Only confirm purchases or tips over a certain amount')} helper={__(HELP.ONLY_CONFIRM_OVER_AMOUNT)} onChange={() => setClientSetting(SETTINGS.INSTANT_PURCHASE_ENABLED, true)} />
              {instantPurchaseEnabled && <FormFieldPrice name="confirmation_price" min={0.1} onChange={(newValue) => setClientSetting(SETTINGS.INSTANT_PURCHASE_MAX, newValue)} price={instantPurchaseMax} />}
            </SettingsRow>
          </>} />
    </>;
} // prettier-ignore

const HELP = {
  HIDE_MEMBERS_ONLY_CONTENT: 'You will not see content that requires a membership subscription.',
  HIDE_REPOSTS: 'You will not see reposts by people you follow or receive email notifying about them.',
  HIDE_SHORTS: 'You will not see vertical videos less than 3 minutes.',
  HIDE_LIVESTREAMS: 'You will not see livestreams in non-following categories.',
  DEFAULT_PLAYLIST_ACTION: 'Default action when clicking a playlist.',
  HIDE_FYP: 'You will not see the personal recommendations in the homepage.',
  SHOW_MATURE:
    'Mature content may include nudity, intense sexuality, profanity, or other adult content. By displaying mature content, you are affirming you are of legal age to view mature content in your country or jurisdiction.  ',
  MAX_PURCHASE_PRICE: 'This will prevent you from purchasing any content over a certain cost, as a safety measure.',
  ONLY_CONFIRM_OVER_AMOUNT: '',
  // [feel redundant. Disable for now] "When this option is chosen, LBRY won't ask you to confirm purchases or tips below your chosen amount.",
  PUBLISH_PREVIEW: 'Show preview and confirmation dialog before publishing content.',
};
