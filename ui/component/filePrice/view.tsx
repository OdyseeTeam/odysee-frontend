import 'scss/component/_file-price.scss';
import * as ICONS from 'constants/icons';
import classnames from 'classnames';
import CreditAmount from 'component/common/credit-amount';
import Icon from 'component/common/icon';
import React, { useEffect, useRef } from 'react';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import {
  selectClaimForUri,
  selectClaimWasPurchasedForUri,
  selectRentalTagForUri,
  selectPurchaseTagForUri,
  selectIsFiatPaidForUri,
  selectIsFetchingPurchases,
  selectCostInfoForUri,
} from 'redux/selectors/claims';
import { doTipAccountCheckForUri } from 'redux/actions/stripe';

type Props = {
  uri?: string;
  showFullPrice?: boolean;
  type?: 'default' | 'filepage' | 'modal' | 'thumbnail';
  customPrices?: {
    priceFiat: number;
    priceLBC: number;
  };
  hideFree?: boolean;
  isFiat?: boolean;
  showLBC?: boolean;
};

const FilePrice = React.memo(function FilePrice({
  uri,
  showFullPrice = false,
  type = 'default',
  customPrices: externalCustomPrices,
  hideFree,
  isFiat,
  showLBC,
}: Props) {
  const dispatch = useAppDispatch();

  const claim = useAppSelector((state) => (uri ? selectClaimForUri(state, uri) : undefined));
  const sdkPaid = useAppSelector((state) => (uri ? selectClaimWasPurchasedForUri(state, uri) : false));
  const fiatPaid = useAppSelector((state) => (uri ? selectIsFiatPaidForUri(state, uri) : false));
  const costInfo = useAppSelector((state) => (uri ? selectCostInfoForUri(state, uri) : undefined));
  const rentalInfo = useAppSelector((state) => (uri ? selectRentalTagForUri(state, uri) : undefined));
  const purchaseTag = useAppSelector((state) => (uri ? selectPurchaseTagForUri(state, uri) : undefined));
  const isFetchingPurchases = useAppSelector((state) => selectIsFetchingPurchases(state));

  let derivedCustomPrices: { priceFiat: number; priceLBC: number } | undefined;
  if (purchaseTag && costInfo?.cost > 0 && costInfo.feeCurrency === 'LBC') {
    derivedCustomPrices = {
      priceFiat: Number(purchaseTag),
      priceLBC: Number(costInfo.cost),
    };
  }

  const customPrices = externalCustomPrices || derivedCustomPrices;

  const purchaseInfo = purchaseTag;

  const prevCostInfoRef = useRef(costInfo);

  useEffect(() => {
    if (!prevCostInfoRef.current && costInfo && !purchaseInfo && uri) {
      dispatch(doTipAccountCheckForUri(uri));
    }
    prevCostInfoRef.current = costInfo;
  }, [costInfo, purchaseInfo, uri, dispatch]);

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
    return (
      <div
        className={classnames('filePriceFiatDuo', {
          'filePriceFiatDuo--filePage': type === 'filepage',
        })}
      >
        {fiatPaid ? (
          <CreditAmount amount={''} className={className} isFiat icon={ICONS.COMPLETED} />
        ) : sdkPaid ? (
          <span className={className}>
            <Icon icon={ICONS.PURCHASED} size={type === 'filepage' ? 22 : undefined} />
          </span>
        ) : (
          <>
            {purchaseInfo && (
              <CreditAmount
                amount={showIconsOnly ? '' : purchaseInfo}
                customAmounts={
                  customPrices
                    ? {
                        amountFiat: customPrices.priceFiat,
                        amountLBC: customPrices.priceLBC,
                      }
                    : undefined
                }
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
        customPrices
          ? {
              amountFiat: customPrices.priceFiat,
              amountLBC: customPrices.priceLBC,
            }
          : undefined
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
});

export default FilePrice;
