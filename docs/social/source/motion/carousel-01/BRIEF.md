---
workflow: motion-graphics
flow: automation
storyboard: no
message: "Parkir dimulai sebelum tiba."
destination: instagram-carousel
aspect: 1080x1350
language: id
length: 6s
---

## Intent

Slide 01 of the KENNETH carousel as a silent, seamlessly looping video. The carousel-long road (see ../../../GUIDE.md) enters from the top; a top-down car drives it downward, slows through the corners, and exits right toward slide 02. Copy is static from frame 0.

## Rules

- Road geometry comes from ../../static/carousel_01.py (road.js + static path `d`); never edit it by hand.
- Only the car moves; background drift returns to its start for a clean loop.
- 1080 x 1350, 30 fps MP4, no audio.
