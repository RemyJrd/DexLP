import { NextResponse } from "next/server";
import { getPoolSnapshot } from "../../../lib/pool-data";
import type { PoolApiError } from "../../../lib/pool-types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snapshot = await getPoolSnapshot();

    return NextResponse.json(snapshot, {
      headers: {
        "Cache-Control": "public, max-age=15, stale-while-revalidate=45",
      },
    });
  } catch (error) {
    console.error("Pool snapshot unavailable", error);

    const body: PoolApiError = {
      error: {
        code: "POOL_DATA_UNAVAILABLE",
        message:
          "Impossible de lire la pool sur Gnosis Chain. Réessayez dans quelques instants.",
      },
    };

    return NextResponse.json(body, {
      status: 503,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }
}

