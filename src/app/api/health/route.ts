import { connection } from "next/server";

import type { ApiResponse } from "@/types/api";

interface HealthData {
  status: "ok";
  timestamp: string;
}

export async function GET(): Promise<Response> {
  // Run at request time so monitors see the live app, not a build-time snapshot.
  await connection();

  const body: ApiResponse<HealthData> = {
    success: true,
    message: "TimeTrack is running.",
    data: { status: "ok", timestamp: new Date().toISOString() },
  };

  return Response.json(body, { headers: { "Cache-Control": "no-store" } });
}
