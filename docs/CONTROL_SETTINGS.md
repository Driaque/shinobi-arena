# Analog movement and control settings · 0.4.0

## Playing

The left thumbstick is an analog horizontal input for the side-view fighter. Its radial dead zone is
18% of stick travel. Outside that zone, horizontal deflection scales movement from zero to full speed.
Vertical motion now changes arena depth (v0.18). Older v0.11 jump/crouch gestures below are historical. Jump and dash
are separate buttons. Keyboard movement takes priority if a direction key is held; devices never add
movement above full speed. Pointer cancellation, loss of capture, blur, rotation and resize clear the stick.

The right action buttons use a circular mobile-action-game layout. The artwork and UI are original;
this adopts familiar mobile control conventions rather than a particular game's assets or combat system.

## Touch layout

1. Tap **Controls** in the top bar. The local match pauses.
2. Drag the stick or any action button to a comfortable position.
3. Select a control by tapping it or choosing it in the editor; use Size to resize it.
4. **Save** applies and remembers the draft. **Cancel** restores the previous settings.
5. **Reset layout** restores defaults for the current screen profile in the draft; Save makes it permanent.

Buttons stay at least 48 CSS px; the stick ranges from 88–160 px. Bounds projection keeps controls on the
arena and out of the top HUD strip. Save rejects overlapping circles on the current screen. Unavailable
bloodline buttons can still be moved in edit mode, so future character choices keep a usable layout.
Returning from the editor does not automatically resume a paused fight.

## Keyboard

From the control editor, select **Keyboard**. Click an action's binding and press the desired key.
Bindings are unique across both players. Conflicts show an error without stealing the existing binding.
Use Clear to remove a binding, or restore default keys in the draft. Escape cancels a pending capture.
P and Escape remain pause controls; Tab stays available for navigation. Space can be bound to jump.
Select Done to return to the touch editor, then Save to keep all changes. HUD key hints update to match.

## Awakening control

P1 defaults to T and P2 to Y; the touch Awaken button is available only when the selected character’s
meter is ready. It can be moved/resized or rebound like other actions. Settings schema version 2
upgrades version-one layouts while retaining their positions and bindings. The new default key is
added only if it is unused; an existing custom T/Y binding is never stolen. If necessary, bind Awaken
manually in Keyboard.

## Persistence and responsive layouts

Settings are versioned in localStorage under `shinobi-arena.controls.v1`, scoped to this browser and site.
They do not sync between devices. Touch layouts have separate small (<720 px arena), medium (<1000 px)
and large screen profiles. Positions are stored as normalized coordinates and projected into safe bounds
on resize. A profile without a saved layout uses its responsive defaults. Key bindings are shared across
profiles. Saving while storage is unavailable applies settings in memory and reports that they will not
survive closing the page. Missing, corrupt or incompatible settings fall back to defaults.

Physical iPhone/Android testing remains pending; Chromium touch emulation is included in CI.


## v0.8 settings version 3

Controls → Placement selects **Below arena** (default separate 136px deck) or **Over arena**. Opacity slider ranges 25–100%, default 65%; active controls brighten slightly. Drag/resize settings are separate for dock and overlay, plus existing viewport profiles. The dock constrains targets below the visible battle area. Use Reset layout for that placement/profile; Save persists the draft, Cancel restores it. Editor labels and selected outline stay readable while adjusting opacity.

Existing v1/v2 custom keyboard mappings and overlay layouts are preserved. New dock layouts start fresh so old overlay coordinates do not obscure the new fighting viewport. Default P2 dash is [ / ]; migration only adds missing bindings if their keys are unused. Storage key stays unchanged; version migration is automatic. Opacity and placement persist alongside keyboard/layout choices.

The play surface prevents native touch scroll, double-tap zoom and gesture zoom while actively fighting; menus/roster retain normal scrolling and page zoom outside the play surface. Fullscreen still attempts a landscape orientation lock where supported. Otherwise portrait pauses the game and asks the player to rotate; browser support determines whether physical orientation can be locked.

## v0.11 — full movement stick and fullscreen

