"use client";

import { useEffect, useRef } from "react";

export function AnimatedBackground() {
  const symbolRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const symbol = symbolRef.current;
    if (!symbol) {
      return;
    }

    let lastScrollY = window.scrollY;
    let currentRotation = 0;
    let rafId = 0;

    const updateRotation = () => {
      symbol.style.transform = `translate(-50%, -50%) rotate(${currentRotation}deg)`;
      rafId = 0;
    };

    const handleScroll = () => {
      const nextScrollY = window.scrollY;
      const delta = nextScrollY - lastScrollY;

      if (delta === 0) {
        return;
      }

      // A low multiplier keeps the motion subtle while still responding to scroll direction.
      currentRotation += delta * 0.25;
      lastScrollY = nextScrollY;

      if (rafId === 0) {
        rafId = window.requestAnimationFrame(updateRotation);
      }
    };

    symbol.style.transform = "translate(-50%, -50%) rotate(0deg)";
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);

      if (rafId !== 0) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(211,47,47,0.12),transparent_42%),radial-gradient(circle_at_84%_78%,rgba(211,47,47,0.08),transparent_44%)]" />

      <div className="autocare-maintenance-glow" />

      <div ref={symbolRef} className="autocare-maintenance-symbol">
        <svg viewBox="0 0 120 120" fill="none" className="h-full w-full">
          <circle cx="60" cy="60" r="54" stroke="rgba(211,47,47,0.28)" strokeWidth="1.5" />
          <path
            d="M74 32a17 17 0 0 0-16.8 20.2L32 77.4a8 8 0 0 0 11.3 11.3L68.5 63.5A17 17 0 0 0 88 40.8l-10.4 10.4a5 5 0 0 1-7.1-7.1L81 33.6A16.9 16.9 0 0 0 74 32Z"
            stroke="rgba(211,47,47,0.85)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="38" cy="82" r="3.5" fill="rgba(255,255,255,0.55)" />
        </svg>
      </div>
    </div>
  );
}
