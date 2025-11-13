import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || "http://backend:8000";

console.log("[API Proxy] Backend URL configured as:", BACKEND_URL);

async function proxyHandler(req: NextRequest) {
  const url = new URL(req.url);
  // Preserve the full pathname (including the /api prefix) so backend routes
  // like /api/v1/* are forwarded unchanged.
  const targetPath = url.pathname;
  const targetUrl = `${BACKEND_URL}${targetPath}${url.search}`;

  console.log(`[API Proxy] Mapping ${req.method} ${url.pathname} to ${targetUrl}`);

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    if (lowerKey !== 'host' && lowerKey !== 'connection' && lowerKey !== 'keep-alive') {
      headers.append(key, value);
    }
  });

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: req.body,
      // @ts-ignore - 'duplex' is a necessary option for streaming request bodies with fetch in Node.js.
      duplex: 'half',
      redirect: 'manual', // Let the client handle redirects.
    });

    console.log(`[API Proxy] Backend responded with status: ${response.status}`);
    
    // Return the response directly. This will stream the body and headers back to the client.
    return response;

  } catch (error) {
    console.error("[API Proxy] Fetch error:", error);
    // If the fetch call itself fails (e.g., network error, DNS issue), return a 502 Bad Gateway.
    return NextResponse.json(
      { error: "Proxy fetch error", details: error instanceof Error ? error.message : String(error) },
      { status: 502 }
    );
  }
}

export async function GET(req: NextRequest) {
  return proxyHandler(req);
}

export async function POST(req: NextRequest) {
  return proxyHandler(req);
}

export async function PUT(req: NextRequest) {
  return proxyHandler(req);
}

export async function PATCH(req: NextRequest) {
  return proxyHandler(req);
}

export async function DELETE(req: NextRequest) {
  return proxyHandler(req);
}
