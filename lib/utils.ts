// lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { TIERS } from './themes';

// clsx + tailwind-merge helper
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Compute expires_at from tier
export function computeExpiresAt(tierId: string): string | null {
  const tier = TIERS.find((t) => t.id === tierId);
  if (!tier || tier.durationHours === null) return null;
  const d = new Date();
  d.setHours(d.getHours() + tier.durationHours);
  return d.toISOString();
}

// Check if card is expired
export function isExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

// Format WhatsApp share link
export function whatsappLink(url: string, creatorName: string, recipientName: string): string {
  const text = encodeURIComponent(
    `✨ ${recipientName}, someone sent you a MagicCard! 💌\n\n${creatorName} made something special just for you 🎴\n\n👆 Tap to open → ${url}`
  );
  return `https://wa.me/?text=${text}`;
}

// Base URL
export function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
}

// Random position within bounds
export function randomPosition(containerW: number, containerH: number, elW = 120, elH = 50) {
  return {
    x: Math.random() * (containerW - elW),
    y: Math.random() * (containerH - elH),
  };
}
