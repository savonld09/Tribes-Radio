// Tribes Radio listener app
const C = window.RADIO_CONFIG;
const $ = s => document.querySelector(s);
const audio = $('#audio');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------------------------------------------------------------- state
const PAYWALL = !!(C.supabaseUrl && C.supabaseAnonKey);
let supabase = null;
let user = null;           // signed-in Supabase user
let subscribed = false;    // has an active subscription
let cur = null;            // current station object
let wantPlaying = false;   // user pressed play (used for auto-reconnect)
let retries = 0;
let npTimer = null;

// ---------------------------------------------------------------- helpers
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2200);
}
const canPlay = st => !PAYWALL || st.free || subscribed;
const setAccent = col => document.documentElement.style.setProperty('--accent', col || C.color);

// ---------------------------------------------------------------- branding
document.title = C.name;
$('#radioName').textContent = C.name;
$('#tagline').textContent = C.tagline;
$('#logoTxt').textContent = C.logo;
$('#miniSub').textContent = C.name;
setAccent(C.color);

// ---------------------------------------------------------------- stations
function renderStations() {
  $('#stations').innerHTML = C.stations.map((st, i) => {
    const on = cur && cur.id === st.id;
    let tag = '';
    if (on && wantPlaying) tag = '<span class="badge">LIVE</span>';
    else if (PAYWALL && !st.free && !subscribed) tag = '<span class="lock">🔒 Subscribers</span>';
    else if (PAYWALL && st.free && !subscribed) tag = '<span class="free">FREE</span>';
    return `<button class="station ${on ? 'on' : ''}" style="--c:${esc(st.color)}" data-i="${i}">
      ${tag}
      <div class="freq">${(88.1 + i * 1.6).toFixed(1)} FM</div>
      <div class="nm">${esc(st.name)}</div>
      <div class="ct">${on ? 'Now listening' : 'Tap to tune in'}</div>
    </button>`;
  }).join('');
  document.querySelectorAll('.station').forEach(b => b.onclick = () => tune(C.stations[+b.dataset.i]));
}

// ---------------------------------------------------------------- playback
async function streamUrl(st) {
  // Subscriber stations go through the stream lock with a fresh login token.
  if (C.streamGateUrl && !st.free) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return null;
    return `${C.streamGateUrl.replace(/\/$/, '')}/stream/${encodeURIComponent(st.id)}?token=${encodeURIComponent(token)}`;
  }
  if (!st.stream) return null;
  return st.stream + (st.stream.includes('?') ? '&' : '?') + 't=' + Date.now(); // jump to the live point
}

async function tune(st) {
  if (!canPlay(st)) return openSubscribe(st);
  cur = st; retries = 0;
  setAccent(st.color);
  $('#artName').textContent = st.name;
  $('#npLabel').textContent = 'Live on ' + st.name;
  $('#npStation').innerHTML = `<b>${esc(st.name)}</b> · ${esc(C.name)}`;
  $('#npTitle').textContent = 'Tuning in…';
  $('#npArtist').textContent = '';
  $('#miniTitle').textContent = st.name;
  $('#miniSub').textContent = C.name;
  setArt(null);
  renderStations();
  startNowPlaying();
  await start();
}

async function start() {
  if (!cur) return;
  $('#err').textContent = '';
  const url = await streamUrl(cur);
  if (!url) {
    wantPlaying = false; updateIcons();
    $('#npTitle').textContent = 'Off air';
    $('#npArtist').textContent = PAYWALL && !cur.free && !user
      ? 'Sign in to listen.'
      : 'This station has no stream address yet. Add it in config.js.';
    return;
  }
  wantPlaying = true;
  setLoading(true);
  audio.src = url;
  try { await audio.play(); } catch (e) { setLoading(false); wantPlaying = false; }
  updateIcons(); renderStations();
}

function stop() {
  wantPlaying = false;
  audio.pause();
  audio.removeAttribute('src'); audio.load(); // drop the connection; live radio resumes at "now"
  setLoading(false); updateIcons(); renderStations();
}

