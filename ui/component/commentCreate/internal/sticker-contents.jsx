// @flow
import Button from 'component/button';
import React from 'react';
import FilePrice from 'component/filePrice';
import OptimizedImage from 'component/optimizedImage';
import ChannelThumbnail from 'component/channelThumbnail';
import UriIndicator from 'component/uriIndicator';

type Props = {
  activeChannelUrl: string,
  src: string,
  price: number,
  exchangeRate?: number,
};

export const StickerReviewBox = (props: Props) => {
  const { activeChannelUrl, src, price, exchangeRate } = props;

  return (
    <div className="comment-create__sticker-preview">
      <div className="comment-create__sticker-preview__info">
        <ChannelThumbnail xsmall uri={activeChannelUrl} />
        <UriIndicator uri={activeChannelUrl} link showAtSign />
      </div>

      <div className="comment-create__sticker-preview__image">
        <OptimizedImage src={src} waitLoad loading="lazy" />
      </div>

      {Boolean(price && exchangeRate) && (
        <FilePrice
          customPrices={{
            // TODO PRICE FILE
            priceFiat: price,
            priceLBC: Number(exchangeRate) !== 0 ? price / Number(exchangeRate) : 0,
          }}
          isFiat
        />
      )}
    </div>
  );
};

type StickerButtonProps = {
  isReviewingStickerComment: boolean,
  disabled?: boolean,
};

export const StickerActionButton = (stickerButtonProps: StickerButtonProps) => {
  const { isReviewingStickerComment, disabled, ...buttonProps } = stickerButtonProps;

  return (
    <Button
      disabled={disabled}
      {...buttonProps}
      title={__('Stickers')}
      label={isReviewingStickerComment ? __('Change') : undefined}
    />
  );
};
