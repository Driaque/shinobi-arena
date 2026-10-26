# Analog movement and control settings · 0.4.0

## Playing

The left thumbstick is an analog horizontal input for the side-view fighter. Its radial dead zone is
18% of stick travel. Outside that zone, horizontal deflection scales movement from zero to full speed.
Vertical motion moves the knob visually but does not jump or move the fighter vertically. Jump and dash
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

## Persistence and responsive layouts

Settings are versioned in localStorage under `shinobi-arena.controls.v1`, scoped to this browser and site.
They do not sync between devices. Touch layouts have separate small (<720 px arena), medium (<1000 px)
and large screen profiles. Positions are stored as normalized coordinates and projected into safe bounds
on resize. A profile without a saved layout uses its responsive defaults. Key bindings are shared across
profiles. Saving while storage is unavailable applies settings in memory and reports that they will not
survive closing the page. Missing, corrupt or incompatible settings fall back to defaults.

Physical iPhone/Android testing remains pending; Chromium touch emulation is included in CI.