function togglePlay() {
  if (wantPlaying) return stop();
  if (!cur) {
    const first = C.stations.find(canPlay) || C.stations[0];
    return tune(first);
  }
  start();
}

function step(dir) {
  const list = C.stations.filter(canPlay);
  if (!list.length) return;
  const i = cur ? list.findIndex(s => s.id === cur.id) : -1;
  tune(list[(i + dir + list.length) % list.length]);
}

audio.addEventListener('playing', () => { setLoading(false); retries = 0; updateIcons(); });
audio.addEventListener('waiting', () => setLoading(true));
audio.addEventListener('pause', updateIcons);
audio.addEventListener('error', reconnect);
audio.addEventListener('ended', reconnect);
audio.addEventListener('stalled', () => { if (wantPlaying) setTimeout(() => { if (audio.paused && wantPlaying) reconnect(); }, 8000); });

function reconnect() {
  if (!wantPlaying || !audio.getAttribute('src')) return;
  if (retries >= 5) {
    wantPlaying = false; setLoading(false); updateIcons();
    $('#err').textContent = PAYWALL && !cur.free && !subscribed
      ? 'Your subscription is not active. Subscribe to keep listening.'
      : "Can't reach this station right now. Try again in a minute.";
    return;
  }
  retries++;
  $('#err').textContent = 'Reconnecting…';
  setTimeout(start, 1500 * retries);
}

function setLoading(on) { $('#playBtn').classList.toggle('loading', on && wantPlaying); }

function updateIcons() {
  const playing = wantPlaying;
  const path = playing ? '<path d="M6 4h4v16H6zM14 4h4v16h-4z"/>' : '<path d="M7 4v16l13-8z"/>';
  $('#playIco').innerHTML = path; $('#miniIco').innerHTML = path;
  $('#playBtn').setAttribute('aria-label', playing ? 'Stop' : 'Play');
  $('#hero').classList.toggle('playing', playing && !audio.paused);
  $('#liveBadge').classList.toggle('on', playing);
  if ('mediaSession' in navigator) navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
}

$('#playBtn').onclick = togglePlay;
$('#miniPlay').onclick = togglePlay;
$('#nextBtn').onclick = () => step(1);
$('#miniNext').onclick = () => step(1);
$('#prevBtn').onclick = () => step(-1);
$('#vol').oninput = e => { audio.volume = +e.target.value; };

if ('mediaSession' in navigator) {
  const ms = navigator.mediaSession;
  const h = (a, f) => { try { ms.setActionHandler(a, f); } catch (e) {} };
  h('play', () => { if (!wantPlaying) togglePlay(); });
  h('pause', () => { if (wantPlaying) stop(); });
  h('stop', stop);
  h('nexttrack', () => step(1));
  h('previoustrack', () => step(-1));
}

// ---------------------------------------------------------------- now playing (AzuraCast)
function npUrl(st) {
  if (C.streamGateUrl) return `${C.streamGateUrl.replace(/\/$/, '')}/nowplaying/${encodeURIComponent(st.id)}`;
  return st.nowPlaying || null;
}

function startNowPlaying() {
  clearInterval(npTimer);
  fetchNowPlaying();
  npTimer = setInterval(fetchNowPlaying, 15000);
}

async function fetchNowPlaying() {
  if (!cur) return;
  const st = cur, url = npUrl(st);
  if (!url) { showSong(null); return; }
  try {
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) throw 0;
    const d = await r.json();
    if (cur !== st) return;
    showSong(d.now_playing?.song, d.playing_next?.song, d.song_history || []);
  } catch (e) { /* keep last info */ }
}

