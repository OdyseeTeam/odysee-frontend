import React from 'react';
import Button from 'component/button';
const memes = require('memes');

export default function Meme() {
  return (
    <h1 className="home__meme">      
      <Button button="link" onClick={() => window.odysee.functions.history.push(memes.url.substr(memes.url.indexOf('odysee.com/')+10, memes.url.length)) }>
        {memes.text}
      </Button>
    </h1>
  );
}
