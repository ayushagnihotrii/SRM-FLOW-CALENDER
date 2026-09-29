import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const { clientId, clientSecret } = await request.json();

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "Both Client ID and Client Secret are required." },
        { status: 400 }
      );
    }

    const envPath = path.join(process.cwd(), ".env.local");
    let content = "";
    if (fs.existsSync(envPath)) {
      content = fs.readFileSync(envPath, "utf-8");
    }

    // Update or insert GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
    if (content.includes("GOOGLE_CLIENT_ID=")) {
      content = content.replace(
        /GOOGLE_CLIENT_ID=.*/,
        `GOOGLE_CLIENT_ID=${clientId.trim()}`
      );
    } else {
      content += `\nGOOGLE_CLIENT_ID=${clientId.trim()}`;
    }

    if (content.includes("GOOGLE_CLIENT_SECRET=")) {
      content = content.replace(
        /GOOGLE_CLIENT_SECRET=.*/,
        `GOOGLE_CLIENT_SECRET=${clientSecret.trim()}`
      );
    } else {
      content += `\nGOOGLE_CLIENT_SECRET=${clientSecret.trim()}`;
    }

    fs.writeFileSync(envPath, content, "utf-8");

    // Also update process.env in memory so it's instantly available without server restart
    process.env.GOOGLE_CLIENT_ID = clientId.trim();
    process.env.GOOGLE_CLIENT_SECRET = clientSecret.trim();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Configure Google error:", error);
    return NextResponse.json(
      { error: "Failed to save Google credentials." },
      { status: 500 }
    );
  }
}
