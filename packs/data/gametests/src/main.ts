import { EntityComponentTypes, Player, system, TicksPerSecond, world } from "@minecraft/server";

const runIds = new WeakMap<Player, number>();

function check(player: Player) {
    if (!world.gameRules.naturalRegeneration || runIds.has(player)) return;
    const hun = player.getComponent(EntityComponentTypes.Hunger);
    if (!hun || hun.currentValue < hun.effectiveMax) return;
    const sat = player.getComponent(EntityComponentTypes.Saturation);
    const hea = player.getComponent(EntityComponentTypes.Health);
    if (!sat || !hea) return;

    const id = system.runInterval(() => {
        if (!world.gameRules.naturalRegeneration || !hun.isValid) {
            system.clearRun(id);
            runIds.delete(player);
            return;
        }
        if (hun.currentValue >= hun.effectiveMax) {
            if (sat.currentValue >= 1.5 && hea.currentValue <= hea.effectiveMax - 1) {
                sat.setCurrentValue(sat.currentValue - 1.5);
                hea.setCurrentValue(hea.currentValue + 1);
            }
        }
        if (hun.currentValue < hun.effectiveMax || sat.currentValue <= sat.effectiveMin || hea.currentValue >= hea.effectiveMax) {
            system.clearRun(id);
            runIds.delete(player);
            return;
        }
    }, TicksPerSecond / 2);
    runIds.set(player, id);
}

world.afterEvents.entityHealthChanged.subscribe(({ entity }) => { if (entity instanceof Player) check(entity); });
world.afterEvents.itemCompleteUse.subscribe(({ source }) => check(source));
world.afterEvents.playerSpawn.subscribe(({ player }) => check(player));
system.run(() => { for (const player of world.getAllPlayers()) check(player); });
