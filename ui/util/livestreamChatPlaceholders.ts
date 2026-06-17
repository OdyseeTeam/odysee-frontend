export type ChatPlaceholderMessage = {
  user: string;
  msg: string;
  amount?: number;
};

export const PLACEHOLDER_HYPERCHATS: Array<ChatPlaceholderMessage & { amount: number }> = [
  { user: 'Frank', msg: 'Loving the stream!', amount: 5 },
  { user: 'Grace', msg: 'Keep it up!', amount: 50 },
  { user: 'Henry', msg: 'You earned this!', amount: 10 },
  { user: 'Ivy', msg: 'Best content ever', amount: 100 },
  { user: 'Jack', msg: 'GG WP', amount: 500 },
];

export const PLACEHOLDER_MESSAGES: Array<ChatPlaceholderMessage> = [
  { user: 'Alice', msg: 'Hello there!' },
  { user: 'Bob', msg: 'Great stream!' },
  { user: 'Carol', msg: 'PogChamp' },
  PLACEHOLDER_HYPERCHATS[0],
  { user: 'Dave', msg: 'Welcome everyone' },
  { user: 'Eve', msg: 'How are you?' },
  { user: 'Mallory', msg: 'First time here, this rocks' },
  { user: 'Oscar', msg: 'KEKW' },
  { user: 'Nina', msg: 'lets goooo' },
  { user: 'Liam', msg: 'cracked aim' },
  PLACEHOLDER_HYPERCHATS[2],
  { user: 'Kira', msg: 'is this live?' },
  { user: 'Jordan', msg: 'yes its live' },
  PLACEHOLDER_HYPERCHATS[1],
  { user: 'Peggy', msg: 'subbed!' },
  { user: 'Trent', msg: 'lets gooo' },
  { user: 'Victor', msg: 'audio is great today' },
  { user: 'Hank', msg: 'first!' },
  { user: 'Iris', msg: 'no u' },
  { user: 'Walter', msg: '👀' },
  { user: 'Sybil', msg: 'when raid?' },
  { user: 'Felix', msg: 'lurking from work' },
  { user: 'Gina', msg: 'this beat slaps' },
  PLACEHOLDER_HYPERCHATS[3],
  { user: 'Yara', msg: 'love this song' },
  { user: 'Zane', msg: 'lol' },
  { user: 'Quinn', msg: 'gn from EU' },
  { user: 'Otto', msg: 'GOAT' },
  { user: 'Maya', msg: 'sheeesh' },
  PLACEHOLDER_HYPERCHATS[4],
];

export function hyperchatColor(amount: number): [number, number, number] {
  if (amount >= 500) return [222, 0, 80];
  if (amount >= 100) return [230, 41, 74];
  if (amount >= 50) return [239, 81, 67];
  if (amount >= 10) return [247, 122, 61];
  return [255, 162, 54];
}

function hexByte(n: number) {
  return n.toString(16).padStart(2, '0');
}

export function hyperchatColorHex(amount: number): string {
  const [r, g, b] = hyperchatColor(amount);
  return `#${hexByte(r)}${hexByte(g)}${hexByte(b)}`;
}
