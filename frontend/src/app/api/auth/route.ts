import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function proxyToBackend(path: string, req: NextRequest, method = "GET") {
  const url = `${BACKEND_URL}${path}`;

  const headers: Record<string, string> = {};
  // Forward incoming cookie header to backend so backend can read session cookies
  const cookie = req.headers.get("cookie");
  if (cookie) headers["cookie"] = cookie;

  // Forward content-type if present
  const contentType = req.headers.get("content-type");
  if (contentType) headers["content-type"] = contentType;

  const init: RequestInit = {
    method,
    headers,
    // forward body where applicable
    body: method === "GET" ? undefined : await req.text(),
    // server-side fetch will include system-level cookies if needed
  };

  const res = await fetch(url, init);
  const bodyText = await res.text();

  // Collect any set-cookie headers from backend response to forward to client
  const setCookie: string[] = [];
  // Node fetch/Next fetch may expose multiple Set-Cookie headers under raw headers
  // but the portable way is to iterate headers entries
  for (const [k, v] of res.headers.entries()) {
    if (k.toLowerCase() === "set-cookie") {
      setCookie.push(v);
    }
  }

  const responseHeaders: Record<string, string> = {
    "content-type": res.headers.get("content-type") || "text/plain",
  };
  // If backend returned set-cookie headers, forward them
  if (setCookie.length > 0) {
    // Next.js supports setting multiple Set-Cookie headers by repeating header
    // but NextResponse.json only accepts a single headers object. We join them with '\n'
    // and set in raw response below.
    responseHeaders["set-cookie"] = setCookie.join("\n");
  }

  return { status: res.status, bodyText, headers: responseHeaders };
}

export async function POST(req: NextRequest) {
  // Proxy refresh request to backend: POST /api/v1/auth/refresh
  try {
    const { status, bodyText, headers } = await proxyToBackend("/api/v1/auth/refresh", req, "POST");
    const res = NextResponse.json(
      bodyText ? JSON.parse(bodyText) : { ok: true },
      { status, headers }
    );

    // If we have multiple Set-Cookie values joined by newline, split and append each
    const rawSetCookie = headers["set-cookie"];
    if (rawSetCookie) {
      const cookies = rawSetCookie.split("\n");
      for (const c of cookies) {
        res.headers.append("Set-Cookie", c);
      }
    }

    return res;
  } catch (err: any) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}

export async function GET(req: NextRequest) {
  // Proxy a CSRF token fetch endpoint for local dev: GET /api/v1/auth/csrf
  try {
    const { status, bodyText, headers } = await proxyToBackend("/api/v1/auth/csrf", req, "GET");
    const res = NextResponse.json(
      bodyText ? JSON.parse(bodyText) : { ok: true },
      { status, headers }
    );

    const rawSetCookie = headers["set-cookie"];
    if (rawSetCookie) {
      const cookies = rawSetCookie.split("\n");
      for (const c of cookies) {
        res.headers.append("Set-Cookie", c);
      }
    }

    return res;
  } catch (err: any) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
