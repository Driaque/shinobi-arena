# Character kits · 0.3.0

These are gameplay adaptations using anime themes. Damage, effects, timers and loadouts are original
balance choices, not statements that every move has precisely this effect in the anime.

| Character | Signature 1 | Signature 2 | Bloodline slot | Style |
| --- | --- | --- | --- | --- |
| Naruto | Rasengan: rushing burst | Shadow Clone Strike: extended melee reach | None in this kit | Close-range pressure |
| Sasuke | Chidori: rushing guard pierce | Fireball: projectile + burn | Sharingan Genjutsu: damage + weakening | Guard pressure and ranged chip |
| Hinata | Twin Lion Fists: guard pierce | Chakra Point Strike: damage + weakening | Byakugan: temporary guard penetration | Precision and suppression |
| Orochimaru | Striking Shadow Snakes: extended reach + poison | Five-Pronged Seal: damage + weakening | None in this kit | Attrition and suppression |

Naruto's tailed-beast power is not labelled a bloodline. Orochimaru's snake techniques occupy signature
slots. A character without an inherited technique has a visibly unavailable bloodline button; the system
does not invent one to fill every slot. Mirror matches are allowed.

Before a new match, each fighter selects a character and weapon. The computer also uses its chosen kit.
Next round preserves loadouts; rematch lets players reselect them. An active round cannot change equipment.

| Weapon | Attack | Tradeoff |
| --- | --- | --- |
| Kunai | Melee thrust, 75 damage | Quick and short-range |
| Shuriken | Projectile, 55 damage | Ranged, can be jumped or guarded |
| Katana | Melee slash, 100 damage | More reach, slower recovery |

Every fighter retains a separate 65-damage unarmed basic attack regardless of equipment.
Weapons cost no chakra, but have recovery and cooldowns. Signatures and bloodline actions have chakra
costs and cooldowns displayed on the player's controls. Defaults and values live in `packages/engine/catalog.js`.

## Shared movement / escape

- Two jump impulses per landing; release/repress jump to use the second one.
- Double-tap either direction within 14 ticks to dash; Q/E or touch buttons explicitly dash backward/forward.
- Ground dash: eight ticks at 17 world units/tick; 24-tick cooldown. No invulnerability.
- Replacement: 25 chakra, eight-second cooldown, retreat up to 170 units, eighteen ticks of direct-hit
  immunity. Can escape hitstun; cancels the current attack/dash. Existing poison/burn are not cleansed.

## Effects

- Pierce: bypasses guard reduction. Chidori and Twin Lion Fists fully pierce guard. Byakugan grants five
  seconds of guard penetration to the user's melee/weapon/projectile attacks. Replacement still evades them.
- Weaken (nerf): outgoing direct damage is reduced by 30% for four or five seconds, depending on the move.
- Poison: nine damage each second for six seconds (54 total after application).
- Burn: twelve damage each second for four seconds (48 total after application).
- Ordinary guarded hits do not apply negative effects. Full guard penetration permits effect application.
- Reapplying the same effect refreshes duration/maximum strength, without stacking duplicates or delaying
  its already-scheduled next damage tick. Poison and burn are distinct and may coexist.
- New rounds and rematches clear effects, buffs, cooldowns and invulnerability.

## Theme references

- Official Chidori description: https://naruto-official.com/en/news/01_1715
- Official Hinata / Twin Lion Fists reference: https://naruto-official.com/en/news/01_2199

These are thematic references, not permission to reuse third-party artwork. All rendering remains project-authored geometry.
