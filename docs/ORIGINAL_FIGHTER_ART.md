# Original fighter artwork

The v0.28.0 combat sheets were generated with the built-in image-generation tool for this project. They are original Fabled Rivals character artwork, not extracted anime sprites. The pre-existing Visual Lab Aren sheet and scenery remain separate assets.

Runtime assets: `apps/web/assets/originals/<identity>.webp`. Geometry and scale: `packages/presentation/fighter-atlases.js` and `fighter-atlas-data.js`. Asset preparation: `scripts/normalize-fighter-art.py` (Python + Pillow; not required for builds). Each committed WebP is 1536×1536 RGBA, 4×4 cells of 384px, with its foot anchor at (192,340). The normalizer finds transparent gutters, trims each pose, registers the lower foot-contact band, and applies one shared scale per character. Standing height is recorded per sheet to match the live engine body size.

## Prompt set

Shared generation prompt: “Production transparent game combat sprite sheet for Fabled Rivals. Square 4×4 atlas, exactly 16 equal cells, one identical original character in all cells. Rich detailed hand-painted anime action RPG art with finely shaded fabric folds, metallic material highlights, refined adult anatomy and crisp contours. Not chibi or flat vector. Transparent alpha, no environment, ground shadow, lettering, logos or visual effects. Empty hands for runtime weapon cues. Face right in three-quarter side view; remain inside each cell with transparent gutters. Same body scale throughout. Row 1: idle ready, alternate idle, running left leg forward, running right leg forward. Row 2: low forward dash, jump rise, jump apex, falling/landing crouch. Row 3: attack anticipation hands near chest, forward strike hand extended, follow-through hand low, aerial attack hand overhead. Row 4: crouch guard, hit recoil, awakening arms open, elemental casting palm extended. Keep facial identity, costume and colors consistent.”

| Identity | Character-specific art direction |
| --- | --- |
| Silent | Mature pale man, fierce blue eyes, long silver-grey hair, dark mask over nose/mouth, layered steel-blue samurai armor, black underclothes, blue-grey sash and original ice-crest headband. |
| Winta | Warm brown skin, long dark hair tied back, amber eyes, crimson lacquered samurai armor with silver details, dark trousers, red sash and ice-crest headband. Silent's blood brother. |
| Dora | Graceful strong woman, golden-brown skin, long dark hair, blue eyes, ornate teal/gold royal champion outfit, fitted battle bodice, flowing split skirt, small gold tiara, bracers and boots. |
| Aren | Athletic man, dark bronze-brown skin, swept-back silver-white locs, teal/gold sleeveless long coat, dark fitted top, black trousers, bronze shoulder guard/greaves, white forearm wraps and gold waist clasp. |
| Eira | Brown skin, long silver-white hair, blue eyes, delicate glasses, blue-white/silver split archivist robe, turquoise trim, armored boots and hip scroll. |
| Kael | Imposing brown-skinned man, cropped dark-brown hair, strong jaw, cheek scar, dark bronze/ember military plate, long burnt-orange coat and reinforced boots. |
| Nyra | Deep brown skin, green-black braided hair, green eyes, hoodless dark-green leather/apothecary tunic, tempestAttunement split cloak, medicine vials and practical boots. |
| Rook | Broad muscular man, dark brown skin, short brown hair/beard, weathered ochre/bronze armor over workman leather, riveted chestplate, thick bracers, armored waist panels, forge tools on belt. |
| Veyra | Warm brown skin, pale lavender-white hair, violet eyes, deep violet/silver combat robe and split skirt, fitted armored bodice, delicate crown and silver shoulder pieces. |
| Oryn | Gaunt man, grey-brown skin with faint aqua cracks, unkempt silver hair, haunted cyan eyes, weathered blue-grey coat, layered armor, belts and a caged cyan lantern at the hip. |

Silent used the same pose layout with additional emphasis on his full-face mask and ice armor. Generated transparent edges are preserved. These sheets share pose semantics, rather than claiming a distinct clip for every move. Weapon geometry, physics and combat outcomes are not inferred from their pixels.

## Weapons in hand

Sheets stay empty-handed. During a weapon attack the painted equipment icon (`apps/web/assets/painted-v2/weapons/<id>-256.png`) is cut out of its flat backdrop at load time and drawn as a sprite at the fighter's leading hand, with a slash trail on the active frames. Grip and tip positions per weapon and the leading-hand position per fighter for poses 8 (anticipation), 9 (strike), 10 (follow-through) and 11 (aerial) live in `packages/presentation/weapons.js` (`WEAPON_ART`, `HAND_ANCHORS`).

Whenever a fighter sheet is regenerated or a new fighter is added, re-measure that fighter's four hand positions (arena units from the root: source pixels from (192,340) × 120 / standingHeight) and update `HAND_ANCHORS`; `tests/weapon-presentation.test.js` fails if a sheet has no entry. A new weapon needs a painted icon on a flat backdrop plus a `WEAPON_ART` entry. This remains presentation only: reach, hitboxes and damage come from the engine.

## Guard, impact and item cues

Guarding, landed blows and consumables share one cut-crystal language so they read as Fabled Rivals rather than a stock fighter. All of it is presentation only and stateless: every frame is derived from match state, so replays, seeks and online play draw the same thing and the engine is untouched.

- **The Rival's Crest** (`packages/presentation/guard.js`). Guarding raises five plates in the fighter's own colour (`CHARACTERS[id].color`), cut to the low-guard pose. Each plate is a fifth of the guard meter and they fail from the outside in, the centre plate last. The rim burns gold for the five ticks a parry is still possible, a blocked blow runs along the rim, a parry answers with a riposte seal (star, turning square, a line thrown at the attacker) and a broken guard cracks and throws the plates as shards.
- **The Rival's Mark** (`packages/presentation/impact.js`, `impactCuesFor`). A landed blow cuts a four-point star, a turning hexagon and a spray of shards, scaled by damage. Guarded hits are left to the crest.
- **Items** (`packages/presentation/items.js`). The painted inventory icon (`apps/web/assets/painted-v2/items/<id>-256.png`) is cut out like weapons and used on the battlefield: it rises from the hip pouch into the leading hand during startup, then is thrown, poured or planted. Cinder Charge flies with a fuse ring that burns down and bursts into faceted rings and shards; Veil Canister and Laureate Shroud leave the spent canister under a soft cloud in their own colours; poison is poured over the weapon hand and leaves wisps while the coating lasts; the Waypoint Anchor plants a gold thread that shortens with the time left and tightens around the fighter on the warp; the Spike Capsule is a cut blade and the Orbit Pack throws the painted disc.
- Chakra charge and ward (`apps/web/practice-effects.js`) use the same four-point mote and cut frame.

Cues are plain data (`packages/presentation/shapes.js`): fills, stroked paths and painted props in arena coordinates, `add` for light and `layer:'ground'` for anything under the fighters. `apps/web/visual-lab-renderers.js` draws them identically in the Canvas and Pixi labs; `fx/puff` is a soft white texture made at load and tinted for smoke and fire. Reduced motion keeps the readable parts (plates, held item, cloud, countdowns) and drops shards, spins and flicker. A new item needs a painted icon, an `ITEM_ART` entry and, if it is thrown as itself, an entry in `ITEM_PROJECTILES`; `tests/item-guard-presentation.test.js` fails when an item has no art.
