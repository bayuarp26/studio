
"use client";

import { useRef, useEffect, type RefObject } from 'react';

interface DynamicCardEffectOptions {
  maxRotation?: number;
  scaleAmount?: number;
  perspective?: string;
  transitionDurationEnter?: string;
  transitionDurationLeave?: string;
  defaultBoxShadow?: string;
}

const defaultOptions: Required<DynamicCardEffectOptions> = {
  maxRotation: 8,
  scaleAmount: 1.04, // Slightly reduced from 1.05
  perspective: '1000px',
  transitionDurationEnter: '0.05s',
  transitionDurationLeave: '0.4s', // Slightly increased for smoother leave
  defaultBoxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)', // Tailwind shadow-lg
};

export function useDynamicCardEffect<T extends HTMLElement>(
  options?: DynamicCardEffectOptions
): RefObject<T> {
  const cardRef = useRef<T>(null);
  const {
    maxRotation,
    scaleAmount,
    perspective,
    transitionDurationEnter,
    transitionDurationLeave,
    defaultBoxShadow,
  } = { ...defaultOptions, ...options };

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    // Set initial transition and transform style
    card.style.transition = `transform ${transitionDurationLeave} ease-out, box-shadow ${transitionDurationLeave} ease-out`;
    card.style.transformStyle = 'preserve-3d';
    card.style.boxShadow = defaultBoxShadow; // Apply default shadow initially


    const handleMouseMove = (e: MouseEvent) => {
      if (!cardRef.current) return; // Ensure card is still mounted
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const { width, height } = rect;
      const mouseX = x - width / 2;
      const mouseY = y - height / 2;

      const rotateY = (mouseX / (width / 2)) * maxRotation;
      const rotateX = -(mouseY / (height / 2)) * maxRotation;

      const shadowX = Math.min(Math.max(rotateY * 0.7, -8), 8);
      const shadowY = Math.min(Math.max(-rotateX * 0.7, -8), 8);
      const shadowBlur = Math.abs(rotateX) + Math.abs(rotateY) + 15; // Increased blur
      const shadowSpread = 2;

      cardRef.current.style.transition = `transform ${transitionDurationEnter} linear, box-shadow ${transitionDurationEnter} linear`;
      cardRef.current.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scaleAmount}) translateZ(25px)`; // Increased translateZ
      cardRef.current.style.boxShadow = `${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowSpread}px rgba(0,0,0,0.25)`; // Slightly darker shadow
    };

    const handleMouseLeave = () => {
      if (!cardRef.current) return;
      cardRef.current.style.transition = `transform ${transitionDurationLeave} ease-out, box-shadow ${transitionDurationLeave} ease-out`;
      cardRef.current.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1) translateZ(0px)';
      cardRef.current.style.boxShadow = defaultBoxShadow;
    };

    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseleave', handleMouseLeave);
      // Reset styles if component unmounts while hovered
      card.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1) translateZ(0px)';
      card.style.boxShadow = defaultBoxShadow;
    };
  }, [maxRotation, scaleAmount, perspective, transitionDurationEnter, transitionDurationLeave, defaultBoxShadow]);

  return cardRef;
}
