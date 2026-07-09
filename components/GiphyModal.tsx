'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';

interface GifResult {
  id: string;
  title: string;
  previewUrl: string;
  url: string;
}

interface GiphyModalProps {
  onSelect: (url: string) => void;
  onClose: () => void;
  initialQuery?: string;
  suggestedQueries?: string[];
  cardLabel?: string;
}

export default function GiphyModal({ onSelect, onClose, initialQuery = '', suggestedQueries = [], cardLabel = 'this card' }: GiphyModalProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<GifResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [provider, setProvider] = useState<'giphy' | 'mock' | ''>('');

  const trimmedQuery = query.trim();
  const canSearch = trimmedQuery.length >= 2;
  const uniqueSuggestions = Array.from(new Set(suggestedQueries.filter(term => term.trim().length >= 2))).slice(0, 3);

  const handleQueryChange = (nextQuery: string) => {
    setQuery(nextQuery);
    if (nextQuery.trim().length < 2) {
      setResults([]);
      setProvider('');
      setError('');
      setLoading(false);
    }
  };

  const runSearch = useCallback(async (term: string, signal?: AbortSignal) => {
    if (term.trim().length < 2) {
      setResults([]);
      setProvider('');
      setError('');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/gifs/search?q=${encodeURIComponent(term.trim())}`, { signal });
      const data = (await res.json()) as {
        results?: GifResult[];
        provider?: 'giphy' | 'mock';
        error?: string;
      };

      if (!res.ok) throw new Error(data.error || 'GIF search failed.');

      setResults(data.results || []);
      setProvider(data.provider || 'giphy');
    } catch (err) {
      if (signal?.aborted) return;
      console.error(err);
      setError('Could not search GIFs right now. Try again in a moment.');
      setResults([]);
      setProvider('');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canSearch) {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      void runSearch(trimmedQuery, controller.signal);
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [canSearch, runSearch, trimmedQuery]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      >
        <motion.div
          className="relative w-full max-w-md rounded-3xl overflow-hidden"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          initial={{ scale: 0.85, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.85, y: 30 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
                  Pick a GIF
                </h3>
                <p className="text-[11px]" style={{ color: 'var(--text3)' }}>
                  Showing GIFs that fit {cardLabel}. Search or tap a suggestion.
                </p>
              </div>
              <button onClick={onClose} className="text-2xl cursor-pointer" style={{ color: 'var(--text3)' }}>✕</button>
            </div>

            <div className="relative mb-3">
              <input
                type="search"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void runSearch(trimmedQuery);
                }}
                placeholder="Search GIFs..."
                className="vc-builder-input w-full px-4 py-3 pr-12 outline-none text-sm"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--text3)' }}>
                {loading ? '...' : 'Search'}
              </div>
            </div>

            {uniqueSuggestions.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {uniqueSuggestions.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => handleQueryChange(term)}
                    className="rounded-full px-3 py-1.5 text-[11px] font-bold transition-transform hover:scale-105 active:scale-95"
                    style={{
                      background: term === trimmedQuery ? 'linear-gradient(135deg, var(--accent), var(--accent2))' : 'color-mix(in srgb, var(--surface2), white 5%)',
                      color: term === trimmedQuery ? 'white' : 'var(--text2)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {term}
                  </button>
                ))}
              </div>
            )}

            {provider === 'mock' && (
              <p className="text-xs mb-3 px-2" style={{ color: 'var(--text3)' }}>
                Add `GIPHY_API_KEY` in `.env.local` for live GIPHY results. Showing demo GIFs for now.
              </p>
            )}

            {error && (
              <div className="mb-3 rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3">
                <p className="text-xs text-red-200">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
              {results.map((gif) => (
                <motion.button
                  key={gif.id}
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { onSelect(gif.url); onClose(); }}
                  className="relative rounded-xl overflow-hidden aspect-square cursor-pointer"
                  style={{ border: '2px solid var(--border)' }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={gif.previewUrl}
                    alt={gif.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </motion.button>
              ))}

              {results.length === 0 && !loading && !error && (
                <div className="col-span-3 py-12 flex flex-col items-center gap-2">
                  <span className="text-3xl">🔍</span>
                  <p className="text-sm text-center" style={{ color: 'var(--text3)' }}>
                    {canSearch ? 'No GIFs found yet.' : 'Start typing to search GIFs.'}
                  </p>
                </div>
              )}

              {loading && (
                <div className="col-span-3 py-12 flex justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="text-3xl"
                  >
                    ⏳
                  </motion.div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
