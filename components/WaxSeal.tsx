"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

interface WaxSealProps {
  onOpen: () => void;
}

export default function WaxSeal({ onOpen }: WaxSealProps) {
  const [clicked, setClicked] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (clicked) return;
    setClicked(true);

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    // Real fire flames using confetti!
    // We run a continuous loop for ~2.5 seconds.
    const duration = 2500;
    const end = Date.now() + duration;

    const fireLoop = () => {
      confetti({
        particleCount: 15,
        spread: 360,
        origin: { x, y },
        // Fire colors: bright yellow, orange, red, and dark ash
        colors: [
          "#ff0000",
          "#ff4500",
          "#ff8c00",
          "#ffd700",
          "#ffffff",
          "#111111",
        ],
        startVelocity: 15 + Math.random() * 20,
        // Negative gravity makes particles fly UPWARDS like real fire flames
        gravity: -0.6,
        scalar: 0.6 + Math.random() * 0.6,
        ticks: 80,
        zIndex: 9999,
        disableForReducedMotion: true,
      });

      if (Date.now() < end) {
        requestAnimationFrame(fireLoop);
      }
    };
    fireLoop();

    // The burning takes 2.5 seconds proceeding slowly
    setTimeout(() => {
      onOpen();
    }, 2500);
  };

  return (
    <button
      type="button"
      aria-label="Open wax seal"
      disabled={clicked}
      className="relative w-24 h-24 flex items-center justify-center cursor-pointer select-none z-10 border-0 bg-transparent p-0 disabled:cursor-wait"
      onClick={handleClick}
    >
      {/* Dynamic SVG Filter for high-end procedural tearing/melting */}
      {clicked && (
        <svg className="absolute w-0 h-0 pointer-events-none">
          <filter id="tear-effect">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.03"
              numOctaves="3"
              result="noise"
            >
              <animate
                attributeName="baseFrequency"
                values="0.03; 0.15"
                dur="2.5s"
                fill="freeze"
              />
            </feTurbulence>
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="0"
              xChannelSelector="R"
              yChannelSelector="G"
            >
              <animate
                attributeName="scale"
                values="0; 150"
                dur="2.5s"
                fill="freeze"
              />
            </feDisplacementMap>
          </filter>
        </svg>
      )}

      <AnimatePresence mode="wait">
        {!clicked ? (
          <motion.div
            key="seal-whole"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="absolute w-20 h-20 rounded-full bg-linear-to-br from-yellow-300 via-amber-500 to-amber-700 border-4 border-amber-600 shadow-2xl flex flex-col items-center justify-center transition-transform"
          >
            {/* Inner Ring */}
            <div className="absolute inset-1.5 rounded-full border border-amber-300/40 opacity-70"></div>

            {/* Monogram */}
            <span className="font-serif font-extrabold text-yellow-100 text-2xl tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] select-none">
              MC
            </span>
            <span className="text-[8px] uppercase tracking-widest text-amber-200 font-sans font-bold mt-0.5 drop-shadow">
              TAP SEAL
            </span>
          </motion.div>
        ) : (
          <motion.div
            key="seal-burn"
            initial={{
              scale: 1,
              filter: "url(#tear-effect) brightness(1) contrast(1)",
              opacity: 1,
            }}
            animate={{
              scale: 0.9,
              filter: "url(#tear-effect) brightness(3) contrast(2)",
              opacity: 0,
              y: -20,
            }}
            transition={{ duration: 2.5, ease: "easeIn" }}
            className="absolute w-20 h-20 rounded-full bg-linear-to-br from-red-600 via-orange-500 to-yellow-400 border-4 border-orange-600 flex flex-col items-center justify-center pointer-events-none"
            style={{
              boxShadow:
                "0 0 80px 20px rgba(255,80,0,0.9), inset 0 0 20px 10px rgba(255,200,0,0.8)",
            }}
          >
            <span className="font-serif font-extrabold text-orange-100 text-2xl tracking-tight select-none mix-blend-overlay">
              MC
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}
