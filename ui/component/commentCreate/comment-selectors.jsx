// @flow
import { EMOTES_48px as ODYSEE_EMOTES, TWEMOTES } from 'constants/emotes';
import * as ICONS from 'constants/icons';
import Icon from 'component/common/icon';
import Button from 'component/button';
import CreditAmount from 'component/common/credit-amount';
import React from 'react';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'component/common/tabs';
import { FREE_GLOBAL_STICKERS, PAID_GLOBAL_STICKERS } from 'constants/stickers';
import './style.scss';

export const SELECTOR_TABS = {
  EMOJI: 0,
  STICKER: 1,
};

type Props = {
  claimIsMine?: boolean,
  openTab?: number,
  addEmoteToComment: (string) => void,
  handleSelectSticker: (any) => void,
  closeSelector?: () => void,
};

export default function CommentSelectors(props: Props) {
  const { claimIsMine, openTab, addEmoteToComment, handleSelectSticker, closeSelector } = props;

  const tabProps = { closeSelector };

  return (
    <Tabs index={openTab}>
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

function scrollToCategory(category) {
  let selectorAnchor = document.getElementById('emoji-selector');
  let categoryAnchor = document.getElementById(category);
  let offset = 55;
  selectorAnchor &&
    categoryAnchor &&
    selectorAnchor.scrollTo({ top: categoryAnchor.offsetTop - offset, behavior: 'smooth' });
}

const EmojisPanel = (emojisProps: EmojisProps) => {
  const { handleSelect, closeSelector } = emojisProps;
  const defaultRowProps = { handleSelect };

  return (
    <div className="selector-menu" id="emoji-selector">
      <Button button="close" icon={ICONS.REMOVE} onClick={closeSelector} />
      <div className="emote-categories">
        {/* <Icon icon={ICONS.TIME} /> */}
        {/* <img
          src="https://thumbnails.odycdn.com/optimize/s:200:0/quality:95/plain/https://thumbnails.lbry.com/UCMvVQIAfsGwzrfPLxiaIG8g"
          style={{ borderRadius: '50%' }}
  /> */}
        <img
          onClick={() => scrollToCategory('odysee')}
          src="https://static.odycdn.com/emoticons/48%20px/smile%402x.png"
        />
        <img onClick={() => scrollToCategory('smilies')} src="/public/img/emoticons/twemoji/smilies/grinning.png" />
        <img
          onClick={() => scrollToCategory('activities')}
          src="/public/img/emoticons/twemoji/activities/basketball.png"
        />
        <img
          onClick={() => scrollToCategory('symbols')}
          src="/public/img/emoticons/twemoji/symbols/sparkling_heart.png"
        />
        <img onClick={() => scrollToCategory('animals')} src="/public/img/emoticons/twemoji/animals/bear.png" />
        <img onClick={() => scrollToCategory('plants')} src="/public/img/emoticons/twemoji/plants/deciduous_tree.png" />
        <img onClick={() => scrollToCategory('flags')} src="/public/img/emoticons/twemoji/flags/pirate_flag.png" />
      </div>

      {/* <EmoteCategory title={__('Recently used')} {...defaultRowProps} /> */}
      {/* <EmoteCategory title={__('Member exclusive')} {...defaultRowProps} /> */}
      <EmoteCategory title={__('Odysee')} images={ODYSEE_EMOTES} {...defaultRowProps} />
      <EmoteCategory title={__('Smilies')} images={TWEMOTES.SMILIES} {...defaultRowProps} />

      <EmoteCategory title={__('Activities')} images={TWEMOTES.ACTIVITIES} {...defaultRowProps} />
      <EmoteCategory title={__('Symbols')} images={TWEMOTES.SYMBOLS} {...defaultRowProps} />
      <EmoteCategory title={__('Animals')} images={TWEMOTES.ANIMALS} {...defaultRowProps} />
      <EmoteCategory title={__('Plants')} images={TWEMOTES.PLANTS} {...defaultRowProps} />
      <EmoteCategory title={__('Flags')} images={TWEMOTES.FLAGS} {...defaultRowProps} />
    </div>
  );
};

type StickersProps = {
  claimIsMine: any,
  handleSelect: (any) => void,
  closeSelector: () => void,
};

const StickersPanel = (stickersProps: StickersProps) => {
  const { claimIsMine, handleSelect, closeSelector } = stickersProps;

  const defaultRowProps = { handleSelect };

  return (
    <div className="selector-menu">
      <Button button="close" icon={ICONS.REMOVE} onClick={closeSelector} />

      <>
        <div className="emote-categories">
          <Icon icon={ICONS.TIME} />
          <img
            src="https://thumbnails.odycdn.com/optimize/s:200:0/quality:95/plain/https://thumbnails.lbry.com/UCMvVQIAfsGwzrfPLxiaIG8g"
            style={{ borderRadius: '50%' }}
          />
          <img src="https://static.odycdn.com/stickers/MISC/PNG/fire.png" />
          <img src="https://static.odycdn.com/stickers/TIPS/png/with%20borderlarge$tip.png" />
        </div>
        <StickerCategory title={__('Recently used')} {...defaultRowProps} />
        {/* <StickerCategory title={__('Member exclusive')} {...defaultRowProps} /> */}
      </>

      <StickerCategory title={__('Free')} images={FREE_GLOBAL_STICKERS} {...defaultRowProps} />
      {!claimIsMine && <StickerCategory title={__('Tips')} images={PAID_GLOBAL_STICKERS} {...defaultRowProps} />}
    </div>
  );
};

type RowProps = {
  title: string,
  images?: any,
  handleSelect: (string) => void,
};

const EmoteCategory = (rowProps: RowProps) => {
  const { images, title, handleSelect } = rowProps;

  return (
    <>
      <a id={title.toLowerCase()}>
        <label id={title} className="chatImage-category-title">
          {title}
        </label>
      </a>

      <div className="emote-selector__items">
        {images &&
          images.map((emote) => {
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
    </>
  );
};

const StickerCategory = (rowProps: RowProps) => {
  const { images, title, handleSelect } = rowProps;

  return (
    <div>
      <label id={title} className="chatImage-category-title">
        {title}
      </label>
      <div className="sticker-selector__items">
        {images &&
          images.map((sticker) => {
            const { price, url, name } = sticker;

            return (
              <Button
                key={name}
                title={name}
                button="alt"
                className="button--file-action"
                onClick={() => handleSelect(sticker)}
              >
                <StickerWrapper price={price}>
                  <img src={url} loading="lazy" />
                  {price && price > 0 && <CreditAmount superChatLight amount={price} size={2} isFiat />}
                </StickerWrapper>
              </Button>
            );
          })}
      </div>
    </div>
  );
};

type StickerProps = {
  price?: number,
  children: any,
};

const StickerWrapper = (stickerProps: StickerProps) => {
  const { price, children } = stickerProps;

  return price ? <div className="sticker-item--priced">{children}</div> : children;
};
