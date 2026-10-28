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

## duel-0.8.0 — movement and counterplay

- Jump can cancel a dash. Ground and air dashes use the same direction/double-tap inputs; one air dash per landing cycle, 24-tick dash cooldown, no invulnerability. Dash costs 18 stamina. Fresh movement taps buffer for 8 ticks while busy. They do not cancel a committed attack. Jump and dash can be pressed together.
- Input frames retain fresh-press metadata so two release/re-press taps on consecutive simulation ticks are distinct. Holding a key/button still does not auto-repeat attacks or jumps.
- Stamina starts at 100: basic stages 12 / 12 / 16, equipped attacks 16. Signatures still use chakra. After 45 ticks without exertion, stamina recovers 0.5/tick while not attacking/dashing (guarding is allowed). Low stamina rejects basics/weapons/dash; it does not prevent jumping or chakra techniques.
- Front guard raised less than 5 ticks before contact parries non-full-piercing attacks. No HP damage; costs 6 guard, interrupts/stuns the attacker 24 ticks. Parry cooldown is 60 ticks. Existing early/held guard still chips normally. Full pierce bypasses parry and guard.
- Guard starts at 100. Guarded basics consume 22, weapons 36, chakra attacks 42. Full pierce deals damage directly. At zero, guard breaks: the hit lands cleanly, defender suffers at least 42 ticks stun and guard resets to 35. Releasing guard allows +0.6/tick recovery after 90 ticks without a guarded hit. Blocking cannot regenerate guard indefinitely.
- Whiffed melee attacks and non-penetrating guarded attacks have 12 extra recovery ticks. Confirmed basic hits still chain/cancel as before. Clean attacks landing during an opponent's recovery gain 20% damage. Committed attacks cannot dodge-cancel this punish window.
- CPU decisions use visible actions every 4 ticks. It blocks incoming non-piercing attacks, retreats from piercing threats, punishes recovery, uses pierce against guard and manages stamina. No hidden damage/HP/resource advantage.

Stamina, guard, movement state and feedback expose these decisions in the HUD. These first balance values need human matchup playtesting; automated anti-spam checks cover several repeated-basic tapping rates rather than claiming every possible strategy is solved.

## duel-0.9.0 — paced CPU difficulty

Match state records Easy (default), Medium, Difficult or Xtreme. Attack strings record their end tick; AI policies wait an explicit gap before starting another string. Combo continuations check their actual stamina cost. Easy caps strings at one basic, Medium at two, Difficult/Xtreme at three. Reaction latency, initial grace period, approach duty cycle, technique use and defensive decisions vary by policy. Fighter stats, costs and cooldowns are shared with the player. See [DIFFICULTY.md](DIFFICULTY.md) for exact timings.

## duel-0.10.0 — explicit training sessions

Ordinary duels retain their rules. A state created through the training adapter carries practice configuration: its clock does not expire, round results are not resolved, and damage cannot take either fighter below 1 HP. Practice can refill HP/stamina/chakra and clear cooldowns around the same simulation tick. Actual damage still fills awakening charge. Guided challenges observe actual jump/dash state, confirmed basic-chain hits, guard/punish events and legal awakening events. They do not complete through UI buttons or simulated success. See [TRAINING.md](TRAINING.md).

## duel-0.11.0 — analog gestures and crouch

The device adapter translates firm up pulls into fresh jump inputs and same-direction double pulls into a one-tick absolute dash intent. The simulation still enforces jump count, air-dash count, stamina, cooldown and commitment/hitstun restrictions. Absolute dash intent is recorded in input frames and does not depend on fighter facing.

Crouch is a held grounded action with no resource cost. It stops walking and uses a 76-unit projectile hurtbox (standing: 120); ordinary melee eligibility is unchanged. Body-height projectiles still connect. It does not grant guard or invulnerability. Jump/attack/dash leave the pose, and release returns to standing. Desktop defaults are S / Down arrow.
