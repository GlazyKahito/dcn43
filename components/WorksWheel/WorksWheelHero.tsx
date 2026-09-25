'use client';

import React from 'react';
import { WorksWheel } from './WorksWheel';
import { PORTFOLIO_PROJECTS } from './projectData';

export function WorksWheelHero() {
  return (
    <div className="relative w-full overflow-hidden bg-transparent">
      {/* Works Wheel Component */}
      <WorksWheel
        items={PORTFOLIO_PROJECTS}
        label="WORKS"
        sublabel="'26"
        action="Explore"
      />

      {/* Anchor for smooth scroll down from the wheel */}
      <div id="explore-anchor" className="relative -top-16" />
    </div>
  );
}

export * from './types';
export * from './projectData';
export { WorksWheel } from './WorksWheel';
