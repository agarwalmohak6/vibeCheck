export function isOfficialMusicLink(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'music.apple.com' &&
      !url.username && !url.password && !url.port;
  } catch {
    return false;
  }
}

export function appleMusicEmbedUrl(value: string): string | null {
  if (!isOfficialMusicLink(value)) return null;
  const url = new URL(value);
  url.hostname = 'embed.music.apple.com';
  url.searchParams.delete('at');
  url.searchParams.set('theme', 'light');
  return url.toString();
}
