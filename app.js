const $ = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => [...el.querySelectorAll(s)];

const state = { lang: localStorage.getItem('cg_lang') || 'en', route: location.hash.replace('#/','') || 'home', lastResults: [] };

const copy = {
  en: {
    subtitle:'Federal Custody Information Center', search:'Inmate Search', fsa:'FSA & Second Chance', rules:'Federal Rules', policies:'BOP Policies', facilities:'Facilities', alerts:'Alerts', resources:'Resources', services:'Services',
    heroTitle:'Federal custody information, made easier to understand.',
    heroSub:'Search public BOP information, follow First Step Act developments, read federal rule summaries, and verify every important item with an official government source.',
    searchNow:'Search BOP records', exploreRules:'Explore federal rules',
    unofficial:'Independent informational service — not affiliated with BOP, DOJ, NARA, FederalRegister.gov, or any government agency.',
    verify:'Always verify legal and custody information with the official source.',
    homeFeatures:['Find public custody information','Understand rule changes','Track important updates','Use official source links','English & Spanish access','Family-focused explanations'],
    whatChanged:'What changed?', whyMatters:'Why it matters', officialSources:'Official sources',
    noAdvice:'Coregenisis provides public information and plain-language educational summaries, not legal advice.',
    searchTitle:'Federal Inmate Search', searchDesc:'Search by BOP register number or name. Results depend on availability of the public BOP source.',
    searchPlaceholder:'Enter BOP # or full name', searching:'Searching public BOP records…', noResults:'No matching public records were returned.',
    ruleTitle:'First Step Act Time Credits — Revisions', summary:'The Bureau of Prisons amended its First Step Act Time Credits regulation. The rule addresses when eligible inmates begin earning time credits and eligibility for certain prisoners transferred to BOP custody after a foreign sentence.',
    change1:'Eligible inmates may begin earning FSA Time Credits when the term of imprisonment commences.', change2:'The rule clarifies eligibility for certain prisoners serving a foreign-imposed sentence after transfer to U.S. custody.',
    affected:'The rule changes the regulatory text governing when earning begins and expands/clarifies eligibility in the circumstances described by the rule. Individual application depends on the controlling law, sentence, eligibility rules, and BOP determinations.',
    alertsTitle:'Create a tracking alert', alertsDesc:'Save a public BOP register number and email so the backend can check for facility or release-date changes when alert services are enabled.',
    saveAlert:'Save tracking request', facilitiesDesc:'Use official BOP facility resources for addresses, contact details, visiting information, and institution pages.',
    rulesDesc:'A plain-language entry point to federal rules and source documents that can affect federal custody and reentry.',
    sourcesDesc:'Use these official sources to verify current law, regulations, agency policy, and custody information.'
  },
  es: {
    subtitle:'Centro de Información de Custodia Federal', search:'Buscar Recluso', fsa:'FSA y Second Chance', rules:'Reglas Federales', policies:'Políticas BOP', facilities:'Instituciones', alerts:'Alertas', resources:'Recursos', services:'Servicios',
    heroTitle:'Información de custodia federal, más fácil de entender.',
    heroSub:'Busque información pública del BOP, siga cambios de la Ley First Step, lea resúmenes de reglas federales y verifique cada punto importante con una fuente oficial.',
    searchNow:'Buscar registros BOP', exploreRules:'Explorar reglas federales',
    unofficial:'Servicio informativo independiente — no afiliado con BOP, DOJ, NARA, FederalRegister.gov ni ninguna agencia gubernamental.',
    verify:'Siempre verifique información legal y de custodia con la fuente oficial.',
    homeFeatures:['Buscar información pública de custodia','Entender cambios de reglas','Seguir actualizaciones importantes','Usar enlaces oficiales','Acceso en inglés y español','Explicaciones para familias'],
    whatChanged:'¿Qué cambió?', whyMatters:'Por qué importa', officialSources:'Fuentes oficiales',
    noAdvice:'Coregenisis ofrece información pública y resúmenes educativos en lenguaje sencillo, no asesoría legal.',
    searchTitle:'Buscador Federal de Reclusos', searchDesc:'Busque por número de registro BOP o nombre. Los resultados dependen de la disponibilidad de la fuente pública del BOP.',
    searchPlaceholder:'Ingrese # BOP o nombre completo', searching:'Buscando registros públicos del BOP…', noResults:'No se devolvieron registros públicos coincidentes.',
    ruleTitle:'Créditos de Tiempo First Step Act — Revisiones', summary:'La Oficina Federal de Prisiones modificó su regulación sobre créditos de tiempo de la Ley First Step. La regla trata cuándo los reclusos elegibles comienzan a ganar créditos y la elegibilidad de ciertos prisioneros transferidos a custodia del BOP después de una sentencia extranjera.',
    change1:'Los reclusos elegibles pueden comenzar a ganar créditos FSA cuando comienza el término de encarcelamiento.', change2:'La regla aclara la elegibilidad de ciertos prisioneros con sentencia extranjera después de su transferencia a custodia de EE.UU.',
    affected:'La regla modifica el texto regulatorio sobre cuándo comienza la acumulación y aclara/amplía elegibilidad en las circunstancias descritas. La aplicación individual depende de la ley vigente, la sentencia, las reglas de elegibilidad y las determinaciones del BOP.',
    alertsTitle:'Crear una alerta de seguimiento', alertsDesc:'Guarde un número BOP público y correo electrónico para que el sistema pueda comprobar cambios de institución o fecha de liberación cuando las alertas estén habilitadas.',
    saveAlert:'Guardar solicitud', facilitiesDesc:'Use los recursos oficiales del BOP para direcciones, contactos, visitas y páginas de instituciones.',
    rulesDesc:'Una entrada en lenguaje sencillo a reglas federales y documentos fuente relacionados con custodia federal y reingreso.',
    sourcesDesc:'Use estas fuentes oficiales para verificar la ley, regulaciones, política de agencia e información de custodia vigentes.'
  }
};

const rule = {
  agency:'Department of Justice — Bureau of Prisons',
  docket:'BOP-1183-I',
  cfr:'28 CFR 523',
  citation:'91 FR 55740',
  document:'2026-17752',
  type:'Interim final rule; request for comments',
  published:'August 31, 2026',
  effective:'September 30, 2026',
  comments:'September 30, 2026',
  rin:'1120-AB83'
};

function t(k){ return copy[state.lang][k]; }
function navItems(){ return [
  ['search',t('search')],['fsa',t('fsa')],['rules',t('rules')],['policies',t('policies')],['facilities',t('facilities')],['alerts',t('alerts')],['resources',t('resources')],['services',t('services')],['pricing',state.lang==='es'?'Planes':'Plans']
];}

function header(){
  const navMarkup=navItems().map(([r,l])=>`<button data-route="${r}" class="${state.route===r?'active':''}">${l}</button>`).join('');
  return `<header class="site-header"><div class="header-inner">
    <a class="brand" href="#/home"><span class="brand-mark">C</span><span class="brand-copy"><strong>Coregenisis</strong><small>${t('subtitle')}</small></span></a>
    <nav class="nav" aria-label="Primary">${navMarkup}</nav>
    <div class="header-actions">
      <div class="lang-toggle"><button data-lang="en" class="${state.lang==='en'?'active':''}">EN</button><button data-lang="es" class="${state.lang==='es'?'active':''}">ES</button></div>
      <a class="btn btn-dark" href="#/search">${t('search')}</a>
      <button id="menuToggle" class="menu-toggle" type="button" aria-expanded="false" aria-controls="mobileNav" aria-label="${state.lang==='es'?'Abrir menú':'Open menu'}">☰ <span>${state.lang==='es'?'Menú':'Menu'}</span></button>
    </div>
  </div><nav id="mobileNav" class="mobile-nav hidden" aria-label="${state.lang==='es'?'Navegación móvil':'Mobile navigation'}">${navMarkup}</nav></header>`;
}

function previewNotice(){
  const host=location.hostname||'';
  const visualOnly=host.endsWith('github.io')||host.includes('githack')||host.includes('jsdelivr');
  if(!visualOnly) return '';
  return `<div class="banner" style="margin:1rem auto;max-width:1180px"><strong>${state.lang==='es'?'Vista previa visual':'Visual preview'}:</strong> ${state.lang==='es'?'La navegación y el diseño son reales, pero los servicios BOP, base de datos y correo no están conectados en esta vista temporal.':'The navigation and design are real, but BOP, database, and email services are not connected on this temporary preview.'}</div>`;
}

function footer(){
  return `<footer class="footer"><div class="container footer-grid">
    <div><div class="brand" style="color:white"><span class="brand-mark">C</span><span class="brand-copy"><strong>Coregenisis</strong><small>${t('subtitle')}</small></span></div><p style="max-width:420px">${t('unofficial')}</p><small>© ${new Date().getFullYear()} Coregenisis. ${t('noAdvice')}</small></div>
    <div><h4>${t('search')}</h4><a href="#/search">BOP inmate search</a><a href="https://www.bop.gov/inmateloc/" target="_blank" rel="noopener">Official BOP locator ↗</a></div>
    <div><h4>${t('rules')}</h4><a href="#/fsa">First Step Act</a><a href="#/rules">Rule center</a><a href="https://www.ecfr.gov/" target="_blank" rel="noopener">eCFR ↗</a></div>
    <div><h4>${t('resources')}</h4><a href="https://www.federalregister.gov/" target="_blank" rel="noopener">Federal Register ↗</a><a href="https://www.govinfo.gov/" target="_blank" rel="noopener">GovInfo ↗</a><a href="https://www.bop.gov/" target="_blank" rel="noopener">BOP.gov ↗</a></div>
    <div><h4>Legal</h4><a href="#/privacy">${state.lang==='es'?'Privacidad':'Privacy'}</a><a href="#/terms">${state.lang==='es'?'Términos':'Terms'}</a><a href="#/disclaimer">${state.lang==='es'?'Aviso legal':'Disclaimer'}</a><a href="#/accuracy">${state.lang==='es'?'Fuentes y exactitud':'Data Sources & Accuracy'}</a><a href="#/calculator-disclaimer">${state.lang==='es'?'Aviso de calculadoras':'Calculator Disclaimer'}</a><a href="#/refunds">${state.lang==='es'?'Reembolsos y cancelación':'Refunds & Cancellation'}</a><a href="#/copyright">${state.lang==='es'?'Derechos de autor':'Copyright'}</a></div>
  </div></footer>`;
}

function pageHeader(title,desc){ return `<section class="page-header"><div class="container"><h1>${title}</h1><p>${desc}</p></div></section>`; }
function sourceLinks(){ return `<div class="card"><h3>${t('officialSources')}</h3>
  <a class="resource-link" href="https://www.federalregister.gov/" target="_blank" rel="noopener"><b>FederalRegister.gov</b><span>Rules, notices, documents ↗</span></a>
  <a class="resource-link" href="https://www.govinfo.gov/" target="_blank" rel="noopener"><b>GovInfo.gov</b><span>Official published materials ↗</span></a>
  <a class="resource-link" href="https://www.ecfr.gov/" target="_blank" rel="noopener"><b>eCFR.gov</b><span>Current CFR text ↗</span></a>
  <a class="resource-link" href="https://www.bop.gov/" target="_blank" rel="noopener"><b>BOP.gov</b><span>Custody and agency information ↗</span></a>
</div>`; }

