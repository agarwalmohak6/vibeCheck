export const RECOMMENDED_SONGS = [
  { id: 'apple:1450695895', label: 'i love you', artist: 'Billie Eilish', sourceUrl: 'https://music.apple.com/us/song/1450695895' },
  { id: 'apple:996472198', label: 'Hamari Adhuri Kahani', artist: 'Arijit Singh & Jeet Gannguli', sourceUrl: 'https://music.apple.com/us/song/996472198' },
] as const;

export function isOfficialMusicLink(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'music.apple.com' &&
      !url.username && !url.password && !url.port;
  } catch {
    return false;
  }
}
