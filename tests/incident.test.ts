import { describe, expect, it } from 'vitest';
import { applyRepair, faultCount, renew, verificationFrom, type Repair, type World } from '../lib/game/actions';
import { createCase, INCIDENTS, scoreCase, type CauseId } from '../lib/game/incidents';
import { moveWithCollision, nearestStation, SPAWN, STATIONS } from '../lib/game/world';
import { createRng } from '../lib/sim/engine';
import { runCommand } from '../lib/sim/commands';
import { cloneNet, createBaseline } from '../lib/sim/topology';

const build = (id: CauseId): World => {
  const net = cloneNet(createBaseline());
  const meta = { adminDown: [] as World['meta']['adminDown'] };
  INCIDENTS.find((i) => i.id === id)!.apply(net, meta);
  return { net, meta };
};

/** The correct repair sequence for each incident, as a player would perform it. */
const FIX: Record<CauseId, (w: World) => World> = {
  'sw-r1-link': (w) => applyRepair(w, { kind: 'replace', link: 'SW1-R1' }),
  'r1-interface': (w) => applyRepair(w, { kind: 'enable-interface', link: 'R1-FW1' }),
  'wrong-ip': (w) => applyRepair(w, { kind: 'pc-static', pc: 'PC1', cfg: { ip: '192.168.1.10', mask: '255.255.255.0', gateway: '192.168.1.1', dns: '172.16.0.10' } }),
  'wrong-gateway': (w) => applyRepair(w, { kind: 'pc-static', pc: 'PC1', cfg: { ip: '192.168.1.10', mask: '255.255.255.0', gateway: '192.168.1.1', dns: '172.16.0.10' } }),
  dns: (w) => applyRepair(w, { kind: 'restart-dns' }),
  dhcp: (w) => renew(applyRepair(w, { kind: 'start-dhcp' }), 'PC1').world,
  firewall: (w) => applyRepair(w, { kind: 'fw-delete', rule: 5 }),
  loss: (w) => applyRepair(w, { kind: 'replace', link: 'SW1-R1' }),
  'dup-ip': (w) => applyRepair(w, { kind: 'pc-static', pc: 'PC2', cfg: { ip: '192.168.1.11', mask: '255.255.255.0', gateway: '192.168.1.1', dns: '172.16.0.10' } }),
  'server-link': (w) => applyRepair(w, { kind: 'reseat', link: 'FW1-SRV1' }),
};

const DECOYS: Repair[] = [{ kind: 'restart-router' }, { kind: 'restart-http' }];

describe('network incident scenarios', () => {
  for (const inc of INCIDENTS) {
    it(`${inc.id}: broken, not fixed by decoys, fixed by the right repair, then verifiable`, () => {
      const w = build(inc.id);
      expect(faultCount(w)).toBeGreaterThan(0);
      for (const d of DECOYS) expect(faultCount(applyRepair(w, d))).toBe(faultCount(w));

      // before the repair, the verification commands must not all pass
      const before = inc.verify.every((k) => verificationFrom(w.net, cmdFor(k)).includes(k));
      expect(before).toBe(false);

      const fixed = FIX[inc.id](w);
      expect(faultCount(fixed)).toBe(0);
      for (const k of inc.verify) expect(verificationFrom(fixed.net, cmdFor(k))).toContain(k);
    });
  }

  it('a shut interface is not fixed by reseating its cable, and a cut cable is not fixed by enabling the interface', () => {
    const shut = build('r1-interface');
    expect(faultCount(applyRepair(shut, { kind: 'reseat', link: 'R1-FW1' }))).toBeGreaterThan(0);
    const cut = build('sw-r1-link');
    expect(faultCount(applyRepair(cut, { kind: 'enable-interface', link: 'SW1-R1' }))).toBeGreaterThan(0);
  });

  it('terminal output reflects the incident state', () => {
    const run = (w: World, c: string) => runCommand({ state: w.net, host: 'PC1', rng: createRng(1) }, c).lines.map((l) => l.text).join('\n');
    expect(run(build('r1-interface'), 'ping 172.16.0.10')).toContain('Destination net unreachable');
    expect(run(build('dns'), 'nslookup www.lab.local')).toContain('timed out');
    expect(run(FIX.dns(build('dns')), 'ping 192.168.1.1')).toContain('Lost = 0');
  });

  it('hard cases carry two non-conflicting incidents and every suspect list contains the truth', () => {
    for (let s = 1; s < 40; s++) {
      const c = createCase('hard', createRng(s));
      expect(c.incidents).toHaveLength(2);
      expect(new Set(c.incidents.map((i) => i.id)).size).toBe(2);
      for (const i of c.incidents) expect(c.suspects).toContain(i.id);
      expect(c.suspects).toHaveLength(10);
      let w: World = { net: c.net, meta: c.meta };
      for (const i of c.incidents) w = FIX[i.id](w);
      expect(faultCount(w)).toBe(0);
    }
  });

  it('scoring follows the published table', () => {
    const perfect = scoreCase({ diagnosisCorrect: true, wrongDiagnoses: 0, wrongRepairs: 0, verified: true, elapsed: 60, limit: 300, actions: 5, freeActions: 12, modifier: 0 });
    expect(perfect.total).toBe(500 + 300 + 300 + 200 + 100);
    expect(perfect.accuracy).toBe(100);
    const sloppy = scoreCase({ diagnosisCorrect: true, wrongDiagnoses: 1, wrongRepairs: 1, verified: true, elapsed: 200, limit: 300, actions: 14, freeActions: 12, modifier: 0 });
    expect(sloppy.total).toBe(500 + 300 - 100 + 300 - 150 + 200 - 50);
  });
});

describe('lab floor', () => {
  it('walls and equipment block movement', () => {
    const router = STATIONS.find((s) => s.id === 'router')!.box;
    const start = { x: router.x - 40, y: router.y + 60 };
    let p = start;
    for (let i = 0; i < 40; i++) p = moveWithCollision(p.x, p.y, 5, 0);
    expect(p.x).toBeLessThan(router.x);
    let q = { x: 60, y: 500 };
    for (let i = 0; i < 40; i++) q = moveWithCollision(q.x, q.y, -5, 0);
    expect(q.x).toBeGreaterThan(28);
  });

  it('the spawn point is clear and every station can be reached within interaction range', () => {
    expect(moveWithCollision(SPAWN.x, SPAWN.y, 0, 0)).toEqual(SPAWN);
    for (const s of STATIONS) {
      const b = s.box;
      const probes = [
        { x: b.x + b.w / 2, y: b.y + b.h + 20 },
        { x: b.x + b.w / 2, y: b.y - 20 },
        { x: b.x - 20, y: b.y + b.h / 2 },
        { x: b.x + b.w + 20, y: b.y + b.h / 2 },
      ];
      const reachable = probes.some((p) => moveWithCollision(p.x, p.y, 0, 0).x === p.x && nearestStation(p.x, p.y)?.id === s.id);
      expect(reachable, s.id).toBe(true);
    }
  });
});

function cmdFor(k: string) {
  return { gateway: 'ping 192.168.1.1', server: 'ping 172.16.0.10', dns: 'nslookup www.lab.local', http: 'curl http://www.lab.local' }[k]!;
}