function home(){
  const features = t('homeFeatures');
  return `<main id="main">
    <section class="hero"><div class="container hero-grid"><div><span class="eyebrow">COREGENISIS 2.0 • PUBLIC FEDERAL INFORMATION</span><h1>${t('heroTitle')}</h1><p>${t('heroSub')}</p><div class="hero-buttons"><a class="btn btn-primary" href="#/search">${t('searchNow')}</a><a class="btn btn-secondary" href="#/rules">${t('exploreRules')}</a></div></div>
    <aside class="hero-panel"><h3>Built around verification</h3><div class="trust-list"><div class="trust-item"><span class="dot"></span><span>${t('unofficial')}</span></div><div class="trust-item"><span class="dot"></span><span>${t('verify')}</span></div><div class="trust-item"><span class="dot"></span><span>Public data, source links, plain-language context, bilingual access.</span></div></div></aside></div></section>
    <section class="section white"><div class="container">
      <div class="search-shell"><form id="knowledgeForm"><label><b>${state.lang==='es'?'Buscar en Coregenisis':'Search the Coregenisis knowledge center'}</b><div class="search-row" style="margin-top:.55rem"><input id="knowledgeQuery" class="field" placeholder="${state.lang==='es'?'Política, institución, regla, documento...':'Policy, facility, rule, document...'}"><button class="btn btn-dark" type="submit">${state.lang==='es'?'Buscar':'Search'}</button></div></label><div class="helper">${state.lang==='es'?'Busca en políticas BOP, instituciones y documentos regulatorios indexados.':'Search indexed BOP policies, facilities, and regulatory documents.'}</div></form><div id="knowledgeStatus" class="helper" role="status" aria-live="polite"></div><div id="knowledgeResults" class="results"></div></div>
      <div style="height:2rem"></div>
      <div class="section-title"><div><h2>One place for the information families actually need</h2><p>Coregenisis 2.0 organizes public custody and regulatory information around practical questions instead of government-site structure.</p></div></div><div class="grid grid-3">${features.map((x,i)=>`<div class="card"><div class="feature-icon">${i+1}</div><h3>${x}</h3><p>Clear, source-linked information designed for mobile use.</p></div>`).join('')}</div>
    </div></section>
    <section class="section"><div class="container">
      <div class="banner"><strong>Source-first design:</strong> summaries are informational. Official government publications and agency records control.</div>
      <div style="height:1rem"></div>
      <div class="grid grid-2"><div class="card"><span class="status-chip status-blue">Featured rule</span><h3>${t('ruleTitle')}</h3><p>${t('summary')}</p><a class="btn btn-light" href="#/rules">Read the rule summary</a></div>${sourceLinks()}</div>
      <div style="height:1rem"></div>
      <div class="card monetization-teaser"><div><span class="status-chip status-green">${state.lang==='es'?'Búsquedas gratis':'Free searches'}</span><h3>${state.lang==='es'?'Búsquedas gratuitas. Herramientas pagadas opcionales.':'Free searches. Optional paid tools.'}</h3><p>${state.lang==='es'?'Coregenisis mantendrá gratuita la búsqueda pública básica y monetizará funciones futuras como alertas, organización familiar y planificación de reingreso.':'Coregenisis will keep basic public search free and monetize future features such as alerts, family organization, and reentry planning.'}</p></div><a class="btn btn-dark" href="#/pricing">${state.lang==='es'?'Ver planes':'See plans'}</a></div>
      <div style="height:1rem"></div>
      <div class="value-strip">
        <div><span class="status-chip status-green">${state.lang==='es'?'Acceso básico gratuito':'Basic access stays free'}</span><h3>${state.lang==='es'?'Información pública primero':'Public information first'}</h3><p>${state.lang==='es'?'La búsqueda pública, instituciones, políticas, reglas y enlaces oficiales permanecen disponibles sin suscripción.':'Public search, facilities, policies, rules, and official-source links remain available without a subscription.'}</p></div>
        <div><span class="status-chip status-blue">${state.lang==='es'?'Opcional':'Optional'}</span><h3>${state.lang==='es'?'Comodidad y organización':'Convenience & organization'}</h3><p>${state.lang==='es'?'Los ingresos futuros provendrán de alertas, perfiles familiares, planificación de reingreso y servicios de formato — no de bloquear registros públicos.':'Future revenue comes from alerts, family profiles, reentry planning, and formatting services — not from putting public records behind a paywall.'}</p></div>
      </div>
      <div style="height:1rem"></div>
      <div class="card"><div class="rule-head"><div><h3>${state.lang==='es'?'Actualizaciones recientes':'Recent official-source updates'}</h3><p>${state.lang==='es'?'Documentos y políticas indexados recientemente por fecha de publicación o emisión.':'Recently indexed regulations and BOP policies ordered by publication or issue date.'}</p></div><a class="btn btn-light" href="#/resources">${state.lang==='es'?'Ver estado de datos':'View data status'}</a></div><div id="updateStatus" class="helper" role="status" aria-live="polite"></div><div id="updateFeed" class="results"></div></div>
    </div></section>
  </main>`;
}

function searchPage(){
  return `<main id="main">${pageHeader(t('searchTitle'),t('searchDesc'))}<section class="section"><div class="container">
  <div class="search-shell"><form id="searchForm"><label><b>${t('searchTitle')}</b><div class="search-row" style="margin-top:.55rem"><input id="searchQuery" class="field" placeholder="${t('searchPlaceholder')}" autocomplete="off" required><button class="btn btn-dark" type="submit">${t('search')}</button></div></label><div class="helper">Examples: 12345-067 or John Smith. Public results should always be verified at BOP.gov.</div></form><div id="searchStatus" class="helper" role="status" aria-live="polite"></div><div id="results" class="results"></div></div>
  <div style="height:1rem"></div><div class="banner">${t('unofficial')} ${t('verify')}</div>
  </div></section></main>`;
}

function ruleCard(){
 return `<article class="card"><div class="rule-head"><div><span class="status-chip status-amber">Interim final rule</span><h2 style="margin:.65rem 0 .2rem">${t('ruleTitle')}</h2><p>${t('summary')}</p></div></div>
 <div class="rule-meta"><span class="meta-pill">${rule.citation}</span><span class="meta-pill">${rule.document}</span><span class="meta-pill">${rule.cfr}</span><span class="meta-pill">RIN ${rule.rin}</span></div>
 <div class="rule-detail"><ul class="fact-list">
  <li><b>Agency</b>${rule.agency}</li><li><b>Docket</b>${rule.docket}</li><li><b>Published</b>${rule.published}</li><li><b>Effective</b>${rule.effective}</li><li><b>Comments due</b>${rule.comments}</li>
 </ul><div><div class="callout"><b>${t('whatChanged')}</b><p>• ${t('change1')}</p><p>• ${t('change2')}</p></div><h3>${t('whyMatters')}</h3><p>${t('affected')}</p><p class="notice">${t('noAdvice')}</p><p><a class="btn btn-light" href="https://www.federalregister.gov/documents/2026/08/31/2026-17752/first-step-act-time-credits-revisions" target="_blank" rel="noopener">Official Federal Register document ↗</a></p></div></div></article>`; 
}

