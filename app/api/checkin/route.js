// In-memory store for incoming RFID check-ins from the Pi.
// Same caveat as /api/data: this lives only in the current serverless
// instance's memory on Vercel and isn't guaranteed to persist between
// requests. Swap for a real DB once you're ready to persist scans.
const MAX_HISTORY = 50;

const store = globalThis.__checkinStore ?? {
  latest: null,
  history: [],
};
globalThis.__checkinStore = store;

function isAuthorized(request) {
  const expected = process.env.MAKERSPACE_API_KEY;
  if (!expected) return true; // no key configured -> auth disabled (dev convenience)
  return request.headers.get("authorization") === `Bearer ${expected}`;
}

export async function POST(request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const cardId = payload?.card_id;
  if (!cardId) {
    return Response.json({ error: "card_id is required" }, { status: 400 });
  }

  const checkin = {
    receivedAt: new Date().toISOString(),
    cardId,
  };

  store.latest = checkin;
  store.history.unshift(checkin);
  if (store.history.length > MAX_HISTORY) {
    store.history.length = MAX_HISTORY;
  }

  return Response.json({ ok: true, receivedAt: checkin.receivedAt });
}

export async function GET() {
  return Response.json({
    latest: store.latest,
    history: store.history,
  });
}
