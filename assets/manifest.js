/*
 * ASSET MANIFEST
 * ---------------------------------------------------------------------------
 * To replace placeholder art or sound: drop a file at the path listed below
 * (or change the path) and reload. A file that is missing simply keeps the
 * built-in placeholder, so you can swap assets one at a time.
 *
 * Image sizes (PNG with transparency unless noted):
 *   symbols / wild / bears / ghost ......... 300 x 300, centred, same framing for all
 *   backgrounds ............................ 1920 x 1080, JPG or PNG, no transparency needed
 *   win_patch .............................. 300 x 300, white/grey; it is tinted per symbol colour
 *   bubble_* ............................... about 640 x 360
 *   logo ................................... up to 900 x 300 (optional; game has no logo area by default)
 * Doll "pop" animation splits each symbol image at symbolSplitY (fraction of height)
 * into a lid and a base, so keep the doll's seam near that line or change the value.
 *
 * Sounds: MP3 / OGG / WAV. Anything missing falls back to a synthesised placeholder.
 * Sounds only load when the game is served over http(s) (see README: "Run it").
 */
window.ASSET_MANIFEST = {
  symbolSplitY: 0.47,

  images: {
    background:            'assets/images/backgrounds/background.jpg',
    background_freespins:  'assets/images/backgrounds/background_freespins.jpg',
    background_bigwin:     'assets/images/backgrounds/background_bigwin.jpg',
    background_megawin:    'assets/images/backgrounds/background_megawin.jpg',
    background_epicwin:    'assets/images/backgrounds/background_epicwin.jpg',
    background_wipewin:    'assets/images/backgrounds/background_wipewin.jpg',

    symbol_L7:  'assets/images/symbols/L7_teal_dummy.png',
    symbol_L6:  'assets/images/symbols/L6_blue.png',
    symbol_L5:  'assets/images/symbols/L5_purple.png',
    symbol_L4:  'assets/images/symbols/L4_pink.png',
    symbol_L3:  'assets/images/symbols/L3_red.png',
    symbol_L2:  'assets/images/symbols/L2_orange_glasses.png',
    symbol_L1:  'assets/images/symbols/L1_yellow.png',
    // optional "scared" faces shown when the Scare Bear targets a doll
    symbol_L7_scared: 'assets/images/symbols/L7_scared.png',
    symbol_L6_scared: 'assets/images/symbols/L6_scared.png',
    symbol_L5_scared: 'assets/images/symbols/L5_scared.png',
    symbol_L4_scared: 'assets/images/symbols/L4_scared.png',
    symbol_L3_scared: 'assets/images/symbols/L3_scared.png',
    symbol_L2_scared: 'assets/images/symbols/L2_scared.png',
    symbol_L1_scared: 'assets/images/symbols/L1_scared.png',

    wild:        'assets/images/symbols/wild_egg.png',
    ghost:       'assets/images/symbols/ghost.png',
    bear_scare:  'assets/images/bears/bear_scare.png',
    bear_charm:  'assets/images/bears/bear_charm.png',
    bear_dance:  'assets/images/bears/bear_dance.png',
    bubble_scare:'assets/images/bears/bubble_scare.png',
    bubble_charm:'assets/images/bears/bubble_charm.png',
    bubble_dance:'assets/images/bears/bubble_dance.png',

    win_patch:   'assets/images/fx/win_patch.png',
    logo:        'assets/images/ui/logo.png'
  },

  sounds: {
    spin:        'assets/audio/spin.mp3',
    reel_stop:   'assets/audio/reel_stop.mp3',
    win:         'assets/audio/win.mp3',
    pop:         'assets/audio/pop.mp3',
    egg_wobble:  'assets/audio/egg_wobble.mp3',
    egg_hatch:   'assets/audio/egg_hatch.mp3',
    bear_scare:  'assets/audio/bear_scare.mp3',
    bear_charm:  'assets/audio/bear_charm.mp3',
    bear_dance:  'assets/audio/bear_dance.mp3',
    fs_start:    'assets/audio/freespins_start.mp3',
    wipe:        'assets/audio/wipe_win.mp3',
    bigwin:      'assets/audio/big_win.mp3',
    music_base:  'assets/audio/music_base.mp3',
    music_free:  'assets/audio/music_freespins.mp3'
  }
};
