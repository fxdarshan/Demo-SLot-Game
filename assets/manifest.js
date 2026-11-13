/*
 * ASSET MANIFEST
 * ---------------------------------------------------------------------------
 * Keys are the asset IDs from docs/game-asset-specification.md
 * ([type]_[category]_[asset_name]_[state]). To replace placeholder art or
 * sound, save a file at the listed path (or change the path) and reload.
 * Missing files keep the built-in placeholder, so assets can be swapped one by one.
 *
 * Sizes (PNG with transparency unless noted):
 *   sym_*  .................................. 300 x 300, centred, same framing for every symbol
 *   bg_*_main ............................... 1920 x 1080 (no transparency needed)
 *   bg_*_frame .............................. 1920 x 1080 overlay, transparent where the reels show
 *   bg_base_reel_strip ...................... one reel column, about 270 x 810 (stretched to the column)
 *   btn_* ................................... about 160 x 160 (spin), 80 x 80 (others)
 *   ui_bar_bottom ........................... 1920 x 110
 *   ui_splash_logo .......................... transparent logo, about 900 x 700 (fitted on the splash screen)
 *   modal_freespins_* ....................... up to about 1200 x 900 panel (fitted on screen); text is drawn on top
 *   banner_win_* ............................ up to about 1000 x 900 title art (fitted on screen); the amount is drawn below it
 * The symbol upgrade animation splits each doll at symbolSplitY (fraction of height)
 * into a lid and a base; keep the doll's seam near that line or change the value.
 *
 * Sounds: MP3 or WAV. They only load when the game is served over http(s) (README: "Run it").
 * Spine 2D skeletons listed in the asset spec are not wired in yet; see README "Next steps".
 */
