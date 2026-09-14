This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Raspberry Pi data feed

This app exposes `POST /api/data` for a Raspberry Pi to send JSON readings to, and the home page polls `GET /api/data` every 2s to display the latest reading and recent history.

- **Endpoint:** `POST /api/data` — send any JSON body, e.g. `{"temperature_c": 21.5, "humidity_pct": 44}`
- **Auth:** set `PI_API_KEY` (see `.env.local.example`) and send it back as the `x-api-key` header on every POST. If `PI_API_KEY` is unset, auth is skipped (dev convenience only — set it before deploying).
- **Storage:** in-memory only for now, capped at the last 50 readings. Fine for testing; swap for a real DB later since a serverless instance's memory isn't guaranteed to persist between requests on Vercel.
- **Pi-side example:** [`pi/send_data.py`](pi/send_data.py) — a small `requests`-based script to adapt with real sensor code.
- **Status indicator:** the home page shows one of:
  - `pi connected` (green) — a reading arrived within the last `PI_STALE_MS` (10s, see `app/page.js`)
  - `no pi connected` (yellow) — the dashboard is reachable but no recent reading has come in
  - `dashboard unreachable` (red) — the browser can't reach `/api/data` at all

  If your Pi sends less often than every ~3s, raise `PI_STALE_MS` in `app/page.js` so it doesn't flap to "no pi connected" between sends.

### Local test

```bash
npm run dev
curl -X POST http://localhost:3000/api/data -H "Content-Type: application/json" -d '{"temperature_c":22.3}'
```

Then open [http://localhost:3000](http://localhost:3000) to see it appear.

### How to connect your Raspberry Pi

**1. Deploy this app to Vercel**

- Push this repo to GitHub, then [import it into Vercel](https://vercel.com/new).
- In the Vercel project → **Settings → Environment Variables**, add `PI_API_KEY` set to a secret string of your choosing.
- Deploy. Note the URL Vercel gives you, e.g. `https://your-app.vercel.app`.

**2. Get the sender script onto the Pi**

SSH into the Pi, then copy `pi/send_data.py` over (or `git clone` this repo on the Pi and use the file in place):

```bash
scp pi/send_data.py pi@<pi-ip-address>:~/send_data.py
```

**3. Install the one dependency**

On the Pi:

```bash
pip install requests
```

**4. Edit `read_sensor()`**

Open `send_data.py` on the Pi and replace the placeholder `read_sensor()` body with your actual sensor-reading code (GPIO, I2C, whatever your hardware uses). It just needs to return a dict — that dict is what shows up on the dashboard.

**5. Run it, pointed at your Vercel URL**

```bash
SERVER_URL="https://your-app.vercel.app/api/data" \
API_KEY="<the same PI_API_KEY you set in Vercel>" \
python3 send_data.py
```

It'll print each send attempt and its response code. Leave it running.

**6. Check the dashboard**

Open `https://your-app.vercel.app` in a browser. Status should flip to `pi connected` (green) within a few seconds, and the JSON payload should match what `read_sensor()` returned.

**Optional — keep it running after you disconnect:** wrap step 5 in a systemd service or run it inside `tmux`/`screen` so it survives an SSH disconnect and reboots.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
