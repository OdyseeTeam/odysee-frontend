// @flow
import 'scss/component/_comment-selectors.scss';
import { EMOTES_48px as EMOTES } from 'constants/emotes';
import * as ICONS from 'constants/icons';
import Button from 'component/button';
import React from 'react';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'component/common/tabs';
import StickersPanel from './sticker-selector-tab';

type Props = {
  claimIsMine?: boolean,
  addEmoteToComment: (string) => void,
  handleSelectSticker: (any) => void,
  closeSelector: () => void,
};

export default function CommentSelectors(props: Props) {
  const { claimIsMine, addEmoteToComment, handleSelectSticker, closeSelector } = props;

  const tabProps = { closeSelector };

  return (
    <Tabs>
      <TabList className="tabs__list--comment-selector">
        <Tab>{__('Emojis')}</Tab>
        <Tab>{__('Stickers')}</Tab>
      </TabList>

      <TabPanels>
        <TabPanel>
          <EmojisPanel handleSelect={(emote) => addEmoteToComment(emote)} {...tabProps} />
        </TabPanel>

        <TabPanel>
          <StickersPanel
            handleSelect={(sticker) => handleSelectSticker(sticker)}
            claimIsMine={claimIsMine}
            {...tabProps}
          />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}

type EmojisProps = {
  handleSelect: (emoteName: string) => void,
  closeSelector: () => void,
};

const EmojisPanel = (emojisProps: EmojisProps) => {
  const { handleSelect, closeSelector } = emojisProps;

  return (
    <div className="selector-menu">
      <Button button="close" icon={ICONS.REMOVE} onClick={closeSelector} />

      <div className="emote-selector__items">
        {EMOTES.map((emote) => {
          const { name, url } = emote;

          return (
            <Button
              key={name}
              title={name}
              button="alt"
              className="button--file-action"
              onClick={() => handleSelect(name)}
            >
              <img src={url} loading="lazy" />
            </Button>
          );
        })}
      </div>
    </div>
  );
};
