const $ = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => [...el.querySelectorAll(s)];

const state = { lang: localStorage.getItem('cg_lang') || 'en', route: location.hash.replace('#/','') || 'home', lastResults: [] };

const copy = {
  en: {
    subtitle:'Federal Custody Information Center', search:'Inmate Search', fsa:'FSA & Time Credits', rules:'Federal Rules', facilities:'Facilities', alerts:'Alerts', resources:'Resources',
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
    subtitle:'Centro de Información de Custodia Federal', search:'Buscar Recluso', fsa:'FSA y Créditos', rules:'Reglas Federales', facilities:'Instituciones', alerts:'Alertas', resources:'Recursos',
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
  ['search',t('search')],['fsa',t('fsa')],['rules',t('rules')],['facilities',t('facilities')],['alerts',t('alerts')],['resources',t('resources')]
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
 </ul><div><div class="callout"><b>${t('whatChanged')}</b><p>• ${t('change1')}</p><p>• ${t('change2')}</p></div><h3>${t('whyMatters')}</h3><p>${t('affected')}</p><p class="notice">${t('noAdvice')}</p></div></div></article>`; 
}

function rulesPage(){
 return `<main id="main">${pageHeader(t('rules'),t('rulesDesc'))}<section class="section"><div class="container"><div class="grid grid-2">${ruleCard()}${sourceLinks()}</div></div></section></main>`;
}
function fsaPage(){
 return `<main id="main">${pageHeader(t('fsa'),'A focused First Step Act hub for public rules, time-credit information, source documents, and future updates.')}<section class="section"><div class="container">
 <div class="grid grid-3"><div class="card"><div class="feature-icon">1</div><h3>Earning credits</h3><p>Understand the regulatory language governing when eligible inmates begin earning FSA Time Credits.</p></div><div class="card"><div class="feature-icon">2</div><h3>Applying credits</h3><p>Keep earning rules separate from the rules governing application toward prerelease custody or supervised release.</p></div><div class="card"><div class="feature-icon">3</div><h3>Verify the source</h3><p>Use Federal Register, eCFR, GovInfo, and BOP materials before relying on a summary.</p></div></div><div style="height:1rem"></div>${ruleCard()}</div></section></main>`;
}
function facilitiesPage(){
 return `<main id="main">${pageHeader(t('facilities'),t('facilitiesDesc'))}<section class="section"><div class="container"><div class="grid grid-2"><div class="card"><h3>Official BOP Locations</h3><p>Use the official facility directory for institution pages, addresses, phone numbers, visiting details, and facility type.</p><a class="btn btn-dark" href="https://www.bop.gov/locations/" target="_blank" rel="noopener">Open BOP Locations ↗</a></div><div class="card"><h3>Coregenisis facility directory</h3><p>The V2 data model includes a facility index so we can add searchable public facility information without presenting stale contact details as current.</p><span class="status-chip status-blue">V2 foundation</span></div></div></div></section></main>`;
}
function alertsPage(){
 return `<main id="main">${pageHeader(t('alertsTitle'),t('alertsDesc'))}<section class="section"><div class="container"><div class="card"><form id="alertForm" class="alert-form">
  <label>BOP register number<input class="field" name="register_number" placeholder="12345-067" required></label>
  <label>Inmate name<input class="field" name="inmate_name" placeholder="Full name"></label>
  <label>Email<input class="field" type="email" name="email" placeholder="you@example.com" required></label>
  <label>Phone (optional)<input class="field" name="phone" placeholder="+1 ..."></label>
  <label class="full"><input type="checkbox" id="lawful" required> I will use this service only for lawful, non-harassing purposes.</label>
  <div class="full"><button class="btn btn-dark" type="submit">${t('saveAlert')}</button><div id="alertStatus" class="helper"></div></div>
 </form></div><div style="height:1rem"></div><div class="banner"><strong>Important:</strong> A saved tracking request is not proof that email delivery is active. Coregenisis should display alert-delivery status only after the production notification service is configured and tested.</div></div></section></main>`;
}
function resourcesPage(){
 return `<main id="main">${pageHeader(t('resources'),t('sourcesDesc'))}<section class="section"><div class="container grid grid-2">${sourceLinks()}<div class="card"><h3>Coregenisis use principles</h3><p>1. Show the official source.</p><p>2. Separate source text from explanation.</p><p>3. Date summaries and updates.</p><p>4. Avoid implying government affiliation.</p><p>5. Do not present individualized legal conclusions as fact.</p></div></div></section></main>`;
}

function app(){
 const routes={home:home,search:searchPage,fsa:fsaPage,rules:rulesPage,facilities:facilitiesPage,alerts:alertsPage,resources:resourcesPage};
 const view=(routes[state.route]||home)();
 $('#app').innerHTML=header()+view+footer();
 bind();
}

function bind(){
 $$('[data-route]').forEach(b=>b.onclick=()=>{location.hash='#/'+b.dataset.route});
 $$('[data-lang]').forEach(b=>b.onclick=()=>{state.lang=b.dataset.lang;localStorage.setItem('cg_lang',state.lang);app()});
 const sf=$('#searchForm'); if(sf) sf.addEventListener('submit',doSearch);
 const af=$('#alertForm'); if(af) af.addEventListener('submit',saveAlert);
}

async function doSearch(e){
 e.preventDefault(); const q=$('#searchQuery').value.trim(); if(!q)return;
 $('#searchStatus').textContent=t('searching'); $('#results').innerHTML='';
 const p=new URLSearchParams({todo:'query',output:'json'});
 if(/^\d{5}-\d{3}$/.test(q)||/^\d{8}$/.test(q)){ p.set('inmateNum',q.replace('-','')); }
 else { const parts=q.split(/\s+/); p.set('inmateFName',parts[0]||''); p.set('inmateLName',parts.slice(1).join(' ')||parts[0]||''); }
 try{
   const res=await fetch('/api/bop-search?'+p.toString(),{headers:{Accept:'application/json'}});
   if(!res.ok) throw new Error('HTTP '+res.status);
   const data=await res.json(); const rows=normalizeResults(data); state.lastResults=rows; renderResults(rows); $('#searchStatus').textContent=rows.length?`${rows.length} public result(s) returned.`:t('noResults');
 }catch(err){ $('#searchStatus').textContent='Live BOP search is not connected on this deployment yet. The V2 interface is ready for the Cloudflare Worker endpoint.'; $('#results').innerHTML='<div class="empty-state">No live result displayed. Verify directly with the official BOP locator.</div>'; }
}

function normalizeResults(data){
 const candidates=[data?.InmateLocator, data?.inmates, data?.results, data?.data, data?.inmate].find(Array.isArray) || (data?.inmate?[data.inmate]:[]);
 return candidates.map(x=>({
   name:[x.name,x.inmateName,[x.firstName||x.inmateFName,x.middleName||x.inmateMName,x.lastName||x.inmateLName].filter(Boolean).join(' ')].find(Boolean)||'Name unavailable',
   bop:x.registerNumber||x.inmateNum||x.regNum||x.register_number||'—',
   facility:x.facilityName||x.faclName||x.facility||'See BOP source',
   release:x.releaseDate||x.actRelDate||x.projRelDate||'See BOP source'
 }));
}
function renderResults(rows){
 const el=$('#results'); if(!rows.length){el.innerHTML='<div class="empty-state">'+t('noResults')+'</div>';return;}
 el.innerHTML=rows.map(r=>`<div class="result-card"><div><b>${esc(r.name)}</b><div class="result-meta">BOP # ${esc(r.bop)}</div></div><div><b>${esc(r.facility)}</b><div class="result-meta">Release: ${esc(r.release)}</div></div><a class="btn btn-light" href="https://www.bop.gov/inmateloc/" target="_blank" rel="noopener">Verify ↗</a></div>`).join('');
}
async function saveAlert(e){
 e.preventDefault(); const fd=new FormData(e.currentTarget); const payload=Object.fromEntries(fd.entries()); payload.lang=state.lang; const out=$('#alertStatus'); out.textContent='Saving…';
 try{ const res=await fetch('/api/track',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}); const data=await res.json(); if(!res.ok) throw new Error(data.error||'Unable to save'); out.textContent=data.message||'Tracking request saved.'; }
 catch(err){ out.textContent='The tracking backend is not connected on this deployment yet. Your information was not submitted.'; }
}
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
window.addEventListener('hashchange',()=>{state.route=location.hash.replace('#/','')||'home';app();scrollTo({top:0,behavior:'smooth'})});
app();