function rulesPage(){
 return `<main id="main">${pageHeader(t('rules'),t('rulesDesc'))}<section class="section"><div class="container">
   <div class="banner"><strong>Source-first:</strong> Coregenisis summaries are explanatory. Use the linked official publication for the controlling text.</div>
   <div style="height:1rem"></div>
   <div class="card"><div class="rule-head"><div><h3>${state.lang==='es'?'Fechas y plazos publicados':'Published dates & deadlines'}</h3><p>${state.lang==='es'?'Seguimiento neutral de fechas de vigencia y períodos de comentarios que aparecen en los registros indexados.':'Neutral tracking of effective dates and comment deadlines appearing in indexed records.'}</p></div></div><div id="deadlineStatus" class="helper" role="status" aria-live="polite"></div><div id="deadlineFeed" class="results"></div></div>
   <div id="ruleStatus" class="helper" role="status" aria-live="polite" style="margin:.8rem 0"></div>
   <div id="ruleFeed" class="grid grid-2">${ruleCard()}${sourceLinks()}</div>
 </div></section></main>`;
}
function fsaPage(){
 const es=state.lang==='es';
 const changes=[
   {
     date:'2026-08-31',
     title:es?'Regla 2026 sobre Créditos de Tiempo FSA':'2026 FSA Time Credits rule',
     text:es
       ?'La regla interina revisa 28 CFR 523.42 y 523.44. Aclara que un recluso elegible comienza a ganar créditos FSA después de que comienza su término de encarcelamiento y aborda ciertos casos de sentencias impuestas en el extranjero.'
       :'The interim rule revises 28 CFR 523.42 and 523.44. It clarifies that an eligible inmate begins earning FSA Time Credits after the term of imprisonment commences and addresses specified foreign-sentence transfer cases.',
     href:'https://www.federalregister.gov/documents/2026/08/31/2026-17752/first-step-act-time-credits-revisions',
     tag:'91 FR 55740'
   },
   {
     date:'2026-05-07',
     title:es?'Programa 5405.01: evaluaciones, programación e incentivos':'Program Statement 5405.01: assessments, programming & incentives',
     text:es
       ?'El BOP consolidó orientación sobre evaluaciones de necesidades criminógenas, programación, incentivos, capacitación y responsabilidades institucionales relacionadas con FSA.'
       :'BOP consolidated guidance on criminogenic-needs assessment, programming, incentives, training, and institutional responsibilities related to FSA implementation.',
     href:'https://www.bop.gov/policy/progstat/5405_001.pdf',
     tag:'PS 5405.01'
   },
   {
     date:'2025-08-01',
     title:es?'Programa actualizado de aplicación de créditos':'Updated Time Credit Application Program',
     text:es
       ?'BOP anunció una herramienta actualizada que muestra fechas condicionales de confinamiento domiciliario que combinan FSA y Second Chance Act para apoyar la planificación de transición.'
       :'BOP announced an updated tool that provides conditional home-confinement placement dates combining FSA and Second Chance Act information for transition planning.',
     href:'https://www.bop.gov/news/20250801-message-from-director-william-k-marshall-iii.jsp',
     tag:'BOP update'
   },
   {
     date:'2025-05-28',
     title:es?'Directiva sobre mayor uso de confinamiento domiciliario':'Home-confinement expansion directive',
     text:es
       ?'La directiva del BOP instruyó a los equipos a usar las fechas condicionales FSA y SCA en la planificación previa a la liberación y a distinguir correctamente la autoridad de cada estatuto.'
       :'BOP directed unit teams to use FSA and SCA conditional placement dates in prerelease planning and to distinguish the statutory authority and eligibility rules of each program.',
     href:'https://www.bop.gov/news/pdfs/20250528-home-confinement-expansioin.pdf',
     tag:'BOP directive'
   },
   {
     date:'2025-04-10',
     title:es?'BOP rescindió el límite general de 60 días':'BOP rescinded proposed 60-day SCA limit',
     text:es
       ?'BOP anunció que no seguiría con la orientación del 31 de marzo de 2025 que habría limitado ciertas colocaciones SCA en centros de reingreso a 60 días.'
       :'BOP announced that it would not proceed with March 31, 2025 guidance that would have limited certain Second Chance Act RRC placements to 60 days.',
     href:'https://www.bop.gov/news/20250410-second-chance-act-sca-placements.jsp',
     tag:'Second Chance Act'
   }
 ];

 return `<main id="main">${pageHeader(
   es?'First Step Act y Second Chance':'First Step Act & Second Chance',
   es
     ?'Centro de información pública para comprender créditos FSA, fechas condicionales, colocaciones de reingreso y cambios recientes del BOP.'
     :'A public-information center for understanding FSA credits, conditional placement dates, reentry placement, and recent BOP changes.'
 )}<section class="section"><div class="container">
   <div class="banner"><strong>${es?'Importante':'Important'}:</strong> ${es
     ?'FSA y Second Chance Act no son lo mismo. Las fechas condicionales y los créditos no garantizan una colocación específica. Las decisiones individuales dependen de la ley aplicable y de las determinaciones del BOP.'
     :'FSA and the Second Chance Act are not the same program. Conditional dates and credits do not guarantee a particular placement. Individual outcomes depend on applicable law and BOP determinations.'}</div>

   <div style="height:1rem"></div>
   <div class="grid grid-3">
     <div class="card"><div class="feature-icon">FSA</div><h3>${es?'Créditos de tiempo':'Time Credits'}</h3><p>${es?'Información sobre acumulación, aplicación y fuentes oficiales de créditos FSA.':'Information on earning, application, and official sources for FSA Time Credits.'}</p></div>
     <div class="card"><div class="feature-icon">SCA</div><h3>Second Chance Act</h3><p>${es?'Información sobre planificación de colocación previa a la liberación, RRC y confinamiento domiciliario.':'Information on prerelease placement planning, RRCs, and home confinement.'}</p></div>
     <div class="card"><div class="feature-icon">✓</div><h3>${es?'Verifique su caso':'Verify your case'}</h3><p>${es?'Coregenisis explica fuentes públicas; no determina elegibilidad individual ni fechas oficiales.':'Coregenisis explains public sources; it does not determine individual eligibility or official dates.'}</p></div>
   </div>

   <div style="height:1.4rem"></div>
   <div class="section-title"><div><h2>${es?'Cambios recientes importantes':'Important recent changes'}</h2><p>${es?'Cronología de cambios y orientación pública que Coregenisis debe mantener visible.':'A timeline of public changes and guidance Coregenisis should keep visible.'}</p></div></div>
   <div class="timeline">${changes.map(c=>`<article class="timeline-item card"><div class="timeline-date">${esc(formatDate(c.date))}</div><div><span class="status-chip status-blue">${esc(c.tag)}</span><h3>${esc(c.title)}</h3><p>${esc(c.text)}</p><a class="btn btn-light" href="${c.href}" target="_blank" rel="noopener">${es?'Fuente oficial ↗':'Official source ↗'}</a></div></article>`).join('')}</div>

   <div style="height:1.4rem"></div>
   <div class="card">
     <span class="status-chip status-amber">${es?'Verificación especial':'Special verification note'}</span>
     <h3>${es?'Estado del piloto para personas mayores o con enfermedad terminal':'Elderly/terminally ill pilot status'}</h3>
     <p>${es
       ?'Las fuentes oficiales actualmente no son totalmente consistentes. El texto vigente de 34 U.S.C. § 60541 todavía limita el período del piloto a los años fiscales 2019–2023, y el informe anual FSA del BOP de junio de 2024 indicó que la autoridad para nuevas referencias expiró al final del año fiscal 2023. Sin embargo, la página FAQ pública del BOP todavía describe el programa y cómo solicitarlo.'
       :'Official sources are currently not fully consistent. The current text of 34 U.S.C. § 60541 still states that the pilot was to run during fiscal years 2019–2023, and BOP’s June 2024 FSA annual report said referral authority expired at the end of FY2023. However, BOP’s public FAQ still describes the program and how to apply.'}</p>
     <p>${es
       ?'Coregenisis mostrará ambas fuentes y no presentará el piloto como una opción garantizada o actualmente reautorizada sin una fuente oficial más reciente.'
       :'Coregenisis will show both sources and will not present the pilot as guaranteed or currently reauthorized without a newer controlling official source.'}</p>
     <div class="hero-buttons">
       <a class="btn btn-light" href="https://uscode.house.gov/view.xhtml?edition=prelim&num=0&req=granuleid%3AUSC-prelim-title34-section60541" target="_blank" rel="noopener">${es?'Texto actual 34 USC 60541 ↗':'Current 34 USC 60541 ↗'}</a>
       <a class="btn btn-light" href="https://www.bop.gov/inmates/fsa/docs/first-step-act-annual-report-june-2024.pdf" target="_blank" rel="noopener">${es?'Informe anual BOP ↗':'BOP annual report ↗'}</a>
       <a class="btn btn-light" href="https://www.bop.gov/inmates/fsa/faq.jsp" target="_blank" rel="noopener">BOP FAQ ↗</a>
     </div>
   </div>

   <div style="height:1.4rem"></div>
   <div class="grid grid-2">
     <div class="card"><h3>${es?'Cómo leer las fechas':'How to read the dates'}</h3>
       <p><b>FSA Conditional Placement Date.</b> ${es?'Una fecha de planificación basada en créditos FSA proyectados/aplicables; no es por sí sola una orden de liberación.':'A planning date based on projected/applicable FSA credits; it is not itself a release order.'}</p>
       <p><b>SCA Conditional Placement Date.</b> ${es?'Una fecha usada en la planificación de prerelease bajo Second Chance Act; el BOP indica que la colocación requiere evaluación individual.':'A date used in Second Chance Act prerelease planning; BOP states placement requires an individualized assessment.'}</p>
       <p><b>Conditional Transition to Community Date.</b> ${es?'La fecha condicional más temprana que puede reflejar la interacción de FSA y SCA en la planificación del BOP.':'The earliest conditional community-transition date that may reflect both FSA and SCA planning.'}</p>
     </div>
     <div class="card"><h3>${es?'Recursos oficiales':'Official resources'}</h3>
       <a class="resource-link" href="https://www.bop.gov/inmates/fsa/" target="_blank" rel="noopener"><b>BOP First Step Act</b><span>Overview hub ↗</span></a>
       <a class="resource-link" href="https://www.bop.gov/inmates/fsa/policies.jsp" target="_blank" rel="noopener"><b>FSA resources & policies</b><span>BOP ↗</span></a>
       <a class="resource-link" href="https://www.bop.gov/inmates/fsa/faq.jsp" target="_blank" rel="noopener"><b>FSA FAQ</b><span>BOP ↗</span></a>
       <a class="resource-link" href="https://www.bop.gov/resources/policy_and_forms.jsp" target="_blank" rel="noopener"><b>BOP Program Statements</b><span>Policy library ↗</span></a>
     </div>
   </div>

   <div style="height:1.4rem"></div>
   ${ruleCard()}
 </div></section></main>`;
}

function policiesPage(){
 const es=state.lang==='es';
 return `<main id="main">${pageHeader(t('policies'),es?'Busque declaraciones de programa y otros documentos de política publicados por la Oficina Federal de Prisiones.':'Search Program Statements and other policy documents published by the Federal Bureau of Prisons.')}<section class="section"><div class="container">
   <div class="banner"><strong>${es?'Fuente oficial':'Official source'}:</strong> ${es?'Coregenisis indexa metadatos públicos del BOP y enlaza el PDF oficial. Verifique la versión vigente en BOP.gov.':'Coregenisis indexes public BOP metadata and links to the official PDF. Verify the current version at BOP.gov.'}</div>
   <div style="height:1rem"></div>
   <div class="search-shell"><form id="policyForm">
     <div class="grid grid-3">
       <label><b>${es?'Buscar':'Search'}</b><input id="policyQuery" class="field" placeholder="${es?'Título o número':'Title or policy number'}"></label>
       <label><b>${es?'Serie':'Series'}</b><select id="policySeries" class="field"><option value="">${es?'Todas':'All'}</option><option>1000</option><option>2000</option><option>3000</option><option>4000</option><option>5000</option><option>6000</option><option>7000</option><option>8000</option><option value="trans">${es?'Traducciones':'Translations'}</option></select></label>
       <label><b>${es?'Tipo':'Type'}</b><select id="policyType" class="field"><option value="">${es?'Todos':'All'}</option><option value="ps">Program Statement</option><option value="trans">${es?'Traducción':'Translation'}</option></select></label>
     </div>
     <div style="margin-top:.8rem"><button class="btn btn-dark" type="submit">${es?'Buscar políticas':'Search policies'}</button> <a class="btn btn-light" href="https://www.bop.gov/resources/policy_and_forms.jsp" target="_blank" rel="noopener">${es?'Página oficial BOP ↗':'Official BOP policy page ↗'}</a></div>
   </form></div>
   <div id="policyStatus" class="helper" role="status" aria-live="polite" style="margin:.8rem 0"></div>
   <div id="policyResults" class="grid grid-2"></div>
 </div></section></main>`;
}

function facilitiesPage(){
 return `<main id="main">${pageHeader(t('facilities'),t('facilitiesDesc'))}<section class="section"><div class="container">
   <div class="search-shell">
     <form id="facilityForm"><label><b>Search federal facilities</b><div class="search-row" style="margin-top:.55rem"><input id="facilityQuery" class="field" placeholder="Facility, city, state, or code"><button class="btn btn-dark" type="submit">Search</button></div></label></form>
     <div class="helper">Directory entries are refreshed from the public BOP locations source when the scheduled refresh is enabled.</div>
   </div>
   <div id="facilityStatus" class="helper" role="status" aria-live="polite" style="margin:.8rem 0"></div>
   <div id="facilityResults" class="grid grid-2"><div class="card"><h3>Official BOP Locations</h3><p>Use the official BOP directory to verify current institution information.</p><a class="btn btn-dark" href="https://www.bop.gov/locations/" target="_blank" rel="noopener">Open BOP Locations ↗</a></div></div>
 </div></section></main>`;
}
function alertsPage(){
 const es=state.lang==='es';
 return `<main id="main">${pageHeader(
   es?'Alertas verificadas':'Verified Alerts',
   es?'Las búsquedas públicas permanecen gratuitas. Las alertas automáticas están planificadas como una función Family Plus.':'Public searches stay free. Automatic monitoring alerts are planned as a Family Plus feature.'
 )}<section class="section"><div class="container">
   <div class="grid grid-2">
     <div class="card">
       <span class="status-chip status-green">Family Plus</span>
       <h3>${es?'Qué monitoreará':'What it will monitor'}</h3>
       <p>${es?'Cambios públicos de institución y fecha de liberación detectados en la fuente BOP, con verificación por correo antes de activar el seguimiento.':'Public facility and release-date changes detected from the BOP source, with email verification before tracking activates.'}</p>
       <p>${es?'Cada correo incluirá un enlace para cancelar y eliminar el registro de seguimiento.':'Every email will include an unsubscribe link that removes the tracking record.'}</p>
       <a class="btn btn-dark" href="#/pricing">${es?'Ver Family Plus':'View Family Plus'}</a>
     </div>
     <div class="card">
       <h3>${es?'Estado actual':'Current status'}</h3>
       <p>${es?'La arquitectura de alertas ya está preparada, pero el envío de correo y la base de datos todavía deben conectarse en Cloudflare antes de aceptar suscripciones reales.':'The alert architecture is prepared, but email delivery and the database still need to be connected in Cloudflare before real subscriptions are accepted.'}</p>
       <div class="banner"><strong>${es?'Sin cobros todavía':'No charges yet'}:</strong> ${es?'No hay checkout activo en esta vista previa.':'There is no active checkout in this preview.'}</div>
     </div>
   </div>
 </div></section></main>`;
}
function familyPage(){
 const es=state.lang==='es';
 return `<main id="main">${pageHeader(
   es?'Panel Family Plus':'Family Plus Dashboard',
   es?'Vista previa funcional. Los perfiles guardados en esta página permanecen solo en este dispositivo durante la etapa de prueba.':'Functional preview. Profiles saved here remain only on this device during the preview stage.'
 )}<section class="section"><div class="container">
   <div class="banner"><strong>${es?'Privacidad de la vista previa':'Preview privacy'}:</strong> ${es?'No envíe información sensible. Esta vista previa usa almacenamiento local del navegador y todavía no está conectada a una cuenta segura.':'Do not enter sensitive information. This preview uses browser local storage and is not yet connected to a secure account.'}</div>
   <div style="height:1rem"></div>
   <div class="grid grid-2">
     <div class="card">
       <h3>${es?'Agregar perfil familiar':'Add family profile'}</h3>
       <form id="familyForm">
         <label>${es?'Nombre para mostrar':'Display name'}<input class="field" name="name" maxlength="80" required placeholder="${es?'Ej. Juan R.':'e.g. John R.'}"></label>
         <div style="height:.65rem"></div>
         <label>${es?'Número BOP':'BOP register number'}<input class="field" name="bop" maxlength="9" placeholder="12345-067"></label>
         <div style="height:.65rem"></div>
         <label>${es?'Nota opcional':'Optional note'}<textarea class="field" name="note" maxlength="160" rows="3" placeholder="${es?'Ej. llamar los domingos':'e.g. call Sundays'}"></textarea></label>
         <div style="height:.8rem"></div>
         <button class="btn btn-dark" type="submit">${es?'Guardar en este dispositivo':'Save on this device'}</button>
         <div id="familyStatus" class="helper" role="status" aria-live="polite"></div>
       </form>
     </div>
     <div class="card">
       <div class="rule-head"><div><h3>${es?'Perfiles guardados':'Saved profiles'}</h3><p>${es?'Estos datos son locales a este navegador.':'These records are local to this browser.'}</p></div><button id="clearFamily" class="btn btn-light" type="button">${es?'Borrar todo':'Clear all'}</button></div>
       <div id="familyProfiles" class="results"></div>
     </div>
   </div>
   <div style="height:1rem"></div>
   <div class="grid grid-3">
     <div class="card"><div class="feature-icon">1</div><h3>${es?'Alertas verificadas':'Verified alerts'}</h3><p>${es?'Planeado: cambios de institución y fecha de liberación con confirmación por correo.':'Planned: facility and release-date change alerts with email confirmation.'}</p></div>
     <div class="card"><div class="feature-icon">2</div><h3>${es?'Historial':'Change history'}</h3><p>${es?'Planeado: línea de tiempo de cambios públicos detectados.':'Planned: timeline of detected public-record changes.'}</p></div>
     <div class="card"><div class="feature-icon">3</div><h3>${es?'Panel familiar':'Family organization'}</h3><p>${es?'Notas, enlaces y próximos pasos en un solo lugar.':'Notes, links, and next steps in one place.'}</p></div>
   </div>
 </div></section></main>`;
}

