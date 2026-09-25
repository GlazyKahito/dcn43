import { Section } from '@/components/chrome/Section';
import { FaultRepairGame } from '@/components/game/FaultRepairGame';

export function MiniGameSection() {
  return (
    <Section
      id="minigame"
      no="07"
      kicker="Mini-game · Network Fault Repair"
      title={
        <>
          Network
          <br />
          fault repair
        </>
      }
      lede="A timed shift on the help desk. The game runs on its own copy of the network, so it never disturbs the simulator. Observe, diagnose, repair, verify — before the clock runs out."
    >
      <FaultRepairGame />
    </Section>
  );
}
