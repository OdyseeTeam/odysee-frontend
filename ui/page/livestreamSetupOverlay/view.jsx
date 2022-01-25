// @flow
import * as PAGES from 'constants/pages';
import * as ICONS from 'constants/icons';
import * as React from 'react';
import Card from 'component/common/card';
import Page from 'component/page';
import ChannelSelector from 'component/channelSelector';
import Button from 'component/button';
import Spinner from 'component/spinner';
import SettingsRow from 'component/settingsRow';
import { FormField } from 'component/common/form';
import Yrbl from 'component/yrbl';
import classnames from 'classnames';
import SettingUnauthenticated from 'component/settingUnauthenticated';

const DEBOUNCE_REFRESH_MS = 1000;

// ****************************************************************************
// ****************************************************************************

type Props = {
  hasChannels: boolean,
  fetchingChannels: boolean,
  channelId: ?string,
  activeChannelClaim: ChannelClaim,
  settingsByChannelId: { [string]: PerChannelSettings },
  fetchCreatorSettings: (channelId: string) => void,
  updateCreatorSettings: (ChannelClaim, PerChannelSettings) => void,
  daemonSettings: DaemonSettings,
  isAuthenticated: boolean,
};

export default function SettingsOverlayPage(props: Props) {
  const {
    hasChannels,
    fetchingChannels,
    channelId,
    activeChannelClaim,
    settingsByChannelId,
    fetchCreatorSettings,
    updateCreatorSettings,
    daemonSettings,
    isAuthenticated,
  } = props;

  const [lastUpdated, setLastUpdated] = React.useState(1);

  let [ chat_overlay, setChatOverlay ] = React.useState([]);
  let [ chat_overlay_position, setChatOverlayPosition ] = React.useState([]);
  let [ chat_remove_comment, setChatRemoveComment ] = React.useState([]);
  let [ sticker_overlay, setStickerOverlay ] = React.useState([]);
  let [ sticker_overlay_keep, setStickerOverlayKeep ] = React.useState([]);
  let [ sticker_overlay_remove, setStickerOverlayRemove ] = React.useState([]);
  let [ tipgoal_overlay, setTipgoalOverlay ] = React.useState([]);
  let [ tipgoal_amount, setTipgoalAmount ] = React.useState([]);
  let [ tipgoal_overlay_position, setTipgoalOverlayPosition ] = React.useState([]);
  let [ tipgoal_previous_donations, setTipgoalPreviousDonations ] = React.useState([]);
  let [ tipgoal_currency, setTipgoalCurrency ] = React.useState([]);
  let [ viewercount_overlay, setViewercountOverlay ] = React.useState([]);
  let [ viewercount_overlay_position, setViewercountOverlayPosition ] = React.useState([]);
  let [ viewercount_chat_bot, setViewercountChatBot ] = React.useState([]);

  // **************************************************************************
  // **************************************************************************

  /**
   * Updates corresponding GUI states with the given PerChannelSettings values.
   *
   * @param settings
   * @param fullSync If true, update all states and consider 'undefined'
   *   settings as "cleared/false"; if false, only update defined settings.
   */
   function settingsToStates(settings: PerChannelSettings, fullSync: boolean) {
    if (fullSync) {
      setChatOverlay(settings.chat_overlay);
      setChatOverlayPosition(settings.chat_overlay_position);
      setChatRemoveComment(settings.chat_remove_comment);
      setStickerOverlay(settings.sticker_overlay);
      setStickerOverlayKeep(settings.sticker_overlay_keep);
      setStickerOverlayRemove(settings.sticker_overlay_remove);
      setTipgoalAmount(settings.tipgoal_amount);
      setTipgoalCurrency(settings.tipgoal_currency);
      setTipgoalOverlay(settings.tipgoal_overlay);
      setTipgoalOverlayPosition(settings.tipgoal_overlay_position);
      setTipgoalPreviousDonations(settings.tipgoal_previous_donations);
      setViewercountChatBot(settings.viewercount_chat_bot);
      setViewercountOverlay(settings.viewercount_overlay);
      setViewercountOverlayPosition(settings.viewercount_overlay_position);
    }
  }

  function setSettings(newSettings: PerChannelSettings) {
    settingsToStates(newSettings, false);
    updateCreatorSettings(activeChannelClaim, newSettings);
    setLastUpdated(Date.now());
  }

  // **************************************************************************
  // **************************************************************************

  // Re-sync list on first idle time; mainly to correct any invalid settings.
  React.useEffect(() => {
    if (lastUpdated && activeChannelClaim) {
      const timer = setTimeout(() => {
        fetchCreatorSettings(activeChannelClaim.claim_id);
      }, DEBOUNCE_REFRESH_MS);
      return () => clearTimeout(timer);
    }
  }, [lastUpdated, activeChannelClaim, fetchCreatorSettings]);

  // Update local states with data from API.
  React.useEffect(() => {
    if (lastUpdated !== 0 && Date.now() - lastUpdated < DEBOUNCE_REFRESH_MS) {
      // Still debouncing. Skip update.
      return;
    }

    if (activeChannelClaim && settingsByChannelId && settingsByChannelId[activeChannelClaim.claim_id]) {
      // Update Overlay settings on page load.
      const channelSettings = settingsByChannelId[activeChannelClaim.claim_id];

      setChatOverlay(channelSettings.chat_overlay);
      setChatOverlayPosition(channelSettings.chat_overlay_position);
      setChatRemoveComment(channelSettings.chat_remove_comment);
      setStickerOverlay(channelSettings.sticker_overlay);
      setStickerOverlayKeep(channelSettings.sticker_overlay_keep);
      setStickerOverlayRemove(channelSettings.sticker_overlay_remove);
      setTipgoalAmount(channelSettings.tipgoal_amount);
      setTipgoalCurrency(channelSettings.tipgoal_currency);
      setTipgoalOverlay(channelSettings.tipgoal_overlay);
      setTipgoalOverlayPosition(channelSettings.tipgoal_overlay_position);
      setTipgoalPreviousDonations(channelSettings.tipgoal_previous_donations);
      setViewercountChatBot(channelSettings.viewercount_chat_bot);
      setViewercountOverlay(channelSettings.viewercount_overlay);
      setViewercountOverlayPosition(channelSettings.viewercount_overlay_position);
    }
  }, [activeChannelClaim, settingsByChannelId, lastUpdated]);

  // **************************************************************************
  // **************************************************************************

  const noDaemonSettings = !daemonSettings || Object.keys(daemonSettings).length === 0;

  return (
    <Page
      noFooter
      settingsOverlay
      noSideNavigation
      backout={{ title: __('Overlay settings and instructions'), backLabel: __('Back') }}
      className="card-stack main--settings-page"
    >
      {!isAuthenticated && IS_WEB && (
        <>
          <SettingUnauthenticated />
          <div className="main--empty">
            <Yrbl
              type="happy"
              title={__('Sign up for full control')}
              subtitle={__('Unlock new buttons that change things.')}
              actions={
                <div className="section__actions">
                  <Button button="primary" icon={ICONS.SIGN_UP} label={__('Sign Up')} navigate={`/$/${PAGES.AUTH}`} />
                </div>
              }
            />
          </div>
        </>
      )}

      {!IS_WEB && noDaemonSettings ? (
        <section className="card card--section">
          <div className="card__title card__title--deprecated">{__('Failed to load settings.')}</div>
        </section>
        ) : (
        <div className={classnames('card-stack', { 'card--disabled': IS_WEB && !isAuthenticated })}>

          {fetchingChannels && ( // Retrieve channels.
            <div className="main--empty">
              <Spinner delayed />
            </div>
          )}

          {!fetchingChannels && !hasChannels && ( // Allow User to create channel if found no channels.
            <Yrbl
              type="happy"
              title={__("You haven't created a channel yet, let's fix that!")}
              actions={
                <div className="section__actions">
                  <Button button="primary" navigate={`/$/${PAGES.CHANNEL_NEW}`} label={__('Create A Channel')} />
                </div>
              }
            />
          )}

          {!fetchingChannels && ( // Retrieve channels if User has channels.
            <div className="section__actions--between">
              <ChannelSelector hideAnon />
            </div>
          )}

          {!fetchingChannels && channelId && isAuthenticated && (
            <>
              <div className="card__title-section">
                <h2 className="card__title">{__('Chat Overlay')}</h2>
              </div>
              <Card
                id={__('Chat Overlay')}
                isBodyList
                body={
                  <>
                    <SettingsRow
                      title={__('Chat')}
                      subtitle={__(HELP.CHAT)}
                    >
                      <FormField
                        name="chat_overlay"
                        type="checkbox"
                        checked={chat_overlay}
                        onChange={() => setSettings({ chat_overlay: !chat_overlay })}
                      />
                    </SettingsRow>

                    <SettingsRow
                      title={__('Position')}
                      subtitle={__(HELP.POSITION)}
                    >
                      <FormField
                        name="chat_overlay_position"
                        type="select"
                        multiple={false}
                        value={chat_overlay_position}
                        onChange={() => setSettings({ chat_overlay_position: !chat_overlay_position })}
                      >
                        <option value="Left">Left</option>
                        <option value="Right">Right</option>
                      </FormField>
                    </SettingsRow>

                    <SettingsRow
                      title={__('Comment Remove Time')}
                      subtitle={__(HELP.CHAT_REMOVE_COMMENT)}
                    >
                      <FormField
                        name="chat_remove_comment"
                        type="number"
                        value={chat_remove_comment}
                        onChange={() => setSettings({ chat_remove_comment: !chat_remove_comment })}
                      />
                    </SettingsRow>
                  </>
                }
              />

              <div className="card__title-section">
                <h2 className="card__title">{__('Stickers Overlay')}</h2>
              </div>
              <Card
                id={__('Stickers Overlay')}
                isBodyList
                body={
                  <>
                    <SettingsRow
                      title={__('Stickers')}
                      subtitle={__(HELP.STICKERS)}
                    >
                      <FormField
                        name="stickers_overlay"
                        type="checkbox"
                        checked={sticker_overlay}
                        onChange={() => setSettings({ sticker_overlay: !sticker_overlay })}
                      />
                    </SettingsRow>

                    <SettingsRow
                      title={__('Keep stickers on Overlay')}
                      subtitle={__(HELP.STICKERS_KEEP)}
                    >
                      <FormField
                        name="keep_stickers_on_overlay"
                        type="checkbox"
                        checked={sticker_overlay_keep}
                        onChange={() => setSettings({ sticker_overlay_keep: !sticker_overlay_keep })}
                      />
                    </SettingsRow>

                    <SettingsRow
                      title={__('Remove Stickers')}
                      subtitle={__(HELP.STICKERS_REMOVE)}
                    >
                      <FormField
                        name="remove_stickers_on_stickers_overlay"
                        type="number"
                        value={sticker_overlay_remove}
                        onChange={() => setSettings({ sticker_overlay_remove: !sticker_overlay_remove })}
                      />
                    </SettingsRow>
                  </>
                }
              />

              <div className="card__title-section">
                <h2 className="card__title">{__('Viewer Count Overlay')}</h2>
              </div>
              <Card
                id={__('Viewer Count Overlay')}
                isBodyList
                body={
                  <>
                    <SettingsRow
                      title={__('Viewer Count')}
                      subtitle={__(HELP.VIEWER_COUNT)}
                    >
                      <FormField
                        name="viewercount_overlay"
                        type="checkbox"
                        checked={viewercount_overlay}
                        onChange={() => setSettings({ viewercount_overlay: !viewercount_overlay })}
                      />
                    </SettingsRow>

                    <SettingsRow
                      title={__('Chat Bot')}
                      subtitle={__(HELP.CHAT_BOT)}
                    >
                      <FormField
                        name="viewercount_chat_bot"
                        type="checkbox"
                        checked={viewercount_chat_bot}
                        onChange={() => setSettings({ viewercount_chat_bot: !viewercount_chat_bot })}
                      />
                    </SettingsRow>

                    <SettingsRow
                      title={__('Position')}
                      subtitle={__(HELP.POSITION)}
                    >
                      <FormField
                        name="viewercount_overlay_position"
                        type="select"
                        multiple={false}
                        value={viewercount_overlay_position}
                        onChange={() => setSettings({ viewercount_overlay_position: !viewercount_overlay_position })}
                      >
                        <option value="Top Left">Top Left</option>
                        <option value="Top Center">Top Center</option>
                        <option value="Top Right">Top Right</option>
                        <option value="Bottom Left">Bottom Left</option>
                        <option value="Bottom Center">Bottom Center</option>
                        <option value="Bottom Right">Bottom Right</option>
                      </FormField>
                    </SettingsRow>
                  </>
                }
              />

              <div className="card__title-section">
                <h2 className="card__title">{__('Tip Goal Overlay')}</h2>
              </div>
              <Card
                id={__('Tip Goal Overlay')}
                isBodyList
                body={
                  <>
                    <SettingsRow
                      title={__('Tip Goal')}
                      subtitle={__(HELP.TIP_GOAL)}
                    >
                      <FormField
                        name="tipgoal_overlay"
                        type="checkbox"
                        checked={tipgoal_overlay}
                        onChange={() => setSettings({ tipgoal_overlay: !tipgoal_overlay })}
                      />
                    </SettingsRow>

                    <SettingsRow
                      title={__('Tip Goal Amount')}
                      subtitle={__(HELP.TIP_GOAL_AMOUNT)}
                    >
                      <FormField
                        name="tipgoal_amount"
                        type="number"
                        min="0"
                        value={tipgoal_amount}
                        onChange={() => setSettings({ tipgoal_amount: !tipgoal_amount })}
                      />
                    </SettingsRow>

                    <SettingsRow
                      title={__('Position')}
                      subtitle={__(HELP.POSITION)}
                    >
                      <FormField
                        name="tipgoal_overlay_position"
                        type="select"
                        multiple={false}
                        value={tipgoal_overlay_position}
                        onChange={() => setSettings({ tipgoal_overlay_position: !tipgoal_overlay_position })}
                      >
                        <option value="Top">Top</option>
                        <option value="Bottom">Bottom</option>
                      </FormField>
                    </SettingsRow>

                    <SettingsRow
                      title={__('Add previous donations to goal')}
                      subtitle={__(HELP.TIP_GOAL_PREV_DONATIONS)}
                    >
                      <FormField
                        name="tip_goal_all_donations"
                        type="checkbox"
                        checked={tipgoal_previous_donations}
                        onChange={() => setSettings({ tipgoal_previous_donations: !tipgoal_previous_donations })}
                      />
                    </SettingsRow>

                    <SettingsRow
                      title={__('Currency')}
                      subtitle={__(HELP.TIP_GOAL_CURRENCY)}
                    >
                      <FormField
                        name="tipgoal_currency"
                        type="select"
                        multiple={false}
                        value={tipgoal_currency}
                        onChange={() => setSettings({ tipgoal_currency: !tipgoal_currency })}
                      >
                        <option value="LBC">LBC</option>
                        <option value="USD">USD</option>
                      </FormField>
                    </SettingsRow>
                  </>
                }
              />
            </>
          )}
        </div>
      )}
    </Page>
  );
}

// prettier-ignore
const HELP = {
  CHAT: 'Enable to allow comments appear on the Overlay.',
  CHAT_REMOVE_COMMENT: 'Remove comments from the Overlay after default 30 seconds.',
  CHAT_BOT: 'Use a Chat Bot with a Viewer Count built in? If so then this will not count the Chat Bot as a viewer on the Overlay.',
  STICKERS: 'Enable to have stickers appear randomly on the Overlay for default 10 seconds when someone sends a sticker.',
  STICKERS_KEEP: 'Enable to keep stickers on the Overlay.',
  STICKERS_REMOVE: 'Remove stickers from the Overlay after default 10 seconds.',
  VIEWER_COUNT: 'Enable to have your viewer count to appear on the Overlay.',
  TIP_GOAL: 'Enable to show what you are working towards.',
  TIP_GOAL_AMOUNT: 'The Amount you want as a goal.',
  TIP_GOAL_CURRENCY: 'The Currency you want as a goal.',
  TIP_GOAL_PREV_DONATIONS: 'Total donations that you have received before the upcoming stream.',
  POSITION: 'Choose a position for this to appear on the Overlay.',
};