function reentryPage(){
 const es=state.lang==='es';
 const items=[
  ['id',es?'Identificación estatal / licencia':'State ID / driver license'],
  ['birth',es?'Acta de nacimiento':'Birth certificate'],
  ['ss',es?'Tarjeta / registro del Seguro Social':'Social Security card/record'],
  ['housing',es?'Plan de vivienda':'Housing plan'],
  ['employment',es?'Empleo / capacitación':'Employment / training'],
  ['transport',es?'Transporte':'Transportation'],
  ['health',es?'Atención médica / recetas':'Healthcare / prescriptions'],
  ['phone',es?'Teléfono y correo electrónico':'Phone & email'],
  ['bank',es?'Cuenta bancaria / presupuesto':'Banking / budget'],
  ['appointments',es?'Citas y obligaciones después de la liberación':'Post-release appointments & obligations']
 ];
 return `<main id="main">${pageHeader(
   es?'Planificador de Reingreso':'Reentry Planner',
   es?'Una vista previa de organización personal para preparar documentos, vivienda, empleo y necesidades prácticas antes de la transición.':'A personal organization preview for preparing documents, housing, employment, and practical needs before transition.'
 )}<section class="section"><div class="container">
   <div class="banner"><strong>${es?'Herramienta informativa':'Informational tool'}:</strong> ${es?'Este planificador no calcula elegibilidad, créditos ni fechas oficiales del BOP.':'This planner does not calculate eligibility, credits, or official BOP dates.'}</div>
   <div style="height:1rem"></div>
   <div class="grid grid-2">
     <div class="card">
       <div class="rule-head"><div><h3>${es?'Lista de preparación':'Preparation checklist'}</h3><p>${es?'Marque lo que ya está preparado.':'Check items as they are prepared.'}</p></div><span id="reentryProgress" class="status-chip status-blue">0%</span></div>
       <div id="reentryChecklist" class="checklist">${items.map(([id,label])=>`<label class="check-row"><input type="checkbox" data-reentry="${id}"><span>${esc(label)}</span></label>`).join('')}</div>
     </div>
     <div class="card">
       <h3>${es?'Plan personal':'Personal plan'}</h3>
       <label>${es?'Fecha objetivo opcional':'Optional target date'}<input id="reentryDate" class="field" type="date"></label>
       <div style="height:.65rem"></div>
       <label>${es?'Vivienda / contacto':'Housing / contact'}<textarea id="reentryHousing" class="field" rows="3" maxlength="250"></textarea></label>
       <div style="height:.65rem"></div>
       <label>${es?'Empleo / capacitación':'Employment / training'}<textarea id="reentryEmployment" class="field" rows="3" maxlength="250"></textarea></label>
       <div style="height:.65rem"></div>
       <label>${es?'Próximos pasos':'Next steps'}<textarea id="reentryNext" class="field" rows="4" maxlength="400"></textarea></label>
       <div style="height:.8rem"></div>
       <button id="saveReentry" class="btn btn-dark" type="button">${es?'Guardar en este dispositivo':'Save on this device'}</button>
       <button id="printReentry" class="btn btn-light" type="button">${es?'Imprimir':'Print'}</button>
       <div id="reentryStatus" class="helper" role="status" aria-live="polite"></div>
     </div>
   </div>
 </div></section></main>`;
}

function servicesPage(){
 const es=state.lang==='es';
 const services=[
   {
     title:es?'Organización de paquete de reingreso':'Reentry Packet Organization',
     price:'$39',
     note:es?'precio inicial planificado':'planned starting price',
     desc:es?'Ayuda para organizar listas, documentos, contactos, vivienda, empleo y próximos pasos en un paquete claro y listo para imprimir.':'Help organizing checklists, documents, contacts, housing, employment, and next steps into a clear printable packet.'
   },
   {
     title:es?'Organización de registros familiares':'Family Records Organizer',
     price:'$29',
     note:es?'precio inicial planificado':'planned starting price',
     desc:es?'Organización de números BOP, instituciones, fechas públicas, contactos y enlaces de fuentes oficiales para una familia.':'Organization of BOP numbers, facilities, public dates, contacts, and official-source links for a family.'
   },
   {
     title:es?'Formato bilingüe de documentos':'Bilingual Document Formatting',
     price:'$25+',
     note:es?'según alcance':'depending on scope',
     desc:es?'Formato EN/ES y organización de documentos informativos o administrativos proporcionados por el cliente.':'EN/ES formatting and organization of informational or administrative documents supplied by the customer.'
   }
 ];
 return `<main id="main">${pageHeader(
   es?'Servicios opcionales':'Optional Services',
   es?'Servicios de organización y formato separados de las búsquedas públicas gratuitas. No son servicios legales.':'Organization and formatting services separate from the free public search tools. These are not legal services.'
 )}<section class="section"><div class="container">
   <div class="pricing-grid">${services.map((s,i)=>`<article class="pricing-card"><span class="status-chip status-blue">${es?'Servicio individual':'One-time service'}</span><h2>${esc(s.title)}</h2><div class="price">${esc(s.price)} <small>${esc(s.note)}</small></div><p>${esc(s.desc)}</p><ul class="pricing-list">${(i===0
      ? (es?['Lista organizada de próximos pasos','Secciones para vivienda, empleo y documentos','Archivo listo para imprimir']:['Organized next-step checklist','Housing, employment & document sections','Print-ready file'])
      : i===1
      ? (es?['Hoja familiar organizada','Enlaces de verificación oficial','Fechas y contactos en un solo lugar']:['Organized family reference sheet','Official verification links','Dates and contacts in one place'])
      : (es?['Formato limpio EN/ES','Organización visual consistente','Archivo final listo para compartir']:['Clean EN/ES formatting','Consistent visual organization','Share-ready final file'])
    ).map(x=>`<li>✓ ${esc(x)}</li>`).join('')}</ul><div class="plan-note">${es?'Disponible después de activar pagos y flujo de pedidos.':'Available after payment and order workflows are activated.'}</div><button class="btn btn-light" type="button" disabled>${es?'Próximamente':'Coming soon'}</button></article>`).join('')}</div>
   <div style="height:1rem"></div>
   <div class="grid grid-2">
     <div class="card"><h3>${es?'Para quién es':'Who this is for'}</h3><p>${es?'Familias que quieren mantener información pública, documentos y próximos pasos organizados en un solo lugar, sin contratar representación legal.':'Families who want public information, documents, and next steps organized in one place without purchasing legal representation.'}</p></div>
     <div class="card"><h3>${es?'Cómo se entregará':'How delivery will work'}</h3><p>${es?'Cada pedido tendrá un alcance claro, materiales requeridos, precio antes de comenzar y un archivo final descargable. El checkout permanece desactivado hasta que el flujo de pagos esté listo.':'Each order will have a clear scope, required materials, price before work begins, and a downloadable final file. Checkout stays disabled until the payment workflow is ready.'}</p></div>
   </div>
   <div style="height:1rem"></div>
   <div class="banner"><strong>${es?'Límite del servicio':'Service boundary'}:</strong> ${es?'Coregenisis puede ayudar a organizar, traducir y dar formato a información suministrada por el cliente, pero no representará a una persona como abogado ni prometerá resultados del BOP o del tribunal.':'Coregenisis may help organize, translate, and format customer-supplied information, but will not represent anyone as a lawyer or promise BOP or court outcomes.'}</div>
 </div></section></main>`;
}