- Horizontal deflection still scales walking speed.
- Pull up firmly to jump. Center the stick (or release it), then pull up again while airborne to double jump. Holding up does not repeat, even after landing.
- Pull right → center → right within **300 ms** to dash right; left → center → left dashes left. Direction is absolute screen direction, independent of facing. Normal finger release counts as centering; cancel/blur/rotation clears gesture history. Holding, small jitter or opposite pulls do not double-dash.
- Hold a downward-dominant pull to crouch; center/release stands. Upward diagonals can jump while retaining horizontal air control. Firm-pull and center thresholds use hysteresis to avoid accidental repeats.
- Existing jump/dash buttons and keys continue to work. Keyboard crouch defaults to **S** / **Down arrow** and is rebindable. Settings v4 retains existing layouts, opacity, placement and custom keys; it only adds unused default crouch bindings. No extra touch button crowds the deck.
- Crouch is grounded, stops walking, and lowers the projectile hurtbox. It does not auto-guard or avoid ordinary melee/body-height projectiles. A jump/attack/dash stands the fighter; hitstun prevents crouching normally.

**Full screen** now requests native fullscreen from the tap, supports prefixed implementations, sizes the entire game to the viewport, and toggles **Exit view**. Native exit events restore the normal layout. Orientation lock is attempted after successful native fullscreen; the portrait prompt remains when locking is unavailable. The fullscreen target includes dialogs and the rotation prompt.

When the native API is missing, disabled or rejects the request, a clearly labeled **Play view** fills the available visual viewport. This CSS fallback cannot remove the browser's address bar. A visible notice explains the limitation; Exit view or Escape restores the page. Entering/exiting pauses the fight and clears held input. Fullscreen compatibility is feature-detected, not guessed from the device name.

Reference: [MDN requestFullscreen](https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen) and [fullscreenEnabled](https://developer.mozilla.org/en-US/docs/Web/API/Document/fullscreenEnabled).

## v0.13 visibility and inventory

Settings schema 5 adds a `visibility` boolean per touch control. Controls shows a checkbox list; hidden nodes are removed from hit testing and collision validation, while keyboard bindings remain intact. Save persists a draft; Cancel restores previous visibility and layout. Hidden controls can always be restored from the top-bar Controls button. Hiding jump/dash buttons leaves the analog gestures available unless the stick is also hidden.

Three new controls are Swap weapon (F / P2 7), Choose consumable (C / P2 8), and Use consumable (X / P2 9). Existing settings versions 1–4 migrate; new keys are added only when unclaimed, preserving custom bindings. New buttons receive sensible defaults and are repositioned around existing custom controls during migration. Native mobile UI hiding is scoped to the help panel so inventory and visibility details remain available on phones.

## v0.15 additional jutsu inputs

Seven equipped jutsus use U/I/O and 1/2/3/4 for P1; P2 uses comma/period/slash and Num 1–4. G (P1) / Num 0 (P2) charges chakra while held. All actions are rebindable. Settings version 6 adds unused default keys without stealing saved bindings. The existing 15 repositionable controls retain visibility, size, position and opacity. Extra technique slots and charge are available in the Jutsus palette; this transient menu closes after choosing a technique and does not permanently cover the arena.

## v0.18 equipped deck and movement

The analog now drives horizontal and shallow depth movement; it no longer casts Jump or Crouch. Dedicated Jump remains, with Crouch and Hold Charge visible in the equipped technique row. The row displays all equipped slots with names/cooldowns; extra slots, Charge and Crouch have visibility checkboxes. Keyboard depth is Z/L for P1 and Num 9/Num 6 for P2. Existing custom bindings and hidden-control choices migrate without being overwritten.

## v0.19 game feel

Feel opens analog dead-zone/sensitivity/double-pull timing, left-handed/floating controls, compact duplicate-button hiding, equipped-row scale/offset, screen shake/particles, optional hold-drag-release jutsu aiming and experimental online movement prediction. Crouch Guard in the equipped row holds both actions with one touch. Practice speed affects offline Practice only. Existing Controls remains the per-button position, size, visibility and opacity editor; Feel does not overwrite its saved layout.

## v0.20 visual controls

Show hints / Hide hints toggles the Practice coach without resetting the dummy or drill; the preference survives reload. Hide is also available on the panel. Jutsus use the same original SVG pictograms in selection, the equipped row, expanded menu and signature controls. Coarse-pointer devices show compact icons and cooldown/key indicators; names remain accessible labels/tooltips. Unused slots stay hidden, and all existing visibility/opacity controls continue to apply.
