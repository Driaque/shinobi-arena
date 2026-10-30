# Original fighter artwork

The v0.28.0 combat sheets were generated with the built-in image-generation tool for this project. They are original Fabled Rivals character artwork, not extracted anime sprites. The pre-existing Visual Lab Aren sheet and scenery remain separate assets.

Runtime assets: `apps/web/assets/originals/<identity>.webp`. Geometry and scale: `packages/presentation/fighter-atlases.js` and `fighter-atlas-data.js`. Asset preparation: `scripts/normalize-fighter-art.py` (Python + Pillow; not required for builds). Each committed WebP is 1536×1536 RGBA, 4×4 cells of 384px, with its foot anchor at (192,340). The normalizer finds transparent gutters, trims each pose, registers the lower foot-contact band, and applies one shared scale per character. Standing height is recorded per sheet to match the live engine body size.

## Prompt set

Shared generation prompt: “Production transparent game combat sprite sheet for Fabled Rivals. Square 4×4 atlas, exactly 16 equal cells, one identical original character in all cells. Rich detailed hand-painted anime action RPG art with finely shaded fabric folds, metallic material highlights, refined adult anatomy and crisp contours. Not chibi or flat vector. Transparent alpha, no environment, ground shadow, lettering, logos or visual effects. Empty hands for runtime weapon cues. Face right in three-quarter side view; remain inside each cell with transparent gutters. Same body scale throughout. Row 1: idle ready, alternate idle, running left leg forward, running right leg forward. Row 2: low forward dash, jump rise, jump apex, falling/landing crouch. Row 3: attack anticipation hands near chest, forward strike hand extended, follow-through hand low, aerial attack hand overhead. Row 4: crouch guard, hit recoil, awakening arms open, elemental casting palm extended. Keep facial identity, costume and colors consistent.”

| Identity | Character-specific art direction |
| --- | --- |
| Silent | Mature pale man, fierce blue eyes, long silver-grey hair, dark mask over nose/mouth, layered steel-blue samurai armor, black underclothes, blue-grey sash and original ice-crest headband. |
| Winta | Warm brown skin, long dark hair tied back, amber eyes, crimson lacquered samurai armor with silver details, dark trousers, red sash and ice-crest headband. Silent's blood brother. |
| Dora | Graceful strong woman, golden-brown skin, long dark hair, blue eyes, ornate teal/gold royal kunoichi outfit, fitted battle bodice, flowing split skirt, small gold tiara, bracers and boots. |
| Aren | Athletic man, dark bronze-brown skin, swept-back silver-white locs, teal/gold sleeveless long coat, dark fitted top, black trousers, bronze shoulder guard/greaves, white forearm wraps and gold waist clasp. |
| Eira | Brown skin, long silver-white hair, blue eyes, delicate glasses, blue-white/silver split archivist robe, turquoise trim, armored boots and hip scroll. |
| Kael | Imposing brown-skinned man, cropped dark-brown hair, strong jaw, cheek scar, dark bronze/ember military plate, long burnt-orange coat and reinforced boots. |
| Nyra | Deep brown skin, green-black braided hair, green eyes, hoodless dark-green leather/apothecary tunic, sage split cloak, medicine vials and practical boots. |
| Rook | Broad muscular man, dark brown skin, short brown hair/beard, weathered ochre/bronze armor over workman leather, riveted chestplate, thick bracers, armored waist panels, forge tools on belt. |
| Veyra | Warm brown skin, pale lavender-white hair, violet eyes, deep violet/silver combat robe and split skirt, fitted armored bodice, delicate crown and silver shoulder pieces. |
| Oryn | Gaunt man, grey-brown skin with faint aqua cracks, unkempt silver hair, haunted cyan eyes, weathered blue-grey coat, layered armor, belts and a caged cyan lantern at the hip. |

Silent used the same pose layout with additional emphasis on his full-face mask and ice armor. Generated transparent edges are preserved. These sheets share pose semantics, rather than claiming a distinct clip for every move. Weapon geometry, physics and combat outcomes are not inferred from their pixels.
