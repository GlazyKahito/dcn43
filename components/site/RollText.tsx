import React from 'react';

interface RollTextProps {
  text: string;
  className?: string;
}

export function RollText({ text, className = '' }: RollTextProps) {
  return (
    <span className={`inline-block transition-colors duration-150 ${className}`}>
      {text}
    </span>
  );
}

