export type SectionId =
  | 'troubleshooting'
  | 'aim'
  | 'theory'
  | 'simulator'
  | 'diagnostics'
  | 'assessments'
  | 'minigame'
  | 'experiment'
  | 'conclusion';

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

export type ModuleId =
  | 'troubleshooting'
  | 'aim'
  | 'theory'
  | 'simulator'
  | 'diagnostics'
  | 'assessments'
  | 'minigame'
  | 'experiment'
  | 'conclusion'
  | 'launch';

export interface LabModule {
  id: ModuleId;
  no: string;
  title: string;
  section: SectionId;
  /** Short role on the learning path, shown on the patch panel. */
  role: string;
  /** What the student does here, one line. */
  line: string;
  glyph: GlyphId;
  /** Interactive tools stay open at any point on the path. */
  tool: boolean;
}

/** The ten laboratory modules in recommended learning order. */
export const MODULES: LabModule[] = [
  { id: 'troubleshooting', no: '01', title: 'Network Troubleshooting', section: 'troubleshooting', glyph: 'scope', tool: false, role: 'Foundation', line: 'Learn the problem: the fault–diagnose–repair–verify loop.' },
  { id: 'aim', no: '02', title: 'Aim', section: 'aim', glyph: 'reticle', tool: false, role: 'Laboratory objective', line: 'Understand the objective and the learning outcomes.' },
  { id: 'theory', no: '03', title: 'Theory', section: 'theory', glyph: 'stack', tool: false, role: 'Network principles', line: 'OSI, addressing, ARP, DNS, DHCP, routing, ICMP, firewalls.' },
  { id: 'simulator', no: '04', title: 'Simulator', section: 'simulator', glyph: 'topology', tool: true, role: 'Build and inspect', line: 'Send packets, cut links, inject faults, run the terminal.' },
  { id: 'diagnostics', no: '05', title: 'Diagnostics', section: 'diagnostics', glyph: 'probe', tool: true, role: 'Find the fault', line: 'Work ticketed scenarios from symptom to verified repair.' },
  { id: 'assessments', no: '06', title: 'Assessments', section: 'assessments', glyph: 'checklist', tool: true, role: 'Test understanding', line: 'Concept, scenario and diagnostic questions, scored.' },
  { id: 'minigame', no: '07', title: 'Mini-Game', section: 'minigame', glyph: 'fault', tool: true, role: 'Apply under pressure', line: 'Network Incident: walk the lab, find the fault, restore the network.' },
  { id: 'experiment', no: '08', title: 'Experiment 10', section: 'experiment', glyph: 'ten', tool: false, role: 'Review the experiment', line: 'Objective, scope, tools, modules and outcomes.' },
  { id: 'conclusion', no: '09', title: 'Conclusion', section: 'conclusion', glyph: 'synthesis', tool: false, role: 'Review findings', line: 'Laboratory findings and synthesis.' },
  { id: 'launch', no: '10', title: 'Launch Lab', section: 'simulator', glyph: 'power', tool: true, role: 'Full environment', line: 'Enter the complete interactive network environment.' },
];

export const moduleById = (id: ModuleId) => MODULES.find((m) => m.id === id)!;

/** Persistent navigation, in the order specified for the site header. */
export const NAV: { label: string; target: ModuleId | 'index' }[] = [
  { label: 'Index', target: 'index' },
  { label: 'Aim', target: 'aim' },
  { label: 'Theory', target: 'theory' },
  { label: 'Simulator', target: 'simulator' },
  { label: 'Diagnostics', target: 'diagnostics' },
  { label: 'Assessments', target: 'assessments' },
  { label: 'Mini-Game', target: 'minigame' },
  { label: 'Conclusion', target: 'conclusion' },
];
