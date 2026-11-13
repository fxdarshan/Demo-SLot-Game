# Cheats and scenarios

Cheats force what the next spin, or a whole sequence of spins, will do. They're for demos, QA and video capture. Every forced outcome except the three marked * is a real result from the maths engine: the same rules, pays and animations as a normal spin, with the reels set up to land that way.

The cheat controls are page elements drawn over the game, not part of the game canvas, so **they never appear in recordings**. The code is in `src/cheats.js`; the outcome builders are in `src/director.js`.

## Cheat menu

Press **C**, or click **Cheats (C)** at the top left of the game. **Esc** closes it.

- **Play a scenario:** a dropdown of the preset sequences (with a one-line description under it). **Play** runs the chosen one straight away; **Link** copies a URL that opens the game and plays it.
- **Symbol win:** two dropdowns, a symbol (Santa, Mrs Claus, Elf, Nutcracker, Snowman, Gingerbread, Gift Egg) and a line length (3, 4 or 5 in a row). **Force next spin** queues it; **Play now** queues it and spins. See [Symbol wins](#symbol-wins).
- **Force the next spin:** the same actions as the hotkeys below.
- **Clear forced (0):** removes forced spins that haven't played yet.

When a forced spin is waiting, a purple chip at the bottom left shows what's next, for example "Next: MEGA banner (+3 more)".

## Hotkeys

Each key puts one outcome at the front of the list. Press **Space** to spin.

| Key | Next spin |
| :---: | :--- |
| `1` | NICE WIN banner (real 15–25× win) |
| `2` | BIG WIN banner (real 25–34× win) |
| `3` | MEGA WIN banner * |
| `4` | SUPERB WIN banner * |
| `5` | SENSATIONAL WIN banner * |
| `6` / `G` | Wipe of 15 Yellows → Ghosts, 100× special award, EPIC banner |
| `F` | Free spins (Wild lands with a star and opens to the Dance Bear) |
| `S` / `M` / `A` | Scare Bear large (3 upgrades) / medium (2) / small (1) |
| `H` | Charm Bear |
| `U` | Upgrade chain (2 or more upgrade rounds) |
| `W` | Wipe of a lower value (15 of one doll upgrade once) |
| `X` | Single small win |
| `N` | No win |
| `0` | Clear forced spins |
| `C` | Open / close the cheat menu |
| `D` | Hide / show the demo panel |
| `Space` | Spin |

**\* Presentation cheats.** Under the official rules each payline pays only its highest win, so one spin without a wipe tops out at about 34× (17 lines × Yellow 5-of-a-kind). MEGA (50×), SUPERB (100×) and SENSATIONAL (250×) can't happen on a single spin. These cheats play a real big-win board, then show the requested banner with an amount inside that tier's range, and credit that amount. Use them to review banner art and animation, not maths.

## Symbol wins

Pick a symbol and 3, 4 or 5 in a row to see that symbol's win animation (every symbol except the Gift Egg plays its 16-frame sprite sheet; the Gift Egg uses the scale pulse; lower symbols still upgrade afterwards). The board puts the symbol on the middle payline for exactly that length, with no Wild or bear, and the search only accepts boards where that symbol is the win. Wins of lower symbols can still upgrade into higher ones afterwards, as in a normal spin. It is a real engine result, so the maths is unchanged. The same dropdowns are in the demo panel under **Next spins** (**Add to list**), where the item is labelled for example "Elf win, 4 in a row". In code it is the outcome `{ type: 'symwin', sym: 0-6, len: 3-5 }`.

## Scenarios

| ID | Name | Sequence |
| :--- | :--- | :--- |
| `all-banners` | All win banners | NICE, BIG, MEGA*, SUPERB*, SENSATIONAL*, EPIC (Ghost) |
| `free-spins` | Free spins | Dance Bear trigger, then 7 random free spins |
| `free-spins-big` | Free spins: big round | Trigger, then Charm, large Scare, chain, Wipe, NICE, win, Ghost inside the free spins |
| `retrigger` | Free spins retrigger | Trigger, then a Dance Bear during free spins adds 7 more (14 spins) |
| `all-bears` | Every bear | Scare small, medium, large, Charm, Dance into free spins |
| `wipe-ghost` | Wipe and Ghost | A wipe of one value, then 15 Yellows becoming Ghosts |
| `max-win` | Max win cap (390×) | Free spins with repeated Ghost awards; the 390× cap ends the round and the summary shows "MAX WIN 390× REACHED" |
| `base-tour` | Base game tour | No win, win, chain, Scare, Charm, NICE, BIG, Wipe |

To change a scenario, edit `SCENARIOS` in `src/cheats.js`. Each item is an outcome type from `Director.OUTCOMES` (`src/director.js`).

Free spins take their outcomes from the same list, so items after a trigger play inside the free spins. When the list runs out, spins go back to random, and a scenario stops once its list is used up.

## Recording a scenario

1. In the demo panel's **Scenarios** section, pick the scenario in the dropdown and press **Load into list**.
2. Under **Record video**, choose **Whole list** and press **Record**.
3. Press **D** first to hide the panel. The cheat button and chip are page elements and are never captured.

## Scenario links

Open the game with `?scenario=<id>` (or `#scenario-<id>`) and it loads that scenario and plays it automatically:

```
index.html?scenario=free-spins-big
https://fxdarshan.github.io/Demo-SLot-Game/?scenario=all-banners    (once GitHub Pages is on)
dist/x-mas-dolls-prototype.html?scenario=max-win
```

Browsers keep sound off until the viewer clicks the page, so a scenario opened from a link starts silent.

The scenario starts once the splash screen has faded out. Add `&nosplash` (for example `?scenario=all-banners&nosplash`) to skip the splash. The cheat menu and hotkeys are covered by the splash while it is showing.

## Notes

- Cheats don't change the maths. `tools/simulate.js` and the RTP figures ignore them.
- Forced outcomes use the current bet and the same 390× round cap as normal play.
- With a presentation cheat (*), the balance moves by the shown amount, so the balance during a cheat session isn't meaningful.
