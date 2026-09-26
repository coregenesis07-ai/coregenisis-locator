// Coregenisis 2.0 Cloudflare Worker
// Public BOP lookup proxy + D1-backed tracking + scheduled change checks.
// Email delivery is intentionally disabled unless RESEND_API_KEY and ALERT_FROM_EMAIL are configured.

const VERSION = "2.0.0-dev";
const BOP_ENDPOINT = "https://www.bop.gov/PublicInfo/execute/inmateloc";
const BOP_LOCATOR = "https://www.bop.gov/inmateloc/";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const headers = apiHeaders(request, env);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    try {
      if (url.pathname === "/api/health" && request.method === "GET") {
        return json({
          ok: true,
          version: VERSION,
          database_configured: Boolean(env.DB),
          alerts_configured: emailConfigured(env),
          source: "BOP.gov",
          source_url: BOP_LOCATOR
        }, 200, headers);
      }

      if (url.pathname === "/api/bop-search" && request.method === "GET") {
        const q = (url.searchParams.get("q") || "").trim();
        if (q.length < 2 || q.length > 100) {
          return json({ error: "Enter a valid BOP register number or name." }, 400, headers);
        }

        const result = await searchBop(q);
        return json(result, 200, headers, { "Cache-Control": "no-store" });
      }

      if (url.pathname === "/api/track" && request.method === "POST") {
        if (!originAllowed(request, env)) {
          return json({ error: "Origin not allowed." }, 403, headers);
        }
        if (!env.DB) {
          return json({ error: "Tracking database is not configured." }, 503, headers);
        }
        if (!emailConfigured(env)) {
          // Do not collect email addresses until delivery is actually configured.
          return json({
            error: "Email alerts are not enabled on this deployment yet.",
            code: "ALERTS_NOT_CONFIGURED"
          }, 503, headers);
        }

        const body = await readJson(request);
        const registerNumber = normalizeRegisterNumber(body.register_number);
        const inmateName = cleanText(body.inmate_name, 120);
        const email = normalizeEmail(body.email);
        const lang = body.lang === "es" ? "es" : "en";
        const consent = body.consent === true;

        if (!registerNumber) {
          return json({ error: "A valid BOP register number is required (#####-###)." }, 400, headers);
        }
        if (!email) {
          return json({ error: "A valid email address is required." }, 400, headers);
        }
        if (!consent) {
          return json({ error: "Lawful-use consent is required." }, 400, headers);
        }

        const current = await searchBop(registerNumber);
        const inmate = current.results.find(r => r.register_number === registerNumber) || current.results[0];
        if (!inmate) {
          return json({
            error: "No matching public BOP record was returned. Verify the register number at BOP.gov before subscribing."
          }, 404, headers);
        }

        const displayName = inmateName || inmate.name || "";
        const releaseDate = inmate.actual_release_date || inmate.projected_release_date || "";

        await env.DB.prepare(
          `INSERT INTO tracked_inmates
            (register_number, inmate_name, email, lang, last_facility, last_release_date, last_checked,
             active, notification_status, failure_count, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, datetime('now'), 1, 'active', 0, datetime('now'), datetime('now'))
           ON CONFLICT(register_number, email) DO UPDATE SET
             inmate_name=excluded.inmate_name,
             lang=excluded.lang,
             last_facility=excluded.last_facility,
             last_release_date=excluded.last_release_date,
             last_checked=datetime('now'),
             active=1,
             notification_status='active',
             failure_count=0,
             last_error=NULL,
             updated_at=datetime('now')`
        ).bind(
          registerNumber,
          displayName,
          email,
          lang,
          inmate.facility_name || "",
          releaseDate
        ).run();

        return json({
          ok: true,
          message: lang === "es" ? "Seguimiento activado." : "Tracking activated.",
          register_number: registerNumber,
          alerts_configured: true
        }, 200, headers);
      }

      if (url.pathname === "/api/track" && request.method === "DELETE") {
        if (!originAllowed(request, env)) {
          return json({ error: "Origin not allowed." }, 403, headers);
        }
        if (!env.DB) {
          return json({ error: "Tracking database is not configured." }, 503, headers);
        }

        const body = await readJson(request);
        const registerNumber = normalizeRegisterNumber(body.register_number);
        const email = normalizeEmail(body.email);
        if (!registerNumber || !email) {
          return json({ error: "Register number and email are required." }, 400, headers);
        }

        await env.DB.prepare(
          "DELETE FROM tracked_inmates WHERE register_number=? AND lower(email)=lower(?)"
        ).bind(registerNumber, email).run();

        return json({ ok: true, message: "Tracking request deleted." }, 200, headers);
      }

      if (url.pathname === "/api/rules" && request.method === "GET") {
        if (!env.DB) return json({ error: "Database is not configured." }, 503, headers);
        const { results } = await env.DB.prepare(
          `SELECT slug, title, agency, docket_number, cfr, federal_register_citation,
                  document_number, rin, document_type, publication_date, effective_date,
                  comment_deadline, status, summary, source_url, official_pdf_url, last_verified_at
             FROM regulatory_documents
            ORDER BY publication_date DESC`
        ).all();
        return json({ results: results || [] }, 200, headers, { "Cache-Control": "public, max-age=300" });
      }

      if (url.pathname === "/api/facilities" && request.method === "GET") {
        if (!env.DB) return json({ error: "Database is not configured." }, 503, headers);
        const q = (url.searchParams.get("q") || "").trim().toLowerCase();
        let stmt;
        if (q) {
          stmt = env.DB.prepare(
            `SELECT code, name, state, type, security_level, city, official_url, last_verified_at
               FROM facilities
              WHERE lower(name) LIKE ? OR lower(state) LIKE ? OR lower(city) LIKE ? OR lower(code) LIKE ?
              ORDER BY name LIMIT 100`
          ).bind(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
        } else {
          stmt = env.DB.prepare(
            `SELECT code, name, state, type, security_level, city, official_url, last_verified_at
               FROM facilities ORDER BY name LIMIT 100`
          );
        }
        const { results } = await stmt.all();
        return json({ results: results || [] }, 200, headers);
      }

      return json({ error: "Not found." }, 404, headers);
    } catch (error) {
      console.error("Coregenisis API error", error);
      const status = error instanceof ApiError ? error.status : 500;
      return json({
        error: error instanceof ApiError ? error.message : "The service could not complete this request.",
        code: error instanceof ApiError ? "UPSTREAM_OR_INPUT_ERROR" : "SERVER_ERROR"
      }, status, headers);
    }
  },

  async scheduled(event, env, ctx) {
    if (!env.DB) return;
    ctx.waitUntil(checkAllInmates(env));
  }
};

