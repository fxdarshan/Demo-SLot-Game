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
 *   modal_freespins_* ....................... about 1100 x 620 panel; text is drawn on top
 *   banner_win_* ............................ about 1200 x 360 title art; the amount is drawn below it
 * The symbol upgrade animation splits each doll at symbolSplitY (fraction of height)
 * into a lid and a base; keep the doll's seam near that line or change the value.
 *
 * Sounds: MP3 or WAV. They only load when the game is served over http(s) (README: "Run it").
 * Spine 2D skeletons listed in the asset spec are not wired in yet; see README "Next steps".
 */
window.ASSET_MANIFEST = {
  symbolSplitY: 0.47,

  images: {
    // 2.1 environment
    bg_base_main:        'assets/images/environment/bg_base_main.png',
    bg_base_frame:       'assets/images/environment/bg_base_frame.png',
    bg_base_reel_strip:  'assets/images/environment/bg_base_reel_strip.png',
    // 3.1 free game environment
    bg_freegame_main:    'assets/images/environment/bg_freegame_main.png',
    bg_freegame_frame:   'assets/images/environment/bg_freegame_frame.png',
    fx_reel3_guaranteed_wild_indicator: 'assets/images/fx/fx_reel3_guaranteed_wild_indicator.png',

    // 2.2 UI / HUD
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
    sym_00_idle: 'assets/images/symbols/sym_00_grandmother_idle.png',   // Tier 0 Yellow (highest)
    sym_01_idle: 'assets/images/symbols/sym_01_glasses_idle.png',       // Tier 1 Orange
    sym_02_idle: 'assets/images/symbols/sym_02_red_idle.png',           // Tier 2 Red
    sym_03_idle: 'assets/images/symbols/sym_03_pink_idle.png',          // Tier 3 Pink
    sym_04_idle: 'assets/images/symbols/sym_04_purple_idle.png',        // Tier 4 Dark Purple
    sym_05_idle: 'assets/images/symbols/sym_05_blue_idle.png',          // Tier 5 Light Blue
    sym_06_idle: 'assets/images/symbols/sym_06_pacifier_idle.png',      // Tier 6 Teal (lowest)

    // 4.2 special and mystery symbols
    sym_wild_idle:        'assets/images/symbols/sym_wild_idle.png',
    sym_wild_star_idle:   'assets/images/symbols/sym_wild_star_idle.png',
    sym_bear_scare_small: 'assets/images/symbols/sym_bear_scare_small.png',
    sym_bear_scare_med:   'assets/images/symbols/sym_bear_scare_med.png',
    sym_bear_scare_large: 'assets/images/symbols/sym_bear_scare_large.png',
    sym_bear_charm:       'assets/images/symbols/sym_bear_charm.png',
    sym_bear_dance:       'assets/images/symbols/sym_bear_dance.png',
    sym_ghost_idle:       'assets/images/symbols/sym_ghost_idle.png',

    // 7 banners and modals (panel / title art; text and amounts are drawn on top)
    modal_freespins_intro:   'assets/images/banners/modal_freespins_intro.png',
    modal_freespins_outro:   'assets/images/banners/modal_freespins_outro.png',
    banner_win_nice:         'assets/images/banners/banner_win_nice.png',
    banner_win_big:          'assets/images/banners/banner_win_big.png',
    banner_win_mega:         'assets/images/banners/banner_win_mega.png',
    banner_win_superb:       'assets/images/banners/banner_win_superb.png',
    banner_win_sensational:  'assets/images/banners/banner_win_sensational.png',
    banner_win_epic:         'assets/images/banners/banner_win_epic.png',

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
