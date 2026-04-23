import * as ICONS from 'constants/icons';
import { FormField } from 'component/common/form';
import Button from 'component/button';
import React, { useRef } from 'react';
import { generateEmbedUrlEncoded, generateEmbedIframeData } from 'util/web';
import { useAppDispatch } from 'redux/hooks';
import { doToast } from 'redux/actions/notifications';

type Props = {
  copyable?: string;
  snackMessage?: string | null | undefined;
  label?: string;
  claim: Claim;
  includeStartTime?: boolean;
  startTime?: number;
  referralCode?: string | null | undefined;
  newestType?: string;
  uriAccessKey?: UriAccessKey;
};
export default function EmbedTextArea(props: Props) {
  const { snackMessage, label, claim, includeStartTime, startTime, referralCode, newestType, uriAccessKey } = props;

  const dispatch = useAppDispatch();
  const [embedAutoplay, setEmbedAutoplay] = React.useState(false);
  const isChannel = claim && claim.value_type === 'channel';
  const isCollection = claim && claim.value_type === 'collection';
  const showAutoplayToggle = !isChannel && !isCollection && !newestType;
  const { canonical_url: canonicalUri } = claim;
  const input = useRef<any>();
  const streamUrl = generateEmbedUrlEncoded(
    canonicalUri,
    includeStartTime && startTime,
    referralCode,
    newestType,
    embedAutoplay,
    uriAccessKey
  );
  const { html: embedText } = generateEmbedIframeData(streamUrl);

  function showCopiedToast() {
    dispatch(
      doToast({
        message: snackMessage || __('Embed code copied'),
      })
    );
  }

  function copyToClipboard() {
    const topRef = input.current;
    const text = embedText || '';

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(showCopiedToast)
        .catch(() => {
          // Fallback for browsers/contexts where Clipboard API is blocked.
          if (topRef && topRef.input && topRef.input.current) {
            topRef.input.current.select();
            document.execCommand('copy');
            showCopiedToast();
          }
        });
      return;
    }

    if (topRef && topRef.input && topRef.input.current) {
      topRef.input.current.select();
      document.execCommand('copy');
      showCopiedToast();
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
        name="embed-textarea"
        type="textarea"
        className="form-field--copyable"
        label={label}
        value={embedText || ''}
        ref={input}
        onFocus={onFocus}
        readOnly
      />

      {showAutoplayToggle && (
        <div className="margin-vertical-medium">
          <FormField
            name={'embed-autoplay' + (newestType ? ' ' + newestType : '')}
            type="checkbox"
            label={__('Enable Autoplay')}
            checked={embedAutoplay}
            onChange={() => setEmbedAutoplay((prev) => !prev)}
          />
        </div>
      )}

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
