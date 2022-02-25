// @flow
import React from 'react';
import 'scss/component/_overlay.scss';
import Overlay from './overlay-backend';
import fetch from 'node-fetch';

const DEBOUNCE_REFRESH_MS = 1000;

type Props = {
  settingsByChannelId: { [string]: PerChannelSettings },
  fetchCreatorSettings: (channelId: string) => void,
  doToast: ({ message: string }) => void,
}

export default function OverlayPage(props: Props) {
  const {
    settingsByChannelId,
    fetchCreatorSettings,
    doToast,
  } = props;

  document.title = 'Streamer Overlay';
  const [ lastUpdated ] = React.useState(1);

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

  // Get channel claim id from URL.
  const claim_id = window.location.pathname.split('/')[4];

  // **************************************************************************
  // **************************************************************************

  // Re-sync list on first idle time; mainly to correct any invalid settings.
  React.useEffect(() => {
    if (lastUpdated && claim_id) {
      const timer = setTimeout(() => {
        fetchCreatorSettings(claim_id);
        doToast({ message: __('Loading data!') });
      }, DEBOUNCE_REFRESH_MS);
      return () => clearTimeout(timer);
    }
  }, [lastUpdated, claim_id, fetchCreatorSettings, doToast]);

  // Update local states with data from API.
  React.useEffect(() => {
    if (lastUpdated !== 0 && Date.now() - lastUpdated < DEBOUNCE_REFRESH_MS) {
      // Still debouncing. Skip update.
      return;
    }

    if (claim_id && settingsByChannelId && settingsByChannelId[claim_id]) {
      try {
        const channelSettings = settingsByChannelId[claim_id];

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

        doToast({ message: __('Data loaded!') });
      }
      catch (e) {
        doToast({ message: __(`Error: ${e}`)});
      }
    }
  }, [claim_id, settingsByChannelId, lastUpdated, doToast]);

  // **************************************************************************
  // **************************************************************************

  // Chat Style Overlay Position
  function ChatStyleOverlayPosition() {
    // Default value
    if (chat_overlay_position === 'Left') {
      return {left: '0', bottom: '0'};
    }
    if (chat_overlay_position === 'Right') {
      return {left: '75%', bottom: '0'};
    }
  }

  // Viewercount Style Overlay Position
  function ViewercountStyleOverlayPosition() {
    // Default value if Tip Goal Overlay is not enabled
    if (viewercount_overlay_position === 'Top Center') {
      return {top: '10px', left: '47.5%'};
    }
    // Default value if Tip Goal Overlay is enabled
    if (viewercount_overlay_position === 'Top Left') {
      return {top: '10px', left: '25%'};
    }
    if (viewercount_overlay_position === 'Top Right') {
      return {top: '10px', left: '75%'};
    }
    if (viewercount_overlay_position === 'Bottom Left') {
      return {bottom: '10px', left: '25%'};
    }
    if (viewercount_overlay_position === 'Bottom Center') {
      return {bottom: '10px', left: '47.5%'};
    }
    if (viewercount_overlay_position === 'Bottom Right') {
      return {bottom: '10px', left: '75%'};
    }
  }

  // Tip Goal Style Overlay Position
  function TipgoalStyleOverlayPosition() {
    // Default value
    if (tipgoal_overlay_position === 'Top') {
      return {top: '5%', left: '47.5%'};
    }
    if (tipgoal_overlay_position === 'Bottom') {
      return {top: '95%', left: '47.5%'};
    }
  }

  React.useEffect(() => {
    Overlay.start(claim_id, fetch, chat_overlay, chat_remove_comment, sticker_overlay, sticker_overlay_keep, sticker_overlay_remove, viewercount_overlay, viewercount_chat_bot, tipgoal_overlay, tipgoal_previous_donations, tipgoal_amount, tipgoal_currency);
  }, [claim_id, chat_overlay, chat_remove_comment, sticker_overlay, sticker_overlay_keep, sticker_overlay_remove, viewercount_overlay, viewercount_chat_bot, tipgoal_overlay, tipgoal_previous_donations, tipgoal_amount, tipgoal_currency]);

  return (
    <>
      {sticker_overlay && ( // Deals with Sticker sub-overlay.
        <div className="sticker-wrapper">
          <div id="sticker" className="sticker" />
        </div>
      )}
      {chat_overlay && ( // Deals with Chat sub-overlay.
        <div className="chat-wrapper">
          <div id="chat" className="chat" style={ChatStyleOverlayPosition()} />
        </div>
      )}
      {viewercount_overlay && ( // Deals with Viewer Count sub-overlay.
        <div className="viewercount-wrapper" style={ViewercountStyleOverlayPosition()}>
          <div id="viewercount-number" className="viewercount-number">Viewers: 0</div>
        </div>
      )}
      {tipgoal_overlay && ( // Deals with Tip Goal sub-overlay.
        <div className="tip-goal-wrapper" style={TipgoalStyleOverlayPosition()}>
          <div className="tip-goal">
            <div className="tip-title">
              Tip Goal: <span id="tip-goal-current-amount">0 {tipgoal_currency}</span> / {tipgoal_amount === 1000 ? 1000 : tipgoal_amount} {tipgoal_currency}
            </div>
            <div className="tip-goal-progress-background">
              <div id="tip-goal-progress" className="tip-goal-progress">0%</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
