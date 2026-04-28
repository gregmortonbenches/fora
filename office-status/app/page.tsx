"use client";

import { useCallback, useEffect, useState } from "react";
import { OFFICE_NAME, PEOPLE, type PersonId } from "./config";

type Status = { inOffice: boolean; updatedAt: number };
type StatusMap = Partial<Record<PersonId, Status | null>>;

const POLL_INTERVAL_MS = 15_000;
const SECRET_STORAGE_KEY = "office-status:update-secret";

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "just now";
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export default function Page() {
  const [statuses, setStatuses] = useState<StatusMap>({});
  const [error, setError] = useState<string | null>(null);
  const [, forceTick] = useState(0);

  const fetchStatuses = useCallback(async () => {
    try {
      const res = await fetch("/api/status", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as StatusMap;
      setStatuses(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }, []);

  useEffect(() => {
    fetchStatuses();
    const id = setInterval(fetchStatuses, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchStatuses]);

  // Re-render every 30s so "x mins ago" stays accurate.
  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const toggle = useCallback(
    async (id: PersonId, currentlyIn: boolean) => {
      setError(null);

      // Optimistic update: move the flag immediately so the click feels instant.
      let prevStatus: Status | null = null;
      setStatuses((prev) => {
        prevStatus = prev[id] ?? null;
        return {
          ...prev,
          [id]: { inOffice: !currentlyIn, updatedAt: Date.now() },
        };
      });

      try {
        let secret =
          typeof window !== "undefined"
            ? window.localStorage.getItem(SECRET_STORAGE_KEY) ?? ""
            : "";

        const doFetch = (s: string) =>
          fetch("/api/status", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(s ? { "x-update-secret": s } : {}),
            },
            body: JSON.stringify({ id, inOffice: !currentlyIn }),
          });

        let res = await doFetch(secret);
        if (res.status === 401) {
          const entered = window.prompt(
            "Enter the update password (set as UPDATE_SECRET on Vercel):",
            secret,
          );
          if (!entered) {
            // User cancelled — roll back the optimistic change.
            setStatuses((prev) => ({ ...prev, [id]: prevStatus }));
            return;
          }
          window.localStorage.setItem(SECRET_STORAGE_KEY, entered);
          secret = entered;
          res = await doFetch(secret);
        }
        if (!res.ok) {
          if (res.status === 401) {
            window.localStorage.removeItem(SECRET_STORAGE_KEY);
            throw new Error("Wrong password");
          }
          throw new Error(`HTTP ${res.status}`);
        }
        // Reconcile with the authoritative server timestamp.
        const updated = (await res.json()) as Status;
        setStatuses((prev) => ({ ...prev, [id]: updated }));
      } catch (err) {
        // Roll back the optimistic change on failure.
        setStatuses((prev) => ({ ...prev, [id]: prevStatus }));
        setError(err instanceof Error ? err.message : "Failed to update");
      }
    },
    [],
  );

  const allOut = PEOPLE.every((p) => !statuses[p.id]?.inOffice);

  return (
    <main>
      <h1>
        {allOut ? `${OFFICE_NAME} is empty` : `Who\u2019s at ${OFFICE_NAME}?`}
      </h1>

      <div className="lawn">
        {PEOPLE.map((person) => {
          const status = statuses[person.id] ?? null;
          const inOffice = !!status?.inOffice;
          const [c1, c2, c3] = person.flagColors;
          return (
            <div key={person.id} className="flagpole-wrap">
              <button
                type="button"
                className="flagpole"
                onClick={() => toggle(person.id, inOffice)}
                aria-label={`${inOffice ? "Lower" : "Raise"} ${person.name}'s flag`}
                aria-pressed={inOffice}
              >
                <span className="finial" aria-hidden="true" />
                <span className="pole" aria-hidden="true" />
                <span className="base" aria-hidden="true" />
                <svg
                  className={`flag${inOffice ? " raised" : ""}`}
                  viewBox="0 0 88 56"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <defs>
                    <clipPath
                      id={`wave-${person.id}`}
                      clipPathUnits="userSpaceOnUse"
                    >
                      <path d="M 0 0 L 84 0 Q 92 14 88 28 Q 84 42 86 56 L 0 56 Z">
                        {inOffice && (
                          <animate
                            attributeName="d"
                            dur="4s"
                            repeatCount="indefinite"
                            values="M 0 0 L 84 0 Q 92 14 88 28 Q 84 42 86 56 L 0 56 Z;M 0 0 L 88 0 Q 80 14 90 28 Q 92 42 84 56 L 0 56 Z;M 0 0 L 84 0 Q 92 14 88 28 Q 84 42 86 56 L 0 56 Z"
                          />
                        )}
                      </path>
                    </clipPath>
                  </defs>
                  <g clipPath={`url(#wave-${person.id})`}>
                    <rect x="0" y="0" width="88" height="19" fill={c1} />
                    <rect x="0" y="19" width="88" height="18" fill={c2} />
                    <rect x="0" y="37" width="88" height="19" fill={c3} />
                  </g>
                </svg>
              </button>
              <h2>{person.name}</h2>
              <p className="status">
                {inOffice ? `In ${OFFICE_NAME}` : `Not in ${OFFICE_NAME}`}
              </p>
              <p className="timestamp">
                {status?.updatedAt
                  ? `${inOffice ? "Arrived" : "Left"} ${timeAgo(status.updatedAt)}`
                  : "No status yet"}
              </p>
            </div>
          );
        })}
      </div>

      {error && <p className="error">{error}</p>}
    </main>
  );
}
