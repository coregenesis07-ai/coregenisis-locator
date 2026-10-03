
// Cloudflare Worker - Free BOP Proxy + Daily Alert Checker
// Uses D1 (free) + MailChannels (free email inside Workers)

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // API: Proxy to BOP.gov to avoid CORS
    if (url.pathname === "/api/bop-search") {
      const q = (url.searchParams.get("q") || "").trim();
      if (!q) return json({error: "Missing search query"}, 400);
      const isRegister = /^\\d{5}-\\d{3}$/.test(q);
      const params = new URLSearchParams({todo: "query", output: "json"});
      if (isRegister) params.set("inmateNum", q);
      else params.set("nameLast", q);
      // Official public BOP inmate-locator endpoint
      const bopUrl = `https://www.bop.gov/PublicInfo/execute/inmateloc?${params.toString()}`;
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

    // Alert enrollment is intentionally paused pending verified-email, consent,
    // unsubscribe, retention, and abuse-prevention controls.
    if (url.pathname === "/api/track" && request.method === "POST") {
      return new Response(JSON.stringify({error: "Alert enrollment temporarily unavailable"}), {
        status: 503,
        headers: {"Content-Type": "application/json", "Cache-Control": "no-store"}
      });
    }

    // Verified-alert lifecycle endpoints remain server-disabled until the D1 migration,
    // sender authentication, retention decision, and end-to-end tests are complete.
    if (url.pathname.startsWith("/api/alerts/")) {
      if (env.ALERTS_ENABLED !== "true") return json({error:"Alerts temporarily unavailable"}, 503);
      if (url.pathname === "/api/alerts/enroll" && request.method === "POST") return enrollAlert(request, env, url);
      if (url.pathname === "/api/alerts/verify" && request.method === "GET") return verifyAlert(env, url);
      if (url.pathname === "/api/alerts/delete" && request.method === "POST") return deleteAlert(request, env);
    }

    if (env.ASSETS) return env.ASSETS.fetch(request);
    return new Response("Federal Custody Guide", {status: 404});
  },

  // CRON: Runs daily 6am - Checks for changes and sends alerts via MailChannels (FREE)
  async scheduled(event, env, ctx) {
    ctx.waitUntil(checkAllInmates(env));
  }
};