function pricingPage(){
 const es=state.lang==='es';
 const plans=[
  {
    name:es?'Gratis':'Free',
    price:'$0',
    cadence:es?'siempre':'always',
    badge:es?'Para individuos y familias':'For individuals & families',
    features:es
      ?['Búsqueda pública de reclusos','Directorio de instituciones','Centro FSA & Second Chance','Políticas BOP y reglas federales','Enlaces a fuentes oficiales']
      :['Public inmate search','Facility directory','FSA & Second Chance center','BOP policies & federal rules','Official-source links'],
    note:es?'Las búsquedas básicas permanecen gratuitas.':'Basic searches stay free.'
  },
  {
    name:'Family Plus',
    price:'$9.99',
    cadence:es?'por mes (planificado)':'/month (planned)',
    badge:es?'Comodidad y seguimiento':'Convenience & monitoring',
    featured:true,
    features:es
      ?['Todo lo gratuito','Perfiles familiares guardados','Alertas verificadas de cambios de institución/fecha','Historial de cambios','Alertas bilingües','Panel familiar']
      :['Everything in Free','Saved family profiles','Verified facility/release-date change alerts','Change history','Bilingual alerts','Family dashboard'],
    note:es?'Próximamente; todavía no se cobran pagos.':'Coming soon; payments are not active yet.'
  },
  {
    name:es?'Planificador de Reingreso':'Reentry Planner',
    price:'$14.99',
    cadence:es?'por mes (planificado)':'/month (planned)',
    badge:es?'Organización de reingreso':'Reentry organization',
    features:es
      ?['Todo en Family Plus','Lista de preparación para liberación','Organizador de identificación y documentos','Calendario de planificación RRC/HC','Recursos de vivienda y empleo','Paquete imprimible de reingreso']
      :['Everything in Family Plus','Release-preparation checklist','ID & document organizer','RRC/HC planning calendar','Housing & employment resources','Printable reentry packet'],
    note:es?'Herramientas informativas; no asesoría legal.':'Informational tools; not legal advice.'
  }
 ];
 return `<main id="main">${pageHeader(
   es?'Planes de Coregenisis':'Coregenisis Plans',
   es?'Las búsquedas públicas permanecen gratuitas. Los planes futuros monetizan conveniencia, seguimiento y organización — no el acceso a registros públicos.':'Public searches stay free. Future paid plans monetize convenience, monitoring, and organization — not access to public records.'
 )}<section class="section"><div class="container">
   <div class="pricing-grid">${plans.map(p=>`<article class="pricing-card ${p.featured?'featured':''}">${p.featured?'<span class="status-chip status-green">Planned popular plan</span>':''}<h2>${esc(p.name)}</h2><div class="price">${esc(p.price)} <small>${esc(p.cadence)}</small></div><p><b>${esc(p.badge)}</b></p><ul class="pricing-list">${p.features.map(f=>`<li>✓ ${esc(f)}</li>`).join('')}</ul><div class="plan-note">${esc(p.note)}</div><a class="btn ${p.featured?'btn-dark':'btn-light'}" href="${p.name==='Family Plus'?'#/family':(p.name==='Reentry Planner'||p.name==='Planificador de Reingreso'?'#/reentry':'#/search')}">${p.name==='Family Plus'?(es?'Ver vista previa':'Preview Family Plus'):(p.name==='Reentry Planner'||p.name==='Planificador de Reingreso'?(es?'Ver planificador':'Preview Planner'):(es?'Buscar gratis':'Search free'))}</a></article>`).join('')}</div>
   <div style="height:1rem"></div>
   <div class="grid grid-3 launch-status">
     <div class="card"><span class="status-chip status-green">${es?'Disponible':'Available'}</span><h3>${es?'Información pública':'Public information'}</h3><p>${es?'Búsqueda, reglas, políticas, instituciones y enlaces oficiales.':'Search, rules, policies, facilities, and official-source links.'}</p></div>
     <div class="card"><span class="status-chip status-amber">${es?'En preparación':'In preparation'}</span><h3>Family Plus</h3><p>${es?'Perfiles, historial y alertas verificadas después de conectar base de datos y correo.':'Profiles, history, and verified alerts after database and email are connected.'}</p></div>
     <div class="card"><span class="status-chip status-amber">${es?'En preparación':'In preparation'}</span><h3>${es?'Pagos':'Payments'}</h3><p>${es?'No hay checkout ni cobros activos todavía.':'There is no active checkout or billing yet.'}</p></div>
   </div>
   <div style="height:1rem"></div>
   <div class="banner"><strong>${es?'Principio de monetización':'Monetization principle'}:</strong> ${es?'Coregenisis no venderá datos personales ni cobrará por ver documentos públicos oficiales. Los ingresos provendrán de funciones opcionales de conveniencia y organización.':'Coregenisis will not sell personal data or charge to view official public documents. Revenue will come from optional convenience and organization features.'}</div>
 </div></section></main>`;
}

function resourcesPage(){
 const es=state.lang==='es';
 return `<main id="main">${pageHeader(t('resources'),t('sourcesDesc'))}<section class="section"><div class="container">
   <div class="grid grid-2">${sourceLinks()}<div class="card"><h3>Coregenisis use principles</h3><p>1. Show the official source.</p><p>2. Separate source text from explanation.</p><p>3. Date summaries and updates.</p><p>4. Avoid implying government affiliation.</p><p>5. Do not present individualized legal conclusions as fact.</p></div></div>
   <div style="height:1rem"></div>
   <div class="card"><div class="rule-head"><div><h3>${es?'Estado y frescura de datos':'Data status & freshness'}</h3><p>${es?'Transparencia sobre cuándo se verificaron por última vez las fuentes indexadas.':'Transparency about when indexed sources were last verified.'}</p></div><span id="alertConfigChip" class="status-chip status-blue">Checking…</span></div><div id="dataStatus" class="grid grid-3" style="margin-top:1rem"><div class="empty-state">Loading status…</div></div></div>
 </div></section></main>`;
}

