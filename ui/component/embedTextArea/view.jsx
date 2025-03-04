// @flow
import * as ICONS from 'constants/icons';
import { FormField } from 'component/common/form';
import Button from 'component/button';
import React, { useRef } from 'react';
import { generateEmbedUrlEncoded, generateEmbedIframeData } from 'util/web';

type Props = {
  copyable: string,
  snackMessage: ?string,
  doToast: ({ message: string }) => void,
  label?: string,
  claim: Claim,
  includeStartTime: boolean,
  startTime: number,
  referralCode: ?string,
  newestType?: string,
  uriAccessKey?: UriAccessKey,
};

export default function EmbedTextArea(props: Props) {
  const { doToast, snackMessage, label, claim, includeStartTime, startTime, referralCode, newestType, uriAccessKey } =
    props;

  const [embedAutoplay, setEmbedAutoplay] = React.useState(false);

  const { canonical_url: canonicalUri } = claim;
  const input = useRef();

  const streamUrl = generateEmbedUrlEncoded(
    canonicalUri,
    includeStartTime && startTime,
    referralCode,
    newestType,
    embedAutoplay,
    uriAccessKey
  );
  const { html: embedText } = generateEmbedIframeData(streamUrl);

  function copyToClipboard() {
    const topRef = input.current;
    if (topRef && topRef.input && topRef.input.current) {
      topRef.input.current.select();
      document.execCommand('copy');
      doToast({ message: snackMessage || 'Embed link copied' });
    }
  }

  function onFocus() {
    // We have to go a layer deep since the input is inside the form component
    const topRef = input && input.current;
    if (topRef && topRef.input && topRef.input.current) {
      topRef.input.current.select();
    }
  }

  return (
    <div className="section">
      <FormField
        type="textarea"
        className="form-field--copyable"
        label={label}
        value={embedText || ''}
        ref={input}
        onFocus={onFocus}
        readOnly
      />

      <div className="margin-vertical-medium">
        <FormField
          name={'embed-autoplay' + (newestType ? ' ' + newestType : '')}
          type="checkbox"
          label={__('Enable Autoplay')}
          checked={embedAutoplay}
          onChange={() => setEmbedAutoplay((prev) => !prev)}
        />
      </div>

      <div className="section__actions">
        <Button
          icon={ICONS.COPY}
          button="primary"
          label={__('Copy')}
          onClick={() => {
            copyToClipboard();
          }}
        />
      </div>
    </div>
  );
}
