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

export interface LabModule {
  id: string;
  no: string;
  title: string;
  section: SectionId;
  line: string;
  glyph: GlyphId;
}

/** The ten launcher positions on the Works Wheel, in dial order. */
export const MODULES: LabModule[] = [
  { id: 'troubleshooting', no: '01', title: 'Network Troubleshooting', section: 'troubleshooting', glyph: 'scope', line: 'The lab loop: break the network, trace the fault, repair it, prove it works.' },
  { id: 'aim', no: '02', title: 'Aim', section: 'aim', glyph: 'reticle', line: 'Laboratory objective, methodology and learning outcomes.' },
  { id: 'theory', no: '03', title: 'Theory', section: 'theory', glyph: 'stack', line: 'OSI, addressing, ARP, DNS, DHCP, routing, ICMP and firewalls.' },
  { id: 'simulator', no: '04', title: 'Simulator', section: 'simulator', glyph: 'topology', line: 'Five-node topology with live packets, fault injection and a terminal.' },
  { id: 'diagnostics', no: '05', title: 'Diagnostics', section: 'diagnostics', glyph: 'probe', line: 'Ten ticketed scenarios worked from symptom to verified recovery.' },
  { id: 'assessments', no: '06', title: 'Assessments', section: 'assessments', glyph: 'checklist', line: 'Concept, scenario and diagnostic questions with scored feedback.' },
  { id: 'minigame', no: '07', title: 'Mini-Game', section: 'minigame', glyph: 'fault', line: 'Network Fault Repair: observe, diagnose, repair and verify against the clock.' },
  { id: 'experiment', no: '08', title: 'Experiment 10', section: 'experiment', glyph: 'ten', line: 'Objective, scope, tools, modules and outcomes of the experiment.' },
  { id: 'conclusion', no: '09', title: 'Conclusion', section: 'conclusion', glyph: 'synthesis', line: 'Laboratory findings and synthesis.' },
  { id: 'launch', no: '10', title: 'Launch Lab', section: 'simulator', glyph: 'power', line: 'Enter the interactive network environment directly.' },
];

/** Persistent navigation, in the order specified for the site header. */
export const NAV: { label: string; target: SectionId | 'works' }[] = [
  { label: 'Works', target: 'works' },
  { label: 'Aim', target: 'aim' },
  { label: 'Theory', target: 'theory' },
  { label: 'Simulator', target: 'simulator' },
  { label: 'Diagnostics', target: 'diagnostics' },
  { label: 'Assessments', target: 'assessments' },
  { label: 'Mini-Game', target: 'minigame' },
  { label: 'Conclusion', target: 'conclusion' },
];