function legalPage(kind){
 const es=state.lang==='es';
 const pages={
  privacy:{
   title:es?'Política de Privacidad':'Privacy Policy',
   lead:es?'Cómo Coregenisis maneja la información necesaria para búsquedas públicas y alertas.':'How Coregenisis handles information needed for public searches and alerts.',
   body:es
    ? '<h3>Datos que usamos</h3><p>Coregenisis usa registros federales públicos para mostrar información de custodia y fuentes regulatorias. Para una alerta verificada podemos guardar el número de registro BOP, nombre mostrado, correo electrónico, idioma, última institución/fecha de liberación conocida, fechas de comprobación y metadatos técnicos necesarios para operar la alerta.</p><h3>Alertas por correo</h3><p>La inscripción usa confirmación por correo. El seguimiento no comienza hasta que el destinatario confirma la solicitud. Cada alerta incluye un enlace para cancelar la suscripción.</p><h3>Uso de datos</h3><p>No vendemos información personal. No ofrecemos alertas SMS en esta versión. Las solicitudes viajan por HTTPS cuando el sitio se despliega en Cloudflare.</p><h3>Eliminación</h3><p>Los registros de seguimiento se eliminan cuando el destinatario usa el enlace de cancelación. Los registros pendientes sin verificar también están programados para eliminarse automáticamente después de siete días. La versión de producción debe mantener el método de eliminación autenticado por token y un canal de contacto publicado.</p>'
    : '<h3>Data we use</h3><p>Coregenisis uses public federal records to display custody information and regulatory sources. For a verified alert we may store the BOP register number, display name, email address, language, last known facility/release date, check timestamps, and technical metadata needed to operate the alert.</p><h3>Email alerts</h3><p>Enrollment uses email confirmation. Tracking does not begin until the recipient confirms the request. Every alert includes an unsubscribe link.</p><h3>Use of data</h3><p>We do not sell personal information. This version does not offer SMS alerts. Requests are transmitted over HTTPS when the site is deployed on Cloudflare.</p><h3>Deletion</h3><p>Tracking records are deleted when the recipient uses the unsubscribe link. Unverified pending alert records are also scheduled for automatic deletion after seven days. Production should maintain the token-authenticated deletion method and a published contact channel.</p>'
  },
  terms:{
   title:es?'Términos y Uso Lícito':'Terms & Lawful Use',
   lead:es?'Condiciones básicas para usar Coregenisis.':'Basic conditions for using Coregenisis.',
   body:es
    ? '<p>Esta herramienta es solo para fines lícitos. Usted acepta no usar Coregenisis para acoso, intimidación, acecho, vigilancia ilegal, suplantación, fraude, abuso automatizado o extracción masiva que perjudique las fuentes oficiales.</p><p>Coregenisis ofrece información pública y resúmenes educativos. No es un bufete de abogados y no ofrece asesoría legal individualizada.</p><p>Al usar el servicio, usted acepta verificar decisiones importantes con las fuentes oficiales y cumplir con las leyes aplicables.</p>'
    : '<p>This tool is for lawful purposes only. You agree not to use Coregenisis for harassment, intimidation, stalking, unlawful surveillance, impersonation, fraud, abusive automation, or bulk extraction that harms official source services.</p><p>Coregenisis provides public information and educational summaries. It is not a law firm and does not provide individualized legal advice.</p><p>By using the service, you agree to verify important decisions against official sources and comply with applicable law.</p>'
  },
  disclaimer:{
   title:es?'Aviso Legal':'Disclaimer',
   lead:es?'Coregenisis es un servicio independiente de información pública.':'Coregenisis is an independent public-information service.',
   body:es
    ? '<p>Coregenisis NO está afiliado a la Oficina Federal de Prisiones (BOP), el Departamento de Justicia (DOJ), NARA, FederalRegister.gov ni ninguna agencia gubernamental.</p><p>La información pública puede cambiar. No se garantiza exactitud, integridad o disponibilidad continua. Las fechas de liberación y otros datos de custodia deben verificarse directamente con BOP.gov.</p><p>Los resúmenes regulatorios no sustituyen el texto oficial del Federal Register, GovInfo o eCFR y no constituyen asesoría legal.</p>'
    : '<p>Coregenisis is NOT affiliated with the Federal Bureau of Prisons (BOP), Department of Justice (DOJ), NARA, FederalRegister.gov, or any government agency.</p><p>Public information can change. Accuracy, completeness, and continuous availability are not guaranteed. Release dates and other custody information should be verified directly with BOP.gov.</p><p>Regulatory summaries do not replace the official Federal Register, GovInfo, or eCFR text and are not legal advice.</p>'
  },
  accuracy:{
   title:es?'Política de Fuentes de Datos y Exactitud':'Data Sources & Accuracy Policy',
   lead:es?'Cómo Coregenisis obtiene, resume y presenta información pública federal.':'How Coregenisis obtains, summarizes, and presents public federal information.',
   body:es
    ? '<h3>1. Fuentes públicas</h3><p>Coregenisis organiza información proveniente de fuentes públicas oficiales, incluyendo BOP.gov, FederalRegister.gov, GovInfo.gov y eCFR.gov cuando corresponda. Los enlaces a la fuente se muestran para que el usuario pueda verificar la información directamente.</p><h3>2. La fuente oficial controla</h3><p>Si una página de Coregenisis difiere de una publicación, registro o determinación oficial, la fuente gubernamental oficial controla. Las asignaciones de institución, fechas de liberación, elegibilidad, créditos de tiempo y decisiones de colocación pueden cambiar y deben verificarse directamente con la agencia correspondiente.</p><h3>3. Actualizaciones y retrasos</h3><p>Los datos públicos pueden publicarse, corregirse o actualizarse sin aviso a Coregenisis. La información mostrada puede estar incompleta, retrasada o temporalmente no disponible. Una fecha de última verificación no garantiza que no haya ocurrido un cambio después de esa fecha.</p><h3>4. Resúmenes en lenguaje sencillo</h3><p>Los resúmenes están diseñados para facilitar la lectura y no sustituyen el texto oficial. Cuando se usen herramientas automatizadas o asistencia de inteligencia artificial para resumir, clasificar o traducir contenido, el resultado puede contener errores u omisiones y debe verificarse con el documento fuente.</p><h3>5. Datos de custodia</h3><p>Coregenisis no crea, corrige ni controla registros del BOP. Una fecha de liberación, institución, estado o número de registro mostrado es información pública derivada de la fuente disponible y no constituye una determinación independiente de Coregenisis.</p><h3>6. Sin garantía de exactitud continua</h3><p>Coregenisis busca presentar información útil y verificable, pero no garantiza exactitud, integridad, puntualidad o disponibilidad ininterrumpida. No se debe tomar una decisión legal, financiera, de viaje o de custodia únicamente basándose en un resumen o resultado de Coregenisis.</p>'
    : '<h3>1. Public sources</h3><p>Coregenisis organizes information from official public sources, including BOP.gov, FederalRegister.gov, GovInfo.gov, and eCFR.gov when applicable. Source links are provided so users can verify information directly.</p><h3>2. Official source controls</h3><p>If a Coregenisis page differs from an official publication, record, or determination, the official government source controls. Facility assignments, release dates, eligibility, time credits, and placement decisions can change and should be verified directly with the responsible agency.</p><h3>3. Updates and delays</h3><p>Public data may be published, corrected, or updated without notice to Coregenisis. Information displayed may be incomplete, delayed, or temporarily unavailable. A last-verified date does not guarantee that no change occurred afterward.</p><h3>4. Plain-language summaries</h3><p>Summaries are designed to improve readability and do not replace official text. When automated tools or artificial-intelligence assistance are used to summarize, classify, or translate content, the result may contain errors or omissions and should be checked against the source document.</p><h3>5. Custody data</h3><p>Coregenisis does not create, correct, or control BOP records. A displayed release date, facility, status, or register number is public information derived from the available source and is not an independent determination by Coregenisis.</p><h3>6. No continuous-accuracy guarantee</h3><p>Coregenisis aims to present useful, verifiable information but does not guarantee accuracy, completeness, timeliness, or uninterrupted availability. Legal, financial, travel, or custody decisions should not be made solely from a Coregenisis summary or result.</p>'
  },
  calculatorDisclaimer:{
   title:es?'Aviso de Calculadoras y Estimaciones':'Calculator & Estimate Disclaimer',
   lead:es?'Límites para cualquier calculadora futura de FSA, fecha de liberación, clasificación u otra estimación.':'Limits that apply to any future FSA, release-date, classification, or other estimate.',
   body:es
    ? '<div class="banner"><strong>Importante:</strong> Las calculadoras de Coregenisis son herramientas educativas y de planificación, no cálculos oficiales del BOP.</div><h3>1. Solo estimaciones</h3><p>Cualquier resultado de créditos FSA, fecha proyectada de liberación, RRC/confinamiento domiciliario, clasificación, puntos de seguridad u otra calculadora es una estimación basada únicamente en los datos ingresados y las reglas programadas en la herramienta.</p><h3>2. No determina elegibilidad</h3><p>La herramienta no determina elegibilidad legal, no modifica una sentencia, no adjudica créditos y no sustituye los cálculos o decisiones del BOP, tribunal u otra agencia.</p><h3>3. Información incompleta o cambiante</h3><p>Los resultados pueden cambiar por sentencias, detainers, exclusiones legales, pérdida o restauración de créditos, participación en programas, cambios de política, decisiones administrativas u otros factores que Coregenisis no conoce o no controla.</p><h3>4. Verificación requerida</h3><p>El usuario debe verificar cualquier resultado con registros oficiales, personal autorizado del BOP y, cuando sea apropiado, asesoría legal calificada antes de depender de una estimación para una decisión importante.</p><h3>5. Sin garantía de resultado</h3><p>Mostrar una fecha o cantidad estimada no significa que Coregenisis prometa o garantice liberación, créditos de tiempo, transferencia, RRC, confinamiento domiciliario, reducción de sentencia o cualquier otro resultado.</p>'
    : '<div class="banner"><strong>Important:</strong> Coregenisis calculators are educational and planning tools, not official BOP calculations.</div><h3>1. Estimates only</h3><p>Any FSA-credit result, projected release date, RRC/home-confinement estimate, classification result, security-points result, or other calculator output is an estimate based only on the information entered and the rules programmed into the tool.</p><h3>2. No eligibility determination</h3><p>The tool does not determine legal eligibility, modify a sentence, award credits, or replace calculations or decisions made by the BOP, a court, or another agency.</p><h3>3. Incomplete or changing information</h3><p>Results may change because of sentencing information, detainers, statutory exclusions, loss or restoration of credits, program participation, policy changes, administrative decisions, or other factors Coregenisis does not know or control.</p><h3>4. Verification required</h3><p>Users should verify any result against official records, authorized BOP staff, and, when appropriate, qualified legal counsel before relying on an estimate for an important decision.</p><h3>5. No outcome guarantee</h3><p>Displaying an estimated date or amount does not mean Coregenisis promises or guarantees release, time credits, transfer, RRC placement, home confinement, sentence reduction, or any other outcome.</p>'
  },
  refunds:{
   title:es?'Política de Reembolsos y Cancelación':'Refund & Cancellation Policy',
   lead:es?'Cómo funcionarán cancelaciones, reembolsos y correcciones de cobros cuando se activen los servicios pagados.':'How cancellations, refunds, and billing corrections will work when paid services are activated.',
   body:es
    ? '<div class="banner"><strong>Estado actual:</strong> Coregenisis todavía no tiene checkout ni cobros activos. Esta política entrará en vigor cuando se activen pagos.</div><h3>1. Servicios gratuitos</h3><p>Las búsquedas públicas, enlaces a fuentes oficiales y recursos gratuitos no requieren pago y, por lo tanto, no generan solicitudes de reembolso.</p><h3>2. Suscripciones</h3><p>Las suscripciones futuras, como Family Plus o Reentry Planner, podrán cancelarse para detener renovaciones futuras. Salvo que se indique otra cosa en el momento de compra, la cancelación no elimina el acceso ya pagado durante el período de facturación vigente.</p><p>Los cobros duplicados, cobros claramente incorrectos o cobros realizados después de una cancelación válida podrán revisarse para corrección o reembolso.</p><h3>3. Servicios personalizados de una sola vez</h3><p>Si el cliente cancela antes de que comience el trabajo, el pago será reembolsable. Si el trabajo ya comenzó, cualquier reembolso podrá reducirse razonablemente para reflejar el trabajo ya realizado y los costos no recuperables previamente informados. Después de entregar el trabajo personalizado acordado, el pago generalmente no será reembolsable, salvo cuando Coregenisis no entregue el servicio comprado o exista un error material que no pueda corregirse razonablemente.</p><h3>4. Productos digitales y archivos entregados</h3><p>Los productos digitales o archivos personalizados entregados generalmente no son reembolsables una vez entregados o accedidos, excepto por duplicación de cobro, falta de entrega, defecto material o cuando la ley aplicable exija otra cosa.</p><h3>5. Cómo solicitar revisión</h3><p>Las solicitudes de reembolso o corrección de cobro deberán enviarse a través del canal de soporte publicado por Coregenisis, incluyendo el correo electrónico de la compra, fecha, servicio y motivo de la solicitud. No se deben enviar datos bancarios completos, números completos de tarjeta ni contraseñas.</p><h3>6. Procesamiento</h3><p>Los reembolsos aprobados se enviarán al método de pago original cuando sea posible. El tiempo en que los fondos aparezcan dependerá del procesador de pagos y de la institución financiera del cliente.</p><h3>7. Sin garantía de resultado</h3><p>El pago por herramientas informativas, organización, traducción o formato no garantiza una decisión del BOP, tribunal, agencia, liberación, crédito de tiempo, colocación en RRC o confinamiento domiciliario.</p><h3>8. Ley aplicable</h3><p>Nada en esta política limita derechos de reembolso, cancelación o protección al consumidor que no puedan renunciarse bajo la ley aplicable o las reglas obligatorias del procesador de pagos.</p>'
    : '<div class="banner"><strong>Current status:</strong> Coregenisis does not yet have active checkout or billing. This policy becomes operational when payments are activated.</div><h3>1. Free services</h3><p>Public searches, official-source links, and free resources require no payment and therefore do not create refund claims.</p><h3>2. Subscriptions</h3><p>Future subscriptions such as Family Plus or Reentry Planner may be cancelled to stop future renewals. Unless stated otherwise at purchase, cancellation does not remove access already paid for during the current billing period.</p><p>Duplicate charges, clearly incorrect charges, or charges made after a valid cancellation may be reviewed for correction or refund.</p><h3>3. One-time custom services</h3><p>If a customer cancels before work begins, the payment is refundable. If work has already begun, any refund may be reasonably reduced to reflect work already performed and previously disclosed non-recoverable costs. After the agreed custom work has been delivered, payment is generally nonrefundable unless Coregenisis fails to provide the purchased service or there is a material error that cannot reasonably be corrected.</p><h3>4. Digital products and delivered files</h3><p>Delivered digital products or custom files are generally nonrefundable once delivered or accessed, except for duplicate billing, non-delivery, a material defect, or where applicable law requires otherwise.</p><h3>5. Requesting a review</h3><p>Refund or billing-correction requests should be submitted through the published Coregenisis support channel and include the purchase email, date, service, and reason for the request. Do not send full bank details, full card numbers, or passwords.</p><h3>6. Processing</h3><p>Approved refunds will be returned to the original payment method when possible. The time for funds to appear depends on the payment processor and the customer\'s financial institution.</p><h3>7. No outcome guarantee</h3><p>Payment for informational tools, organization, translation, or formatting does not guarantee any BOP, court, agency, release, time-credit, RRC-placement, or home-confinement outcome.</p><h3>8. Applicable law</h3><p>Nothing in this policy limits refund, cancellation, or consumer-protection rights that cannot be waived under applicable law or mandatory payment-processor rules.</p>'
  },
  copyright:{
   title:es?'Derechos de Autor':'Copyright',
   lead:es?'Propiedad intelectual del contenido original de Coregenisis.':'Intellectual-property notice for original Coregenisis content.',
   body:es
    ? '<p>© 2026 Coregenisis. Se reservan los derechos sobre el diseño original, código, textos explicativos y marca de Coregenisis, sujeto a los derechos de terceros y al carácter público de los registros y materiales gubernamentales enlazados.</p><p>Coregenisis no reclama propiedad sobre publicaciones gubernamentales de dominio público ni sobre marcas de agencias federales.</p>'
    : '<p>© 2026 Coregenisis. Rights are reserved in original Coregenisis design, code, explanatory text, and branding, subject to third-party rights and the public status of linked government records and publications.</p><p>Coregenisis does not claim ownership of public-domain government publications or federal agency marks.</p>'
  }
 };
 const p=pages[kind]||pages.disclaimer;
 return `<main id="main">${pageHeader(p.title,p.lead)}<section class="section"><div class="container"><div class="card" style="max-width:860px;margin:auto">${p.body}<div class="banner" style="margin-top:1rem">${t('verify')}</div></div></div></section></main>`;
}

function app(){
 const routes={home:home,search:searchPage,fsa:fsaPage,rules:rulesPage,policies:policiesPage,facilities:facilitiesPage,alerts:alertsPage,resources:resourcesPage,services:servicesPage,pricing:pricingPage,family:familyPage,reentry:reentryPage,privacy:()=>legalPage('privacy'),terms:()=>legalPage('terms'),disclaimer:()=>legalPage('disclaimer'),accuracy:()=>legalPage('accuracy'),'calculator-disclaimer':()=>legalPage('calculatorDisclaimer'),refunds:()=>legalPage('refunds'),copyright:()=>legalPage('copyright')};
 const view=(routes[state.route]||home)();
 $('#app').innerHTML=header()+previewNotice()+view+footer();
 bind();
}

function bind(){
 $$('[data-route]').forEach(b=>b.onclick=()=>{location.hash='#/'+b.dataset.route;const m=$('#mobileNav');if(m)m.classList.add('hidden');const tgl=$('#menuToggle');if(tgl)tgl.setAttribute('aria-expanded','false')});
 $$('[data-lang]').forEach(b=>b.onclick=()=>{state.lang=b.dataset.lang;localStorage.setItem('cg_lang',state.lang);app()});
 const mt=$('#menuToggle'); if(mt) mt.addEventListener('click',()=>{const m=$('#mobileNav');if(!m)return;const opening=m.classList.contains('hidden');m.classList.toggle('hidden');mt.setAttribute('aria-expanded',String(opening));});
 const sf=$('#searchForm'); if(sf) sf.addEventListener('submit',doSearch);
 const kf=$('#knowledgeForm'); if(kf) kf.addEventListener('submit',doKnowledgeSearch);
 const af=$('#alertForm'); if(af) af.addEventListener('submit',saveAlert);
 const ff=$('#facilityForm'); if(ff) ff.addEventListener('submit',e=>{e.preventDefault();loadFacilities($('#facilityQuery')?.value||'')});
 const pf=$('#policyForm'); if(pf) pf.addEventListener('submit',e=>{e.preventDefault();loadPolicies()});
 if(state.route==='facilities') loadFacilities('');
 if(state.route==='rules'){ loadRules(); loadDeadlines(); }
 if(state.route==='policies') loadPolicies();
 if(state.route==='resources') loadDataStatus();
 if(state.route==='home') loadRecentUpdates();
 if(state.route==='family') initFamilyPreview();
 if(state.route==='reentry') initReentryPreview();
}

