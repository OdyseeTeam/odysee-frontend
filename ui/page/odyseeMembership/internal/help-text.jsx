// @flow
import React from 'react';

const HelpText = () => (
  <div className="section__subtitle">
    <p className="balance-text">
      {__(
        'First of all, thank you for considering or purchasing a membership, it means a ton to us! A few important details to know:'
      )}
    </p>
    <p>
      <ul>
        <li className="balance-text">
          {__(
            'Exclusive and early access features include: a special badge to show your support of Odysee, the ability to post Odysee hyperlinks + images in comments, and account is also automatically eligible for Credits.'
          )}
        </li>
        <li className="balance-text">
          {__(
            'The yearly Premium+ membership has a discount compared to monthly, and Premium is only available yearly.'
          )}
        </li>
        <li>
          {__(
            `Badges are displayed on a single channel, so please ensure you're signing up under the account you'd like to receive a badge.`
          )}
        </li>
        <li>
          {__('Cannot upgrade or downgrade a membership at this time. Refunds are not available. Choose wisely.')}
        </li>
      </ul>
    </p>
  </div>
);

export default HelpText;
