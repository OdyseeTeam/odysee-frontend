import React from 'react';
import Button from 'component/button';

export default function Meme() {
  const meme = window?.homepages?.en?.meme;
  if (!meme) {
    return null;
  }

  return (
    <h1 className="home__meme">
      <Button
        button="link"
        onClick={() =>
          window.odysee.functions.history.push(meme.url.substr(meme.url.indexOf('odysee.com/') + 10, meme.url.length))
        }
      >
        {meme.text}
      </Button>
    </h1>
  );
}
