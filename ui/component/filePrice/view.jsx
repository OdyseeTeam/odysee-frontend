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
  rentalInfo: { price: number, currency: string, expirationTimeInSeconds: number, priceInPreferredCurrency: number },
  purchaseInfo: { price: number, currency: string, priceInPreferredCurrency: number },
  isFetchingPurchases: boolean,
  // below props are just passed to <CreditAmount />
  customPrices?: { priceFiat: number, priceLBC: number },
  hideFree?: boolean, // hide the file price if it's free
  isFiat?: boolean,
  showLBC?: boolean,
  currency: string,
  canUsePreferredCurrency: boolean,
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
      currency,
      canUsePreferredCurrency,
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
    });

    if (fiatRequired) {
      if (isFetchingPurchases || (fiatPaid && type !== 'thumbnail')) {
        return null;
      }

      const hasMultiOptions = Boolean(purchaseInfo) && Boolean(rentalInfo);
      const showIconsOnly = hasMultiOptions && type === 'thumbnail';
      const purchasePrice =
        purchaseInfo && (canUsePreferredCurrency ? purchaseInfo.priceInPreferredCurrency : purchaseInfo.price);
      const rentalPrice =
        rentalInfo && (canUsePreferredCurrency ? rentalInfo.priceInPreferredCurrency : rentalInfo.price);

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
                  amount={showIconsOnly ? '' : purchasePrice}
                  className={className}
                  isFiat
                  showFullPrice={showFullPrice}
                  icon={ICONS.BUY}
                  fiatCurrency={currency}
                />
              )}
              {rentalInfo && (
                <CreditAmount
                  amount={showIconsOnly ? '' : rentalPrice}
                  className={className}
                  isFiat
                  showFullPrice={showFullPrice}
                  icon={ICONS.TIME}
                  fiatCurrency={currency}
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
