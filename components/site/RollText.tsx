import React from 'react';

interface RollTextProps {
  text: string;
  className?: string;
}

export function RollText({ text, className = '' }: RollTextProps) {
  const characters = text.split('');

  return (
    <span className={`motion_roll inline-block ${className}`}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="inline-flex">
        {characters.map((char, i) => (
          <span
            key={i}
            className="motion_rollChar inline-block"
            style={{ ['--i' as any]: i }}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
      </span>
    </span>
  );
}
