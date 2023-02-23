// @flow
import 'scss/component/_file-price.scss';
import * as ICONS from 'constants/icons';
import classnames from 'classnames';
import CreditAmount from 'component/common/credit-amount';
import Icon from 'component/common/icon';
import React from 'react';

type Props = {
  claim: ?{},
  sdkPaid: boolean,
  fiatPaid: boolean,
  costInfo?: ?{ includesData: boolean, cost: number },
  showFullPrice: boolean,
  type?: 'default' | 'filepage' | 'modal' | 'thumbnail',
  uri: string,
  rentalInfo: { price: number, currency: string, expirationTimeInSeconds: number },
  purchaseInfo: number,
  isFetchingPurchases: boolean,
  // below props are just passed to <CreditAmount />
  customPrices?: { priceFiat: number, priceLBC: number },
  hideFree?: boolean, // hide the file price if it's free
  isFiat?: boolean,
  showLBC?: boolean,
};

class FilePrice extends React.PureComponent<Props> {
  static defaultProps = { showFullPrice: false };

  render() {
    const {
      costInfo,
      showFullPrice,
      showLBC,
      isFiat,
      hideFree,
      sdkPaid,
      type = 'default',
      customPrices,
      rentalInfo,
      purchaseInfo,
      isFetchingPurchases,
      fiatPaid,
    } = this.props;

    const fiatRequired = Boolean(purchaseInfo) || Boolean(rentalInfo);
    const hasPrice = customPrices || fiatRequired || costInfo?.cost;

    if (!hasPrice && hideFree) {
      return null;
    }

    const className = classnames('filePrice', {
      'filePrice--key': sdkPaid,
      'filePrice--filepage': type === 'filepage',
      'filePrice--thumbnail': type === 'thumbnail',
      'filePrice--modal': type === 'modal',
      'filePrice--fiat': fiatRequired,
      'filePrice--skewedBg': true,
    });

    if (fiatRequired) {
      if (isFetchingPurchases || (fiatPaid && type !== 'thumbnail')) {
        return null;
      }

      const hasMultiOptions = Boolean(purchaseInfo) && Boolean(rentalInfo);
      const showIconsOnly = hasMultiOptions && type === 'thumbnail';

      return (
        <div
          className={classnames('filePriceFiatDuo', {
            'filePriceFiatDuo--filePage': type === 'filepage',
          })}
        >
          {fiatPaid ? (
            <CreditAmount
              amount={''}
              className={className}
              isFiat
              icon={ICONS.COMPLETED} // icon={ICONS.PURCHASED}
            />
          ) : (
            <>
              {purchaseInfo && (
                <CreditAmount
                  amount={showIconsOnly ? '' : purchaseInfo}
                  className={className}
                  isFiat
                  showFullPrice={showFullPrice}
                  icon={ICONS.BUY}
                />
              )}
              {rentalInfo && (
                <CreditAmount
                  amount={showIconsOnly ? '' : rentalInfo.price}
                  className={className}
                  isFiat
                  showFullPrice={showFullPrice}
                  icon={ICONS.TIME}
                />
              )}
            </>
          )}
        </div>
      );
    }

    if (sdkPaid) {
      return (
        <span className={className}>
          <Icon icon={ICONS.PURCHASED} size={type === 'filepage' ? 22 : undefined} />
        </span>
      );
    }

    return (
      <CreditAmount
        amount={costInfo && costInfo.cost > 0 ? costInfo.cost : undefined}
        customAmounts={
          customPrices ? { amountFiat: customPrices.priceFiat, amountLBC: customPrices.priceLBC } : undefined
        }
        className={className}
        isEstimate={!!costInfo && !costInfo.includesData}
        isFiat={isFiat}
        showFree
        showFullPrice={showFullPrice}
        showLBC={showLBC}
        size={14}
      />
    );
  }
}

export default FilePrice;
