import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { networkInterfaces } from "os";

const PORT = 3456;
const DATA_FILE = join(import.meta.dir, "data.json");
const HTML_FILE = join(import.meta.dir, "index.html");

// Initialize data file if it doesn't exist
if (!existsSync(DATA_FILE)) {
  writeFileSync(DATA_FILE, JSON.stringify({ entries: {}, cycles: [] }, null, 2));
}

function getLocalIP(): string {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]!) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "localhost";
}

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    // CORS headers for all responses
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // API: Get data
    if (url.pathname === "/api/data" && req.method === "GET") {
      try {
        const raw = readFileSync(DATA_FILE, "utf-8");
        return new Response(raw, {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      } catch {
        return new Response(JSON.stringify({ entries: {}, cycles: [] }), {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    // API: Save data
    if (url.pathname === "/api/data" && req.method === "POST") {
      try {
        const body = await req.json();
        writeFileSync(DATA_FILE, JSON.stringify(body, null, 2));
        return new Response(JSON.stringify({ ok: true }), {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: String(e) }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    // Serve index.html for everything else
    if (url.pathname === "/" || url.pathname === "/index.html") {
      const html = readFileSync(HTML_FILE, "utf-8");
      return new Response(html, {
        headers: { "Content-Type": "text/html", ...corsHeaders },
      });
    }

    return new Response("Not found", { status: 404 });
  },
});

const localIP = getLocalIP();
console.log(`\n  Cycle Tracker running!\n`);
console.log(`  Laptop:  http://localhost:${PORT}`);
console.log(`  Phone:   http://${localIP}:${PORT}`);
console.log(`\n  Data saved to: ${DATA_FILE}`);
console.log(`  Keep this terminal open.\n`);
