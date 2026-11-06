# Fighter motion: findings and implementation

## Diagnosis

Before this update, default continuous fighters used procedural Canvas geometry over a PixiJS battlefield. Painted mode used 16 opaque key illustrations per original fighter, with only two running poses. It cannot reproduce a full gait just by increasing renderer FPS. Crossfading unrelated illustrations was removed previously because it creates double limbs and translucent weapons.

The base renderer also recomputed zoom from the highest fighter every frame. This visibly changed every character's scale on jumps. The standalone visual-lab camera repeated the same policy. Local root positions were projected between simulation ticks but action ages were not, leaving weapons visibly quantized.

## Primary references

- PixiJS render loop: https://pixijs.com/8.x/guides/concepts/render-loop — render-time animation should use elapsed time rather than assuming a particular display frequency.
- Glenn Fiedler, Fix Your Timestep: https://gafferongames.com/post/fix_your_timestep/ — keep simulation fixed and separate visual sampling from authoritative updates.
- Spine applying animations: https://en.esotericsoftware.com/spine-applying-animations — skeletal animation supports mixing poses and layering actions on locomotion. This supports an articulated/layered direction; it does not make unrelated flattened drawings suitable for crossfading.
- PixiJS performance tips: https://pixijs.com/8.x/guides/concepts/performance-tips — sprite sheets and batched sprites are preferable for rich artwork; avoid unnecessary scene complexity and profile before optimizing.

## Implemented

Fixed camera scale derived only from viewport size, with 540 world units of aerial headroom above the floor. Unified 64-unit travel cycle, planted feet during stance, smooth foot return and two-bone knee placement. Body bob is compensated at each grounded foot. Fractional local action ages match root sampling. Connected arm posing now reaches the full roster. Painted root offsets join at combat phase boundaries rather than snapping from anticipation to follow-through.

The approved art pass takes the frame-animation alternative: eight coherent full-body run frames per carry variant for all ten originals. The production atlases use transparent backgrounds, a common root and a fixed scale within each character, with per-character standing-height metadata to match the prior run silhouette size. Canvas and PixiJS sample the same distance-driven frame index. The scene disables its procedural bob/root offsets during authored running so the sheet's motion is not applied twice. Only selected characters load. Load failures retain existing poses.

Equipped art is specific to a painted carry set, so presentation checks the actual active weapon and remaining poison/smoke items before selecting it. Silent additionally needs both Tachi and Kaiken. Unsupported sets use the empty-handed sprint. Equipment rendering for arbitrary combinations remains future work.

## Next art investment, not implemented

Extend the approved full-body direction to idle, stop, turn, jump, land, guard, hit and attack sequences. The cut-apart limb pilot was rejected and is excluded from this release. Keep coherent root/volume and validate at gameplay scale before increasing effects. Layered attachments would require separately approved artwork and pivots; they are not supplied by the current flattened sheets.

Success should be judged with side-by-side recorded runs at 60/120 Hz and on real phones: planted feet, consistent size, continuous wrists/weapons, readable startup/active/recovery, no doubled silhouettes, and frame-time measurements with all four survival fighters. Automated checks verify geometry and camera invariants; they cannot establish subjective animation quality or physical-device performance.
