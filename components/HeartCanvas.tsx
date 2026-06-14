'use client';

import React, { useEffect, useRef } from 'react';

interface Heart {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  wiggleSpeed: number;
  wiggleWidth: number;
  angle: number;
}

export default function HeartCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let hearts: Heart[] = [];
    const maxHearts = 35;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const resizeCanvas = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Helper to draw a heart path
    const drawHeart = (c: CanvasRenderingContext2D, x: number, y: number, size: number, opacity: number) => {
      c.save();
      c.beginPath();
      // Translate to heart center for scaling
      c.translate(x, y);
      
      // Draw bezier heart
      c.moveTo(0, -size / 4);
      c.bezierCurveTo(size / 2, -size * 0.8, size * 1.2, -size / 3, 0, size);
      c.bezierCurveTo(-size * 1.2, -size / 3, -size / 2, -size * 0.8, 0, -size / 4);
      
      c.closePath();
      // Soft coquette pastel pink/rose
      c.fillStyle = `rgba(233, 30, 140, ${opacity})`;
      c.fill();
      c.restore();
    };

    // Initialize hearts
    const initHearts = () => {
      hearts = [];
      for (let i = 0; i < maxHearts; i++) {
        hearts.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 12 + 8,
          speed: Math.random() * 0.4 + 0.15,
          opacity: Math.random() * 0.08 + 0.04, // micro-opacity: 0.04 to 0.12
          wiggleSpeed: Math.random() * 0.02 + 0.005,
          wiggleWidth: Math.random() * 15 + 5,
          angle: Math.random() * Math.PI * 2,
        });
      }
    };

    initHearts();

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < hearts.length; i++) {
        const h = hearts[i];
        
        if (!prefersReducedMotion) {
          h.y -= h.speed;
          h.angle += h.wiggleSpeed;
          const xOffset = Math.sin(h.angle) * h.wiggleWidth * 0.05;
          h.x += xOffset;

          // Recycle heart when it goes off screen
          if (h.y < -h.size) {
            h.y = canvas.height + h.size;
            h.x = Math.random() * canvas.width;
            h.speed = Math.random() * 0.4 + 0.15;
            h.opacity = Math.random() * 0.08 + 0.04;
          }
        }

        drawHeart(ctx, h.x, h.y, h.size, h.opacity);
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-[1]"
      style={{ mixBlendMode: 'multiply' }}
    />
  );
}
