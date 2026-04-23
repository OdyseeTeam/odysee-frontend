import React from 'react';
import classnames from 'classnames';
import { QRCodeSVG } from 'qrcode.react';
type Props = {
  value: string;
  paddingRight?: boolean;
  paddingTop?: boolean;
};

function QRCode({ value, paddingRight = false, paddingTop = false }: Props) {
  return (
    <div
      className={classnames('qr-code', {
        'qr-code--right-padding': paddingRight,
        'qr-code--top-padding': paddingTop,
      })}
    >
      <QRCodeSVG value={value} />
    </div>
  );
}

export default QRCode;
