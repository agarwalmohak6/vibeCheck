'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

const GIPHY_API_KEY = process.env.NEXT_PUBLIC_GIPHY_API_KEY || '';

interface GiphyResult {
  id: string;
  images: { fixed_height: { url: string }; original: { url: string } };
  title: string;
}

interface GiphyModalProps {
  onSelect: (url: string) => void;
  onClose: () => void;
}

export default function GiphyModal({ onSelect, onClose }: GiphyModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GiphyResult[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      if (GIPHY_API_KEY) {
        const res = await fetch(
          `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=12&rating=pg-13`
        );
        const data = await res.json();
        setResults(data.data || []);
      } else {
        // Mock results when no API key
        setResults([
          {
            id: 'mock1',
            title: 'Love GIF',
            images: {
              fixed_height: { url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/200.gif' },
              original: { url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif' },
            },
          },
          {
            id: 'mock2',
            title: 'Hearts GIF',
            images: {
              fixed_height: { url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/200.gif' },
              original: { url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif' },
            },
          },
          {
            id: 'mock3',
            title: 'Kawaii',
            images: {
              fixed_height: { url: 'https://media.giphy.com/media/26FPJGjhefSJuaRhu/200.gif' },
              original: { url: 'https://media.giphy.com/media/26FPJGjhefSJuaRhu/giphy.gif' },
            },
          },
        ]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

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
              <h3 className="text-lg font-bold" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
                🎬 Pick a GIF
              </h3>
              <button onClick={onClose} className="text-2xl" style={{ color: 'var(--text3)' }}>✕</button>
            </div>

            {/* Search */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && search()}
                placeholder="Search GIFs..."
                className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                }}
              />
              <motion.button
                onClick={search}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2.5 rounded-xl font-bold text-white text-sm theme-btn"
              >
                {loading ? '⏳' : '🔍'}
              </motion.button>
            </div>

            {!GIPHY_API_KEY && (
              <p className="text-xs mb-3 px-2" style={{ color: 'var(--text3)' }}>
                ℹ️ Add NEXT_PUBLIC_GIPHY_API_KEY in .env.local for live search
              </p>
            )}

            {/* Results grid */}
            <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
              {results.map((gif) => (
                <motion.button
                  key={gif.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { onSelect(gif.images.original.url); onClose(); }}
                  className="relative rounded-xl overflow-hidden aspect-square"
                  style={{ border: '2px solid var(--border)' }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={gif.images.fixed_height.url}
                    alt={gif.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </motion.button>
              ))}

              {results.length === 0 && !loading && (
                <div className="col-span-3 py-12 flex flex-col items-center gap-2">
                  <span className="text-3xl">🔍</span>
                  <p className="text-sm" style={{ color: 'var(--text3)' }}>Search for a GIF above</p>
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
