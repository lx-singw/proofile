"use client";

import { useState } from "react";

export default function TestLoginPage() {
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleTestLogin = async () => {
    setLoading(true);
    setResult("Testing login...");

    try {
      const response = await fetch("/api/v1/auth/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        credentials: "include",
        body: "username=debug@example.com&password=Passw0rd!",
      });

      setResult(`Response status: ${response.status}\n`);

      const data = await response.json();
      setResult((prev) => prev + `Response: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      setResult(
        `Error: ${error instanceof Error ? error.message : String(error)}\n` +
          `Stack: ${error instanceof Error ? error.stack : "N/A"}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Test Login Endpoint</h1>

      <button
        onClick={handleTestLogin}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
      >
        {loading ? "Testing..." : "Test Login"}
      </button>

      <pre className="bg-gray-100 p-4 rounded whitespace-pre-wrap break-words text-sm">
        {result}
      </pre>
    </div>
  );
}
