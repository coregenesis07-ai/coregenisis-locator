
// Cloudflare Worker - Free BOP Proxy + Daily Alert Checker
// Uses D1 (free) + MailChannels (free email inside Workers)

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // API: Proxy to BOP.gov to avoid CORS
    if (url.pathname === "/api/bop-search") {
      const q = url.searchParams.toString();
      // Official public BOP endpoint
      const bopUrl = `https://www.bop.gov/PublicInfo/execute/inmateloc?${q}`;
      try {
        const res = await fetch(bopUrl, {
          headers: { "User-Agent": "Coregenisis/1.0 (helps families)" }
        });
        const data = await res.text();
        return new Response(data, {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=300"
          }
        });
      } catch (e) {
        return new Response(JSON.stringify({error: "BOP fetch failed"}), {status: 500});
      }
    }

    // API: Subscribe for alerts
    if (url.pathname === "/api/track" && request.method === "POST") {
      const body = await request.json();
      const { register_number, inmate_name, email, phone, lang } = body;
      
      if (!register_number || !email) {
        return new Response(JSON.stringify({error: "Missing fields"}), {status: 400});
      }

      // Save to D1
      await env.DB.prepare(
        `INSERT INTO tracked_inmates (register_number, inmate_name, email, phone, lang, last_checked, created_at) 
         VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
         ON CONFLICT(register_number, email) DO UPDATE SET inmate_name=excluded.inmate_name`
      ).bind(register_number, inmate_name, email, phone || "", lang || "en").run();

      return new Response(JSON.stringify({ok: true, message: "Tracking enabled"}), {
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response("Coregenisis API - Use /api/bop-search or /api/track", {status: 404});
  },

  // CRON: Runs daily 6am - Checks for changes and sends alerts via MailChannels (FREE)
  async scheduled(event, env, ctx) {
    ctx.waitUntil(checkAllInmates(env));
  }
};

async function checkAllInmates(env) {
  const { results } = await env.DB.prepare("SELECT * FROM tracked_inmates").all();
  
  for (const row of results) {
    try {
      const bopUrl = `https://www.bop.gov/PublicInfo/execute/inmateloc?todo=query&output=json&inmateNum=${row.register_number}`;
      const res = await fetch(bopUrl);
      const data = await res.json();
      
      // Simplified change detection - adapt to real BOP JSON structure
      const currentFacility = data?.inmate?.faclName || "Unknown";
      const currentRelease = data?.inmate?.actRelDate || data?.inmate?.projRelDate || "Unknown";
      
      // Compare with last known (you would store last_facility/last_release in D1)
      // If changed, send alert
      
      // Example: send email via MailChannels (FREE in Workers)
      if (currentFacility !== row.last_facility || currentRelease !== row.last_release_date) {
        await sendAlertEmail(env, row, {facility: currentFacility, releaseDate: currentRelease});
        
        // Update D1
        await env.DB.prepare(
          "UPDATE tracked_inmates SET last_facility=?, last_release_date=?, last_checked=datetime('now') WHERE id=?"
        ).bind(currentFacility, currentRelease, row.id).run();
      }
    } catch (e) {
      console.error("Check failed for", row.register_number, e);
    }
  }
}

async function sendAlertEmail(env, tracked, current) {
  const isSpanish = tracked.lang === "es";
  
  const subject = isSpanish 
    ? `Actualización BOP: ${tracked.inmate_name} - Cambio detectado`
    : `BOP Update: ${tracked.inmate_name} - Change Detected`;

  const html = isSpanish ? `
    <h2>Coregenisis - Alerta Gratuita</h2>
    <p>Hola, hay un cambio para <strong>${tracked.inmate_name} (${tracked.register_number})</strong>:</p>
    <ul>
      <li><strong>Instalación Actual:</strong> ${current.facility}</li>
      <li><strong>Fecha de Liberación:</strong> ${current.releaseDate}</li>
    </ul>
    <p>Revisar en BOP.gov y en Coregenisis. Este es un servicio gratuito para familias.</p>
  ` : `
    <h2>Coregenisis - Free Alert</h2>
    <p>Hi, there is an update for <strong>${tracked.inmate_name} (${tracked.register_number})</strong>:</p>
    <ul>
      <li><strong>Current Facility:</strong> ${current.facility}</li>
      <li><strong>Release Date:</strong> ${current.releaseDate}</li>
    </ul>
    <p>Check BOP.gov and Coregenisis. This is a free service for families.</p>
  `;

  // MailChannels free email - no API key needed in Workers
  await fetch("https://api.mailchannels.net/tx/v1/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: tracked.email }] }],
      from: { email: env.ALERT_FROM_EMAIL || "alerts@coregenisis.pages.dev", name: "Coregenisis Alerts" },
      subject,
      content: [{ type: "text/html", value: html }]
    })
  });
}
