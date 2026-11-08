// =====================================================================
//  TRIBES RADIO: SETTINGS
//  This is the only file you need to edit. See SETUP.md for each value.
//  While supabaseUrl is blank, the app runs in "open mode": every
//  station plays for free (good for testing before you set up payments).
// =====================================================================
window.RADIO_CONFIG = {
  // ---- Branding ----
  name: 'Tribes Radio',
  tagline: 'Hebrew Israelite music · 24/7',
  logo: 'TR',
  color: '#e3b34a',

  // ---- Subscription ----
  price: '$5/month',
  supabaseUrl: '',          // e.g. 'https://abcd1234.supabase.co'
  supabaseAnonKey: '',      // the "anon / public" key (safe to put here)
  stripePaymentLink: '',    // e.g. 'https://buy.stripe.com/xxxx'
  stripePortalLink: '',     // e.g. 'https://billing.stripe.com/p/login/xxxx'

  // ---- Stream lock (Cloudflare Worker) ----
  // When set, subscriber stations stream through the lock and their
  // real stream addresses stay secret (leave `stream` blank below).
  streamGateUrl: '',        // e.g. 'https://tribes-gate.yourname.workers.dev'

  // ---- Stations ----
  // id      must match the station's "short name" in AzuraCast
  // free    true = anyone can listen, false = subscribers only
  // stream  the AzuraCast listen URL (only needed for free stations,
  //         or for every station if you are not using the stream lock)
  // nowPlaying  optional AzuraCast API URL, used only without the lock:
  //         'https://YOUR-AZURACAST/api/nowplaying/STATION_ID'
  stations: [
    { id: 'gospel',  name: 'Gospel & Praise', color: '#e3b34a', free: true,  stream: '', nowPlaying: '' },
    { id: 'rnb',     name: 'R&B / Soul',      color: '#c86bd9', free: false, stream: '', nowPlaying: '' },
    { id: 'rap',     name: 'Rap / Hip-Hop',   color: '#e0483e', free: false, stream: '', nowPlaying: '' },
    { id: 'women',   name: "Women's Hour",    color: '#f08fb0', free: false, stream: '', nowPlaying: '' },
    { id: 'feast',   name: 'Feast Days',      color: '#58c48b', free: false, stream: '', nowPlaying: '' },
  ],
};
