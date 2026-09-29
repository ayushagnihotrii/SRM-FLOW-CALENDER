import { NextResponse } from "next/server";
import { serverDb } from "@/lib/server-db";

export async function GET() {
  const stats = serverDb.getLastSyncStats();

  return NextResponse.json({
    hasSynced: Boolean(stats),
    stats: stats || null,
  });
}
