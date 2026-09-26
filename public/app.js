const $ = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => [...el.querySelectorAll(s)];

const state = { lang: localStorage.getItem('cg_lang') || 'en', route: location.hash.replace('#/','') || 'home', lastResults: [] };

const copy = {
  en: {
    subtitle:'Federal Custody Information Center', search:'Inmate Search', fsa:'FSA & Time Credits', rules:'Federal Rules', policies:'BOP Policies', facilities:'Facilities', alerts:'Alerts', resources:'Resources',
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
    subtitle:'Centro de Información de Custodia Federal', search:'Buscar Recluso', fsa:'FSA y Créditos', rules:'Reglas Federales', policies:'Políticas BOP', facilities:'Instituciones', alerts:'Alertas', resources:'Recursos',
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
  ['search',t('search')],['fsa',t('fsa')],['rules',t('rules')],['policies',t('policies')],['facilities',t('facilities')],['alerts',t('alerts')],['resources',t('resources')]
];}

function header(){
  return `<header class="site-header"><div class="header-inner">
    <a class="brand" href="#/home"><span class="brand-mark">C</span><span class="brand-copy"><strong>Coregenisis</strong><small>${t('subtitle')}</small></span></a>
    <nav class="nav" aria-label="Primary">${navItems().map(([r,l])=>`<button data-route="${r}" class="${state.route===r?'active':''}">${l}</button>`).join('')}</nav>
    <div class="header-actions"><div class="lang-toggle"><button data-lang="en" class="${state.lang==='en'?'active':''}">EN</button><button data-lang="es" class="${state.lang==='es'?'active':''}">ES</button></div><a class="btn btn-dark" href="#/search">${t('search')}</a></div>
  </div></header>`;
}

function footer(){
  return `<footer class="footer"><div class="container footer-grid">
    <div><div class="brand" style="color:white"><span class="brand-mark">C</span><span class="brand-copy"><strong>Coregenisis</strong><small>${t('subtitle')}</small></span></div><p style="max-width:420px">${t('unofficial')}</p><small>© ${new Date().getFullYear()} Coregenisis. ${t('noAdvice')}</small></div>
    <div><h4>${t('search')}</h4><a href="#/search">BOP inmate search</a><a href="https://www.bop.gov/inmateloc/" target="_blank" rel="noopener">Official BOP locator ↗</a></div>
    <div><h4>${t('rules')}</h4><a href="#/fsa">First Step Act</a><a href="#/rules">Rule center</a><a href="https://www.ecfr.gov/" target="_blank" rel="noopener">eCFR ↗</a></div>
    <div><h4>${t('resources')}</h4><a href="https://www.federalregister.gov/" target="_blank" rel="noopener">Federal Register ↗</a><a href="https://www.govinfo.gov/" target="_blank" rel="noopener">GovInfo ↗</a><a href="https://www.bop.gov/" target="_blank" rel="noopener">BOP.gov ↗</a></div>
    <div><h4>Legal</h4><a href="#/privacy">${state.lang==='es'?'Privacidad':'Privacy'}</a><a href="#/terms">${state.lang==='es'?'Términos':'Terms'}</a><a href="#/disclaimer">${state.lang==='es'?'Aviso legal':'Disclaimer'}</a><a href="#/copyright">${state.lang==='es'?'Derechos de autor':'Copyright'}</a></div>
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
    <section class="section white"><div class="container"><div class="section-title"><div><h2>One place for the information families actually need</h2><p>Coregenisis 2.0 organizes public custody and regulatory information around practical questions instead of government-site structure.</p></div></div><div class="grid grid-3">${features.map((x,i)=>`<div class="card"><div class="feature-icon">${i+1}</div><h3>${x}</h3><p>Clear, source-linked information designed for mobile use.</p></div>`).join('')}</div></div></section>
    <section class="section"><div class="container"><div class="banner"><strong>Source-first design:</strong> summaries are informational. Official government publications and agency records control.</div><div style="height:1rem"></div>
      <div class="grid grid-2"><div class="card"><span class="status-chip status-blue">Featured rule</span><h3>${t('ruleTitle')}</h3><p>${t('summary')}</p><a class="btn btn-light" href="#/rules">Read the rule summary</a></div>${sourceLinks()}</div></div></section>
  </main>`;
}

