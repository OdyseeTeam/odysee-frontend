export function isEmbedPath(pathname?: string | null): boolean {
  return Boolean(pathname && (pathname.startsWith('/$/embed/') || pathname.startsWith('/%24/embed/')));
}
