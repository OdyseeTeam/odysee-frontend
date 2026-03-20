// @flow

function strToSeconds(stime: string): number {
  const tt = stime.split(':').reverse();
  return (tt.length >= 3 ? +tt[2] : 0) * 60 * 60 + (tt.length >= 2 ? +tt[1] : 0) * 60 + (tt.length >= 1 ? +tt[0] : 0);
}

function isValidTimestamp(str: string): boolean {
  switch (str.length) {
    case 4:
      return /^[0-9]:[0-5][0-9]$/.test(str);
    case 5:
      return /^[0-5][0-9]:[0-5][0-9]$/.test(str);
    case 7:
      return /^[0-9]:[0-5][0-9]:[0-5][0-9]$/.test(str);
    case 8:
      return /^[0-9][0-9]:[0-5][0-9]:[0-5][0-9]$/.test(str);
    default:
      return false;
  }
}

export type Chapter = {
  time: number,
  label: string,
  timestamp: string,
};

export default function parseChapters(description: ?string): Array<Chapter> {
  if (!description) return [];

  const chapters: Array<Chapter> = [];
  const lines = description.split('\n');

  for (const line of lines) {
    const match = line.match(/^(\d[\d:]*(?::\d\d))\s*[-–—]?\s*(.+)/);
    if (!match) continue;

    const timestampRaw = match[1].replace(/:+$/, '');
    const label = match[2].trim();

    if (!isValidTimestamp(timestampRaw) || !label) continue;

    chapters.push({
      time: strToSeconds(timestampRaw),
      label,
      timestamp: timestampRaw,
    });
  }

  return chapters.length >= 2 ? chapters : [];
}
