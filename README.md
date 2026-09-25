# Network Troubleshooting & Simulator — Virtual Lab (VLab)
### K J Somaiya School of Engineering &bull; Department of Computer Engineering

A high-fidelity Virtual Lab experiment platform on **"Network Troubleshooting & Simulator"** matching the layout, tone, and design language of [IPv6 Transition Virtual Lab](https://ipv6-transition.vercel.app/).

---

## 🚀 Key Features

1. **Animated Hero ("The network is down. Now what?")**:
   - Loading sequence ("Bringing up interfaces...").
   - Live topology animation with packet flow and link degradation drop.
   - Dual-beat conceptual introduction (OSI Layered Methodology & Diagnostic Toolbox).
2. **Aim Section**:
   - Official experiment objective with glowing highlight container.
3. **Comprehensive Theory (Modules 01 - 03)**:
   - **Module 01: The Layered Approach (OSI-based diagnosis)**: Physical through Application stack, rules, symptoms, television plug analogy, advantages & disadvantages.
   - **Module 02: The Diagnostic Toolbox**: Deep reference on `ping`, `tracert`, `ipconfig`, `nslookup`, `arp -a`, `netstat -an`, and `telnet` (healthy outputs, failure signatures, and deductions).
   - **Module 03: Common Faults & Signatures**: Full fault table (unplugged cable, wrong IP/mask, bad gateway, APIPA, duplicate IP, DNS server down, missing return route, firewall port block, service not listening, MTU).
   - **Quick Reference Table**: Symptom &rarr; Likely Layer &rarr; First Command to run.
   - **Implementation Block**:
     - Tabbed source code viewer for a network reachability socket probe in **C** (what students submit in lab), **C++**, **Python**, and **Java**.
     - Python script parsing `ping` command stdout for packet loss % and average RTT.
     - 40-line formatted Troubleshooting Decision Procedure Pseudocode with line numbers.
4. **Pre-Test Assessment**:
   - 10 foundational MCQs in an interactive modal (one question at a time) with immediate progress tracking, scoring, explanations per question, and confetti celebration.
5. **Interactive Lab — Three Integrated Simulations**:
   - **Simulation 01 — Virtual Terminal**:
     - Blinking cursor, command history (up/down arrows), tab completion, `clear`, and `help`.
     - Device selector: run commands from `PC1`, `PC2`, `R1`, or `WEB`.
     - Real-time packet flow and animated path lighting on the side topology map (`ping` highlights endpoints, `tracert` steps through hops one by one).
     - Built-in cheat sheet drawer.
   - **Simulation 02 — Fault Injection Lab (Core Exercise)**:
     - 8 pre-built realistic faults applied silently to the in-memory network model.
     - Student sees only real-world user complaints, never the cause.
     - Diagnose panel: select faulty layer, faulty device, and cause; grades answers, reveals which commands were diagnostic, and shows the reasoning chain.
     - Fix mode: edit device configs or re-plug links, then click **Verify** to re-evaluate the model.
     - Live scorecard tracking solved scenarios, commands used, and time elapsed.
   - **Simulation 03 — OSI Layer Walkthrough**:
     - Vertical stack of layers tested bottom-up (L1 &rarr; L2 &rarr; L3 &rarr; L4 &rarr; L7).
     - Step, auto-play with speed slider (0.5x, 1.0x, 2.0x), and reset.
     - Halts at the first failure and displays a root-cause verdict card with recommended fix.
   - **Unified Diagnostic Console**:
     - Streams all actions, faults, and checks across all three simulations.
6. **Post-Test Assessment**:
   - 10 advanced scenario-based MCQs (traceroute hop drops, ipconfig anomalies, asymmetric routing, firewall triage).
7. **Conclusion**:
   - Synthesis paragraph and "Experiment Complete" outcome badge.

---

## 🛠️ Tech Stack

- **Framework**: Next.js (App Router) + TypeScript
- **Styling**: Tailwind CSS (Dark aesthetic with Apple-inspired palette: `#000000`, `#161617`, `#2997ff`, `#ff9f0a`, `#30d158`, `#ff453a`)
- **Animations**: Framer Motion
- **Icons**: Lucide React & Google Material Symbols Outlined
- **Unit Testing**: Vitest
- **Celebration Effects**: Canvas Confetti
- **Zero Backend**: All simulation logic executes client-side via pure TypeScript state machines.

---

## 💻 Running Locally

1. Clone or download the repository:
   \`\`\`bash
   cd shrenigger
   \`\`\`
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
3. Run the development server:
   \`\`\`bash
   npm run dev
   \`\`\`
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Running Tests

Run the Vitest test suite asserting the default healthy baseline and all 8 fault scenarios:
\`\`\`bash
npm test
\`\`\`

---

## ☁️ Deploying to Vercel (Zero Config)

This project is built with standard Next.js App Router and deploys to [Vercel](https://vercel.com) with **zero configuration**:

1. Push your repository to GitHub / GitLab / Bitbucket.
2. In the Vercel Dashboard, click **"Add New Project"** and select your repository.
3. Framework Preset will auto-detect as **Next.js**.
4. Click **"Deploy"**. No environment variables or custom build commands are needed.

---

## ⚙️ Customization Guide

Where to configure the platform for your institution or syllabus:

| Item | File Location | Description |
| :--- | :--- | :--- |
| **Experiment Number & Metadata** | `/lib/config.ts` | Change `experimentNumber`, `experimentTitle`, `institution`, or `aim`. |
| **Somaiya Logo** | `/public/somaiya-logo.png` | **NOTE:** Replace this placeholder file with your official high-resolution Somaiya logo PNG. |
| **Network Topology & Devices** | `/lib/net/topology.ts` | Edit device IP addresses, MACs, subnets, gateways, and links in `createDefaultTopology()`. |
| **Simulation Engine Rules** | `/lib/net/engine.ts` | Modify reachability evaluation, hop calculations, or routing table lookups. |
| **Fault Scenarios** | `/lib/net/faults.ts` | Add, remove, or modify any of the 8 pre-built fault scenarios, their complaints, and fixes. |
| **Pre-Test & Post-Test Questions** | `/data/quiz.ts` | Add or edit the 10 Pre-Test and 10 Post-Test MCQs, code snippets, and explanations. |
| **Command Handlers** | `/lib/net/commands/*.ts` | Add new commands or change output formatting for `ping`, `tracert`, `ipconfig`, etc. |

---

## 📝 Academic Attribution

Developed for **K J Somaiya School of Engineering**, Somaiya Vidyavihar University, Mumbai.  
Designed for computer engineering students learning systematic network triage, OSI stack diagnosis, and Internet protocols.
