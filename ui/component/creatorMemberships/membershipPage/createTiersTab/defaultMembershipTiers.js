let membershipTiers = [
  {
    displayName: 'Helping Hand',
    description: "You're doing your part, thank you!",
    monthlyContributionInUSD: 5,
    perks: ['exclusiveAccess', 'badge'],
  },
  // {
  //   displayName: 'Big-Time Supporter',
  //   description: 'You are a true fan and are helping in a big way!',
  //   monthlyContributionInUSD: 10,
  //   perks: ['exclusiveAccess', 'earlyAccess', 'badge', 'emojis'],
  // },
  // {
  //   displayName: 'Community MVP',
  //   description: 'Where would this creator be without you? You are a true legend!',
  //   monthlyContributionInUSD: 20,
  //   perks: ['exclusiveAccess', 'earlyAccess', 'badge', 'emojis', 'custom-badge'],
  // },
];

const perkDescriptions = [
  {
    perkName: 'exclusiveAccess',
    perkDescription: 'Members-only content',
  },
  {
    perkName: 'earlyAccess',
    perkDescription: 'Early access content',
  },
  {
    perkName: 'badge',
    perkDescription: 'Member Badge',
  },
  {
    perkName: 'emojis',
    perkDescription: 'Members-only emojis',
  },
  {
    perkName: 'custom-badge',
    perkDescription: 'MVP member badge',
  },
];

export {
  membershipTiers,
  perkDescriptions,
};
