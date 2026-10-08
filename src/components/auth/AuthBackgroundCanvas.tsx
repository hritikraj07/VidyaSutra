'use client';

import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseRadius: number;
  radius: number;
  opacity: number;
  isAccent?: boolean; // Saffron accent (used sparingly)
  symbol?: string; // Academic symbol if applicable
  symbolSize?: number;
  rotation?: number;
  vRot?: number;
}

const ACADEMIC_SYMBOLS = ['∑', '∫', 'π', '∆', 'λ', '∞', '√', '≈', '∇', '∩'];

export const AuthBackgroundCanvas: React.FC<{
  onMouseMoveOffset?: (offsetX: number, offsetY: number) => void;
}> = ({ onMouseMoveOffset }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let lastTime = performance.now();

    // Check prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let prefersReducedMotion = mediaQuery.matches;

    const handleMotionChange = (e: MediaQueryListEvent) => {
      prefersReducedMotion = e.matches;
      if (prefersReducedMotion) {
        cancelAnimationFrame(animationFrameId);
        renderStaticBackground();
      } else {
        lastTime = performance.now();
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMotionChange);
    } else {
      mediaQuery.addListener(handleMotionChange);
    }

    // Cursor tracking with lerp for silky smooth 60fps response
    let targetMouseX = window.innerWidth / 2;
    let targetMouseY = window.innerHeight / 2;
    let currentMouseX = targetMouseX;
    let currentMouseY = targetMouseY;
    let hasMouseMoved = false;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
      hasMouseMoved = true;

      if (onMouseMoveOffset) {
        // Normalized offset (-1 to +1) for calm card parallax
        const normX = (e.clientX - width / 2) / (width / 2);
        const normY = (e.clientY - height / 2) / (height / 2);
        onMouseMoveOffset(normX, normY);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    let particles: Particle[] = [];

    const initParticles = () => {
      const isMobile = width < 768;
      const count = isMobile ? 18 : 38;
      particles = [];

      for (let i = 0; i < count; i++) {
        // ~8% chance of subtle saffron accent (adhering strictly to 5-10% constraint)
        const isAccent = i % 14 === 0;
        // ~25% chance of being an academic symbol
        const hasSymbol = !isAccent && i % 4 === 0;
        const symbol = hasSymbol
          ? ACADEMIC_SYMBOLS[Math.floor(Math.random() * ACADEMIC_SYMBOLS.length)]
          : undefined;

        const baseRadius = hasSymbol ? 0 : isAccent ? 2.6 : Math.random() * 1.8 + 1.2;
        const opacity = hasSymbol
          ? Math.random() * 0.12 + 0.12
          : isAccent
          ? 0.38
          : Math.random() * 0.22 + 0.14;

        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.28,
          vy: (Math.random() - 0.5) * 0.28,
          baseRadius,
          radius: baseRadius,
          opacity,
          isAccent,
          symbol,
          symbolSize: hasSymbol ? Math.floor(Math.random() * 6 + 13) : undefined,
          rotation: hasSymbol ? Math.random() * Math.PI : undefined,
          vRot: hasSymbol ? (Math.random() - 0.5) * 0.003 : undefined,
        });
      }
    };

    let cachedBgGrad: CanvasGradient | null = null;
    let cachedCardGlow: CanvasGradient | null = null;

    const updateCachedGradients = () => {
      // 1. Base atmospheric gradient
      cachedBgGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.4,
        60,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.9
      );
      cachedBgGrad.addColorStop(0, '#1E3264');
      cachedBgGrad.addColorStop(0.45, '#131F46');
      cachedBgGrad.addColorStop(1, '#090E1F');

      // 2. Center ambient card glow
      cachedCardGlow = ctx.createRadialGradient(
        width * 0.5,
        height * 0.5,
        0,
        width * 0.5,
        height * 0.5,
        320
      );
      cachedCardGlow.addColorStop(0, 'rgba(36, 59, 122, 0.22)');
      cachedCardGlow.addColorStop(0.4, 'rgba(231, 162, 59, 0.03)');
      cachedCardGlow.addColorStop(1, 'rgba(11, 18, 41, 0)');
    };

    const resize = () => {
      if (!canvas) return;
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);
      updateCachedGradients();
      initParticles();

      if (prefersReducedMotion) {
        renderStaticBackground();
      }
    };

    window.addEventListener('resize', resize, { passive: true });
    resize();

    // Render static frame when reduced motion is requested
    const renderStaticBackground = () => {
      if (cachedBgGrad) {
        ctx.fillStyle = cachedBgGrad;
        ctx.fillRect(0, 0, width, height);
      }
      if (cachedCardGlow) {
        ctx.fillStyle = cachedCardGlow;
        ctx.fillRect(0, 0, width, height);
      }
    };

    lastTime = performance.now();

    const animate = (currentTime: number) => {
      if (document.hidden) {
        animationFrameId = requestAnimationFrame(animate);
        return;
      }

      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      // Smooth cursor lerp (smoothly glide toward mouse)
      if (hasMouseMoved) {
        currentMouseX += (targetMouseX - currentMouseX) * 0.055;
        currentMouseY += (targetMouseY - currentMouseY) * 0.055;
      }

      // LAYER 1: ATMOSPHERIC DEEP NAVY / INDIGO BASE (using cached gradient)
      if (cachedBgGrad) {
        ctx.fillStyle = cachedBgGrad;
        ctx.fillRect(0, 0, width, height);
      }

      // Subtle ambient light following cursor
      if (hasMouseMoved) {
        const cursorGlow = ctx.createRadialGradient(
          currentMouseX,
          currentMouseY,
          0,
          currentMouseX,
          currentMouseY,
          340
        );
        cursorGlow.addColorStop(0, 'rgba(36, 59, 122, 0.16)');
        cursorGlow.addColorStop(0.2, 'rgba(231, 162, 59, 0.03)');
        cursorGlow.addColorStop(0.65, 'rgba(23, 37, 84, 0.07)');
        cursorGlow.addColorStop(1, 'rgba(15, 23, 42, 0)');
        ctx.fillStyle = cursorGlow;
        ctx.fillRect(0, 0, width, height);
      }

      // Central ambient glow behind login card position (using cached gradient)
      if (cachedCardGlow) {
        ctx.fillStyle = cachedCardGlow;
        ctx.fillRect(0, 0, width, height);
      }

      // LAYER 2 & 3: MIDGROUND & FOREGROUND PARTICLES
      const maxConnDist = width < 768 ? 75 : 105;
      const maxConnDistSq = maxConnDist * maxConnDist;

      // 1. Draw thin, elegant network lines
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        if (p1.symbol) continue; // symbols don't connect

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          if (p2.symbol) continue;

          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < maxConnDistSq) {
            const dist = Math.sqrt(distSq);
            const alpha = (1 - dist / maxConnDist) * 0.14;
            ctx.beginPath();
            ctx.strokeStyle = p1.isAccent || p2.isAccent
              ? `rgba(231, 162, 59, ${alpha * 0.9})` // Saffron accent connection
              : `rgba(160, 180, 222, ${alpha})`; // Soft Indigo connection
            ctx.lineWidth = 0.85;
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      // 2. Update and draw nodes & academic symbols
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Motion update
        p.x += p.vx * dt * 60;
        p.y += p.vy * dt * 60;

        if (p.rotation !== undefined && p.vRot !== undefined) {
          p.rotation += p.vRot * dt * 60;
        }

        // Boundary wrapping
        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;
        if (p.y < -20) p.y = height + 20;
        if (p.y > height + 20) p.y = -20;

        // Subtle cursor repulsion (part of atmospheric response)
        if (hasMouseMoved) {
          const cdx = p.x - currentMouseX;
          const cdy = p.y - currentMouseY;
          const cdist = Math.sqrt(cdx * cdx + cdy * cdy);
          const repulseRadius = 140;

          if (cdist < repulseRadius && cdist > 0) {
            const force = (1 - cdist / repulseRadius) * 0.8;
            p.x += (cdx / cdist) * force;
            p.y += (cdy / cdist) * force;
          }
        }

        // Render particle or symbol
        if (p.symbol) {
          ctx.save();
          ctx.translate(p.x, p.y);
          if (p.rotation) ctx.rotate(p.rotation);
          ctx.font = `500 ${p.symbolSize}px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif`;
          ctx.fillStyle = `rgba(190, 206, 240, ${p.opacity})`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(p.symbol, 0, 0);
          ctx.restore();
        } else {
          // Circular particle node
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          if (p.isAccent) {
            // Saffron highlight
            ctx.fillStyle = `rgba(231, 162, 59, ${p.opacity})`;
            ctx.shadowColor = 'rgba(231, 162, 59, 0.45)';
            ctx.shadowBlur = 4;
            ctx.fill();
            ctx.shadowBlur = 0; // reset
          } else {
            // Indigo / Ice node
            ctx.fillStyle = `rgba(180, 202, 240, ${p.opacity})`;
            ctx.fill();
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    if (!prefersReducedMotion) {
      renderStaticBackground();
      animationFrameId = requestAnimationFrame(() => {
        animationFrameId = requestAnimationFrame(animate);
      });
    } else {
      renderStaticBackground();
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(animationFrameId);
      } else if (!prefersReducedMotion) {
        lastTime = performance.now();
        animationFrameId = requestAnimationFrame(animate);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelAnimationFrame(animationFrameId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMotionChange);
      } else {
        mediaQuery.removeListener(handleMotionChange);
      }
    };
  }, [onMouseMoveOffset]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
        display: 'block',
      }}
      aria-hidden="true"
    />
  );
};