async function searchBop(query) {
  const params = new URLSearchParams({ todo: "query", output: "json" });
  const registerNumber = normalizeRegisterNumber(query);

  if (registerNumber) {
    params.set("inmateNumType", "IRN");
    params.set("inmateNum", registerNumber);
  } else {
    const parts = query.trim().replace(/\s+/g, " ").split(" ");
    if (parts.length < 2) {
      throw new ApiError(400, "For a name search, enter at least a first and last name.");
    }
    params.set("nameFirst", parts[0]);
    params.set("nameLast", parts[parts.length - 1]);
    if (parts.length > 2) params.set("nameMiddle", parts.slice(1, -1).join(" "));
  }

  const response = await fetch(`${BOP_ENDPOINT}?${params.toString()}`, {
    headers: {
      "Accept": "application/json,text/plain;q=0.9,*/*;q=0.1",
      "User-Agent": "Coregenisis/2.0 (+public federal information service)"
    },
    redirect: "follow"
  });

  if (!response.ok) {
    throw new ApiError(502, "The official BOP lookup service did not return a successful response.");
  }

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new ApiError(502, "The official BOP lookup service returned an unexpected response.");
  }

  if (data?.Captcha === true) {
    throw new ApiError(503, "The official BOP service requires additional verification right now. Please verify directly at BOP.gov.");
  }

  const rows = Array.isArray(data?.InmateLocator) ? data.InmateLocator : [];
  return {
    source: "Federal Bureau of Prisons",
    source_url: BOP_LOCATOR,
    checked_at: new Date().toISOString(),
    notice: "BOP states that release dates may not be up to date while sentences are reviewed or recalculated. Verify current information at BOP.gov.",
    results: rows.map(normalizeBopRow)
  };
}

