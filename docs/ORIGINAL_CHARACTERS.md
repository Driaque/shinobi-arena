# The Northern Calamity — first playable adaptation

Source: user-supplied schemaVersion 1.0 character brief and two concept references, 2026-10-27.
Established identity and ability names below are separate from the game's proposed timings, numerical effects and awakenings. This release implements a selected kit, not every listed technique.

## Silent — Cold Metal

Hyorin Village; Tetsugan bloodline. Light skin, long silver-grey hair, ice-blue eyes, dark face mask, Hyorin ice headband and navy/silver/black northern shinobi armor. Tachi-style sword and Kaiken dagger. Elements: Metal, Water, Earth, Fire, Wind and Lightning.

Established ability pool: Middle Guard Stance, Harmonious Slash, Equilibrium Guard Strike, Vacuum Fan, Phantom Step, Dragon King's Impact, Blazing Fang Strike, Chakra Resonance, Echoing Rift, Stone of the Withering, Mizukumi, Abyssal Surge.

Archetype: precision counterattacker. Three metal sword basics replace the generic unarmed chain. Tachi and Kaiken are selectable before battle; selecting another equipped weapon does not change the built-in sword basics.

| Input (default P1) | Technique | First playable rules |
| --- | --- | --- |
| J ×3 | Opening Cut → Returning Edge → Rising Steel | Sword combo, standard confirm/cancel and scaling rules; 182 total damage without modifiers |
| U | Harmonious Slash | 125 damage, 25 chakra, 165 reach, 50% guard penetration |
| I | Echoing Rift | 70 damage, 30 chakra, 270 reach; clean hit pulls up to 90 units and applies +20% incoming **metal** damage for 3 seconds |
| O | Tetsugan · Middle Guard | 30 chakra; 3-second stance, 8-second cooldown. Hold Guard after activation recovery. Front guard absorbs 20% of chip damage and reflects 30% of guardable attack power. Reflect does not itself reflect or trigger lifesteal. A successful guarded hit readies one +35% sword counter for 1.5 seconds; the next sword contact consumes it, even against guard. Partial pierce reduces reflect; full pierce bypasses the stance. |
| T | Cold Metal Ascendant (**proposed**) | Unlock after 400 cumulative actual HP lost, once per round; 10 seconds, no activation heal/immunity. Metal aura/armor, +15% outgoing damage, 15% less incoming damage, +8% movement, 25% faster basic-chain animation progress. U becomes Ascendant Harmonious Slash; I becomes Ascendant Echoing Rift. |

Metal vulnerability is a damage modifier, never periodic damage. Rift does not pull/apply vulnerability through ordinary guard or Replacement. Guard stance is the initial defensive stance; offensive stance switching, additional moves and penguin companions remain future work.

## Winta — Frozen Sun

Hyorin-associated; Shinrai Ōu bloodline. Profile describes long dark hair, crimson/maroon northern samurai armor and an optional kasa, with crimson lightning, embers and snow. The supplied black/gold lightning portrait is the temporary visual concept. The stage fighter currently combines dark hair, maroon armor, gold eyes and crimson lightning. Sword weapon. Elements: Lightning, Water and Fire.

Associated ability pool: Mizukumi, Inner Peace, Harmonious Slash, Chakra Overflow, Eclipse Drain, Chakra Resonance.

Archetype: elemental pressure fighter. Three lightning sword basics use the usual confirm and scaling system.

| Input (default P1) | Technique | First playable rules |
| --- | --- | --- |
| J ×3 | Spark Cut → Crossing Current → Storm Rise | Lightning sword combo, 182 total damage before modifiers |
| U | Mizukumi | 125 lightning damage, 25 chakra; forward dash during active frames, no invulnerability |
| I | Eclipse Drain | 100 water damage, 30 chakra; restores 35% of actual damage on a clean hit, rounded down, capped at 1000 HP. Guard chip grants no healing; overkill grants no extra healing. Healing never removes accumulated awakening charge or resurrects a defeated fighter. |
| O | Shinrai Ōu | 30 chakra; +15% lightning damage for 5 seconds, 10-second cooldown. Does not enhance water or equipped metal weapons. |
| T | Frozen Sun Dominion (**proposed**) | Unlock after 400 cumulative actual HP lost, once per round; 10 seconds. +15% outgoing damage, +20% movement/dash speed, 5% less incoming damage, 25% faster basic-chain animation progress. U becomes Dominion Mizukumi; I becomes Dominion Eclipse Drain with 40% clean-hit lifesteal. |

Recovery in the first kit comes from Eclipse Drain. Inner Peace and other techniques are not yet bound. Real-time damage/effect mappings are proposed gameplay adaptations, not assertions about exact TNR jutsu rules.

## Shared behavior and future duo

Both are available for P1, local P2 and the CPU under Originals / TNR. Portraits use the supplied concept images; stage fighters remain procedural, not finished sprites. Mobile analog, double jump/dash, Replacement and customizable saved controls work as before. Weapons remain freely selectable for all characters.

Duo: **The Northern Calamity — Frozen Sun & Cold Metal**. **Northern Calamity: Frozen Metal Storm** remains a proposed team ultimate. It is not exposed as a working action because the game currently has two solo fighters, no team/assist mode.

Future kit expansion can add stance switching, explicit stun techniques and further elemental interactions after these mechanics have been playtested. Neither the longer ability pool nor the duo ultimate is advertised as already playable.

## Dora — AquaPrincess (v0.14.0)

Dora joins Originals / TNR as a selectable wind/water/fire counterattacker. Silent’s wife; bladed fans and katana. Water weakens, wind pulls into a defendable fire finisher, Triune Flow rewards guarded hits, and damage unlocks Limit Release. Her generated regal portrait follows the user’s appearance corrections. See [full Dora kit and adaptation notes](DORA.md).