function searchPage(){
  return `<main id="main">${pageHeader(t('searchTitle'),t('searchDesc'))}<section class="section"><div class="container">
  <div class="search-shell"><form id="searchForm"><label><b>${t('searchTitle')}</b><div class="search-row" style="margin-top:.55rem"><input id="searchQuery" class="field" placeholder="${t('searchPlaceholder')}" autocomplete="off" required><button class="btn btn-dark" type="submit">${t('search')}</button></div></label><div class="helper">Examples: 12345-067 or John Smith. Public results should always be verified at BOP.gov.</div></form><div id="searchStatus" class="helper"></div><div id="results" class="results"></div></div>
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
   <div id="ruleStatus" class="helper" style="margin:.8rem 0"></div>
   <div id="ruleFeed" class="grid grid-2">${ruleCard()}${sourceLinks()}</div>
 </div></section></main>`;
}
function fsaPage(){
 const es=state.lang==='es';
 return `<main id="main">${pageHeader(t('fsa'),es?'Centro de información pública sobre la Ley First Step, créditos de tiempo, documentos oficiales y recursos del BOP.':'A focused First Step Act hub for public rules, time-credit information, official documents, and BOP resources.')}<section class="section"><div class="container">
 <div class="grid grid-3"><div class="card"><div class="feature-icon">1</div><h3>${es?'Créditos de tiempo':'Time credits'}</h3><p>${es?'Use el texto regulatorio y las fuentes oficiales para entender las reglas generales de acumulación y aplicación.':'Use the regulatory text and official sources to understand the general earning and application rules.'}</p></div><div class="card"><div class="feature-icon">2</div><h3>PATTERN & programs</h3><p>${es?'Consulte los recursos oficiales de evaluación de riesgo, necesidades y programas relacionados con FSA.':'Use the official risk-assessment, needs, and programming resources tied to FSA implementation.'}</p></div><div class="card"><div class="feature-icon">3</div><h3>${es?'Verifique la fuente':'Verify the source'}</h3><p>${es?'Los resúmenes de Coregenisis no sustituyen las publicaciones oficiales.':'Coregenisis summaries do not replace official publications.'}</p></div></div>
 <div style="height:1rem"></div>
 <div class="grid grid-2">
   <div class="card"><h3>${es?'Recursos oficiales del BOP':'Official BOP FSA resources'}</h3>
     <a class="resource-link" href="https://www.bop.gov/inmates/fsa/" target="_blank" rel="noopener"><b>First Step Act</b><span>BOP overview hub ↗</span></a>
     <a class="resource-link" href="https://www.bop.gov/inmates/fsa/policies.jsp" target="_blank" rel="noopener"><b>FSA related resources</b><span>BOP policies & tools ↗</span></a>
     <a class="resource-link" href="https://www.bop.gov/inmates/fsa/faq.jsp" target="_blank" rel="noopener"><b>FSA FAQ</b><span>BOP frequently asked questions ↗</span></a>
   </div>
   ${sourceLinks()}
 </div>
 <div style="height:1rem"></div>${ruleCard()}</div></section></main>`;
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
   <div id="policyStatus" class="helper" style="margin:.8rem 0"></div>
   <div id="policyResults" class="grid grid-2"></div>
 </div></section></main>`;
}

function facilitiesPage(){
 return `<main id="main">${pageHeader(t('facilities'),t('facilitiesDesc'))}<section class="section"><div class="container">
   <div class="search-shell">
     <form id="facilityForm"><label><b>Search federal facilities</b><div class="search-row" style="margin-top:.55rem"><input id="facilityQuery" class="field" placeholder="Facility, city, state, or code"><button class="btn btn-dark" type="submit">Search</button></div></label></form>
     <div class="helper">Directory entries are refreshed from the public BOP locations source when the scheduled refresh is enabled.</div>
   </div>
   <div id="facilityStatus" class="helper" style="margin:.8rem 0"></div>
   <div id="facilityResults" class="grid grid-2"><div class="card"><h3>Official BOP Locations</h3><p>Use the official BOP directory to verify current institution information.</p><a class="btn btn-dark" href="https://www.bop.gov/locations/" target="_blank" rel="noopener">Open BOP Locations ↗</a></div></div>
 </div></section></main>`;
}
function alertsPage(){
 return `<main id="main">${pageHeader(t('alertsTitle'),t('alertsDesc'))}<section class="section"><div class="container"><div class="card"><form id="alertForm" class="alert-form">
  <label>BOP register number<input class="field" name="register_number" placeholder="12345-067" required></label>
  <label>Inmate name<input class="field" name="inmate_name" placeholder="Full name"></label>
  <label>Email<input class="field" type="email" name="email" placeholder="you@example.com" required></label>
  <label>Language<select class="field" name="lang"><option value="en">English</option><option value="es">Español</option></select></label>
  <label class="full"><input type="checkbox" id="lawful" required> I will use this service only for lawful, non-harassing purposes.</label>
  <div class="full"><button class="btn btn-dark" type="submit">${t('saveAlert')}</button><div id="alertStatus" class="helper"></div></div>
 </form></div><div style="height:1rem"></div><div class="banner"><strong>Important:</strong> Alert enrollment uses email confirmation. Tracking does not begin until the recipient verifies the request. Every alert email includes an unsubscribe link.</div></div></section></main>`;
}
function resourcesPage(){
 return `<main id="main">${pageHeader(t('resources'),t('sourcesDesc'))}<section class="section"><div class="container grid grid-2">${sourceLinks()}<div class="card"><h3>Coregenisis use principles</h3><p>1. Show the official source.</p><p>2. Separate source text from explanation.</p><p>3. Date summaries and updates.</p><p>4. Avoid implying government affiliation.</p><p>5. Do not present individualized legal conclusions as fact.</p></div></div></section></main>`;
}

function legalPage(kind){
 const es=state.lang==='es';
 const pages={
  privacy:{
   title:es?'Política de Privacidad':'Privacy Policy',
   lead:es?'Cómo Coregenisis maneja la información necesaria para búsquedas públicas y alertas.':'How Coregenisis handles information needed for public searches and alerts.',
   body:es
    ? '<h3>Datos que usamos</h3><p>Coregenisis usa registros federales públicos para mostrar información de custodia y fuentes regulatorias. Para una alerta verificada podemos guardar el número de registro BOP, nombre mostrado, correo electrónico, idioma, última institución/fecha de liberación conocida, fechas de comprobación y metadatos técnicos necesarios para operar la alerta.</p><h3>Alertas por correo</h3><p>La inscripción usa confirmación por correo. El seguimiento no comienza hasta que el destinatario confirma la solicitud. Cada alerta incluye un enlace para cancelar la suscripción.</p><h3>Uso de datos</h3><p>No vendemos información personal. No ofrecemos alertas SMS en esta versión. Las solicitudes viajan por HTTPS cuando el sitio se despliega en Cloudflare.</p><h3>Eliminación</h3><p>Los registros de seguimiento pueden desactivarse mediante el enlace de cancelación. La versión de producción también debe mantener un método de eliminación autenticado por token y un canal de contacto publicado.</p>'
    : '<h3>Data we use</h3><p>Coregenisis uses public federal records to display custody information and regulatory sources. For a verified alert we may store the BOP register number, display name, email address, language, last known facility/release date, check timestamps, and technical metadata needed to operate the alert.</p><h3>Email alerts</h3><p>Enrollment uses email confirmation. Tracking does not begin until the recipient confirms the request. Every alert includes an unsubscribe link.</p><h3>Use of data</h3><p>We do not sell personal information. This version does not offer SMS alerts. Requests are transmitted over HTTPS when the site is deployed on Cloudflare.</p><h3>Deletion</h3><p>Tracking records can be deactivated through the unsubscribe link. Production should also maintain a token-authenticated deletion method and a published contact channel.</p>'
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
 const routes={home:home,search:searchPage,fsa:fsaPage,rules:rulesPage,policies:policiesPage,facilities:facilitiesPage,alerts:alertsPage,resources:resourcesPage,privacy:()=>legalPage('privacy'),terms:()=>legalPage('terms'),disclaimer:()=>legalPage('disclaimer'),copyright:()=>legalPage('copyright')};
 const view=(routes[state.route]||home)();
 $('#app').innerHTML=header()+view+footer();
 bind();
}

function bind(){
 $('[data-route]').forEach(b=>b.onclick=()=>{location.hash='#/'+b.dataset.route});
 $('[data-lang]').forEach(b=>b.onclick=()=>{state.lang=b.dataset.lang;localStorage.setItem('cg_lang',state.lang);app()});
 const sf=$('#searchForm'); if(sf) sf.addEventListener('submit',doSearch);
 const af=$('#alertForm'); if(af) af.addEventListener('submit',saveAlert);
 const ff=$('#facilityForm'); if(ff) ff.addEventListener('submit',e=>{e.preventDefault();loadFacilities($('#facilityQuery')?.value||'')});
 const pf=$('#policyForm'); if(pf) pf.addEventListener('submit',e=>{e.preventDefault();loadPolicies()});
 if(state.route==='facilities') loadFacilities('');
 if(state.route==='rules') loadRules();
 if(state.route==='policies') loadPolicies();
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
