import { kv } from "@vercel/kv";
import { NextRequest, NextResponse } from "next/server";
import { PEOPLE, type PersonId } from "@/app/config";

export const runtime = "edge";
// Don't cache this route - we always want the latest status.
export const dynamic = "force-dynamic";

type Status = {
  inOffice: boolean;
  updatedAt: number;
};

type StatusMap = Record<PersonId, Status | null>;

const VALID_IDS = new Set<string>(PEOPLE.map((p) => p.id));

function key(id: string) {
  return `status:${id}`;
}

export async function GET() {
  const entries = await Promise.all(
    PEOPLE.map(async (p) => {
      const value = await kv.get<Status>(key(p.id));
      return [p.id, value ?? null] as const;
    }),
  );
  const data = Object.fromEntries(entries) as StatusMap;
  return NextResponse.json(data, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(req: NextRequest) {
  const secret = process.env.UPDATE_SECRET;
  if (secret) {
    const provided = req.headers.get("x-update-secret");
    if (provided !== secret) {
      return NextResponse.json({ error: "unauthorised" }, { status: 401 });
    }
  }

  let body: { id?: string; inOffice?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const { id, inOffice } = body;
  if (typeof id !== "string" || !VALID_IDS.has(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  if (typeof inOffice !== "boolean") {
    return NextResponse.json({ error: "invalid inOffice" }, { status: 400 });
  }

  const status: Status = { inOffice, updatedAt: Date.now() };
  await kv.set(key(id), status);
  return NextResponse.json(status, {
    headers: { "Cache-Control": "no-store" },
  });
}
