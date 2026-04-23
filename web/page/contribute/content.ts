export const CONTRIBUTION_TITLE = 'Build Odysee With Us';
export const CONTRIBUTION_INTRO =
  'Odysee is a community platform, and we believe it should be built by the community too.';
export const CONTRIBUTION_BODY =
  "Whether you're a developer looking to contribute code, a designer with fresh ideas, or a creator who sees possibilities we have not imagined yet, we'd love your help building Odysee.";
export const WHY_POINTS = [
  "YouTube wasn't built in a day, and neither was the spirit that once made it great. We're trying to recapture that with Odysee.",
  'Your code does not just fix bugs or add features. It proves a video platform can be built with creators and users, not just for them.',
];
export const TRACKS = [
  {
    title: 'TV Apps',
    summary: 'Bring Odysee to living-room screens.',
    items: [
      'Apple TV app development',
      'PlayStation app development',
      'Google TV app development',
      'LG TV app development',
    ],
  },
  {
    title: 'Discovery & Search',
    summary: 'Help users find great content faster.',
    items: [
      'Improved discovery',
      'Accurate results (private search access available with prior Elasticsearch experience)',
      'Better tagging',
    ],
  },
  {
    title: 'Mobile Improvements',
    summary: 'Make mobile smoother and more modern.',
    items: [
      'Mobile UI smoothness and improvements on odysee.com',
      'iOS app improvements and features',
      'React/Redux modernization',
    ],
  },
  {
    title: 'Design & Misc Features',
    summary: 'Ship better UX and new ideas.',
    items: ['Homepage UI revisions', 'Custom theming systems', 'Features we have not thought of yet'],
  },
];
export const PROCESS_STEPS = [
  'Explore our GitHub repositories and use llms.txt so coding agents can understand the architecture better.',
  'Choose a task that matches your skills and interests.',
  'Contribute by submitting your work for review.',
  "Collaborate with our team while we review contributions. We're thorough, so reviews can take time.",
];
export const QUALITY_NOTE =
  'This is about building together, not rushing. Please test your changes thoroughly before submitting. If you need help running changes locally or understanding architecture, join us in Discord.';
export const REPOSITORIES = [
  {
    label: 'Odysee.com',
    shortLabel: 'Frontend',
    href: 'https://github.com/OdyseeTeam/odysee-frontend/issues?q=is%3Aissue%20state%3Aopen%20label%3A%22help%20wanted%22',
  },
  {
    label: 'Commenting service',
    shortLabel: 'Commentron',
    href: 'https://github.com/OdyseeTeam/commentron/issues?q=is%3Aissue%20state%3Aopen%20label%3A%22help%20wanted%22',
  },
  {
    label: 'Documentation / help improvements',
    shortLabel: 'Docs',
    href: 'https://github.com/OdyseeTeam/odysee-docs',
  },
  {
    label: 'Odysee Roku',
    shortLabel: 'Roku',
    href: 'https://github.com/OdyseeTeam/odysee-roku/issues?q=is%3Aissue%20state%3Aopen%20label%3A%22help%20wanted%22',
  },
  {
    label: 'Watch on Odysee',
    shortLabel: 'Watch Extension',
    href: 'https://github.com/OdyseeTeam/Watch-on-Odysee',
  },
];
export const CTA_COPY =
  'Ready to help out? Head over to GitHub and look for issues tagged "help wanted". Also use llms.txt to help coding agents understand Odysee systems.';
