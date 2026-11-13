#!/usr/bin/env python3
"""Regression checks for the edge cases in docs/edge-cases.md. Needs Playwright and Chrome.

    python3 -m http.server 8765 &        # from the repo root
    python3 tools/edge-cases.py [http://localhost:8765/index.html?nosplash]
Prints PASS / FAIL per case and exits 1 if anything failed.
"""
import asyncio, sys
from playwright.async_api import async_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8765/index.html?nosplash'
results = []

def check(name, ok, detail=''):
    results.append(ok); print(('PASS ' if ok else 'FAIL ') + name + (f'  [{detail}]' if detail and not ok else ''))

async def idle(pg, timeout=90000):
    await pg.wait_for_function('!Game.G.busy', timeout=timeout)

async def fresh(b, url=URL, w=1920, h=1080):
    pg = await b.new_page(viewport={'width': w, 'height': h}); pg.errs = []
    pg.on('pageerror', lambda e: pg.errs.append(str(e)))
    pg.on('console', lambda m: pg.errs.append(m.text) if m.type == 'error' and 'expected failure' not in m.text and 'Failed to load resource' not in m.text else None)
    await pg.goto(url); await pg.wait_for_function('Game.G.assetInfo', timeout=30000); await pg.wait_for_timeout(300)
    return pg

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome')

        # 1 balance: bet above the balance is lowered, balance never goes negative
        pg = await fresh(b)
        await pg.evaluate("Game.G.balance = 3; Game.G.betIndex = Game.C.bets.length - 1; void Game.play()")
        await pg.wait_for_timeout(300)
        bet = await pg.evaluate("Game.bet()"); await idle(pg)
        bal = await pg.evaluate("Game.G.balance")
        check('balance: bet lowered to what the balance covers', bet <= 3 and bet == 2, f'bet {bet}')
        check('balance: never negative', bal >= 0, f'balance {bal}')
        # 2 balance below the smallest bet refills the demo balance
        await pg.evaluate("Game.G.balance = 0.05; void Game.play()"); await pg.wait_for_timeout(300)
        bal = await pg.evaluate("Game.G.balance"); await idle(pg)
        check('balance: refilled when below the smallest bet', bal > 500, f'balance {bal}')
        check('balance cases: no page errors', not pg.errs, str(pg.errs)); await pg.close()

        # 3 speed slider mid-round applies from the next spin
        pg = await fresh(b)
        await pg.evaluate("void Game.play()"); await pg.wait_for_timeout(400)
        await pg.evaluate("Game.setSpeed(3)")
        mid = await pg.evaluate("Game.G.speed"); await idle(pg)
        after = await pg.evaluate("Game.G.speed")
        check('speed: unchanged during a round', mid == 1, f'{mid}'); check('speed: applied after the round', after == 3, f'{after}')
        await pg.close()

        # 4 AUTO toggled off and on while busy runs one loop only
        pg = await fresh(b)
        await pg.evaluate("window.__n = 0; const o = Game.director.build; Game.director.build = (...a) => { window.__n++; return o(...a); }; Game.G.speed = 3; Game.G.speedWanted = 3; 0")
        await pg.evaluate("void Game.play()"); await pg.wait_for_timeout(200)
        await pg.evaluate("void Game.autoplayLoop(); void Game.autoplayLoop(); void Game.autoplayLoop()")      # on, off, on
        await idle(pg); await pg.wait_for_timeout(100)
        t0 = await pg.evaluate("window.__n"); await pg.wait_for_timeout(8000)
        t1 = await pg.evaluate("window.__n")
        await pg.evaluate("Game.G.autoplay = false"); await idle(pg)
        per = (t1 - t0) / 8
        check('autoplay: a single loop (not double spin rate)', per < 0.75, f'{per:.2f} spins/s')
        await pg.close()

        # 5 malformed cheat items do not crash
        pg = await fresh(b)
        await pg.evaluate("Game.G.queue.push({type:'symwin', sym:'x', len:99}, {type:'symwin', sym:-4, len:0}, {type:'custom'}, {type:'custom', grid:[[1]]}, {type:'nonsense'})")
        for _ in range(5):
            await pg.evaluate("void Game.play()"); await idle(pg)
        check('malformed cheat items: all five spins complete, no errors', not pg.errs, str(pg.errs)); await pg.close()

        # 6 unknown scenario link
        pg = await fresh(b, URL + '&scenario=does-not-exist')
        await pg.wait_for_timeout(2500)
        txt = await pg.evaluate("document.querySelector('.cheat-toast')?.textContent || ''")
        check('unknown scenario link: message, no crash', 'Unknown scenario' in txt and not pg.errs, f'{txt!r} {pg.errs}'); await pg.close()

        # 7 an error in the middle of a round leaves nothing stuck
        pg = await fresh(b)
        await pg.evaluate("const o = Game.director.build; let n = 0; Game.director.build = (...a) => { if (n++ === 0) throw new Error('expected failure'); return o(...a); }; 0")
        await pg.evaluate("void Game.play()"); await pg.wait_for_timeout(500)
        st = await pg.evaluate("({busy: Game.G.busy, spinning: Game.G.spinning, banner: !!Game.G.banner, modal: !!Game.G.modal, fs: Game.G.fs.active})")
        check('error mid-round: game not stuck', not st['busy'] and not st['spinning'] and not st['banner'] and not st['modal'] and not st['fs'], str(st))
        await pg.evaluate("void Game.play()"); await idle(pg)
        check('error mid-round: next spin works', True); await pg.close()

        # 8 Space spam during a round
        pg = await fresh(b)
        await pg.keyboard.press('Space')
        for _ in range(60):
            await pg.keyboard.press('Space'); await pg.wait_for_timeout(30)
        await idle(pg)
        check('space spam: round completes, no errors', not pg.errs, str(pg.errs)); await pg.close()

        # 9 a win sheet that fails to load falls back to the pulse
        pg = await b.new_page(viewport={'width': 1920, 'height': 1080}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.route('**/sym_03_nutcracker_win_sheet.webp', lambda r: r.abort())
        await pg.goto(URL); await pg.wait_for_function('Game.G.assetInfo', timeout=30000)
        has = await pg.evaluate("Assets.winSprite(3)")
        await pg.evaluate("Game.G.queue.push({type:'symwin', sym:3, len:3}); void Game.play()"); await idle(pg)
        check('missing win sheet: falls back, no errors', has is None and not errs, f'{has} {errs}'); await pg.close()

        # 10 every win sheet plays all 16 frames in order, and a winner's sheet is not cut by an upgrade
        pg = await fresh(b)
        await pg.evaluate("""const o = CanvasRenderingContext2D.prototype.drawImage; window.__f = [];
          CanvasRenderingContext2D.prototype.drawImage = function (img, sx, sy, sw, sh) { if (arguments.length == 9 && img.width == 1600) window.__f.push((sx / 400 | 0) + 4 * (sy / 400 | 0)); return o.apply(this, arguments); }; 0""")
        bad = []
        for sym in range(6):
            await pg.evaluate(f"window.__f.length = 0; Game.G.queue.push({{type:'symwin', sym:{sym}, len:3}}); void Game.play()")
            await idle(pg)
            seq = await pg.evaluate("window.__f"); runs = []
            for i in seq:
                if not runs or runs[-1][-1] != i: runs.append([i]) if (not runs or i == 0) else runs[-1].append(i)
            if not runs or runs[0] != list(range(16)): bad.append((sym, runs[:1]))
        check('win sheets: first pass is frames 0 to 15 in order for all six symbols', not bad, str(bad)); await pg.close()

        # 11 small / portrait window keeps the game inside the viewport
        for (w, h) in [(390, 844), (844, 390), (1024, 768)]:
            pg = await fresh(b, URL, w, h)
            r = await pg.evaluate("(() => { const r = Game.canvas.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom, innerWidth, innerHeight] })()")
            ok = r[0] >= -1 and r[2] <= r[4] + 1 and r[1] >= -1 and r[3] <= r[5] + 1
            check(f'viewport {w}x{h}: canvas inside the window', ok, str(r)); await pg.close()

        await b.close()
    print(f'\n{sum(results)}/{len(results)} passed'); sys.exit(0 if all(results) else 1)

asyncio.run(main())
