# Landscape mobile design

## Screen regions

| Region | Layout and interaction |
| --- | --- |
| Upper left/right | Fighter name, HP and chakra; remain outside thumb regions |
| Upper centre | Round timer and compact pause/settings button |
| Middle | Battlefield, fighters and readable combat feedback |
| Lower left | Analog stick, separate double-jump and explicit back/forward dash buttons |
| Lower right | Basic, equipped weapon, guard, Replacement, signatures and bloodline |
| Safe edges | Pad for camera cutout, home indicator and rounded screen corners |

The playable arena uses an analog stick and a circular action cluster. Touch controls can be dragged and resized in the paused Controls editor. The pre-battle screen selects characters and weapons. Artwork remains procedural.
Test at 844×390 and 915×412 CSS viewports and a smaller 667×375 viewport, plus physical devices.
Do not stretch simulation coordinates to match device aspect ratio: use a virtual arena and letterboxing
or explicitly defined camera framing so a wider phone doesn't change combat reach.

## Rotation

Menus may work in portrait. Fighting requires landscape: show a full-screen rotate prompt and
make covered controls inert. Request fullscreen/orientation lock only following a user gesture.
If either API is missing or rejected, manual rotation remains fully functional.
Never promise that a website can force orientation on every phone.

Local gameplay: portrait, blur or hidden state clears inputs and pauses the simulation. Return to
landscape shows a resume action/countdown, rather than unexpectedly resuming into an attack.
Online gameplay: clear local inputs; the authoritative match keeps running under a published grace/forfeit
policy. The overlay must explain that the match is still live. Do not pause another player's match.

## Multi-touch

Use pointer events and pointer capture. Every held action tracks independent keyboard/pointer sources.
Releasing one finger must not release another action or a second source holding that same action.
Clear on pointercancel, lostpointercapture, window blur, visibility changes and orientation changes.
Apply `touch-action: none` to game controls, not globally to the entire site.
Support moving plus attacking/blocking simultaneously. Resolve left+right as neutral in the simulation.
Edge-trigger jump and specials; don't repeat them every simulation tick while held.

## Physical-device release checklist

- [ ] iPhone Safari, both landscape orientations, fullscreen unavailable and available paths.
- [ ] Android Chrome, browser bars expanded/collapsed, fullscreen on/off.
- [ ] Hold move + attack; lift one finger; other action stays held.
- [ ] Pointer leaves button, is cancelled, or capture is lost: no stuck action.
- [ ] Portrait gate prevents keyboard and touch actions behind it.
- [ ] App switch, lock screen and return: no hidden input, correct pause/resume.
- [ ] Touch targets don't overlap; controls avoid safe-area cutouts.
- [ ] Scaled text remains readable; narrow landscape layout doesn't cover vital combat information.
- [ ] Settings allow comfortable button sizes and left/right-handed layouts.
- [ ] Keyboard focus is visible; interface navigation works without a mouse.

Automated emulation complements these checks but does not replace physical-device evidence.



## v0.8 unobstructed play

Default touch targets now occupy a separate bottom deck, outside the battle viewport. The responsive camera fills the remaining fight area while retaining horizontal arena coordinates, avoiding miniature letterboxed fighters. Opacity is user-adjustable (25–100%) and placement may switch back to an overlay. Layout editor keeps both placements independently.

Live gameplay uses touch-action:none plus scoped non-passive touch/gesture prevention. Outside gameplay, native menu scrolling/zoom remain available. Portrait is paused behind the rotate gate. A browser cannot always honor an orientation lock; fullscreen requests it when available. Mobile checks emulate simultaneous jump/dash touches and repeated taps without viewport scale or scroll changes; physical iOS/Safari verification remains manual.
