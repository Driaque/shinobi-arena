# Combat rules · duel-0.2.0

World coordinates: 1280×720; floor at y=570. Character y is height above the floor. Simulation runs
at 60 fixed ticks/second. Render rate does not determine movement or attack timing. A frame stall
admits at most 100 ms of catch-up time per animation frame; hidden/local games pause.

## Movement and defence

Ground speed: 5 units/tick; airborne speed: 4.5. Jump begins with upward velocity 17, gravity 0.9/tick.
Opposite directions cancel. Jump is edge-triggered and cannot retrigger while held. Grounded/near-height
fighters stay at least 52 units apart, including at arena boundaries. Fighters may cross while sufficiently
vertically separated. Idle fighters turn toward the opponent; attacks retain their facing.

Guard requires holding block while grounded, not attacking and not stunned. A guarded hit requires
facing the incoming attack. Guard chips ceil(8% of damage) and reduces knockback to 30%; guard
impact causes seven ticks of stun. Unguarded hits cause eighteen ticks of stun and interrupt an action.
This prototype has no throws, invulnerability, air blocking or high/low guard mixups.

## Actions

A fresh input press starts an action if the fighter can act. Inputs during recovery/stun are not queued
for a later combo. Device-level quick taps between simulation ticks are captured for the next tick.
Chakra is spent at action start and not refunded on interruption. Chakra regenerates 0.035/tick,
up to 100. Both fighters begin with 1000 HP and 100 chakra.

| Move | Startup | Active | Recovery | Damage | Chakra | Reach |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Basic hit | 5 | 4 | 13 | 65 | 0 | 90 |
| Rasengan / Chidori | 12 | 9 | 24 | 150 | 30 | 118, plus active lunge |
| Clone strike | 16 | 7 | 24 | 120 | 35 | 210 |
| Fireball | 17 | 1 | 28 | 110 | 25 | Projectile |

Basic and lunge attacks have a vertical tolerance of 100 units and only hit in front of the fighter.
Each melee swing hits a target at most once. Fireballs move 12 units/tick, expire after 100 ticks or
leaving the arena, and disappear on impact. Projectiles already launched survive the caster's interruption.
Their hit checks include target height, allowing jumps over them.

Both fighters update movement/actions before hit candidates are collected. All hit and block decisions
are gathered before damage is applied, so same-tick hits can trade. Double knockout draws.
Round outcome is checked after all hits. At zero timer, higher HP wins. First to two round wins ends
the match; draws award no points. Next round resets HP/resources/positions and timer, preserving wins.
Rematch resets the entire match. Changing modes discards the current match.

## Computer

Evaluates legal visible state every eight ticks. Approaches, guards against visible attack startup,
uses specials at range, and uses basic attacks nearby. Uses the same costs, stun and cooldown rules.
No randomness or LLM service. This is a baseline opponent, not advanced fighting-game AI.