window.ASSET_MANIFEST = {
  symbolSplitY: 0.47,

  // Sprite sheets that replace a symbol's win pulse (sym_xx_win). Frames run left to right, top to bottom.
  //   tpf: ticks (1/30 s) each frame is held, whole ticks so every frame lasts the same time (16 x 3 = 48 ticks = 1.6 s, 100 ms a frame).
  //   loops: alternative to tpf: how many times the whole sheet plays during the symbol win window (CONFIG.frames.symWin, 45 ticks = 1.5 s).
  //   holds: alternative to tpf: ticks (1/30 s) each frame stays on screen; the sum is stretched over the win window
  //   scale: drawn size of one frame as a multiple of the symbol size (makes the body match the idle art)
  //   ox, oy: offset from the symbol centre, as a fraction of the symbol size (lines up the body with the idle art)
  // tools/asset-pipeline/cut_sprite_sheet.py prints scale, ox and oy when run with --idle.
  sprites: {
    sym_00_win: { cols: 4, rows: 4, tpf: 3, scale: 1.2047, ox: -0.0412, oy: -0.0576 },
  },

  images: {
    // 2.1 environment
    bg_base_main:        'assets/images/environment/bg_base_main.jpg',        // snowy cabins under the northern lights
    bg_base_frame:       'assets/images/environment/bg_base_frame.png',
    bg_base_reel_strip:  'assets/images/environment/bg_base_reel_strip.png',
    // 3.1 free game environment
    bg_freegame_main:    'assets/images/environment/bg_freegame_main.jpg',    // cosy firelit living room
    bg_freegame_frame:   'assets/images/environment/bg_freegame_frame.png',
    fx_reel3_guaranteed_wild_indicator: 'assets/images/fx/fx_reel3_guaranteed_wild_indicator.png',
    vfx_anticipation_reel3: 'assets/images/fx/vfx_anticipation_reel3.webp',   // golden spiral over reel 3 (drawn additive)

    // 2.2 UI / HUD
    ui_splash_logo:      'assets/images/ui/ui_splash_logo.webp',            // X-Mas Dolls logo for the splash / loading screen
    ui_bar_bottom:       'assets/images/ui/ui_bar_bottom.png',
    btn_spin_idle:       'assets/images/ui/btn_spin_idle.png',
    btn_spin_active:     'assets/images/ui/btn_spin_active.png',
    btn_spin_disabled:   'assets/images/ui/btn_spin_disabled.png',
    btn_auto_idle:       'assets/images/ui/btn_auto_idle.png',
    btn_auto_active:     'assets/images/ui/btn_auto_active.png',
    btn_bet_plus:        'assets/images/ui/btn_bet_plus.png',
    btn_bet_minus:       'assets/images/ui/btn_bet_minus.png',
    btn_info:            'assets/images/ui/btn_info.png',
    ui_freegame_counter: 'assets/images/ui/ui_freegame_counter.png',

    // 4.1 standard symbols (idle frames)
    // Holiday art set (2026-11-13). Tier order = pay value, 0 highest.
    sym_00_idle: 'assets/images/symbols/sym_00_santa_idle.png',         // Tier 0 Santa (highest)
    sym_01_idle: 'assets/images/symbols/sym_01_mrs_claus_idle.png',     // Tier 1 Mrs Claus
    sym_02_idle: 'assets/images/symbols/sym_02_elf_idle.png',           // Tier 2 Elf
    sym_03_idle: 'assets/images/symbols/sym_03_nutcracker_idle.png',    // Tier 3 Nutcracker
    sym_04_idle: 'assets/images/symbols/sym_04_snowman_idle.png',       // Tier 4 Snowman
    sym_05_idle: 'assets/images/symbols/sym_05_gingerbread_idle.png',   // Tier 5 Gingerbread
    sym_06_idle: 'assets/images/symbols/sym_06_gift_idle.png',          // Tier 6 Gift egg (lowest)

    // 4.2 special and mystery symbols
    sym_wild_idle:        'assets/images/symbols/sym_wild_idle.png',        // star snow-globe matryoshka
    sym_wild_star_idle:   'assets/images/symbols/sym_wild_star_idle.png',   // same doll with a gold aura (will open)
    sym_bear_scare_small: 'assets/images/symbols/sym_bear_scare_small.png',  // grumpy 'Frost Frenzy' reindeer, 3 sizes
    sym_bear_scare_med:   'assets/images/symbols/sym_bear_scare_med.png',
    sym_bear_scare_large: 'assets/images/symbols/sym_bear_scare_large.png',
    sym_bear_charm:       'assets/images/symbols/sym_bear_charm.png',       // elegant reindeer with glowing antlers
    sym_bear_dance:       'assets/images/symbols/sym_bear_dance.png',       // joyful jingle-bell reindeer
    sym_ghost_idle:       'assets/images/symbols/sym_ghost_idle.png',
    sym_00_win:           'assets/images/symbols/sym_00_santa_win_sheet.webp',   // Santa win animation: 4 x 3 sprite sheet, see sprites below

    // 7 banners and modals (panel / title art; text and amounts are drawn on top)
    modal_freespins_intro:   'assets/images/banners/modal_freespins_intro.webp',   // 'Festive Win!' frame; text drawn in the centre
    modal_freespins_outro:   'assets/images/banners/modal_freespins_outro.webp',   // 'Total Win!' wooden sign; amount drawn on the board
    banner_win_nice:         'assets/images/banners/banner_win_nice.webp',          // 'Nice List!' wreath
    banner_win_big:          'assets/images/banners/banner_win_big.png',
    banner_win_mega:         'assets/images/banners/banner_win_mega.webp',          // 'Merry Mega!' golden star
    banner_win_superb:       'assets/images/banners/banner_win_superb.webp',        // 'Superb Sleigh Ride!' bells
    banner_win_sensational:  'assets/images/banners/banner_win_sensational.webp',   // 'Sensational Snowfall!' ice
    banner_win_epic:         'assets/images/banners/banner_win_epic.webp',          // 'Epic Christmas!' sleigh (also the Ghost award)

    // 8 pay line visualisation (line_overlay_01..17 are drawn as paths in code)
    line_node_highlight:     'assets/images/fx/line_node_highlight.png'
  },

  sounds: {
    bgm_basegame_loop:      'assets/audio/bgm_basegame_loop.mp3',
    bgm_freegame_loop:      'assets/audio/bgm_freegame_loop.mp3',
    sfx_spin_button_click:  'assets/audio/sfx_spin_button_click.mp3',
    sfx_reel_spin:          'assets/audio/sfx_reel_spin.mp3',
    sfx_reel_stop_01:       'assets/audio/sfx_reel_stop_01.mp3',
    sfx_reel_stop_02:       'assets/audio/sfx_reel_stop_02.mp3',
    sfx_reel_stop_03:       'assets/audio/sfx_reel_stop_03.mp3',
    sfx_reel_stop_04:       'assets/audio/sfx_reel_stop_04.mp3',
    sfx_reel_stop_05:       'assets/audio/sfx_reel_stop_05.mp3',
    sfx_anticipation_reel3: 'assets/audio/sfx_anticipation_reel3.mp3',
    sfx_symbol_win_line:    'assets/audio/sfx_symbol_win_line.mp3',
    sfx_symbol_upgrade:     'assets/audio/sfx_symbol_upgrade.mp3',
    sfx_scare_bear_roar:    'assets/audio/sfx_scare_bear_roar.mp3',
    sfx_charm_bear_magic:   'assets/audio/sfx_charm_bear_magic.mp3',
    sfx_dance_bear_jig:     'assets/audio/sfx_dance_bear_jig.mp3',
    sfx_wipe_win_fanfare:   'assets/audio/sfx_wipe_win_fanfare.mp3',
    sfx_ghost_jackpot:      'assets/audio/sfx_ghost_jackpot.mp3',
    sfx_countup_loop:       'assets/audio/sfx_countup_loop.mp3',
    sfx_countup_end:        'assets/audio/sfx_countup_end.mp3'
  }
};
