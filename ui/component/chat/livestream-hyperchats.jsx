// @flow
import type { ElementRef } from 'react';

import { parseSticker } from 'util/comments';
import * as ICONS from 'constants/icons';
import Button from 'component/button';
import ChannelThumbnail from 'component/channelThumbnail';
import classnames from 'classnames';
import CreditAmount from 'component/common/credit-amount';
import React from 'react';
import Slide from '@mui/material/Slide';
import { Lbryio } from 'lbryinc';

type Props = {
  superChats: Array<Comment>,
  hyperchatsHidden?: boolean,
  selectedHyperchat: ?Comment,
  channelTitle?: string,
  isMobile?: boolean,
  toggleHyperChat: () => void,
  handleHyperchatClick: (comment: any) => void,
};

export default function LivestreamHyperchats(props: Props) {
  const {
    superChats: hyperChatsByAmount,
    hyperchatsHidden,
    isMobile,
    toggleHyperChat,
    handleHyperchatClick,
    selectedHyperchat,
  } = props;

  const superChatTopTen = React.useMemo(() => {
    return hyperChatsByAmount ? hyperChatsByAmount.slice(0, 10) : hyperChatsByAmount;
  }, [hyperChatsByAmount]);

  const [exchangeRate, setExchangeRate] = React.useState(0);
  React.useEffect(() => {
    if (!exchangeRate) Lbryio.getExchangeRates().then(({ LBC_USD }) => setExchangeRate(LBC_USD));
  }, [exchangeRate]);

  const stickerSuperChats = hyperChatsByAmount && hyperChatsByAmount.filter(({ comment }) => !!parseSticker(comment));

  const showMore = superChatTopTen && hyperChatsByAmount && superChatTopTen.length < hyperChatsByAmount.length;
  const elRef: ElementRef<any> = React.useRef();

  return !superChatTopTen ? null : (
    <Slider isMobile={isMobile} hyperchatsHidden={hyperchatsHidden}>
      <div
        ref={elRef}
        className={classnames('livestream-hyperchats__wrapper', {
          'livestream-hyperchats__wrapper--mobile': isMobile,
        })}
      >
        <div className="livestream-hyperchats">
          {superChatTopTen.map((hyperChat: Comment) => {
            const { comment_id, channel_url, support_amount, is_fiat } = hyperChat;
            const isSticker = stickerSuperChats && stickerSuperChats.includes(hyperChat);
            const basedAmount = is_fiat && exchangeRate ? support_amount : support_amount * 10 * exchangeRate;

            return (
              <div
                key={comment_id}
                className={classnames('livestream-hyperchat', {
                  'livestream-hyperchat--mobile': isMobile,
                  'hyperchat-preview-level1': basedAmount >= 5,
                  'hyperchat-preview-level2': basedAmount >= 10,
                  'hyperchat-preview-level3': basedAmount >= 50,
                  'hyperchat-preview-level4': basedAmount >= 100,
                  'hyperchat-preview-level5': basedAmount >= 500,
                  active: selectedHyperchat && selectedHyperchat.comment_id === comment_id,
                })}
                onClick={() => handleHyperchatClick(hyperChat)}
              >
                <ChannelThumbnail uri={channel_url} xxsmall showMemberBadge />

                <div
                  className={classnames('livestreamHyperchat__info', {
                    'livestreamHyperchat__info--notSticker': stickerSuperChats && !isSticker,
                  })}
                >
                  <div className="livestreamHyperchat__info--user">
                    <CreditAmount
                      hideTitle
                      size={10}
                      className="livestreamHyperchat__amount--large"
                      amount={support_amount}
                      isFiat={is_fiat}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {showMore && (
            <div className="chat__show-hyperchats">
              <Button
                title={__('Show More...')}
                button="inverse"
                className="close-button"
                onClick={() => toggleHyperChat()}
                iconRight={ICONS.ARROW_RIGHT}
              />
            </div>
          )}
        </div>
      </div>
    </Slider>
  );
}

type SliderProps = {
  hyperchatsHidden?: boolean,
  children: any,
};

const Slider = (sliderProps: SliderProps) => {
  const { hyperchatsHidden, children } = sliderProps;

  return (
    <Slide direction="left" in={!hyperchatsHidden} mountOnEnter unmountOnExit>
      {children}
    </Slide>
  );
};