function readLocalJson(key,fallback){
 try{const v=JSON.parse(localStorage.getItem(key)||'null');return v??fallback}catch{return fallback}
}
function initFamilyPreview(){
 const form=$('#familyForm'), list=$('#familyProfiles'), status=$('#familyStatus'), clear=$('#clearFamily');
 if(!form||!list)return;
 const render=()=>{
   const rows=readLocalJson('cg_family_profiles',[]);
   list.innerHTML=rows.length?rows.map((r,idx)=>`<div class="result-card"><div><b>${esc(r.name)}</b><div class="result-meta">${esc(r.bop||'No BOP # saved')}</div></div><div class="result-meta">${esc(r.note||'')}</div><button class="btn btn-light" type="button" data-remove-family="${idx}">${state.lang==='es'?'Eliminar':'Remove'}</button></div>`).join(''):'<div class="empty-state">'+(state.lang==='es'?'No hay perfiles guardados.':'No saved profiles yet.')+'</div>';
   $$('[data-remove-family]').forEach(b=>b.onclick=()=>{const arr=readLocalJson('cg_family_profiles',[]);arr.splice(Number(b.dataset.removeFamily),1);localStorage.setItem('cg_family_profiles',JSON.stringify(arr));render();});
 };
 form.onsubmit=e=>{
   e.preventDefault();const fd=new FormData(form);const row={name:String(fd.get('name')||'').trim(),bop:String(fd.get('bop')||'').trim(),note:String(fd.get('note')||'').trim()};
   if(!row.name)return;const arr=readLocalJson('cg_family_profiles',[]);arr.push(row);localStorage.setItem('cg_family_profiles',JSON.stringify(arr));form.reset();if(status)status.textContent=state.lang==='es'?'Guardado localmente.':'Saved locally on this device.';render();
 };
 if(clear)clear.onclick=()=>{localStorage.removeItem('cg_family_profiles');if(status)status.textContent=state.lang==='es'?'Perfiles borrados.':'Profiles cleared.';render();};
 render();
}
function initReentryPreview(){
 const saved=readLocalJson('cg_reentry_plan',{checks:{},date:'',housing:'',employment:'',next:''});
 $$('[data-reentry]').forEach(c=>{c.checked=Boolean(saved.checks?.[c.dataset.reentry]);c.onchange=updateReentryProgress;});
 const date=$('#reentryDate'),housing=$('#reentryHousing'),employment=$('#reentryEmployment'),next=$('#reentryNext');
 if(date)date.value=saved.date||'';if(housing)housing.value=saved.housing||'';if(employment)employment.value=saved.employment||'';if(next)next.value=saved.next||'';
 const save=$('#saveReentry'),print=$('#printReentry'),status=$('#reentryStatus');
 if(save)save.onclick=()=>{const checks={};$$('[data-reentry]').forEach(c=>checks[c.dataset.reentry]=c.checked);localStorage.setItem('cg_reentry_plan',JSON.stringify({checks,date:date?.value||'',housing:housing?.value||'',employment:employment?.value||'',next:next?.value||''}));if(status)status.textContent=state.lang==='es'?'Plan guardado localmente.':'Plan saved locally on this device.';updateReentryProgress();};
 if(print)print.onclick=()=>window.print();
 updateReentryProgress();
}
function updateReentryProgress(){
 const boxes=$$('[data-reentry]'),chip=$('#reentryProgress');if(!boxes.length||!chip)return;const done=boxes.filter(x=>x.checked).length;chip.textContent=Math.round(done/boxes.length*100)+'%';
}

async function loadRecentUpdates(){
 const status=$('#updateStatus'), out=$('#updateFeed');
 if(!status||!out) return;
 status.textContent=state.lang==='es'?'Cargando actualizaciones…':'Loading updates…';
 try{
   const res=await fetch('/api/updates',{headers:{Accept:'application/json'}});
   const data=await res.json();
   if(!res.ok) throw new Error(data.error||'Unable to load updates');
   const rows=(Array.isArray(data.results)?data.results:[]).slice(0,6);
   status.textContent=rows.length
     ? (state.lang==='es'?'Mostrando las actualizaciones indexadas más recientes.':'Showing the most recent indexed updates.')
     : (state.lang==='es'?'No hay actualizaciones indexadas todavía.':'No indexed updates yet.');
   out.innerHTML=rows.length?rows.map(renderUpdate).join(''):'<div class="empty-state">No indexed updates yet.</div>';
 }catch(err){
   status.textContent=state.lang==='es'?'Las actualizaciones aparecerán cuando la base de datos V2 esté conectada.':'Updates will appear after the V2 database is connected.';
   out.innerHTML='';
 }
}
function renderUpdate(u){
 const href=safeHref(u.source_url,'https://www.bop.gov/');
 const isPolicy=u.source_type==='bop_policy';
 const label=isPolicy?(state.lang==='es'?'Política BOP':'BOP Policy'):(state.lang==='es'?'Documento regulatorio':'Regulatory Document');
 return `<div class="result-card"><div><span class="status-chip ${isPolicy?'status-blue':'status-amber'}">${esc(label)}</span><div style="height:.35rem"></div><b>${esc(u.title||u.identifier||'Official-source update')}</b><div class="result-meta">${esc(u.identifier||'')}</div></div><div><b>${esc(formatDate(u.published_date))}</b><div class="result-meta">${state.lang==='es'?'Última verificación':'Last verified'}: ${esc(formatDateTime(u.last_verified_at))}</div></div><a class="btn btn-light" href="${href}" target="_blank" rel="noopener">${state.lang==='es'?'Fuente ↗':'Source ↗'}</a></div>`;
}

async function doKnowledgeSearch(e){
 e.preventDefault();
 const q=$('#knowledgeQuery')?.value?.trim()||'';
 const status=$('#knowledgeStatus'), out=$('#knowledgeResults');
 if(!q||!status||!out) return;
 status.textContent=state.lang==='es'?'Buscando…':'Searching…'; out.innerHTML='';
 try{
   const res=await fetch('/api/search?'+new URLSearchParams({q}).toString(),{headers:{Accept:'application/json'}});
   const data=await res.json();
   if(!res.ok) throw new Error(data.error||'Search unavailable');
   const groups=[
     [state.lang==='es'?'Instituciones':'Facilities',data.facilities||[],renderKnowledgeFacility],
     [state.lang==='es'?'Políticas BOP':'BOP Policies',data.policies||[],renderKnowledgePolicy],
     [state.lang==='es'?'Reglas y documentos':'Rules & Documents',data.regulatory_documents||[],renderKnowledgeRule]
   ].filter(([,rows])=>rows.length);
   const total=groups.reduce((n,[,rows])=>n+rows.length,0);
   status.textContent=total?(state.lang==='es'?`${total} resultado(s).`:`${total} result(s).`):(state.lang==='es'?'Sin resultados.':'No results.');
   out.innerHTML=groups.length?groups.map(([label,rows,render])=>`<div class="card"><h3>${esc(label)}</h3>${rows.map(render).join('')}</div>`).join(''):'<div class="empty-state">No matching indexed records found.</div>';
 }catch(err){
   status.textContent=err.message||'Search unavailable.';
 }
}
function renderKnowledgeFacility(f){
 const href=safeHref(f.official_url,'https://www.bop.gov/locations/');
 return `<a class="resource-link" href="${href}" target="_blank" rel="noopener"><b>${esc(f.name||f.code)}</b><span>${esc([f.city,f.state,f.type].filter(Boolean).join(' • '))} ↗</span></a>`;
}
function renderKnowledgePolicy(p){
 const href=safeHref(p.source_url,'https://www.bop.gov/resources/policy_and_forms.jsp');
 return `<a class="resource-link" href="${href}" target="_blank" rel="noopener"><b>${esc(p.title||p.policy_number)}</b><span>${esc(p.policy_number||'')} ↗</span></a>`;
}
function renderKnowledgeRule(r){
 const href=safeHref(r.source_url,'https://www.federalregister.gov/');
 return `<a class="resource-link" href="${href}" target="_blank" rel="noopener"><b>${esc(r.title||r.document_number)}</b><span>${esc(r.federal_register_citation||r.document_number||'')} ↗</span></a>`;
}

async function loadDataStatus(){
 const out=$('#dataStatus'), chip=$('#alertConfigChip');
 if(!out) return;
 try{
   const res=await fetch('/api/data-status',{headers:{Accept:'application/json'}});
   const data=await res.json();
   if(!res.ok) throw new Error(data.error||'Unable to load data status');
   if(chip){
     chip.textContent=data.alerts_configured?(state.lang==='es'?'Alertas configuradas':'Alerts configured'):(state.lang==='es'?'Alertas pendientes':'Alerts not configured');
     chip.className='status-chip '+(data.alerts_configured?'status-green':'status-amber');
   }
   const items=[
     [state.lang==='es'?'Instituciones':'Facilities',data.facilities],
     [state.lang==='es'?'Políticas BOP':'BOP policies',data.policies],
     [state.lang==='es'?'Documentos regulatorios':'Regulatory documents',data.regulatory_documents]
   ];
   out.innerHTML=items.map(([label,v])=>`<div class="card"><div class="feature-icon">${esc(v?.count??0)}</div><h3>${esc(label)}</h3><p class="notice">${state.lang==='es'?'Última verificación':'Last verified'}: ${esc(formatDateTime(v?.last_verified_at))}</p></div>`).join('');
 }catch(err){
   if(chip){chip.textContent='Unavailable';chip.className='status-chip status-amber';}
   out.innerHTML='<div class="empty-state">Status data is unavailable until the V2 database is connected.</div>';
 }
}

