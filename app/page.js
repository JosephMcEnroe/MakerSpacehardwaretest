"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";

const POLL_INTERVAL_MS = 2000;
// If no reading has arrived within this window, treat the Pi as disconnected.
// Should be a few times your Pi's send interval (see pi/send_data.py).
const PI_STALE_MS = 10000;

export default function Home() {
  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState([]);
  const [serverReachable, setServerReachable] = useState(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch("/api/data", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (cancelled) return;
        setLatest(json.latest);
        setHistory(json.history ?? []);
        setServerReachable(true);
      } catch {
        if (!cancelled) setServerReachable(false);
      }
      if (!cancelled) setNow(Date.now());
    }

    poll();
    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const piConnected =
    !!latest && now - new Date(latest.receivedAt).getTime() < PI_STALE_MS;

  let status;
  let statusColor;
  if (serverReachable === false) {
    status = "dashboard unreachable";
    statusColor = "#e74c3c";
  } else if (piConnected) {
    status = "pi connected";
    statusColor = "#2ecc71";
  } else {
    status = "no pi connected";
    statusColor = "#f1c40f";
  }

  return (
    <div className={styles.page}>
      <main className={styles.main} style={{ width: "100%", maxWidth: 800 }}>
        <h1>Raspberry Pi Data Feed</h1>
        <p>
          Status: <strong style={{ color: statusColor }}>{status}</strong>
        </p>

        <section style={{ marginTop: 24, width: "100%" }}>
          <h2>Latest reading</h2>
          {latest ? (
            <div>
              <p style={{ opacity: 0.7, fontSize: 14 }}>
                Received: {new Date(latest.receivedAt).toLocaleString()}
              </p>
              <pre
                style={{
                  background: "rgba(128,128,128,0.1)",
                  padding: 16,
                  borderRadius: 8,
                  overflowX: "auto",
                }}
              >
                {JSON.stringify(latest.data, null, 2)}
              </pre>
            </div>
          ) : (
            <p style={{ opacity: 0.7 }}>Waiting for data from the Pi...</p>
          )}
        </section>

        <section style={{ marginTop: 24, width: "100%" }}>
          <h2>History ({history.length})</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {history.map((reading, i) => (
              <details key={reading.receivedAt + i}>
                <summary>{new Date(reading.receivedAt).toLocaleString()}</summary>
                <pre
                  style={{
                    background: "rgba(128,128,128,0.1)",
                    padding: 12,
                    borderRadius: 8,
                    overflowX: "auto",
                  }}
                >
                  {JSON.stringify(reading.data, null, 2)}
                </pre>
              </details>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