function normalizeBopRow(row) {
  const name = [row?.nameFirst, row?.nameMiddle, row?.nameLast, row?.suffix]
    .map(v => cleanText(v, 80))
    .filter(Boolean)
    .join(" ");

  const facilityUrl = cleanText(row?.faclURL, 300);
  return {
    name: name || "Name unavailable",
    register_number: cleanText(row?.inmateNum, 20),
    facility_code: cleanText(row?.faclCode, 20),
    facility_name: cleanText(row?.faclName, 120),
    facility_type: cleanText(row?.faclType, 60),
    facility_url: facilityUrl
      ? new URL(facilityUrl, "https://www.bop.gov").toString()
      : "",
    projected_release_date: cleanText(row?.projRelDate, 40),
    actual_release_date: cleanText(row?.actRelDate, 40)
  };
}

async function checkAllInmates(env) {
  if (!emailConfigured(env)) {
    console.log("Coregenisis scheduled check skipped: email provider not configured.");
    return;
  }

  const { results = [] } = await env.DB.prepare(
    `SELECT id, register_number, inmate_name, email, lang, last_facility, last_release_date
       FROM tracked_inmates
      WHERE active=1
      ORDER BY id
      LIMIT 1000`
  ).all();

  for (const row of results) {
    try {
      const current = await searchBop(row.register_number);
      const inmate = current.results.find(r => r.register_number === row.register_number) || current.results[0];
      if (!inmate) {
        await markFailure(env, row.id, "No current BOP result returned.");
        continue;
      }

      const currentFacility = inmate.facility_name || "";
      const currentRelease = inmate.actual_release_date || inmate.projected_release_date || "";
      const facilityChanged = (row.last_facility || "") !== currentFacility;
      const releaseChanged = (row.last_release_date || "") !== currentRelease;

      if (facilityChanged || releaseChanged) {
        await sendAlertEmail(env, row, inmate, { facilityChanged, releaseChanged });

        await env.DB.batch([
          env.DB.prepare(
            `UPDATE tracked_inmates
                SET last_facility=?, last_release_date=?, last_checked=datetime('now'),
                    last_alerted_at=datetime('now'), failure_count=0, last_error=NULL,
                    notification_status='active', updated_at=datetime('now')
              WHERE id=?`
          ).bind(currentFacility, currentRelease, row.id),
          env.DB.prepare(
            `INSERT INTO alert_events
              (tracked_inmate_id, event_type, old_value, new_value, sent_at, created_at)
             VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`
          ).bind(
            row.id,
            facilityChanged && releaseChanged ? "facility_and_release" : facilityChanged ? "facility" : "release_date",
            JSON.stringify({ facility: row.last_facility || "", release_date: row.last_release_date || "" }),
            JSON.stringify({ facility: currentFacility, release_date: currentRelease })
          )
        ]);
      } else {
        await env.DB.prepare(
          `UPDATE tracked_inmates
              SET last_checked=datetime('now'), failure_count=0, last_error=NULL, updated_at=datetime('now')
            WHERE id=?`
        ).bind(row.id).run();
      }
    } catch (error) {
      console.error("Scheduled check failed", row.register_number, error);
      await markFailure(env, row.id, String(error?.message || error).slice(0, 500));
    }
  }
}

async function markFailure(env, id, message) {
  await env.DB.prepare(
    `UPDATE tracked_inmates
        SET last_checked=datetime('now'), failure_count=failure_count+1,
            last_error=?, updated_at=datetime('now')
      WHERE id=?`
  ).bind(message, id).run();
}

