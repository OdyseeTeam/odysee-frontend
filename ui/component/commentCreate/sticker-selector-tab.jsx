// @flow
import 'scss/component/_comment-selectors.scss';
import * as ICONS from 'constants/icons';
import Button from 'component/button';
import React from 'react';
import CreditAmount from 'component/common/credit-amount';
import { FREE_GLOBAL_STICKERS, PAID_GLOBAL_STICKERS } from 'constants/stickers';

/* const buildStickerSideLink = (section: string, icon: string) => ({ section, icon });

const STICKER_SIDE_LINKS = [
  buildStickerSideLink(__('Free'), ICONS.TAG),
  buildStickerSideLink(__('Tips'), ICONS.FINANCE),
  // Future work may include Channel, Subscriptions, ...
]; */

type StickersProps = {
  claimIsMine: any,
  handleSelect: (any) => void,
  closeSelector: () => void,
};

export default function StickersPanel(stickersProps: StickersProps) {
  const { claimIsMine, handleSelect, closeSelector } = stickersProps;

  /* function scrollToStickerSection(section: string) {
    const listBodyEl = document.querySelector('.sticker-selector__body');
    const sectionToScroll = document.getElementById(section);

    if (listBodyEl && sectionToScroll) {
      // $FlowFixMe
      listBodyEl.scrollTo({
        top: sectionToScroll.offsetTop - sectionToScroll.getBoundingClientRect().height * 4,
        behavior: 'smooth',
      });
    }
  } */

  const defaultRowProps = { handleSelect };

  return (
    <div className="selector-menu--stickers">
      <Button button="close" icon={ICONS.REMOVE} onClick={closeSelector} />

      <div className="sticker-selector__main">
        <div className="sticker-selector__body">
          <StickersRow title={__('Free')} stickers={FREE_GLOBAL_STICKERS} {...defaultRowProps} />
          {!claimIsMine && <StickersRow title={__('Tips')} stickers={PAID_GLOBAL_STICKERS} {...defaultRowProps} />}
        </div>
      </div>
    </div>
  );
}

type RowProps = {
  title: string,
  stickers: any,
  handleSelect: (string) => void,
};

const StickersRow = (rowProps: RowProps) => {
  const { title, stickers, handleSelect } = rowProps;

  return (
    <div className="sticker-selector__body-row">
      <label id={title} className="sticker-selector__row-title">
        {title}
      </label>

      <div className="sticker-selector__items">
        {stickers.map((sticker) => {
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
