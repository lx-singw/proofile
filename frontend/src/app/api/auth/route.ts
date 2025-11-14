import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || "http://backend:8000";

async function proxyToBackend(path: string, req: NextRequest, method = "GET") {
  const allowedPaths = ["/api/v1/auth/refresh", "/api/v1/auth/csrf"];
  if (!allowedPaths.includes(path)) {
    throw new Error("Invalid path");
  }
  const url = `${BACKEND_URL}${path}`;

  const headers: Record<string, string> = {};
  const cookie = req.headers.get("cookie");
  if (cookie) headers["cookie"] = cookie;

  const contentType = req.headers.get("content-type");
  if (contentType) headers["content-type"] = contentType;

  const init: RequestInit = {
    method,
    headers,
    body: method === "GET" ? undefined : await req.text(),
  };

  const res = await fetch(url, {
    ...init,
    redirect: 'manual',
    signal: AbortSignal.timeout(5000)
  });
  
  if (!res.ok && res.status >= 500) {
    throw new Error(`Backend error: ${res.status}`);
  }
  
  const bodyText = await res.text();

  const setCookie: string[] = [];
  try {
    for (const [k, v] of res.headers.entries()) {
      if (k.toLowerCase() === "set-cookie") {
        setCookie.push(v);
      }
    }
  } catch {
    // Ignore header iteration errors
  }

  const responseHeaders: Record<string, string> = {};
  const responseContentType = res.headers.get("content-type");
  if (responseContentType) {
    responseHeaders["content-type"] = responseContentType;
  }
  
  if (setCookie.length > 0) {
    responseHeaders["set-cookie"] = setCookie.join("\n");
  }

  return { status: res.status, bodyText, headers: responseHeaders };
}

export async function POST(req: NextRequest) {
  try {
    const { status, bodyText, headers } = await proxyToBackend("/api/v1/auth/refresh", req, "POST");
    let jsonBody;
    try {
      jsonBody = bodyText ? JSON.parse(bodyText) : { ok: true };
    } catch {
      return NextResponse.json({ error: "Invalid JSON response" }, { status: 502 });
    }
    const res = NextResponse.json(jsonBody, { status, headers });

    const rawSetCookie = headers["set-cookie"];
    if (rawSetCookie) {
      const cookies = rawSetCookie.split("\n");
      for (const c of cookies) {
        res.headers.append("Set-Cookie", c);
      }
    }

    return res;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { status, bodyText, headers } = await proxyToBackend("/api/v1/auth/csrf", req, "GET");
    let jsonBody;
    try {
      jsonBody = bodyText ? JSON.parse(bodyText) : { ok: true };
    } catch {
      return NextResponse.json({ error: "Invalid JSON response" }, { status: 502 });
    }
    const res = NextResponse.json(jsonBody, { status, headers });

    const rawSetCookie = headers["set-cookie"];
    if (rawSetCookie) {
      const cookies = rawSetCookie.split("\n");
      for (const c of cookies) {
        res.headers.append("Set-Cookie", c);
      }
    }

    return res;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
