import { NextResponse } from "next/server";
import { getCurrentSessionPerson } from "@/lib/currentSession";
import { getDomainSnapshot } from "@/lib/data/domainSnapshot";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getCurrentSessionPerson();
    if (!session.person?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const snapshot = await getDomainSnapshot();
    return NextResponse.json(snapshot, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0"
      }
    });
  } catch (error) {
    console.error("context/snapshot error", error);
    return NextResponse.json(
      { error: "Failed to load context snapshot" },
      { status: 500 }
    );
  }
}
