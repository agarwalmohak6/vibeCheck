export interface Track {
  id: string;
  label: string;
  artist: string;
  mood: 'romantic' | 'birthday' | 'apology';
  spotifyId: string; // Placeholder for embed, e.g. "4PTG3Z6ehGkBF3zIqYQG6D"
  youtubeId: string; // Placeholder for youtube search/embed, e.g. "dQw4w9WgXcQ"
  previewUrl?: string; // 30s snippet or preview audio if possible (using royalty free/public URLs for demo)
}

export const TRACKS: Track[] = [
  // Romantic
  {
    id: "rom_tum_hi_ho",
    label: "Tum Hi Ho",
    artist: "Arijit Singh",
    mood: "romantic",
    spotifyId: "56t4A19T10Pvx37dEa0eH3",
    youtubeId: "Umqb9KENg1Y",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/38/de/b9/38deb942-d44a-f2bb-205c-ddf05be84693/mzaf_9747647124859107103.plus.aac.p.m4a"
  },
  {
    id: "rom_kesariya",
    label: "Kesariya",
    artist: "Arijit Singh",
    mood: "romantic",
    spotifyId: "5LuWv9t0o0642Xw1m7m2QZ",
    youtubeId: "BddP6PYo2Gs",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/38/4c/5c/384c5c8f-3ff8-e457-b2f7-3158ce108649/mzaf_12389299033886433185.plus.aac.p.m4a"
  },
  {
    id: "rom_raataan_lambiyan",
    label: "Raataan Lambiyan",
    artist: "Jubin Nautiyal",
    mood: "romantic",
    spotifyId: "2G7V7zsRL1C6LsN7z8tQ2R",
    youtubeId: "gvyUuxdRdRY",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/99/0c/38/990c381b-0530-8c0d-87a9-18b050b97f0a/mzaf_10418866714500530894.plus.aac.p.m4a"
  },
  {
    id: "rom_pehle_bhi_main",
    label: "Pehle Bhi Main",
    artist: "Vishal Mishra",
    mood: "romantic",
    spotifyId: "3yHovayXjIE612Z12Z1Z1Z", 
    youtubeId: "iAIBF2qiRyY",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/3a/d8/43/3ad8432d-c2e6-052b-5679-cc01c6a599ea/mzaf_7941667053086496020.plus.aac.p.m4a"
  },
  {
    id: "rom_zaalima",
    label: "Zaalima",
    artist: "Arijit Singh",
    mood: "romantic",
    spotifyId: "6gB2Z12Z12Z12Z12Z12Z12",
    youtubeId: "hXdFrEPnC_4",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/cd/9f/4a/cd9f4a3f-8f5d-922b-2db9-933751017f8f/mzaf_8736831722992033377.plus.aac.p.m4a"
  },

  // Birthday
  {
    id: "bday_happy_birthday",
    label: "Happy Birthday (Desi Beats)",
    artist: "Traditional Remix",
    mood: "birthday",
    spotifyId: "3Z12Z12Z12Z12Z12Z12Z12",
    youtubeId: "z8Vfp48laAM",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/93/6a/5e/936a5ecd-b8f4-a689-6f68-308ee51ef76a/mzaf_15354290014276421604.plus.aac.p.m4a"
  },
  {
    id: "bday_baaar_baar_din",
    label: "Baar Baar Din Ye Aaye",
    artist: "Mohammed Rafi",
    mood: "birthday",
    spotifyId: "4Z12Z12Z12Z12Z12Z12Z12",
    youtubeId: "vG2S5s51b2s",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/00/51/63/0051630f-0c67-02df-4a51-0e93ea55e922/mzaf_1906037364965549989.plus.aac.p.m4a"
  },
  {
    id: "bday_birthday_bash",
    label: "Birthday Bash",
    artist: "Yo Yo Honey Singh",
    mood: "birthday",
    spotifyId: "5Z12Z12Z12Z12Z12Z12Z12",
    youtubeId: "Z5JbN4k1yzo",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/1b/ad/75/1bad75b4-c90e-6e90-4805-def4a81c38ca/mzaf_7931252853174734636.plus.aac.p.m4a"
  },
  {
    id: "bday_chota_bachha",
    label: "Chhota Bachha Jaan Ke",
    artist: "Aditya Narayan",
    mood: "birthday",
    spotifyId: "6Z12Z12Z12Z12Z12Z12Z12",
    youtubeId: "X_9u1UoKz1c",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/cc/50/00/cc5000e8-2469-f823-5cbd-8d1f502dc13a/mzaf_6506322238798047338.plus.aac.p.m4a"
  },
  {
    id: "bday_birthday_song",
    label: "Happy Birthday",
    artist: "Diljit Dosanjh",
    mood: "birthday",
    spotifyId: "7Z12Z12Z12Z12Z12Z12Z12",
    youtubeId: "eXW7c1s14Q4",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/a8/60/af/a860afab-c26b-4c36-8184-6d28b3f4ebc9/mzaf_2455901068418199555.plus.aac.p.m4a"
  },

  // Apology
  {
    id: "apo_channa_mereya",
    label: "Channa Mereya",
    artist: "Arijit Singh",
    mood: "apology",
    spotifyId: "8Z12Z12Z12Z12Z12Z12Z12",
    youtubeId: "z-diRlyLGzo",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/d5/f9/98/d5f998a7-0090-ee2d-03f8-557ad6c5bf65/mzaf_14251357991592637728.plus.aac.p.m4a"
  },
  {
    id: "apo_tujhe_bhula_diya",
    label: "Tujhe Bhula Diya",
    artist: "Mohit Chauhan",
    mood: "apology",
    spotifyId: "9Z12Z12Z12Z12Z12Z12Z12",
    youtubeId: "yIv_7Yx1kXg",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/e2/e4/8c/e2e48c66-5145-8bc2-15d5-ed54eac021e5/mzaf_6476384826244653728.plus.aac.p.m4a"
  },
  {
    id: "apo_agar_tum_saath",
    label: "Agar Tum Saath Ho",
    artist: "Alka Yagnik & Arijit Singh",
    mood: "apology",
    spotifyId: "10Z12Z12Z12Z12Z12Z12Z",
    youtubeId: "sK7riqg2mr4",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview126/v4/b1/ef/60/b1ef60e4-edb1-9c6c-831c-63156a648460/mzaf_1954453039481622269.plus.aac.p.m4a"
  },
  {
    id: "apo_luka_chuppi",
    label: "Luka Chuppi",
    artist: "A.R. Rahman & Lata Mangeshkar",
    mood: "apology",
    spotifyId: "11Z12Z12Z12Z12Z12Z12Z",
    youtubeId: "g6fS16K4Q3w",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/6a/89/2d/6a892db0-b8b1-2293-606f-faf3cf7f21f0/mzaf_8802185035076999916.plus.aac.p.m4a"
  },
  {
    id: "apo_bekhayali",
    label: "Bekhayali",
    artist: "Sachet Tandon",
    mood: "apology",
    spotifyId: "12Z12Z12Z12Z12Z12Z12Z",
    youtubeId: "VOLKJJvfAbg",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/4e/f1/8a/4ef18aa3-53a5-7ced-f887-b537d4adf0eb/mzaf_16713780536711201262.plus.aac.p.m4a"
  }
];

export function getTrackById(id: string): Track | undefined {
  return TRACKS.find(t => t.id === id);
}

export function getTracksByMood(mood: 'romantic' | 'birthday' | 'apology'): Track[] {
  return TRACKS.filter(t => t.mood === mood);
}
