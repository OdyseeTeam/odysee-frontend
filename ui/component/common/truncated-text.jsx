// @flow
import * as React from 'react';
// import remark from 'remark';
// import remarkAttr from 'remark-attr';
import twemoji from 'twemoji';
// import { formattedEmote, inlineEmote } from 'util/remark-emote';
// import remarkEmoji from 'remark-emoji';
const emojiList = require('node-emoji');

type Props = {
  text?: ?string,
  lines: number,
  showTooltip?: boolean,
  children?: React.Node,
  style?: any,
};

const TruncatedText = (props: Props) => {
  const { text, children, lines, showTooltip, style } = props;
  const tooltip = showTooltip ? children || text : '';

  const RE_EMOJI = /:\+1:|:-1:|:[\w-]+:/g;

  const Twemoji = ({ emoji }) => {
    emoji = emoji.replace(RE_EMOJI, getEmoji);
    return (
      <span
        dangerouslySetInnerHTML={{
          __html: twemoji.parse(emoji),
        }}
      />
    );
  };

  function getEmoji(match) {
    const got = emojiList.get(match);
    if (got === match) {
      return got;
    }

    return got + ' ';
  }

  return (
    <span title={tooltip} className="truncated-text" style={{ WebkitLineClamp: lines, ...style }}>
      <Twemoji emoji={children || text} />
    </span>
  );
};

TruncatedText.defaultProps = {
  showTooltip: true,
};

export default TruncatedText;
