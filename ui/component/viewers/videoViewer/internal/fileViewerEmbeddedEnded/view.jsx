// @flow
import React from 'react';
import Button from 'component/button';
import * as ICONS from 'constants/icons';
import { formatLbryUrlForWeb } from 'util/url';
import { withRouter } from 'react-router';
import { URL as APP_URL, SITE_NAME } from 'config';
import Logo from 'component/logo';

const DEFAULT_PROMPTS = {
  bigtech: 'Together, we can take back control from big tech',
  discuss: `Continue the discussion on ${SITE_NAME}`,
  find: `Find more great content on ${SITE_NAME}`,
  test: "We test a lot of messages here. Wouldn't it be funny if the one telling you that did the best?",
};

type Props = {
  uri: string,
  doReplay: () => void,
  // -- redux --
  isAuthenticated: boolean,
  preferEmbed: boolean,
  uriAccessKey: ?UriAccessKey,
};

function FileViewerEmbeddedEnded(props: Props) {
  const { uri, doReplay, isAuthenticated, preferEmbed, uriAccessKey } = props;

  const prompts = isAuthenticated
    ? { ...DEFAULT_PROMPTS, tip_auth: 'Always tip your creators' }
    : {
        ...DEFAULT_PROMPTS,
        earn_unauth: `Join ${SITE_NAME} and receive credits to watch.`,
        blockchain_unauth: "Now if anyone asks, you can say you've used a blockchain.",
      };

  const promptKeys = Object.keys(prompts);
  const promptKey = promptKeys[Math.floor(Math.random() * promptKeys.length)];
  // $FlowFixMe
  const prompt = prompts[promptKey];
  const odyseeLink = (() => {
    const url = new URL(`${APP_URL}${formatLbryUrlForWeb(uri)}`);
    url.searchParams.set('src', promptKey);
    if (uriAccessKey) {
      url.searchParams.set('signature', uriAccessKey.signature);
      url.searchParams.set('signature_ts', uriAccessKey.signature_ts);
    }
    return url.toString();
  })();

  return (
    <div className="file-viewer__overlay">
      <div className="file-viewer__overlay-secondary">
        <Button className="file-viewer__overlay-logo" href="/" disabled={preferEmbed}>
          <Logo type={'embed'} />
        </Button>
      </div>

      <div className="file-viewer__overlay-title file-viewer_embed-ended-title">
        <p>{prompt}</p>
      </div>
      <div className="file-viewer__overlay-actions">
        <>
          {doReplay && (
            <Button
              title={__('Replay')}
              button="link"
              label={preferEmbed ? __('Replay') : undefined}
              iconRight={ICONS.REPLAY}
              onClick={doReplay}
            />
          )}
          {!preferEmbed && (
            <>
              <a target="_blank" rel="noopener noreferrer" href={odyseeLink}>
                <Button label={__('Discuss')} iconRight={ICONS.EXTERNAL} button="primary" />
              </a>
              {!isAuthenticated && (
                <a target="_blank" rel="noopener noreferrer" href={`${APP_URL}/$/signup?src=embed_signup`}>
                  <Button label={__('Join %SITE_NAME%', { SITE_NAME })} button="secondary" />
                </a>
              )}
            </>
          )}
        </>
      </div>
    </div>
  );
}

export default withRouter(FileViewerEmbeddedEnded);