function showSong(song, next, history) {
  if (!song) {
    if ($('#npTitle').textContent === 'Tuning in…') { $('#npTitle').textContent = cur.name; $('#npArtist').textContent = C.name; }
    return;
  }
  $('#npTitle').textContent = song.title || cur.name;
  $('#npArtist').textContent = song.artist || '';
  $('#miniTitle').textContent = song.title || cur.name;
  $('#miniSub').textContent = (song.artist ? song.artist + ' · ' : '') + cur.name;
  document.title = (song.title ? song.title + ' · ' : '') + C.name;
  setArt(song.art);
  if ('mediaSession' in navigator) {
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: song.title || cur.name, artist: song.artist || '', album: cur.name + ' · ' + C.name,
        artwork: song.art ? [{ src: song.art, sizes: '512x512' }] : [{ src: 'icon-512.png', sizes: '512x512', type: 'image/png' }],
      });
    } catch (e) {}
  }
  const row = s => `<div class="row">${s.art ? `<img src="${esc(s.art)}" alt="" loading="lazy">` : '<div class="ph"></div>'}
    <div class="t"><b>${esc(s.title)}</b><span>${esc(s.artist || '')}</span></div></div>`;
  $('#nextList').innerHTML = next ? row(next) : '<div class="empty">Coming up soon.</div>';
  $('#histList').innerHTML = history.length ? history.slice(0, 5).map(h => row(h.song || h)).join('') : '<div class="empty">Nothing yet.</div>';
}

function setArt(src) {
  const img = $('#artImg'), art = $('#art');
  if (!src) { img.hidden = true; art.classList.remove('has-img'); return; }
  img.onload = () => { img.hidden = false; art.classList.add('has-img'); };
  img.onerror = () => { img.hidden = true; art.classList.remove('has-img'); };
  img.src = src;
}

// ---------------------------------------------------------------- dialogs
function openModal(html) {
  $('#sheet').innerHTML = `<button class="x" aria-label="Close">✕</button>` + html;
  $('#sheet .x').onclick = closeModal;
  $('#modal').classList.add('open');
}
function closeModal() { $('#modal').classList.remove('open'); }
$('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });

function openSignIn(reason) {
  openModal(`<h3>Sign in</h3>
    <p>${esc(reason || 'Enter your email and we\'ll send you a sign-in link. No password needed.')}</p>
    <form class="stack" id="signinForm">
      <input type="email" id="email" placeholder="you@example.com" required autocomplete="email">
      <button class="btn primary block" id="sendLink">Email me a sign-in link</button>
    </form>`);
  $('#signinForm').onsubmit = async e => {
    e.preventDefault();
    const email = $('#email').value.trim();
    $('#sendLink').disabled = true; $('#sendLink').textContent = 'Sending…';
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + location.pathname } });
    if (error) { $('#sendLink').disabled = false; $('#sendLink').textContent = 'Email me a sign-in link'; return toast(error.message); }
    openModal(`<h3>Check your email</h3><p>We sent a sign-in link to <b>${esc(email)}</b>. Open it on this phone and you'll come right back here, signed in.</p>
      <button class="btn block" onclick="document.getElementById('modal').classList.remove('open')">OK</button>`);
  };
}

function openSubscribe(st) {
  if (!user) return openSignIn(st ? `${st.name} is for subscribers. Sign in first, then subscribe for ${C.price}.` : null);
  openModal(`<h3>Subscribe</h3>
    <div class="price">${esc(C.price)}</div>
    <ul>
      <li>Every station: R&B, Rap, Women's Hour and more</li>
      <li>24/7 Hebrew Israelite music</li>
      <li>Supports the artists and the station</li>
      <li>Cancel anytime</li>
    </ul>
    <button class="btn primary block" id="goPay">Continue to payment</button>
    <div class="small">Secure checkout by Stripe</div>`);
  $('#goPay').onclick = () => {
    if (!C.stripePaymentLink) return toast('Payment link not set up yet');
    const u = new URL(C.stripePaymentLink);
    u.searchParams.set('client_reference_id', user.id);
    if (user.email) u.searchParams.set('prefilled_email', user.email);
    location.href = u.toString();
  };
}

