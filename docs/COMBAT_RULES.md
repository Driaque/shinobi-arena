# Combat rules · duel-0.6.0

The deterministic simulation runs at 60 ticks/second in a 1280×720 world. Floor y=570; fighter y is height
above the floor. Render frequency does not determine combat outcomes. Local pause/portrait/focus loss
stops the match; resume is explicit. Data definitions live in `packages/engine/catalog.js`.

## Movement, guard and escape

Ground speed is 5 units/tick, airborne speed 4.5, modified by an active awakening. Analog deflection scales
horizontal speed; held keyboard directions override it and opposite keys neutralize each other. Two jumps
are available per landing. Ground dash lasts eight ticks at 17 units/tick with a 24-tick cooldown and no
invulnerability. Double-tap either direction or use explicit back/forward buttons.

Grounded guard requires no action/dash/stun and facing the incoming attack. Normal guard takes ceil(8%)
chip damage and 30% knockback; guard impact stuns for seven ticks. Unguarded hits interrupt actions and
usually stun for eighteen ticks. Guard-piercing attacks bypass reduction according to their pierce fraction.
Full pierce also permits effects through guard. There are no throws or air-blocking yet.

Replacement costs 25 chakra, has an eight-second cooldown, retreats up to 170 units and grants eighteen
ticks of direct-hit immunity. It cancels the current action/buffer/dash and clears hitstun. It breaks the
opponent's combo. It does not cure poison/burn or prevent periodic damage.

## Actions and combos

Basic, weapon, signatures and bloodline/dōjutsu are separate slots. A fresh press enters a ten-tick buffer;
holding does not repeat. Chakra is spent at action start and not refunded when interrupted. Each swing
can hit a target once. Projectiles disappear on impact/bounds/expiry; launched projectiles survive a
caster's interruption. Normal chakra regeneration is 0.035/tick, up to 100.

Basic chain:

| Stage | Startup / active / recovery | Base damage | Reach | Follow-up |
| --- | --- | ---: | ---: | --- |
| Basic strike | 5 / 4 / 13 | 65 | 90 | Body strike |
| Body strike | 5 / 4 / 15 | 50 | 105 | Launching kick |
| Launching kick | 8 / 4 / 24 | 90 | 130 | Ender; launches and knocks back |

Tap Basic again after the first hit; early taps within the buffer are accepted. Once the active phase ends,
a confirmed basic hit can cancel recovery into the next basic stage, a weapon or a signature. Blocked hits
and whiffs do not qualify. Stage three cannot cancel into another basic stage. A normal attack pressed
late in recovery may begin after recovery if its buffer has not expired.

The combo counter continues only while the same opponent is still in hitstun and the last hit was within
30 ticks. Damage scales 100%, 90%, 80%, 70%... with a 55% floor. A standard connected three-hit basic
chain deals 65 + 45 + 72 = 182 damage before other modifiers. Gaps reset the counter. DOT does not count
as a combo hit. Visible counters last sixty ticks after the last confirmed hit.

Hit/block candidates resolve together, so same-tick strikes can trade and double KO draws. Lethal periodic
damage is processed before actions; it cannot be escaped by activating a form after death.

## Effects and awakenings

Weaken reduces outgoing direct damage 30%. Poison deals nine damage/second for six seconds. Baseline
Fireball burn deals twelve/second for four seconds; Amaterasu has its own data values. Same-type effects
refresh duration/max potency without duplicating instances or postponing the next DOT tick.

Actual HP lost—including chip and periodic damage, excluding prevented damage and overkill—fills the
awakening charge on eligible fighters. Press Awaken when the threshold is reached and the fighter is free
of action/dash/hitstun. One activation per round; no healing, invulnerability or cooldown reset. Forms modify
speed, damage, defence and chakra regeneration. Naruto/Boruto also replace selected signatures while active.
Most forms last 600 ticks; Eight Gates lasts 480. See CHARACTER_KITS.md for thresholds and modifiers.
Projectiles snapshot outgoing awakening/weakening/pierce at launch; target defence is evaluated on impact.

The form timer runs only while the simulation runs. Expiry restores base signatures/stats. New rounds
reset charge, activation eligibility, effects, cooldowns and combo state while retaining selected loadouts.

## Victory and computer play

90-second rounds; first to two wins. Knockout wins immediately after all same-tick hits resolve. At time
expiry, higher HP wins; equal HP/double KO draws without awarding a point. Rematch reopens loadout selection.

The baseline computer observes legal visible state every eight ticks, can chain basics and activate a ready
awakening, and uses the same resource/stun rules. It has no hidden stat bonuses. Values and timing are
prototype balance choices; roster variety does not establish competitive balance.


## duel-0.7.0 — originals combat interactions

Silent's Tetsugan stance gives guarded chip absorption, bounded non-recursive reflect and a short one-use sword-counter window. Echoing Rift pulls on clean contact and exposes only metal damage. Winta's Shinrai Ōu enhances lightning; Eclipse Drain heals from actual clean damage, capped at maximum HP and excluding overkill. Healing does not undo accumulated damage charge. New statuses are not treated as poison/burn ticks. See [ORIGINAL_CHARACTERS.md](ORIGINAL_CHARACTERS.md) for exact values and proposed awakening modifiers.