async function sendAlertEmail(env, tracked, current, changed) {
  const spanish = tracked.lang === "es";
  const subject = spanish
    ? `Actualización BOP: ${tracked.inmate_name || tracked.register_number}`
    : `BOP update: ${tracked.inmate_name || tracked.register_number}`;

  const changedLines = [];
  if (changed.facilityChanged) {
    changedLines.push(spanish
      ? `<li><strong>Institución:</strong> ${escapeHtml(current.facility_name || "No indicada")}</li>`
      : `<li><strong>Facility:</strong> ${escapeHtml(current.facility_name || "Not listed")}</li>`);
  }
  if (changed.releaseChanged) {
    const release = current.actual_release_date || current.projected_release_date || (spanish ? "No indicada" : "Not listed");
    changedLines.push(spanish
      ? `<li><strong>Fecha de liberación:</strong> ${escapeHtml(release)}</li>`
      : `<li><strong>Release date:</strong> ${escapeHtml(release)}</li>`);
  }

  const html = spanish
    ? `<h2>Coregenisis — actualización de registro público</h2>
       <p>Detectamos un cambio en la información pública del BOP para <strong>${escapeHtml(tracked.inmate_name || tracked.register_number)}</strong>.</p>
       <ul>${changedLines.join("")}</ul>
       <p>Verifique la información directamente en <a href="${BOP_LOCATOR}">BOP.gov</a>. Coregenisis es un servicio informativo independiente y no está afiliado al BOP o DOJ.</p>`
    : `<h2>Coregenisis — public record update</h2>
       <p>We detected a change in public BOP information for <strong>${escapeHtml(tracked.inmate_name || tracked.register_number)}</strong>.</p>
       <ul>${changedLines.join("")}</ul>
       <p>Verify the information directly at <a href="${BOP_LOCATOR}">BOP.gov</a>. Coregenisis is an independent information service and is not affiliated with BOP or DOJ.</p>`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: env.ALERT_FROM_EMAIL,
      to: [tracked.email],
      subject,
      html
    })
  });

  if (!response.ok) {
    const details = (await response.text()).slice(0, 500);
    throw new Error(`Email provider error ${response.status}: ${details}`);
  }
}

function emailConfigured(env) {
  return Boolean(env.RESEND_API_KEY && env.ALERT_FROM_EMAIL);
}

function originAllowed(request, env) {
  const origin = request.headers.get("Origin");
  if (!origin) return true;
  if (!env.ALLOWED_ORIGIN) return true;
  return origin === env.ALLOWED_ORIGIN;
}

function apiHeaders(request, env) {
  const h = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Vary": "Origin"
  });
  const origin = request.headers.get("Origin");
  if (origin && (!env.ALLOWED_ORIGIN || origin === env.ALLOWED_ORIGIN)) {
    h.set("Access-Control-Allow-Origin", origin);
    h.set("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
    h.set("Access-Control-Allow-Headers", "Content-Type");
  }
  return h;
}

async function readJson(request) {
  const len = Number(request.headers.get("Content-Length") || 0);
  if (len > 8192) throw new ApiError(413, "Request body is too large.");
  try {
    return await request.json();
  } catch {
    throw new ApiError(400, "Invalid JSON request.");
  }
}

function normalizeRegisterNumber(value) {
  const raw = String(value || "").trim();
  const match = raw.match(/^(\d{5})-?(\d{3})$/);
  return match ? `${match[1]}-${match[2]}` : "";
}

function normalizeEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  if (email.length > 254) return "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

function cleanText(value, max = 200) {
  return String(value || "").replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, max);
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[ch]));
}

function json(payload, status = 200, baseHeaders = new Headers(), extra = {}) {
  const headers = new Headers(baseHeaders);
  Object.entries(extra).forEach(([k, v]) => headers.set(k, v));
  return new Response(JSON.stringify(payload), { status, headers });
}

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
