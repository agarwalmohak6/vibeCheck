import { getMoodStory } from '@/lib/moodStories';

export default function SceneLoading({ mood = 'bestie_check', scene = 'opening', compact = false }: { mood?: string; scene?: 'opening' | 'photos' | 'creating' | 'payment' | 'preview'; compact?: boolean }) {
  const story = getMoodStory(mood);
  const text = { opening: 'Opening a little moment for you…', photos: 'Making room for your memories…', creating: 'Sealing your note and preparing your link…', payment: 'Waiting for payment confirmation…', preview: 'Preparing your personal preview…' }[scene];
  return <div className={`vc-scene-loading ${compact ? 'is-compact' : ''}`} role="status" aria-live="polite" aria-busy="true"><div className="vc-scene-loading__icons" aria-hidden="true">{story.narrative.emojis.map((emoji, index) => <span key={index} style={{ animationDelay: `${index * .18}s` }}>{emoji}</span>)}</div><p>{text}</p></div>;
}
