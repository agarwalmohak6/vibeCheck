export type CardEventType =
  | 'card_viewed'
  | 'envelope_opened'
  | 'passcode_failed'
  | 'passcode_unlocked'
  | 'story_answered'
  | 'runaway_dodged'
  | 'cta_accepted';

export type CardSender = 'creator' | 'recipient';

export interface PublicCardData {
  message_title: string;
  main_body: string;
  media_url?: string;
  compressed_media_url?: string;
  gif_url?: string;
  music_url?: string;
  music_label?: string;
  cover_image_url?: string;
  yes_btn_text?: string;
  no_btn_text?: string;
  unlock_question?: string;
  has_secret_code?: boolean;
  story_questions?: Array<{
    id: string;
    eyebrow: string;
    question: string;
    options: string[];
  }>;
}

export interface PublicCard {
  id: string;
  recipient_name: string;
  creator_name: string;
  template_type: string;
  theme_selected: string;
  card_data: PublicCardData;
  tier_selected: string;
  account_id?: string | null;
  created_at: string;
  expires_at?: string | null;
  is_paid: boolean;
  payment_id?: string | null;
  music_track_id?: string | null;
}

export interface TrackerEvent {
  id: string;
  card_id: string;
  event_type: CardEventType;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ChatMessageDTO {
  id: string;
  card_id: string;
  sender: CardSender;
  text: string;
  created_at: string;
}
