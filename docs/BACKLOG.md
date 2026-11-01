# Ordered backlog

## Current product priorities

The following sequence supersedes the historical milestone order below. Planned items are not implementation claims.

| Priority | Work | Acceptance |
| --- | --- | --- |
| P0 | Character animation and combat readability | Clean opaque poses, stable roots, readable startup/contact/recovery; verify desktop and physical phones. v0.28.1 addresses crossfade ghosting only. |
| P0 | Online reliability | Record latency/jitter and match completion; test cross-device hit consistency and reconnect handling before choosing further prediction/rollback work. |
| P1 | Discord sign-in and persistent identity | Keep guest play; server-verified Discord login links to a permanent internal player ID; prove ownership before attaching guest history/rating/rewards; explicit conflict flow; cross-device recovery and logout. Keep provider credentials server-side. |
| P1 | Friends and private matches | Add friends, share room links, challenge and rematch; optional presence, block/report controls; no automatic Discord friend imports or messages. |
| P1 | First-match onboarding | Recommended builds, short interactive introduction and obvious retry/rematch; measure first-match completion without help. |
| P1 | Distinct original fighters | Each rival has a recognizable mechanic, animation identity and teachable counterplay; validate with human matches. |
| P2 | Character mastery | Character-specific challenges award cosmetic titles, colours and badges; no combat stat advantages. Build on existing training and persistent identity. |
| P2 | Battlefield variety | Visually distinct stages with readable combat; interactive terrain needs separate design and balance tests. |
| P2 | Player and competitor research | Separate live observations, documented features and hypotheses; record source, player problem, proposed experiment and success measure. |

Track visit → ready → first match → completed match → rematch → return → friend invite, split by device/input. Verify actual hosting/database lifetime before wider playtests.

## Approved expansion sequence

1. Keep animation/combat readability and online reliability at P0; improve profiles, gestures, presence and duel invitations alongside these foundations.
2. Challenges and cosmetic progression: v0.30.0 adds verified online daily/weekly/permanent objectives and cumulative login days. Next: validated arcade participation, richer cosmetic selection and character mastery. Never award combat advantages. Guest progress follows the saved player ID and existing Discord linking.
3. Short Silent and Winta character story chapter: brothers, dialogue panels, a few encounters, rival fight and ending. Reuse arenas and combat; establish original lore before expanding the campaign.
4. Two-player co-op survival: synchronized waves, readable enemy patterns and teammate assistance, followed by bosses. Validate AI, two-client authority, disconnects, mobile performance and reward eligibility before release.

v0.31.0 introduces the first Northern Echoes story chapter and private two-player, three-wave survival. Additional chapters, boss encounters, in-wave revives, reconnect, profile rewards and shared exploration remain future work. The initial login track is seven cumulative claim days, without streak resets. Challenges use UTC day/Monday-week boundaries. Measure challenge participation, repeat visits and rematches before expanding reward volume.

## Historical milestones

0.4.0 update: F07 keyboard rebinding is implemented, along with analog movement, a drag/resize
touch layout editor, conflict checks and per-device/profile persistence. See CONTROL_SETTINGS.md.

Each item should become a separate issue/PR once the remote exists. These are not yet GitHub issues.

| ID | Work | Acceptance | Depends on |
| --- | --- | --- | --- |
| F01 | Confirm combat specification | Hit/block/KO/timeout/simultaneous-hit rules and example ticks documented | — |
| F02 | Fixed-step loop | Identical outcome across different render rates; catch-up bounded | F01 |
| F03 | Arena movement | Jump/land/facing/boundaries tested; opposite directions neutral | F02 |
| F04 | Attack state machine | Startup/active/recovery and one hit per target per swing | F03 |
| F05 | Block and hit response | Direction, hitstun, knockback, interruptions tested | F04 |
| F06 | Round lifecycle | KO, draw, timer, first-to-two and rematch playable | F05 |
| F07 | Keyboard settings | Separate P1/P2 maps, conflict handling, reset defaults | F06 |
| F08 | Character definitions | Two distinct move sets with resource costs and version ID | F06 |
| F09 | Computer opponent | Legal input frames, reaction delay, solo match completes | F08 |
| F10 | Asset pipeline | Sprite metadata, animation events, provenance and loading errors | F08 |
| F11 | Mobile gameplay | Landscape gate, two-thumb controls, safe areas and explicit resume | F09 |
| F12 | Browser automation | Complete match and interrupted multi-touch scenarios in CI | F11 |
| F13 | Replays | Versioned inputs reproduce final state hash | F08 |
| F14 | Network spike | Two-device comparison report with latency/jitter/loss | F13 |
| F15 | Private online matches | Authoritative result, reconnect and input validation | F14 |
| F16 | Portfolio case study | Demo, decisions, test evidence and measured performance | F12, F15 |

Definition of done: observable player/developer outcome, relevant correctness tests, docs updated,
CI passes, no unsupported feature claims. Mobile changes also require listed device evidence.



### Originals / TNR follow-up

- Playtest Silent/Winta matchups and adjust the proposed real-time kit values.
- Add explicit offensive/defensive stance switching for Silent; current bloodline activation is the defensive stance.
- Expand mapped ability pool (e.g. Inner Peace, Phantom Step, dedicated stun techniques).
- Replace concept portraits/procedural bodies with approved animation assets.
- Design team/assist mode before implementing the proposed Northern Calamity ultimate.
