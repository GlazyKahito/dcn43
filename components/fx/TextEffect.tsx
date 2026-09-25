'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Fragment } from 'react';

/**
 * Word-by-word blur-in, after motion-primitives' TextEffect (MIT) as listed on 21st.dev.
 * `lines` keeps authored line breaks; each word rises and sharpens in sequence.
 */
export function TextEffect({ lines, play, delay = 0, stagger = 0.07, lineClass = [] }: { lines: string[]; play: boolean; delay?: number; stagger?: number; lineClass?: string[] }) {
  const reduced = useReducedMotion();
  let n = 0;
  return (
    <>
      {lines.map((line, li) => (
        <Fragment key={li}>
          <span className={lineClass[li] ?? ''}>
            {line.split(' ').map((w, wi) => {
              const i = n++;
              return (
                <Fragment key={wi}>
                  <motion.span
                    className="inline-block"
                    initial={reduced ? false : { opacity: 0, y: '0.35em', filter: 'blur(8px)' }}
                    animate={play || reduced ? { opacity: 1, y: 0, filter: 'blur(0px)' } : undefined}
                    transition={{ duration: 0.7, delay: delay + i * stagger, ease: [0.2, 0.7, 0.2, 1] }}
                  >
                    {w}
                  </motion.span>
                  {wi < line.split(' ').length - 1 && ' '}
                </Fragment>
              );
            })}
          </span>
          {li < lines.length - 1 && <br />}
        </Fragment>
      ))}
    </>
  );
}
