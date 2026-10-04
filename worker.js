// Federal Custody Guide Worker
// Public BOP search proxy. Alert enrollment and monitoring remain disabled.

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/bop-search") {
      if (request.method !== "GET") return json({error: "Method not allowed"}, 405);
      const q = (url.searchParams.get("q") || "").trim();
      if (!q) return json({error: "Missing search query"}, 400);
      if (q.length > 100) return json({error: "Search query too long"}, 400);

      const isRegister = /^[0-9]{5}-[0-9]{3}$/.test(q);
      const params = new URLSearchParams({todo: "query", output: "json"});
      if (isRegister) params.set("inmateNum", q);
      else params.set("nameLast", q);

      const bopUrl = `https://www.bop.gov/PublicInfo/execute/inmateloc?${params.toString()}`;
      try {
        const res = await fetch(bopUrl, {
          headers: {
            "Accept": "application/json",
            "User-Agent": "FederalCustodyGuide/1.0"
          }
        });
        if (!res.ok) return json({error: "BOP service unavailable", upstream_status: res.status}, 502);

        const raw = await res.text();
        let data;
        try { data = JSON.parse(raw); }
        catch { return json({error: "BOP returned an unexpected response"}, 502); }

        return new Response(JSON.stringify({ok: true, source: "bop.gov", data}), {
          status: 200,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff"
          }
        });
      } catch {
        return json({error: "BOP service unavailable"}, 502);
      }
    }

    // Alerts are intentionally unavailable until the complete consent,
    // verification, deletion, retention, delivery, and abuse-prevention
    // workflow is configured and tested end to end.
    if (url.pathname === "/api/track" || url.pathname.startsWith("/api/alerts/")) {
      return json({error: "Alerts are not currently available"}, 503);
    }

    if (url.pathname.startsWith("/api/")) return json({error: "API route not found"}, 404);

    if (env.ASSETS) return env.ASSETS.fetch(request);
    return new Response("Federal Custody Guide", {status: 404});
  },

  // Keep scheduled events harmless while alerts are unavailable.
  async scheduled() {
    return;
  }
};

function json(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
