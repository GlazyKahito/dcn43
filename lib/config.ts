/**
 * Central configuration for the Virtual Lab experiment.
 * Experiment number, institution, and metadata are configured here.
 */
export const LAB_CONFIG = {
  experimentNumber: "10",
  courseCode: "ET301",
  courseName: "Computer Networks & Diagnostics",
  experimentTitle: "Network Troubleshooting & Simulator",
  shortTitle: "Network Troubleshooting",
  institution: "K J Somaiya School of Engineering",
  institutionShort: "KJSSE",
  department: "Department of Computer Engineering",
  author: "VLab Development Team",
  year: "2026",
  aim: "To understand systematic network troubleshooting methodology, use standard diagnostic utilities (ping, traceroute, ipconfig, nslookup, arp, netstat), and diagnose and resolve common network faults in a simulated topology.",
} as const;
