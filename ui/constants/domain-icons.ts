import * as ICONS from 'constants/icons';

type DomainIconEntry = {
  icon: string;
  domains: string[];
};

const ENTRIES: DomainIconEntry[] = [{ icon: ICONS.YOUTUBE, domains: ['youtube.com', 'youtu.be'] }];

const lookup = new Map<string, string>();
for (const entry of ENTRIES) {
  for (const domain of entry.domains) {
    lookup.set(domain, entry.icon);
  }
}

export function getDomainIcon(hostname: string): string | undefined {
  const host = hostname.replace(/^www\./i, '');
  return lookup.get(host);
}

export const DOMAIN_ICONS = lookup;