function openAccount() {
  openModal(`<h3>Your account</h3>
    <p>${esc(user.email || '')}<br>Status: <b style="color:var(--text)">${subscribed ? 'Subscribed ✓' : 'Free listener'}</b></p>
    <div class="stack">
      ${subscribed
        ? (C.stripePortalLink ? `<a class="btn block" style="text-align:center;text-decoration:none" href="${esc(C.stripePortalLink)}">Manage or cancel subscription</a>` : '')
        : `<button class="btn primary block" id="accSub">Subscribe – ${esc(C.price)}</button>`}
      <button class="btn block" id="signOut">Sign out</button>
    </div>`);
  const s = $('#accSub'); if (s) s.onclick = () => openSubscribe();
  $('#signOut').onclick = async () => { await supabase.auth.signOut(); closeModal(); toast('Signed out'); };
}

// ---------------------------------------------------------------- accounts & subscription
async function checkSubscription() {
  subscribed = false;
  if (user) {
    const { data } = await supabase.from('subscriptions').select('status').eq('user_id', user.id).maybeSingle();
    subscribed = !!data && ['active', 'trialing'].includes(data.status);
  }
  renderAccount();
}

function renderAccount() {
  const btn = $('#accountBtn');
  btn.hidden = !PAYWALL;
  btn.textContent = user ? (subscribed ? 'Account ✓' : 'Account') : 'Sign in';
  btn.classList.toggle('primary', !user);
  const banner = $('#subBanner');
  banner.hidden = !PAYWALL || subscribed;
  $('#bannerText').textContent = ` ${C.price} for all ${C.stations.length} stations. Cancel anytime.`;
  renderStations();
  // Stop a locked station if the subscription ended
  if (cur && !canPlay(cur) && wantPlaying) { stop(); $('#err').textContent = 'This station is for subscribers.'; }
}

$('#accountBtn').onclick = () => user ? openAccount() : openSignIn();
$('#bannerBtn').onclick = () => openSubscribe();

async function initAccounts() {
  if (!PAYWALL) { renderAccount(); return; }
  try {
    const mod = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    supabase = mod.createClient(C.supabaseUrl, C.supabaseAnonKey);
  } catch (e) { console.error(e); toast("Couldn't load sign-in"); return; }
  const { data } = await supabase.auth.getSession();
  user = data.session?.user || null;
  await checkSubscription();
  supabase.auth.onAuthStateChange(async (_evt, session) => {
    const was = user?.id; user = session?.user || null;
    if (was !== user?.id) await checkSubscription();
  });
  // Back from Stripe checkout: Stripe tells our server a moment later, so check a few times.
  if (location.hash === '#subscribed') {
    history.replaceState(null, '', location.pathname);
    toast('Thank you! Activating your subscription…');
    for (let i = 0; i < 6 && !subscribed; i++) { await new Promise(r => setTimeout(r, 2500)); await checkSubscription(); }
    toast(subscribed ? 'Subscribed! Every station is unlocked.' : 'Payment received. Refresh in a minute if stations are still locked.');
  }
}

// ---------------------------------------------------------------- install button
let installEvt = null;
const isStandalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; $('#installBtn').hidden = false; });
if (isIOS && !isStandalone) $('#installBtn').hidden = false;
$('#installBtn').onclick = async () => {
  if (installEvt) { installEvt.prompt(); await installEvt.userChoice; installEvt = null; $('#installBtn').hidden = true; return; }
  openModal(`<h3>Install on iPhone</h3>
    <p>1. Tap the <b>Share</b> button (square with an arrow) at the bottom of Safari.<br>
    2. Scroll down and tap <b>Add to Home Screen</b>.<br>
    3. Tap <b>Add</b>. ${esc(C.name)} will appear on your home screen like any other app.</p>
    <button class="btn block" onclick="document.getElementById('modal').classList.remove('open')">Got it</button>`);
};
window.addEventListener('appinstalled', () => { $('#installBtn').hidden = true; toast('Installed!'); });

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});

// ---------------------------------------------------------------- start
renderStations();
initAccounts();
