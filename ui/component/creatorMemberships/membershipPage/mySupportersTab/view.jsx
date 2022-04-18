// @flow
import React from 'react';

export default function CreatorMembershipsTab() {
  // TODO: replace with API call
  const yourSupporters = [
    {
      channelName: '@test35234',
      tierName: 'Community MVP',
      supportAmountPerMonth: '20',
      currency: 'USD',
      monthsOfSupport: 2,
    },
  ];

  return (
    <table className="table table--transactions">
      <thead>
        <tr>
          <th className="date-header">Supporter Channel Name</th>
          <th className="channelName-header">Membership Tier</th>
          <th className="location-header">Support Amount</th>
          <th className="channelName-header">Total Supporting Time</th>
          <th className="amount-header">Details</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          {yourSupporters.map((supporter, i) => (
            <>
              <td>
                <span dir="auto" className="button__label">
                  @test35234
                </span>
              </td>
              <td>Community MVP</td>
              <td>$20 USD / Month</td>
              <td>2 Months</td>
              <td>
                <span dir="auto" className="button__label">
                  See Details
                </span>
              </td>
            </>
          ))}
        </tr>
      </tbody>
    </table>
  );
}
