export type SectionId = 'theory' | 'simulator' | 'minigame' | 'assessments' | 'conclusion';

export type GlyphId =
  | 'scope'
  | 'reticle'
  | 'stack'
  | 'topology'
  | 'probe'
  | 'checklist'
  | 'fault'
  | 'ten'
  | 'synthesis'
  | 'power';

export type ModuleId = SectionId;

export interface LabModule {
  id: ModuleId;
  no: string;
  title: string;
  section: SectionId;
  /** Short role on the learning path. */
  role: string;
  /** What the student does here, one line. */
  line: string;
  glyph: GlyphId;
  /** Interactive tools stay open at any point on the path. */
  tool: boolean;
}

/** The five laboratory modules in recommended learning order. */
export const MODULES: LabModule[] = [
  { id: 'theory', no: '01', title: 'Theory', section: 'theory', glyph: 'stack', tool: false, role: 'Aim and principles', line: 'The objective, then five cards: models, addressing, services, routing, method.' },
  { id: 'simulator', no: '02', title: 'Simulation', section: 'simulator', glyph: 'topology', tool: true, role: 'Break it, trace it, fix it', line: 'Live network, fault injection, terminal and ticketed troubleshooting scenarios.' },
  { id: 'minigame', no: '03', title: 'Mini-Game', section: 'minigame', glyph: 'fault', tool: true, role: 'Apply under pressure', line: 'Network Incident: walk the lab, find the fault, restore the network.' },
  { id: 'assessments', no: '04', title: 'Test', section: 'assessments', glyph: 'checklist', tool: true, role: 'Check understanding', line: 'Concept, scenario and diagnostic questions, scored with feedback.' },
  { id: 'conclusion', no: '05', title: 'Conclusion', section: 'conclusion', glyph: 'synthesis', tool: false, role: 'Findings', line: 'What the experiment showed, and the Experiment 8 summary.' },
];

export const moduleById = (id: ModuleId) => MODULES.find((m) => m.id === id)!;

/** Persistent navigation. */
export const NAV: { label: string; target: ModuleId | 'index' }[] = [
  { label: 'Index', target: 'index' },
  { label: 'Theory', target: 'theory' },
  { label: 'Simulation', target: 'simulator' },
  { label: 'Mini-Game', target: 'minigame' },
  { label: 'Test', target: 'assessments' },
  { label: 'Conclusion', target: 'conclusion' },
];
