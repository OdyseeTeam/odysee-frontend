// @flow
import React from 'react';
import Button from 'component/button';

type Props = {
  meme: ?{ text: string, url: string },
};

export default function Meme(props: Props) {
  const { meme } = props;
  if (!meme) {
    return null;
  }

  const handleClick = () => {
    const isExternal = meme.url.indexOf('odysee.com/') === -1;

    if (isExternal && window.odysee?.functions?.initBrowser) {
      window.odysee.functions.initBrowser(meme.url, 'external');
    } else {
      window.odysee.functions.history.push(meme.url.substr(meme.url.indexOf('odysee.com/') + 10, meme.url.length));
    }
  };

  return (
    <h1 className="home__meme">
      <Button button="link" onClick={handleClick}>
        {meme.text}
      </Button>
    </h1>
  );
}
