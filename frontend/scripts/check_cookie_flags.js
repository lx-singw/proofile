#!/usr/bin/env node
/*
 Simple script to call the backend CSRF endpoint and print Set-Cookie headers and flags.
 Usage (from frontend folder):
   node ./scripts/check_cookie_flags.js
 It reads BACKEND_URL or NEXT_PUBLIC_API_URL env var, defaults to http://localhost:8000
*/
const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function main() {
  const url = `${BACKEND_URL}/api/v1/auth/csrf`;
  console.log(`Fetching ${url} ...`);
  try {
    // Add a 7s timeout so we don't hang in dev
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 7000);
    const res = await fetch(url, { method: "GET", credentials: "include", signal: controller.signal });
    clearTimeout(t);

    console.log(`Response status: ${res.status}`);
    const setCookie = res.headers.get("set-cookie");
    if (!setCookie) {
      console.log("No Set-Cookie header returned. Backend may not be setting CSRF cookie or endpoint differs.");
      const text = await res.text().catch(() => "<no body>");
      console.log(`Body: ${text.slice(0, 400)}`);
      process.exit(res.ok ? 0 : 1);
    }

    // Support multiple cookies separated by newline (server proxies may join them)
    const cookies = setCookie.split(/\n|, (?=[^;]+=)/g);
    console.log(`Found ${cookies.length} cookie(s):`);
    for (const c of cookies) {
      console.log(`- ${c}`);
      const flags = [];
      if (/HttpOnly/i.test(c)) flags.push("HttpOnly");
      if (/Secure/i.test(c)) flags.push("Secure");
      const sameSite = c.match(/SameSite=([^;]+)/i);
      if (sameSite) flags.push(`SameSite=${sameSite[1]}`);
      const path = c.match(/Path=([^;]+)/i);
      if (path) flags.push(`Path=${path[1]}`);
      console.log(`  Parsed flags: ${flags.join(", ")}`);
    }
  } catch (err) {
    console.error("Error fetching CSRF endpoint:", err);
    process.exit(2);
  }
}

main();