async function checkAllInmates(env) {
  const { results } = await env.DB.prepare(
    "SELECT * FROM tracked_inmates WHERE status = 'active' AND verified_at IS NOT NULL AND unsubscribed_at IS NULL AND (expires_at IS NULL OR expires_at > datetime('now'))"
  ).all();
  
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
    <h2>Federal Custody Guide - Alerta Solicitada</h2>
    <p>Hola, hay un cambio para <strong>${tracked.inmate_name} (${tracked.register_number})</strong>:</p>
    <ul>
      <li><strong>Instalación Actual:</strong> ${current.facility}</li>
      <li><strong>Fecha de Liberación:</strong> ${current.releaseDate}</li>
    </ul>
    <p>Confirme la información en BOP.gov. Federal Custody Guide es un recurso educativo independiente.</p>
  ` : `
    <h2>Federal Custody Guide - Requested Alert</h2>
    <p>Hi, there is an update for <strong>${tracked.inmate_name} (${tracked.register_number})</strong>:</p>
    <ul>
      <li><strong>Current Facility:</strong> ${current.facility}</li>
      <li><strong>Release Date:</strong> ${current.releaseDate}</li>
    </ul>
    <p>Confirm the information at BOP.gov. Federal Custody Guide is an independent educational resource.</p>
  `;

  // MailChannels free email - no API key needed in Workers
  await fetch("https://api.mailchannels.net/tx/v1/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: tracked.email }] }],
      from: { email: env.ALERT_FROM_EMAIL || "alerts@coregenisis.pages.dev", name: "Federal Custody Guide Alerts" },
      subject,
      content: [{ type: "text/html", value: html }]
    })
  });
}


function json(value, status=200) {
  return new Response(JSON.stringify(value), {status, headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});
}
function validRegisterNumber(v) { return /^\d{5}-\d{3}$/.test(String(v||"").trim()); }
function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v||"").trim()) && String(v).length <= 254; }
function normalizeEmail(v) { return String(v||"").trim().toLowerCase(); }
function randomToken() {
  const bytes=new Uint8Array(32); crypto.getRandomValues(bytes);
  return Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("");
}
async function sha256(v) {
  const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(v));
  return Array.from(new Uint8Array(b),x=>x.toString(16).padStart(2,"0")).join("");
}
async function enrollAlert(request, env, url) {
  let body; try { body=await request.json(); } catch { return json({error:"Invalid JSON"},400); }
  const register=String(body.register_number||"").trim(), email=normalizeEmail(body.email), lang=body.lang==="es"?"es":"en";
  if (!validRegisterNumber(register)||!validEmail(email)) return json({error:"Invalid registration number or email"},400);
  if (body.consent !== true || body.consent_version !== "2026-10-03") return json({error:"Consent required"},400);
  const emailHash=await sha256(email);
  const suppressed=await env.DB.prepare("SELECT 1 FROM alert_suppressions WHERE email_hash=?").bind(emailHash).first();
  if (suppressed) return json({ok:true,message:"Request received"});
  const verifyToken=randomToken(), manageToken=randomToken();
  const verifyHash=await sha256(verifyToken), manageHash=await sha256(manageToken);
  await env.DB.prepare(
    "INSERT INTO tracked_inmates(register_number,email,lang,status,verify_token_hash,manage_token_hash,consent_version,consented_at,created_at,expires_at) VALUES(?,?,?,'pending',?,?,?,datetime('now'),datetime('now'),datetime('now','+1 year')) ON CONFLICT(register_number,email) DO UPDATE SET lang=excluded.lang,status='pending',verify_token_hash=excluded.verify_token_hash,manage_token_hash=excluded.manage_token_hash,consent_version=excluded.consent_version,consented_at=datetime('now'),verified_at=NULL,unsubscribed_at=NULL,expires_at=datetime('now','+1 year')"
  ).bind(register,email,lang,verifyHash,manageHash,body.consent_version).run();
  await sendVerificationEmail(env,email,lang,verifyToken,manageToken,url.origin);
  return json({ok:true,message:"Check your email to verify the alert"});
}
async function verifyAlert(env,url) {
  const token=url.searchParams.get("token")||""; if(token.length<32) return json({error:"Invalid token"},400);
  const hash=await sha256(token);
  const row=await env.DB.prepare("SELECT id FROM tracked_inmates WHERE verify_token_hash=? AND status='pending'").bind(hash).first();
  if(!row) return json({error:"Invalid or expired verification"},400);
  await env.DB.prepare("UPDATE tracked_inmates SET status='active',verified_at=datetime('now'),verify_token_hash=NULL WHERE id=?").bind(row.id).run();
  await env.DB.prepare("INSERT INTO alert_audit(tracking_id,event) VALUES(?,'verified')").bind(row.id).run();
  return new Response("Federal Custody Guide alert verified. You may close this page.",{headers:{"Content-Type":"text/plain; charset=utf-8","Cache-Control":"no-store"}});
}
async function deleteAlert(request,env) {
  let body; try { body=await request.json(); } catch { return json({error:"Invalid JSON"},400); }
  const token=String(body.manage_token||""); if(token.length<32) return json({error:"Invalid token"},400);
  const hash=await sha256(token);
  const row=await env.DB.prepare("SELECT id,email FROM tracked_inmates WHERE manage_token_hash=?").bind(hash).first();
  if(!row) return json({ok:true});
  const emailHash=await sha256(normalizeEmail(row.email));
  await env.DB.prepare("INSERT OR REPLACE INTO alert_suppressions(email_hash,reason,created_at) VALUES(?,'user_opt_out',datetime('now'))").bind(emailHash).run();
  await env.DB.prepare("DELETE FROM tracked_inmates WHERE id=?").bind(row.id).run();
  return json({ok:true,message:"Alert data deleted and future enrollment suppressed for this email"});
}
async function sendVerificationEmail(env,email,lang,verifyToken,manageToken,origin) {
  const verifyUrl=origin+"/api/alerts/verify?token="+encodeURIComponent(verifyToken);
  const manageUrl=origin+"/manage-alert.html?token="+encodeURIComponent(manageToken);
  const subject=lang==="es"?"Verifique su alerta de Federal Custody Guide":"Verify your Federal Custody Guide alert";
  const html=lang==="es"
    ? `<h2>Verifique su alerta</h2><p>Solicitó monitoreo de información pública del BOP. <a href="${verifyUrl}">Verificar alerta</a>.</p><p>Para cancelar y eliminar los datos de la alerta: <a href="${manageUrl}">administrar alerta</a>.</p>`
    : `<h2>Verify your alert</h2><p>You requested monitoring of public BOP information. <a href="${verifyUrl}">Verify alert</a>.</p><p>To stop monitoring and delete the alert data: <a href="${manageUrl}">manage alert</a>.</p>`;
  await fetch("https://api.mailchannels.net/tx/v1/send",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
    personalizations:[{to:[{email}]}],from:{email:env.ALERT_FROM_EMAIL,name:"Federal Custody Guide Alerts"},subject,content:[{type:"text/html",value:html}]
  })});
}
