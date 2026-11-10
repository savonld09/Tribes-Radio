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
   supabaseUrl: 'https://ouholyfevwrwsjmpduvv.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91aG9seWZldndyd3NqbXBkdXZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQyNjE3NzAsImV4cCI6MjEwOTgzNzc3MH0.SKVDYob4MMLOWZDHuG7EuLZiX9bjdE977t5tychhTEQ',
    stripePaymentLink: 'https://buy.stripe.com/test_5kQ00kaOL5R3fyb13LaMU00',
    stripePortalLink: 'https://billing.stripe.com/p/login/test_XXXXXXXXXXXX',

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
    { id: 'gospel',  name: 'Gospel & Praise', color: '#e3b34a', free: true,  stream: 'https://radio.tribesradio.com/listen/gospel/radio.mp3', nowPlaying: 'https://radio.tribesradio.com/api/nowplaying/gospel' },
    { id: 'rnb',     name: 'R&B / Soul',      color: '#c86bd9', free: false, stream: 'https://radio.tribesradio.com/listen/rnb/radio.mp3', nowPlaying: 'https://radio.tribesradio.com/api/nowplaying/rnb' },
    { id: 'rap',     name: 'Rap / Hip-Hop',   color: '#e0483e', free: false, stream: 'https://radio.tribesradio.com/listen/rap/radio.mp3', nowPlaying: 'https://radio.tribesradio.com/api/nowplaying/rap' },
    { id: 'sisters', name: 'Sisters Channel', color: '#f08fb0', free: false, stream: 'https://radio.tribesradio.com/listen/sisters/radio.mp3', nowPlaying: 'https://radio.tribesradio.com/api/nowplaying/sisters' },
    { id: 'feast',   name: 'Feast Days',      color: '#58c48b', free: false, stream: 'https://radio.tribesradio.com/listen/feast/radio.mp3', nowPlaying: 'https://radio.tribesradio.com/api/nowplaying/feast' },
  ],
};
