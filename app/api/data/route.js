// In-memory store for incoming Raspberry Pi readings.
// NOTE: On Vercel this lives only in the current serverless instance's
// memory. It's fine for testing/demo purposes, but readings can be lost
// when the instance recycles. Swap this for a real DB (Postgres, Redis,
// etc.) once you're ready to persist data.
const MAX_HISTORY = 50;

const store = globalThis.__piDataStore ?? {
  latest: null,
  history: [],
};
globalThis.__piDataStore = store;

function isAuthorized(request) {
  const expected = process.env.PI_API_KEY;
  if (!expected) return true; // no key configured -> auth disabled (dev convenience)
  return request.headers.get("x-api-key") === expected;
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

  const reading = {
    receivedAt: new Date().toISOString(),
    data: payload,
  };

  store.latest = reading;
  store.history.unshift(reading);
  if (store.history.length > MAX_HISTORY) {
    store.history.length = MAX_HISTORY;
  }

  return Response.json({ ok: true, receivedAt: reading.receivedAt });
}

export async function GET() {
  return Response.json({
    latest: store.latest,
    history: store.history,
  });
}
