# Fighter motion: findings and implementation

## Diagnosis

The default continuous fighters already use procedural Canvas geometry over a PixiJS battlefield. Painted mode uses 16 opaque key illustrations per original fighter, with only two running poses. It cannot reproduce a full gait just by increasing renderer FPS. Crossfading unrelated illustrations was removed previously because it creates double limbs and translucent weapons.

The base renderer also recomputed zoom from the highest fighter every frame. This visibly changed every character's scale on jumps. The standalone visual-lab camera repeated the same policy. Local root positions were projected between simulation ticks but action ages were not, leaving weapons visibly quantized.

## Primary references

- PixiJS render loop: https://pixijs.com/8.x/guides/concepts/render-loop — render-time animation should use elapsed time rather than assuming a particular display frequency.
- Glenn Fiedler, Fix Your Timestep: https://gafferongames.com/post/fix_your_timestep/ — keep simulation fixed and separate visual sampling from authoritative updates.
- Spine applying animations: https://en.esotericsoftware.com/spine-applying-animations — skeletal animation supports mixing poses and layering actions on locomotion. This supports an articulated/layered direction; it does not make unrelated flattened drawings suitable for crossfading.
- PixiJS performance tips: https://pixijs.com/8.x/guides/concepts/performance-tips — sprite sheets and batched sprites are preferable for rich artwork; avoid unnecessary scene complexity and profile before optimizing.

## Implemented

Fixed camera scale derived only from viewport size, with 540 world units of aerial headroom above the floor. Unified 64-unit travel cycle, planted feet during stance, smooth foot return and two-bone knee placement. Body bob is compensated at each grounded foot. Fractional local action ages match root sampling. Connected arm posing now reaches the full roster. Painted root offsets join at combat phase boundaries rather than snapping from anticipation to follow-through.

## Next art investment, not implemented

Build one pilot layered fighter with separate torso, head, upper/lower arms, hands, legs, hair, coat and weapon attachments, consistent pivots and two-bone limbs. Author neutral, run, stop, turn, rise/apex/fall, land, guard, hit and attack keys. Blend joint transforms, never silhouettes. Validate Silent first at gameplay scale and then carry the rig contract across the roster. A frame-animation alternative needs coherent run in-betweens and consistent root/volume before adding more FX.

Success should be judged with side-by-side recorded runs at 60/120 Hz and on real phones: planted feet, consistent size, continuous wrists/weapons, readable startup/active/recovery, no doubled silhouettes, and frame-time measurements with all four survival fighters. Automated checks verify geometry and camera invariants; they cannot establish subjective animation quality or physical-device performance.
