# Edge cases

What happens when the prototype is pushed off the happy path, which cases were broken and are now fixed, which ones were already handled, and which are known limits. Every case marked **Tested** is checked by `tools/edge-cases.py`, which runs in headless Chrome:

```
python3 -m http.server 8765        # from the repo root
python3 tools/edge-cases.py        # prints PASS / FAIL per case, exits 1 on a failure
```

Date of this review: 2026-11-13.

## Fixed in this review

| # | Case | What used to happen | What happens now | Tested |
| :-: | :--- | :--- | :--- | :-: |
| 1 | **Balance lower than the bet** (a high bet, or a long session) | The spin ran anyway and the balance went negative. Autoplay kept spinning at a negative balance forever | Before a spin, the bet drops to the highest one the balance covers ("BET LOWERED TO €2.00" shows above the balance for 2.6 s). If the balance is below the smallest bet (€0.10) the demo balance is refilled to the start balance ("DEMO BALANCE REFILLED"). The balance never goes below zero | Yes |
| 2 | **Presentation speed changed during a round** (the demo panel slider) | Every animation timer reads the speed live, so a win animation could speed up or slow down halfway, and a slowed one was cut off by the wait that had already been set | The slider value is held until the next spin starts (`Game.setSpeed`). The readout updates at once and its tooltip says it applies from the next spin | Yes |
| 3 | **AUTO switched off and on again while a round is running** | Two autoplay loops ran side by side, so spins came faster than one loop can do | One loop at a time: each loop carries an id and a loop that has been replaced stops | Yes |
| 4 | **An error thrown in the middle of a round** (any bug, a bad cheat) | The error was logged and the round ended, but a banner, modal, transition, the reel-spin state or the free-spins look could stay on screen, and autoplay kept going into the same error | The round resets all of it (spinning, banner, modal, transition, anticipation, wipe lock, free-spins look and background, autoplay) and the next spin works | Yes |
| 5 | **Malformed cheat items**: a symbol-win with a missing, text or out-of-range symbol or length; a `custom` item with no grid or a wrong-sized grid | A wrong grid crashed the spin; an out-of-range symbol searched for a board that cannot exist | The symbol is clamped to 0 to 6 and the length to 3 to 5. A malformed custom grid plays as a normal spin. The queue label uses the same clamping | Yes |
| 6 | **A scenario link with an unknown id** (`?scenario=typo`) | Nothing happened, with no message | The cheat toast says "Unknown scenario: typo" | Yes |
| 7 | **Several winners with sheets in one step, one of which upgrades** | When Mrs Claus (or any sheet symbol) upgraded, the upgrade started when the longest upgrading sheet ended, but another winner in the same step could be cut off, because the rest of the step only waited the standard 35 ticks | After the upgrade, the step waits at least until the longest sheet in the step has finished (48 ticks from the start) | By playing all six symbols |
| 8 | **Asset loading throws** (not just a 404) | The splash screen stayed up and the game never started | The error is logged, the game starts with placeholders and the splash leaves | Reviewed |
| 9 | **Stale cheat doc**: said only Santa has a sprite sheet | | `docs/cheats.md` now says every symbol except the Gift egg plays its sheet | n/a |

## Already handled (checked, no change needed)

| Case | Behaviour | Tested |
| :--- | :--- | :-: |
| A win sheet image fails to load or is removed from the manifest | `Assets.winSprite` returns nothing and the symbol uses the scale pulse and upgrade. No error | Yes |
| Every win sheet | The first pass shows frames 0 to 15 in order, at 3 ticks (100 ms) each, for Santa, Mrs Claus, Elf, Nutcracker, Snowman and Gingerbread | Yes |
| Space pressed many times during a round | The extra presses only skip skippable waits; the round completes and the game ends in a normal state | Yes |
| Small, portrait and landscape phone windows | The 16:9 canvas is scaled inside the window and never overflows (390×844, 844×390, 1024×768 checked) | Yes |
| Spin pressed while the info screen is open, or while a round is running | Ignored (`play()` returns at once) | Reviewed |
| Bet changed during a round | Locked while busy | Reviewed |
| Fonts slow to load | The game starts after 2.5 s anyway | Reviewed |
| Forced list empty or used up in the middle of free spins | Free spins take list items first, then random spins; the list scenario stops when the list is gone | Reviewed |
| Win over the cap (390× the bet) | The round ends and the summary shows "MAX WIN 390× REACHED" | Reviewed (scenario `max-win`) |
| Music or sound blocked by the browser until the first click | Audio starts on the first press or click | Reviewed |
| Cheat controls in recordings | They are page elements, so they never appear in a recording | Reviewed |

## Known limits (not fixed)

- **Console messages for missing art.** The manifest lists optional assets that have not been delivered (reel frame, reel strips, UI buttons, sounds). The browser logs a 404 for each and the game uses its placeholder. This is expected, and the edge-case script ignores these messages.
- **Win sheets are fixed at 3 ticks a frame.** If a sheet feels fast, raise `tpf` in `assets/manifest.js` (4 = 133 ms a frame, 2.1 s). The Gift egg has no sheet and uses the pulse.
- **Sheet art limits.** The generated sheets are cleaned and pinned to the round bottom by tools, but they are still AI frames: tiny differences in shading and pose remain. Where the generator's corner sparkle overlapped a body, the body outline in that spot was rebuilt, which can leave a slightly soft edge when zoomed in.
- **Hidden browser tab.** Browsers slow timers in a hidden tab. A round started and then hidden will finish, but slowly, and its animations jump forward when the tab returns. Not tested.
- **Speed slider changes wait for the next spin.** This is deliberate (case 2), but during a long free-spins round the new speed applies from the next free spin, not from the next frame.
- **Recording** (the built-in recorder) was not part of this pass.
- **Not implemented**: Spine animation, the reel anticipation slowdown and the portrait layout (see the README status table).

## Adding a case

Add a block to `tools/edge-cases.py` (use `fresh()` for a new page and `check(name, ok)`), add a row here, and add a line to the CHANGELOG. Evaluate calls that start a round must use `void Game.play()`, because Playwright otherwise waits for the whole round to finish.
