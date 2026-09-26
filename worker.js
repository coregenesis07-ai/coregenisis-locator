// Coregenisis 2.0 Cloudflare Worker
// Public BOP lookup proxy + D1-backed tracking + scheduled change checks.
// Email delivery is intentionally disabled unless RESEND_API_KEY and ALERT_FROM_EMAIL are configured.

const VERSION = "2.0.0-dev";
const BOP_ENDPOINT = "https://www.bop.gov/PublicInfo/execute/inmateloc";
const BOP_LOCATIONS_ENDPOINT = "https://www.bop.gov/PublicInfo/execute/locations/?todo=query&output=json";
const BOP_POLICY_ENDPOINT = "https://www.bop.gov/PublicInfo/execute/policysearch?todo=query&output=json";
const BOP_LOCATOR = "https://www.bop.gov/inmateloc/";
const FEDERAL_REGISTER_API = "https://www.federalregister.gov/api/v1/documents";

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

      if (url.pathname === "/api/updates" && request.method === "GET") {
        if (!env.DB) return json({ error: "Database is not configured." }, 503, headers);
        const { results } = await env.DB.prepare(
          `SELECT * FROM (
             SELECT
               'regulation' AS source_type,
               title,
               document_number AS identifier,
               publication_date AS published_date,
               source_url,
               last_verified_at
             FROM regulatory_documents
             WHERE publication_date IS NOT NULL
             UNION ALL
             SELECT
               'bop_policy' AS source_type,
               title,
               policy_number AS identifier,
               CASE
                 WHEN length(issue_date)=10
                   THEN substr(issue_date,7,4)||'-'||substr(issue_date,1,2)||'-'||substr(issue_date,4,2)
                 ELSE NULL
               END AS published_date,
               source_url,
               last_verified_at
             FROM bop_policies
             WHERE issue_date IS NOT NULL
           )
           WHERE published_date IS NOT NULL
           ORDER BY published_date DESC
           LIMIT 25`
        ).all();

        return json({ results: results || [] }, 200, headers, { "Cache-Control": "public, max-age=300" });
      }

      if (url.pathname === "/api/admin/refresh" && request.method === "POST") {
        if (!env.ADMIN_TOKEN) {
          return json({ error: "Admin refresh is not configured." }, 503, headers);
        }

        const auth = request.headers.get("Authorization") || "";
        const supplied = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
        if (!supplied || !(await secureEqual(supplied, env.ADMIN_TOKEN))) {
          return json({ error: "Unauthorized." }, 401, headers);
        }

        await refreshOfficialSources(env);
        return json({
          ok: true,
          refreshed_at: new Date().toISOString(),
          message: "Official-source refresh completed."
        }, 200, headers);
      }

      if (url.pathname === "/api/search" && request.method === "GET") {
        if (!env.DB) return json({ error: "Database is not configured." }, 503, headers);
        const q = cleanText(url.searchParams.get("q"), 120).trim().toLowerCase();
        if (q.length < 2) return json({ error: "Enter at least 2 characters." }, 400, headers);
        const like = `%${q}%`;

        const [facilityRows, policyRows, ruleRows] = await env.DB.batch([
          env.DB.prepare(
            `SELECT code, name, state, city, type, security_level, official_url, last_verified_at
               FROM facilities
              WHERE lower(name) LIKE ? OR lower(state) LIKE ? OR lower(city) LIKE ? OR lower(code) LIKE ?
              ORDER BY name LIMIT 10`
          ).bind(like, like, like, like),
          env.DB.prepare(
            `SELECT record_number, policy_number, title, document_type, series, issue_date,
                    source_url, last_verified_at
               FROM bop_policies
              WHERE lower(title) LIKE ? OR lower(policy_number) LIKE ?
              ORDER BY issue_date DESC LIMIT 10`
          ).bind(like, like),
          env.DB.prepare(
            `SELECT slug, title, agency, federal_register_citation, document_number,
                    publication_date, effective_date, comment_deadline, source_url, official_pdf_url,
                    last_verified_at
               FROM regulatory_documents
              WHERE lower(title) LIKE ? OR lower(document_number) LIKE ?
                 OR lower(coalesce(federal_register_citation,'')) LIKE ?
                 OR lower(coalesce(summary,'')) LIKE ?
              ORDER BY publication_date DESC LIMIT 10`
          ).bind(like, like, like, like)
        ]);

        return json({
          query: q,
          facilities: facilityRows?.results || [],
          policies: policyRows?.results || [],
          regulatory_documents: ruleRows?.results || []
        }, 200, headers, { "Cache-Control": "public, max-age=60" });
      }

      if (url.pathname === "/api/data-status" && request.method === "GET") {
        if (!env.DB) return json({ error: "Database is not configured." }, 503, headers);

        const [facilities, policies, rules, alerts] = await env.DB.batch([
          env.DB.prepare("SELECT COUNT(*) AS count, MAX(last_verified_at) AS last_verified_at FROM facilities"),
          env.DB.prepare("SELECT COUNT(*) AS count, MAX(last_verified_at) AS last_verified_at FROM bop_policies"),
          env.DB.prepare("SELECT COUNT(*) AS count, MAX(last_verified_at) AS last_verified_at FROM regulatory_documents"),
          env.DB.prepare("SELECT COUNT(*) AS count, MAX(last_checked) AS last_checked FROM tracked_inmates WHERE active=1")
        ]);

        return json({
          checked_at: new Date().toISOString(),
          alerts_configured: emailConfigured(env),
          facilities: firstRow(facilities),
          policies: firstRow(policies),
          regulatory_documents: firstRow(rules),
          active_alerts: firstRow(alerts)
        }, 200, headers, { "Cache-Control": "public, max-age=60" });
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
        const verificationToken = generateToken();
        const unsubscribeToken = generateToken();

        await env.DB.prepare(
          `INSERT INTO tracked_inmates
            (register_number, inmate_name, email, lang, last_facility, last_release_date, last_checked,
             active, notification_status, verification_token, unsubscribe_token,
             failure_count, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, datetime('now'), 0, 'pending_verification', ?, ?, 0, datetime('now'), datetime('now'))
           ON CONFLICT(register_number, email) DO UPDATE SET
             inmate_name=excluded.inmate_name,
             lang=excluded.lang,
             last_facility=excluded.last_facility,
             last_release_date=excluded.last_release_date,
             last_checked=datetime('now'),
             active=0,
             notification_status='pending_verification',
             verification_token=excluded.verification_token,
             unsubscribe_token=excluded.unsubscribe_token,
             verified_at=NULL,
             failure_count=0,
             last_error=NULL,
             updated_at=datetime('now')`
        ).bind(
          registerNumber,
          displayName,
          email,
          lang,
          inmate.facility_name || "",
          releaseDate,
          verificationToken,
          unsubscribeToken
        ).run();

        try {
          await sendVerificationEmail(env, {
            register_number: registerNumber,
            inmate_name: displayName,
            email,
            lang,
            verification_token: verificationToken
          });
        } catch (error) {
          await env.DB.prepare(
            `UPDATE tracked_inmates
                SET notification_status='delivery_error', last_error=?, updated_at=datetime('now')
              WHERE register_number=? AND lower(email)=lower(?)`
          ).bind(String(error?.message || error).slice(0, 500), registerNumber, email).run();
          throw error;
        }

        return json({
          ok: true,
          pending_verification: true,
          message: lang === "es"
            ? "Revise su correo y confirme la alerta antes de que comience el seguimiento."
            : "Check your email and confirm the alert before tracking begins.",
          register_number: registerNumber
        }, 200, headers);
      }

      if (url.pathname === "/api/verify" && request.method === "GET") {
        if (!env.DB) return htmlPage("Coregenisis", "Verification service is not configured.", 503);
        const token = cleanText(url.searchParams.get("token"), 200);
        if (!token) return htmlPage("Coregenisis", "This verification link is invalid.", 400);

        const row = await env.DB.prepare(
          `SELECT id, inmate_name, register_number, email, lang
             FROM tracked_inmates WHERE verification_token=? LIMIT 1`
        ).bind(token).first();

        if (!row) return htmlPage("Coregenisis", "This verification link is invalid or has already been used.", 404);

        await env.DB.prepare(
          `UPDATE tracked_inmates
              SET active=1, notification_status='active', verification_token=NULL,
                  verified_at=datetime('now'), updated_at=datetime('now'), last_error=NULL
            WHERE id=?`
        ).bind(row.id).run();

        const message = row.lang === "es"
          ? `La alerta para ${escapeHtml(row.inmate_name || row.register_number)} está confirmada.`
          : `Tracking for ${escapeHtml(row.inmate_name || row.register_number)} is confirmed.`;
        return htmlPage("Coregenisis alert confirmed", message, 200, env.PUBLIC_SITE_URL);
      }

      if (url.pathname === "/api/unsubscribe" && request.method === "GET") {
        if (!env.DB) return htmlPage("Coregenisis", "Unsubscribe service is not configured.", 503);
        const token = cleanText(url.searchParams.get("token"), 200);
        if (!token) return htmlPage("Coregenisis", "This unsubscribe link is invalid.", 400);

        const row = await env.DB.prepare(
          `SELECT id, inmate_name, register_number FROM tracked_inmates
            WHERE unsubscribe_token=? LIMIT 1`
        ).bind(token).first();
        if (!row) return htmlPage("Coregenisis", "This unsubscribe link is invalid or expired.", 404);

        await env.DB.prepare(
          `UPDATE tracked_inmates
              SET active=0, notification_status='unsubscribed', updated_at=datetime('now')
            WHERE id=?`
        ).bind(row.id).run();

        return htmlPage(
          "Coregenisis alert stopped",
          `Tracking for ${escapeHtml(row.inmate_name || row.register_number)} has been stopped.`,
          200,
          env.PUBLIC_SITE_URL
        );
      }

      if (url.pathname === "/api/track" && request.method === "DELETE") {
        if (!originAllowed(request, env)) {
          return json({ error: "Origin not allowed." }, 403, headers);
        }
        if (!env.DB) return json({ error: "Tracking database is not configured." }, 503, headers);

        const body = await readJson(request);
        const token = cleanText(body.unsubscribe_token, 200);
        if (!token) return json({ error: "A valid deletion token is required." }, 400, headers);

        const result = await env.DB.prepare(
          "DELETE FROM tracked_inmates WHERE unsubscribe_token=?"
        ).bind(token).run();

        return json({
          ok: true,
          deleted: Number(result?.meta?.changes || 0) > 0,
          message: "Tracking data deletion request processed."
        }, 200, headers);
      }

      if (url.pathname === "/api/deadlines" && request.method === "GET") {
        if (!env.DB) return json({ error: "Database is not configured." }, 503, headers);
        const { results } = await env.DB.prepare(
          `SELECT slug, title, document_number, source_url, effective_date, comment_deadline
             FROM regulatory_documents
            WHERE (comment_deadline IS NOT NULL AND comment_deadline >= date('now'))
               OR (effective_date IS NOT NULL AND effective_date >= date('now'))
            ORDER BY
              CASE
                WHEN comment_deadline IS NOT NULL AND effective_date IS NOT NULL
                  THEN MIN(comment_deadline, effective_date)
                ELSE COALESCE(comment_deadline, effective_date)
              END ASC
            LIMIT 50`
        ).all();
        return json({ results: results || [] }, 200, headers, { "Cache-Control": "public, max-age=300" });
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

      if (url.pathname === "/api/policies" && request.method === "GET") {
        if (!env.DB) return json({ error: "Database is not configured." }, 503, headers);

        const q = cleanText(url.searchParams.get("q"), 120).toLowerCase();
        const series = cleanText(url.searchParams.get("series"), 20);
        const type = cleanText(url.searchParams.get("type"), 20);

        const where = [];
        const binds = [];

        if (q) {
          where.push("(lower(title) LIKE ? OR lower(policy_number) LIKE ?)");
          binds.push(`%${q}%`, `%${q}%`);
        }
        if (series) {
          where.push("series=?");
          binds.push(series);
        }
        if (type) {
          where.push("document_type=?");
          binds.push(type);
        }

        const sql = `SELECT record_number, policy_number, title, document_type, series,
                            issue_date, active, source_url, secondary_url, last_verified_at
                       FROM bop_policies
                      ${where.length ? "WHERE " + where.join(" AND ") : ""}
                      ORDER BY issue_date DESC, title ASC
                      LIMIT 250`;

        const { results } = await env.DB.prepare(sql).bind(...binds).all();
        return json({ results: results || [] }, 200, headers, { "Cache-Control": "public, max-age=300" });
      }

      if (url.pathname === "/api/facilities" && request.method === "GET") {
        if (!env.DB) return json({ error: "Database is not configured." }, 503, headers);
        const q = (url.searchParams.get("q") || "").trim().toLowerCase();
        let stmt;
        if (q) {
          stmt = env.DB.prepare(
            `SELECT code, name, state, type, security_level, city, address, zip_code,
                  phone_number, region, gender, has_camp, official_url, last_verified_at
               FROM facilities
              WHERE lower(name) LIKE ? OR lower(state) LIKE ? OR lower(city) LIKE ? OR lower(code) LIKE ?
              ORDER BY name LIMIT 100`
          ).bind(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
        } else {
          stmt = env.DB.prepare(
            `SELECT code, name, state, type, security_level, city, address, zip_code,
                    phone_number, region, gender, has_camp, official_url, last_verified_at
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

    if (event.cron === "30 10 * * 0") {
      ctx.waitUntil(refreshOfficialSources(env));
      return;
    }

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

async function refreshOfficialSources(env) {
  await refreshFacilities(env);
  await refreshBopPolicies(env);
  await discoverRecentBopFederalRegisterDocuments(env);
  await refreshRegulatoryDocuments(env);
}

async function discoverRecentBopFederalRegisterDocuments(env) {
  const url = new URL(FEDERAL_REGISTER_API + ".json");
  url.searchParams.set("per_page", "25");
  url.searchParams.set("order", "newest");
  url.searchParams.append("conditions[agencies][]", "prisons-bureau");

  const response = await fetch(url.toString(), { headers: { "Accept": "application/json" } });
  if (!response.ok) throw new Error(`Federal Register BOP feed refresh failed: ${response.status}`);

  const data = await response.json();
  const docs = Array.isArray(data?.results) ? data.results : [];

  for (const doc of docs) {
    const number = cleanText(doc?.document_number, 80);
    if (!number) continue;

    await env.DB.prepare(
      `INSERT INTO regulatory_documents
        (slug, title, agency, document_number, document_type, publication_date,
         status, summary, source_url, official_pdf_url, last_verified_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(document_number) DO UPDATE SET
         title=excluded.title,
         agency=excluded.agency,
         document_type=excluded.document_type,
         publication_date=excluded.publication_date,
         status=excluded.status,
         summary=excluded.summary,
         source_url=excluded.source_url,
         official_pdf_url=excluded.official_pdf_url,
         last_verified_at=datetime('now')`
    ).bind(
      `fr-${number.toLowerCase()}`,
      cleanText(doc?.title, 240),
      cleanText((doc?.agencies || []).map(a => a.name).join("; "), 240),
      number,
      cleanText(doc?.type, 120),
      cleanText(doc?.publication_date, 30),
      cleanText(doc?.type, 120),
      cleanText(doc?.abstract || doc?.excerpts, 2000),
      cleanText(doc?.html_url, 500),
      cleanText(doc?.pdf_url, 500)
    ).run();
  }

  console.log(`Coregenisis regulatory feed discovered: ${docs.length}`);
}

async function refreshBopPolicies(env) {
  const response = await fetch(BOP_POLICY_ENDPOINT, {
    headers: {
      "Accept": "application/json",
      "User-Agent": "Coregenisis/2.0 (+public federal information service)"
    }
  });
  if (!response.ok) throw new Error(`BOP policy refresh failed: ${response.status}`);

  const data = await response.json();
  const policies = Array.isArray(data?.Policies) ? data.Policies : [];
  if (!policies.length) throw new Error("BOP policy refresh returned no policies.");

  const statements = policies
    .filter(p => cleanText(p?.recordNumber, 40))
    .map(p => {
      const sourceUrl = p?.url ? new URL(p.url, "https://www.bop.gov").toString() : "";
      const secondaryUrl = p?.url2 ? new URL(p.url2, "https://www.bop.gov").toString() : "";
      return env.DB.prepare(
        `INSERT INTO bop_policies
          (record_number, policy_number, title, document_type, series, issue_date,
           active, source_url, secondary_url, last_verified_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
         ON CONFLICT(record_number) DO UPDATE SET
           policy_number=excluded.policy_number,
           title=excluded.title,
           document_type=excluded.document_type,
           series=excluded.series,
           issue_date=excluded.issue_date,
           active=excluded.active,
           source_url=excluded.source_url,
           secondary_url=excluded.secondary_url,
           last_verified_at=datetime('now')`
      ).bind(
        cleanText(p?.recordNumber, 40),
        cleanText(p?.number, 80),
        cleanText(p?.name, 260),
        cleanText(p?.type, 30),
        cleanText(p?.series, 30),
        cleanText(p?.issueDate, 30),
        String(p?.active) === "1" ? 1 : 0,
        sourceUrl,
        secondaryUrl
      );
    });

  for (let i = 0; i < statements.length; i += 50) {
    await env.DB.batch(statements.slice(i, i + 50));
  }

  console.log(`Coregenisis BOP policies refreshed: ${statements.length}`);
}

async function refreshFacilities(env) {
  const response = await fetch(BOP_LOCATIONS_ENDPOINT, {
    headers: {
      "Accept": "application/json",
      "User-Agent": "Coregenisis/2.0 (+public federal information service)"
    }
  });
  if (!response.ok) throw new Error(`BOP locations refresh failed: ${response.status}`);

  const data = await response.json();
  const locations = Array.isArray(data?.Locations) ? data.Locations : [];
  if (!locations.length) throw new Error("BOP locations refresh returned no locations.");

  const statements = locations.map(loc => {
    const officialUrl = loc?.url ? new URL(loc.url, "https://www.bop.gov").toString() : "";
    return env.DB.prepare(
      `INSERT INTO facilities
        (code, name, state, city, type, security_level, address, zip_code, phone_number,
         region, gender, has_camp, official_url, last_verified_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(code) DO UPDATE SET
         name=excluded.name,
         state=excluded.state,
         city=excluded.city,
         type=excluded.type,
         security_level=excluded.security_level,
         address=excluded.address,
         zip_code=excluded.zip_code,
         phone_number=excluded.phone_number,
         region=excluded.region,
         gender=excluded.gender,
         has_camp=excluded.has_camp,
         official_url=excluded.official_url,
         last_verified_at=datetime('now')`
    ).bind(
      cleanText(loc?.code, 20),
      cleanText(loc?.nameDisplay || loc?.nameTitle || loc?.name, 160),
      cleanText(loc?.state, 10),
      cleanText(loc?.city, 100),
      cleanText(loc?.type, 40),
      cleanText(loc?.securityLevel, 60),
      cleanText(loc?.address, 180),
      cleanText(loc?.zipCode, 20),
      cleanText(loc?.phoneNumber, 40),
      cleanText(loc?.region, 100),
      cleanText(loc?.gender, 30),
      loc?.hasCamp ? 1 : 0,
      officialUrl
    );
  });

  for (let i = 0; i < statements.length; i += 50) {
    await env.DB.batch(statements.slice(i, i + 50));
  }

  console.log(`Coregenisis facilities refreshed: ${locations.length}`);
}

async function refreshRegulatoryDocuments(env) {
  const { results = [] } = await env.DB.prepare(
    `SELECT id, document_number FROM regulatory_documents
      WHERE document_number IS NOT NULL AND document_number <> ''`
  ).all();

  for (const row of results) {
    try {
      const response = await fetch(`${FEDERAL_REGISTER_API}/${encodeURIComponent(row.document_number)}.json`, {
        headers: { "Accept": "application/json" }
      });
      if (!response.ok) {
        console.warn("Federal Register refresh skipped", row.document_number, response.status);
        continue;
      }
      const data = await response.json();
      const rin = Array.isArray(data?.regulation_id_numbers) ? data.regulation_id_numbers[0] || "" : "";
      const docket = Array.isArray(data?.docket_ids) ? data.docket_ids[0] || "" : "";
      const cfr = Array.isArray(data?.cfr_references)
        ? data.cfr_references.map(x => `${x.title} CFR ${x.part}`).join(", ")
        : "";

      await env.DB.prepare(
        `UPDATE regulatory_documents SET
          title=?,
          agency=?,
          docket_number=?,
          cfr=?,
          federal_register_citation=?,
          rin=?,
          document_type=?,
          publication_date=?,
          effective_date=?,
          comment_deadline=?,
          summary=?,
          source_url=?,
          official_pdf_url=?,
          last_verified_at=datetime('now')
         WHERE id=?`
      ).bind(
        cleanText(data?.title, 240),
        cleanText((data?.agencies || []).map(a => a.name).join("; "), 240),
        cleanText(docket, 80),
        cleanText(cfr, 120),
        cleanText(data?.citation, 80),
        cleanText(rin, 80),
        cleanText(data?.action || data?.type, 160),
        cleanText(data?.publication_date, 30),
        cleanText(data?.effective_on, 30),
        cleanText(data?.comments_close_on, 30),
        cleanText(data?.abstract, 2000),
        cleanText(data?.html_url, 500),
        cleanText(data?.pdf_url, 500),
        row.id
      ).run();
    } catch (error) {
      console.warn("Federal Register refresh error", row.document_number, error);
    }
  }
}

async function checkAllInmates(env) {
  if (!emailConfigured(env)) {
    console.log("Coregenisis scheduled check skipped: email provider not configured.");
    return;
  }

  const { results = [] } = await env.DB.prepare(
    `SELECT id, register_number, inmate_name, email, lang, last_facility, last_release_date,
              unsubscribe_token
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

async function sendVerificationEmail(env, tracked) {
  const spanish = tracked.lang === "es";
  const verifyUrl = `${env.PUBLIC_SITE_URL.replace(/\/$/, "")}/api/verify?token=${encodeURIComponent(tracked.verification_token)}`;
  const subject = spanish ? "Confirme su alerta de Coregenisis" : "Confirm your Coregenisis alert";
  const html = spanish
    ? `<h2>Confirme su alerta de Coregenisis</h2>
       <p>Solicitó seguimiento de información pública del BOP para <strong>${escapeHtml(tracked.inmate_name || tracked.register_number)}</strong>.</p>
       <p><a href="${verifyUrl}">Confirmar alerta</a></p>
       <p>Si usted no solicitó esta alerta, ignore este mensaje.</p>`
    : `<h2>Confirm your Coregenisis alert</h2>
       <p>You requested tracking of public BOP information for <strong>${escapeHtml(tracked.inmate_name || tracked.register_number)}</strong>.</p>
       <p><a href="${verifyUrl}">Confirm alert</a></p>
       <p>If you did not request this alert, ignore this message.</p>`;

  await sendEmail(env, tracked.email, subject, html);
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
       <p>Verifique la información directamente en <a href="${BOP_LOCATOR}">BOP.gov</a>. Coregenisis es un servicio informativo independiente y no está afiliado al BOP o DOJ.</p>
       <p><a href="${env.PUBLIC_SITE_URL.replace(/\/$/, "")}/api/unsubscribe?token=${encodeURIComponent(tracked.unsubscribe_token || "")}">Cancelar alerta</a></p>`
    : `<h2>Coregenisis — public record update</h2>
       <p>We detected a change in public BOP information for <strong>${escapeHtml(tracked.inmate_name || tracked.register_number)}</strong>.</p>
       <ul>${changedLines.join("")}</ul>
       <p>Verify the information directly at <a href="${BOP_LOCATOR}">BOP.gov</a>. Coregenisis is an independent information service and is not affiliated with BOP or DOJ.</p>
       <p><a href="${env.PUBLIC_SITE_URL.replace(/\/$/, "")}/api/unsubscribe?token=${encodeURIComponent(tracked.unsubscribe_token || "")}">Unsubscribe</a></p>`;

  await sendEmail(env, tracked.email, subject, html);
}

async function sendEmail(env, to, subject, html) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: env.ALERT_FROM_EMAIL,
      to: [to],
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
  return Boolean(env.RESEND_API_KEY && env.ALERT_FROM_EMAIL && env.PUBLIC_SITE_URL);
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

async function secureEqual(a, b) {
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(String(a))),
    crypto.subtle.digest("SHA-256", enc.encode(String(b)))
  ]);
  const aa = new Uint8Array(ha);
  const bb = new Uint8Array(hb);
  if (aa.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < aa.length; i++) diff |= aa[i] ^ bb[i];
  return diff === 0;
}

function firstRow(batchResult) {
  const row = batchResult?.results?.[0] || {};
  return {
    count: Number(row.count || 0),
    last_verified_at: row.last_verified_at || row.last_checked || null
  };
}

function generateToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function htmlPage(title, message, status = 200, homeUrl = "") {
  const safeHome = homeUrl ? escapeHtml(homeUrl) : "";
  const homeLink = safeHome ? `<p><a href="${safeHome}">Return to Coregenisis</a></p>` : "";
  return new Response(
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head><body style="font-family:system-ui;max-width:680px;margin:60px auto;padding:0 20px"><h1>${escapeHtml(title)}</h1><p>${message}</p>${homeLink}</body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8", "X-Content-Type-Options": "nosniff" } }
  );
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
