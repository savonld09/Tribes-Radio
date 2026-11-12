# Tribes Radio

**24/7 internet radio for Hebrew Israelite music, with five genre stations and a $5/month subscription.**

🔗 **Live app:** [savonld09.github.io/Tribes-Radio](https://savonld09.github.io/Tribes-Radio)
Status: pre-launch, running in Stripe test mode with test tracks.

<p>
  <img src="https://github.com/user-attachments/assets/76d9bb73-251b-4a86-b847-6149aef06c86" alt="Home screen" width="200" />
  <img src="https://github.com/user-attachments/assets/eced3589-c749-4cf8-bd39-85a6b2322a9b" alt="Gospel & Praise playing" width="200" />
  <img src="https://github.com/user-attachments/assets/20dbea40-95e7-461e-8dcc-b6d66769ac5c" alt="Station list" width="200" />
  <img src="https://github.com/user-attachments/assets/6fb7595f-6cf1-47c3-860d-be9520c7ea1e" alt="Sign-in prompt on a locked station" width="200" />
</p>

## What it does

- **Five live stations:** Gospel & Praise (free), plus R&B / Soul, Rap / Hip-Hop, Sisters Channel and Feast Days for subscribers
- **Subscriptions:** $5/month through Stripe, with a customer portal to manage or cancel
- **Passwordless sign-in:** listeners get a magic link by email
- **Protected streams:** paid stations only play for active subscribers, and the real stream addresses stay hidden
- **Now playing, up next and recently played:** song info updates live from the streaming server
- **Installable app:** add it to a phone's home screen, with lock-screen play/pause controls and offline caching of the app shell

## How it works

```
Listener's phone or browser (PWA on GitHub Pages)
   │
   ├── Sign in / subscription status ──► Supabase (Postgres + Auth)
   │                                         ▲
   │                                         │ webhook keeps status in sync
   │                                     Stripe (subscriptions)
   │
   └── Play a station ──► Cloudflare Worker (stream gate)
                              │  checks the listener's subscription
                              ▼
                          AzuraCast streaming server
                          (Icecast + Liquidsoap in Docker on a DigitalOcean Ubuntu server)
```

## Tech stack

| Area | Tools |
| --- | --- |
| Front end | HTML, CSS, vanilla JavaScript; Progressive Web App (manifest, service worker, Media Session API) |
| Hosting | GitHub Pages; custom domain and DNS on Cloudflare; HTTPS via Let's Encrypt |
| Streaming | AzuraCast (Icecast + Liquidsoap) in Docker on a DigitalOcean Ubuntu server |
| Back end | Supabase: Postgres with row-level security, email magic-link auth, Edge Function for the Stripe webhook |
| Payments | Stripe subscriptions, Payment Link, webhooks, customer portal |
| Access control | Cloudflare Worker that verifies subscriptions before serving paid streams |

## Project structure

```
index.html              App layout
app.js                  Player, stations, sign-in and subscription logic
app.css                 Styles
config.js               Supabase, Stripe and stream settings
sw.js                   Service worker (offline caching)
manifest.webmanifest    Install settings for the PWA
icon-*.png              App icons
```

The Supabase database schema, the Stripe webhook Edge Function and the Cloudflare Worker that gates streams are deployed directly to those services and aren't in this repo yet.

## Running it yourself

1. Create a Supabase project with a subscriptions table and email magic-link sign-in.
2. Deploy a Supabase Edge Function that receives Stripe webhooks and updates subscription status.
3. Set up AzuraCast with Docker on a Linux server and create the stations.
4. Deploy a Cloudflare Worker that checks a listener's subscription before passing through a paid stream.
5. Fill in `config.js` with your own settings and publish the files to GitHub Pages or any static host.

## Challenges I solved

- **Server overload:** I diagnosed CPU and memory overload on the streaming server and scaled it up.
- **Webhook and API failures:** I used the Supabase and Cloudflare logs to track down 404 and 500 errors and get the Stripe webhook syncing subscriptions correctly.
- **Keeping paid streams private:** I moved stream access behind a Cloudflare Worker, so the app never exposes the real stream addresses and non-subscribers can't play locked stations.

## How I built it

I designed Tribes Radio and built it with AI-assisted development (Claude). I set up and configured every service myself (Supabase, Stripe, Cloudflare, DigitalOcean and AzuraCast), tested each part, and debugged problems from logs. As I work through the Meta Front-End Developer certificate, I plan to rewrite parts of the front end by hand.

## What's next

- In-app feedback button so listeners can rate the app, report bugs and leave comments (saved to Supabase and reviewed weekly)
- Launch with real artists' music once license agreements are reviewed
- Automated tests and a QA test plan
- Accessibility and Lighthouse improvements
- Native app store versions

---

Built by Savon Davis (Chaama), founder of Israelite Experiences · [GitHub](https://github.com/savonld09)
