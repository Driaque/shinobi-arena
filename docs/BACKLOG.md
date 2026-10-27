# Ordered backlog

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
