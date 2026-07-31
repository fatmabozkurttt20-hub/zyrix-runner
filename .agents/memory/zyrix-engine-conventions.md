---
name: ZYRIX engine conventions
description: Durable design rules for the ZYRIX pseudo-3D runner engine (speed boosts, restart keys, review workflow)
---

# ZYRIX engine conventions

- **Temporary speed effects multiply movement, never mutate the base speed.** Overdrive applies an eased 0..1 boost factor (`moveSpeed = g.speed * (1 + k*boost)`) to object movement/score/distance/scroll. **Why:** the base ramp (`g.speed`) must stay deterministic so effects end by easing the multiplier back to 1 with zero snap and no drift. **How to apply:** any future powerup/slowdown should follow the same multiplier pattern.
- **One-shot visual effects must key off `runKey`** (increments when the run clock resets) — GameScene may not remount between runs. Also reset any airborne/edge-detection refs on run reset to avoid phantom triggers.
- **Code review runs as a persistent architect subagent** continued via `sendFollowup({ name: "code-review-fec8", ... })` — never spawn a fresh reviewer. Verify reviewer claims about "previously merged" behavior against git log before acting: parallel task agents mean the reviewer's memory of merges can be ahead of or behind actual main.
- Crystal/orb pickups gate on `visualLane()` (eased lane during slides), same window constants as crystals; keep new collectibles consistent with that.