async function loadPolicies(){
 const status=$('#policyStatus'), out=$('#policyResults');
 if(!status||!out) return;
 const params=new URLSearchParams();
 const q=$('#policyQuery')?.value?.trim()||'';
 const series=$('#policySeries')?.value||'';
 const type=$('#policyType')?.value||'';
 if(q) params.set('q',q); if(series) params.set('series',series); if(type) params.set('type',type);
 status.textContent=state.lang==='es'?'Cargando políticas oficiales…':'Loading official policy index…';
 out.innerHTML='';
 try{
   const res=await fetch('/api/policies?'+params.toString(),{headers:{Accept:'application/json'}});
   const data=await res.json();
   if(!res.ok) throw new Error(data.error||'Unable to load policies');
   const rows=Array.isArray(data.results)?data.results:[];
   status.textContent=rows.length
     ? (state.lang==='es'?`${rows.length} documento(s) de política.`:`${rows.length} policy document(s).`)
     : (state.lang==='es'?'No se encontraron políticas.':'No matching policies found.');
   out.innerHTML=rows.length?rows.map(renderPolicyCard).join(''):'<div class="empty-state">No matching policies found.</div>';
 }catch(err){
   status.textContent=err.message||'Policy index is unavailable.';
   out.innerHTML='<div class="card"><h3>Official BOP Policy & Forms</h3><p>Use the official BOP page while the Coregenisis index is unavailable.</p><a class="btn btn-dark" href="https://www.bop.gov/resources/policy_and_forms.jsp" target="_blank" rel="noopener">Open BOP Policy & Forms ↗</a></div>';
 }
}
function renderPolicyCard(p){
 const href=safeHref(p.source_url,'https://www.bop.gov/resources/policy_and_forms.jsp');
 const type=p.document_type==='trans'?(state.lang==='es'?'Traducción':'Translation'):(p.document_type==='ps'?'Program Statement':(p.document_type||'BOP policy'));
 return `<article class="card"><div class="rule-head"><div><span class="status-chip status-blue">${esc(type)}</span><h3>${esc(p.title||'BOP policy')}</h3></div></div><div class="rule-meta"><span class="meta-pill">${esc(p.policy_number||'No number')}</span><span class="meta-pill">${esc(p.series||'')}</span></div><p class="result-meta">${state.lang==='es'?'Fecha de emisión':'Issue date'}: ${esc(formatPolicyDate(p.issue_date))} • ${state.lang==='es'?'Última verificación':'Last verified'}: ${esc(formatDateTime(p.last_verified_at))}</p><a class="btn btn-light" href="${href}" target="_blank" rel="noopener">${state.lang==='es'?'PDF oficial BOP ↗':'Official BOP PDF ↗'}</a></article>`;
}
function formatPolicyDate(v){
 if(!v)return 'Not listed';
 const m=String(v).match(/^(\d{2})-(\d{2})-(\d{4})$/);
 if(!m)return String(v);
 const d=new Date(`${m[3]}-${m[1]}-${m[2]}T00:00:00`);
 return Number.isNaN(d.getTime())?String(v):d.toLocaleDateString();
}

async function loadFacilities(q=''){
 const status=$('#facilityStatus'), out=$('#facilityResults');
 if(!status||!out) return;
 status.textContent='Loading public facility directory…';
 try{
   const res=await fetch('/api/facilities?'+new URLSearchParams({q}).toString(),{headers:{Accept:'application/json'}});
   const data=await res.json();
   if(!res.ok) throw new Error(data.error||'Unable to load facilities');
   const rows=Array.isArray(data.results)?data.results:[];
   status.textContent=rows.length?`${rows.length} facility record(s). Verify details at BOP.gov.`:'No matching facilities found.';
   out.innerHTML=rows.length?rows.map(renderFacilityCard).join(''):'<div class="empty-state">No matching facilities found.</div>';
 }catch(err){
   status.textContent=err.message||'Facility directory is unavailable.';
   out.innerHTML='<div class="card"><h3>Official BOP Locations</h3><p>Use the official directory while the Coregenisis index is unavailable.</p><a class="btn btn-dark" href="https://www.bop.gov/locations/" target="_blank" rel="noopener">Open BOP Locations ↗</a></div>';
 }
}
function renderFacilityCard(f){
 const href=safeHref(f.official_url,'https://www.bop.gov/locations/');
 const camp=Number(f.has_camp)===1?' • Camp available':'';
 const contact=[f.address,[f.city,f.state,f.zip_code].filter(Boolean).join(', '),f.phone_number].filter(Boolean).map(esc).join('<br>');
 return `<article class="card"><div class="rule-head"><div><span class="status-chip status-blue">${esc(f.type||'BOP')}</span><h3>${esc(f.name||f.code||'Federal facility')}</h3><p>${esc(f.security_level||'Security level not listed')}${camp}</p></div></div><div class="result-meta">${contact}</div><p class="notice">Region: ${esc(f.region||'Not listed')} • Last verified: ${esc(formatDateTime(f.last_verified_at))}</p><a class="btn btn-light" href="${href}" target="_blank" rel="noopener">Official BOP page ↗</a></article>`;
}

async function loadDeadlines(){
 const status=$('#deadlineStatus'), out=$('#deadlineFeed');
 if(!status||!out) return;
 status.textContent=state.lang==='es'?'Cargando fechas…':'Loading dates…';
 try{
   const res=await fetch('/api/deadlines',{headers:{Accept:'application/json'}});
   const data=await res.json();
   if(!res.ok) throw new Error(data.error||'Unable to load deadlines');
   const rows=Array.isArray(data.results)?data.results:[];
   const items=[];
   rows.forEach(r=>{
     if(r.comment_deadline) items.push({kind:state.lang==='es'?'Fin de comentarios':'Comment deadline',date:r.comment_deadline,title:r.title,url:r.source_url});
     if(r.effective_date) items.push({kind:state.lang==='es'?'Fecha de vigencia':'Effective date',date:r.effective_date,title:r.title,url:r.source_url});
   });
   items.sort((a,b)=>String(a.date).localeCompare(String(b.date)));
   status.textContent=items.length?(state.lang==='es'?`${items.length} fecha(s) futura(s) indexada(s).`:`${items.length} indexed future date(s).`):(state.lang==='es'?'No hay fechas futuras indexadas.':'No future indexed dates.');
   out.innerHTML=items.length?items.map(renderDeadline).join(''):'<div class="empty-state">No future indexed dates.</div>';
 }catch(err){
   status.textContent=err.message||'Deadline tracker unavailable.';
 }
}
function renderDeadline(item){
 const href=safeHref(item.url,'https://www.federalregister.gov/');
 const days=daysUntil(item.date);
 const timing=days===0?(state.lang==='es'?'Hoy':'Today'):(days>0?(state.lang==='es'?`En ${days} día(s)`:`In ${days} day(s)`):'');
 return `<div class="result-card"><div><b>${esc(item.kind)}</b><div class="result-meta">${esc(item.title||'Federal document')}</div></div><div><b>${esc(formatDate(item.date))}</b><div class="result-meta">${esc(timing)}</div></div><a class="btn btn-light" href="${href}" target="_blank" rel="noopener">Source ↗</a></div>`;
}
function daysUntil(v){
 if(!v)return NaN;
 const target=new Date(v+'T00:00:00');
 const today=new Date(); today.setHours(0,0,0,0);
 return Math.round((target.getTime()-today.getTime())/86400000);
}
async function loadRules(){
 const status=$('#ruleStatus'), out=$('#ruleFeed');
 if(!status||!out) return;
 status.textContent='Checking regulatory source records…';
 try{
   const res=await fetch('/api/rules',{headers:{Accept:'application/json'}});
   const data=await res.json();
   if(!res.ok) throw new Error(data.error||'Unable to load rule records');
   const rows=Array.isArray(data.results)?data.results:[];
   if(!rows.length) throw new Error('No regulatory records are loaded yet.');
   status.textContent=`${rows.length} source-linked regulatory record(s).`;
   out.innerHTML=rows.map(renderRuleRecord).join('')+sourceLinks();
 }catch(err){
   status.textContent='Using the built-in source-linked rule summary until the database is connected.';
 }
}
function renderRuleRecord(r){
 const href=safeHref(r.source_url,'https://www.federalregister.gov/');
 const pdf=r.official_pdf_url?safeHref(r.official_pdf_url,''):'';
 const deadline=r.comment_deadline?formatDate(r.comment_deadline):'Not listed';
 return `<article class="card"><div class="rule-head"><div><span class="status-chip status-amber">${esc(r.document_type||r.status||'Federal rule')}</span><h2 style="margin:.65rem 0 .2rem">${esc(r.title||'Federal regulatory document')}</h2><p>${esc(r.summary||'See the official source for details.')}</p></div></div><div class="rule-meta"><span class="meta-pill">${esc(r.federal_register_citation||'')}</span><span class="meta-pill">${esc(r.document_number||'')}</span><span class="meta-pill">${esc(r.cfr||'')}</span></div><ul class="fact-list"><li><b>Agency</b>${esc(r.agency||'')}</li><li><b>Published</b>${esc(formatDate(r.publication_date))}</li><li><b>Effective</b>${esc(formatDate(r.effective_date))}</li><li><b>Comment deadline</b>${esc(deadline)}</li><li><b>Last verified</b>${esc(formatDateTime(r.last_verified_at))}</li></ul><p><a class="btn btn-light" href="${href}" target="_blank" rel="noopener">Official Federal Register source ↗</a>${pdf?` <a class="btn btn-light" href="${pdf}" target="_blank" rel="noopener">Official PDF ↗</a>`:''}</p></article>`;
}
function formatDate(v){ if(!v)return 'Not listed'; const d=new Date(v+'T00:00:00'); return Number.isNaN(d.getTime())?String(v):d.toLocaleDateString(); }
function formatDateTime(v){ if(!v)return 'Not yet'; const d=new Date(v); return Number.isNaN(d.getTime())?String(v):d.toLocaleString(); }
function safeHref(v,fallback){ try{const u=new URL(String(v||'')); return ['https:','http:'].includes(u.protocol)?esc(u.toString()):fallback;}catch{return fallback;} }

async function doSearch(e){
 e.preventDefault(); const q=$('#searchQuery').value.trim(); if(!q)return;
 $('#searchStatus').textContent=t('searching'); $('#results').innerHTML='';
 const p=new URLSearchParams({q});
 try{
   const res=await fetch('/api/bop-search?'+p.toString(),{headers:{Accept:'application/json'}});
   const data=await res.json();
   if(!res.ok) throw new Error(data.error||('HTTP '+res.status));
   const rows=normalizeResults(data); state.lastResults=rows; renderResults(rows);
   $('#searchStatus').textContent=rows.length?`${rows.length} public result(s) returned. Verify at BOP.gov.`:(data.notice||t('noResults'));
 }catch(err){ $('#searchStatus').textContent=err.message||'Live BOP search is unavailable right now.'; $('#results').innerHTML='<div class="empty-state">No live result displayed. Verify directly with the official BOP locator.</div>'; }
}

function normalizeResults(data){
 const candidates=Array.isArray(data?.results) ? data.results : [];
 return candidates.map(x=>({
   name:x.name||'Name unavailable',
   bop:x.register_number||'—',
   facility:x.facility_name||'See BOP source',
   release:x.actual_release_date||x.projected_release_date||'See BOP source'
 }));
}
function renderResults(rows){
 const el=$('#results'); if(!rows.length){el.innerHTML='<div class="empty-state">'+t('noResults')+'</div>';return;}
 el.innerHTML=rows.map(r=>`<div class="result-card"><div><b>${esc(r.name)}</b><div class="result-meta">BOP # ${esc(r.bop)}</div></div><div><b>${esc(r.facility)}</b><div class="result-meta">Release: ${esc(r.release)}</div></div><a class="btn btn-light" href="https://www.bop.gov/inmateloc/" target="_blank" rel="noopener">Verify ↗</a></div>`).join('');
}
async function saveAlert(e){
 e.preventDefault();
 const fd=new FormData(e.currentTarget);
 const payload=Object.fromEntries(fd.entries());
 payload.lang=payload.lang||state.lang;
 payload.consent=$('#lawful')?.checked===true;
 const out=$('#alertStatus'); out.textContent='Saving…';
 try{
   const res=await fetch('/api/track',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
   const data=await res.json();
   if(!res.ok) throw new Error(data.error||'Unable to save');
   out.textContent=data.message||'Tracking activated.';
 }
 catch(err){
   out.textContent=err.message||'Tracking could not be activated. Your information was not submitted.';
 }
}
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
window.addEventListener('hashchange',()=>{state.route=location.hash.replace('#/','')||'home';app();scrollTo({top:0,behavior:'smooth'})});
app();
