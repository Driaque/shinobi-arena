# CPU difficulty · v0.9.0

Easy is the default for new players. The top-bar Difficulty selector offers **Easy, Medium, Difficult, Xtreme**. The setting is saved separately on this device. Changing it during play pauses the current fight and preserves HP, resources, round and loadouts; Resume applies the new policy. It persists across rounds/rematches. Local P2 disables the selector and uses no CPU policy.

| Mode | Opening before CPU acts | Decision interval | Reaction threshold | Minimum pause after an attack string | Basic combo limit |
| --- | --- | --- | --- | --- | --- |
| Easy | 3 seconds | 12 ticks / 200 ms | 30 ticks / 500 ms | 90 ticks / 1.5 seconds | 1 hit |
| Medium | 1.5 seconds | 8 ticks / 133 ms | 16 ticks / 267 ms | 42 ticks / 0.7 seconds | 2 hits |
| Difficult | 0.75 seconds | 6 ticks / 100 ms | 8 ticks / 133 ms | 20 ticks / 333 ms | 3 hits |
| Xtreme | 0.4 seconds | 4 ticks / 67 ms | 4 ticks / 67 ms | 8 ticks / 133 ms | 3 hits |

Timing uses the fixed 60 Hz simulation. Reaction thresholds apply to visible enemy actions, not to hidden or future inputs. Decision intervals can add further delay. Attack-string pauses begin when the committed attack finishes, including recovery. Defensive decisions may still occur during a pause if the policy has observed a threat long enough.

Easy approaches intermittently, favors basics, considers signatures on every fourth attack-string opportunity, and does not use Replacement or awakening. It leaves generous openings for movement and button practice. Medium approaches more steadily, permits a signature every other string, and enables delayed Replacement and awakening. Difficult and Xtreme can use full strings, recovery punishes, guard-piercing choices and tighter pressure. Their shorter pauses/reaction thresholds make them more challenging.

All four use identical HP, damage, stamina costs, chakra costs, cooldowns, guard rules and hit detection. Difficulty changes decisions, never secret stat multipliers or resource regeneration. AI combo attempts check the stamina required for the next stage, including the more expensive finisher. Availability checks still go through the normal engine's spending and cooldown validation.

Policies are immutable data in `packages/engine/difficulty.js`. `computerInput` reads state without mutating it. Match state includes the selected difficulty; recorded legal inputs still replay deterministically using the versioned rules. Completed/interrupted attacks record their end tick so policy pacing survives pauses and round transitions correctly; fresh rounds reset fighter timing counters.

Validation covers safe Easy fallback, opening grace period, minimum recovery gaps, combo caps, visibly different pressure, reaction thresholds, unchanged fighter stats, deterministic input generation, all 18 characters' budgets in every mode, and a simple spaced-basic learner strategy winning on Easy. Existing basic-spam counterplay stress tests now explicitly choose Xtreme. Browser checks cover all four options, Easy default, saved selection, local P2 disabling, and changing a mobile match's difficulty without resetting it.

The difficulty curve is a first tuning pass; human playtesting across matchups remains the next source of balance feedback.
