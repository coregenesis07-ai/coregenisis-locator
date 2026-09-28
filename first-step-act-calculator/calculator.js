(()=> {
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
let step=1, unit='years', lastCopyText='';

function showStep(n){
 step=n;
 for(let i=1;i<=3;i++){
   $('#step'+i)?.classList.toggle('active',i===n);
   const pill=$('#stepPill'+i);
   if(pill){pill.classList.toggle('active',i===n);pill.classList.toggle('done',i<n);}
 }
 window.scrollTo({top:Math.max(0,(document.querySelector('.wizard-card')?.offsetTop||0)-90),behavior:'smooth'});
}
function sentenceMonths(){
 const v=Math.max(0,Number($('#sentenceLength')?.value||0));
 return unit==='years'?Math.round(v*12):Math.round(v);
}
function validStep1(){
 if(sentenceMonths()<=0 || !$('#sentenceStart')?.value){alert('Enter the sentence length and federal sentence start date.');return false;}
 return true;
}
$$('[data-next]').forEach(b=>b.addEventListener('click',()=>{if(step===1&&!validStep1())return;showStep(Number(b.dataset.next));}));
$$('[data-back]').forEach(b=>b.addEventListener('click',()=>showStep(Number(b.dataset.back))));

function setUnit(next){
 unit=next;
 $('#unitYears').classList.toggle('active',unit==='years');
 $('#unitMonths').classList.toggle('active',unit==='months');
 $('#lengthLabel').textContent=unit==='years'?'Sentence length in years':'Sentence length in months';
 const input=$('#sentenceLength');
 if(unit==='months' && Number(input.value)<=20) input.value=Math.round(Number(input.value||5)*12);
 else if(unit==='years' && Number(input.value)>20) input.value=(Number(input.value)/12).toFixed(1).replace(/\.0$/,'');
}
$('#unitYears')?.addEventListener('click',()=>setUnit('years'));
$('#unitMonths')?.addEventListener('click',()=>setUnit('months'));
$('#participationMode')?.addEventListener('change',e=>$('#knownPeriodsWrap')?.classList.toggle('hidden',e.target.value!=='known'));

const addMonths=(d,m)=>{const x=new Date(d.getTime());const day=x.getDate();x.setDate(1);x.setMonth(x.getMonth()+m);const last=new Date(x.getFullYear(),x.getMonth()+1,0).getDate();x.setDate(Math.min(day,last));return x;};
const addDays=(d,n)=>{const x=new Date(d.getTime());x.setDate(x.getDate()+n);return x;};
const diffDays=(a,b)=>Math.max(0,Math.floor((b-a)/86400000));
const fmt=d=>!d||Number.isNaN(d.getTime())?'—':d.toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'});
const daysLabel=n=>Math.max(0,Math.round(n))+' days';
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));

function gctForMonths(months,lost){
 if(months<=12)return 0;
 const max=Math.round((months/12)*54);
 return Math.max(0,max-Math.max(0,lost||0));
}
function estimateFtc(periods,rate){return Math.max(0,Math.floor(periods))*rate;}
function calcScenario({months,start,rate,eligibility,participationMode,knownPeriods,knownFtc,gctLost,rdapMonths}){
 const rawEnd=addMonths(start,months);
 const sentenceDays=diffDays(start,rawEnd);
 const gct=gctForMonths(months,gctLost);
 const afterGct=addDays(rawEnd,-gct);
 let ftc=0, periods=0, ftcSource='none';
 if(eligibility!=='no'){
   if(Number.isFinite(knownFtc)){
     ftc=Math.max(0,knownFtc);
     ftcSource='entered';
   }else if(participationMode==='known'){
     periods=Math.max(0,Math.floor(knownPeriods));
     ftc=estimateFtc(periods,rate);
     ftcSource='known-periods';
   }else{
     periods=Math.max(0,Math.floor(diffDays(start,afterGct)/30));
     ftc=estimateFtc(periods,rate);
     ftcSource='projected';
   }
 }
 const supervised=Math.min(ftc,365);
 const prerelease=Math.max(0,ftc-supervised);
 const rdapDays=Math.round(Math.max(0,rdapMonths)*30.4375);
 const fsaSupervisedDate=addDays(afterGct,-supervised);
 const fsaPrereleaseDate=addDays(afterGct,-ftc);
 const rdapStandaloneDate=addDays(afterGct,-rdapDays);
 return {rawEnd,sentenceDays,gct,afterGct,ftc,periods,supervised,prerelease,rdapDays,fsaSupervisedDate,fsaPrereleaseDate,rdapStandaloneDate,rate,ftcSource};
}
function statusTag(kind,label){
 return '<span class="status-tag status-'+kind+'">'+label+'</span>';
}
function mathDetails(title,lines){
 return '<details class="math-details"><summary>Show the math behind '+title+'</summary><div class="subtle" style="margin-top:.55rem">'+lines.map(x=>'<div style="margin:.25rem 0">'+x+'</div>').join('')+'</div></details>';
}
function ladderItem(date,title,note,kind='calculated',math=[]){
 return '<div class="ladder-item '+(kind==='modeled'?'modeled':kind==='reference'?'reference':'')+'">'+
   '<div class="ladder-date">'+fmt(date)+' '+statusTag(kind,kind==='entered'?'Entered':kind==='modeled'?'Modeled':kind==='reference'?'Reference':'Calculated')+'</div>'+
   '<div class="ladder-title">'+title+'</div><div class="ladder-note">'+note+'</div>'+
   (math.length?mathDetails('this date',math):'')+'</div>';
}
function scaleHtml(r,start){
 const now=new Date();
 const elapsed=clamp(diffDays(start,now),0,r.sentenceDays);
 const servedPct=r.sentenceDays?clamp((elapsed/r.sentenceDays)*100,0,100):0;
 const modeledCredit=Math.min(r.sentenceDays,Math.max(0,r.gct+r.ftc));
 const creditPct=r.sentenceDays?clamp((modeledCredit/r.sentenceDays)*100,0,100-servedPct):0;
 const remaining=Math.max(0,r.sentenceDays-elapsed);
 return '<section class="result-panel summary-only sentence-scale">'+
   '<h3>Sentence, to scale</h3>'+
   '<div class="scale-legend"><span><b>'+daysLabel(elapsed)+'</b> elapsed since entered start date</span><span><b>'+daysLabel(remaining)+'</b> calendar sentence remaining</span><span><b>'+daysLabel(modeledCredit)+'</b> GCT + FTC shown separately as modeled credits</span></div>'+
   '<div class="scale-bar" aria-label="Sentence timeline"><span class="scale-served" style="width:'+servedPct.toFixed(1)+'%"></span><span class="scale-credit" style="width:'+creditPct.toFixed(1)+'%"></span></div>'+
   '<div class="scale-labels"><span>'+fmt(start)+' · entered start date</span><span>'+fmt(r.rawEnd)+' · full term</span></div>'+
   '<p class="notice">This scale is illustrative. It does not mean future credits are already earned or that any placement date is guaranteed.</p>'+
 '</section>';
}
function creditsHtml(r,knownFtcEntered){
 const projected=r.ftcSource==='projected'||r.ftcSource==='known-periods';
 const maxForMeter=Math.max(365,r.ftc,1);
 const pct=clamp((r.ftc/maxForMeter)*100,0,100);
 const sourceText=r.ftcSource==='entered'?'Entered from a BOP worksheet by the user':
   r.ftcSource==='known-periods'?'Modeled from the qualifying 30-day periods entered':
   r.ftcSource==='projected'?'Projected from continuous qualifying participation through the approximate GCT date':
   'No FSA Time Credits modeled';
 return '<section class="result-panel full-only analysis-card"><h3>FSA Time Credits</h3>'+
   '<div class="credit-meter"><span style="width:'+pct.toFixed(1)+'%"></span></div>'+
   '<div class="timeline-row"><span>'+(knownFtcEntered?'Known/entered FTC balance':'Modeled FTC total')+'</span><b>'+daysLabel(r.ftc)+'</b></div>'+
   '<div class="timeline-row"><span>Potentially relevant to earlier supervised release</span><b>'+daysLabel(r.supervised)+'</b></div>'+
   '<div class="timeline-row"><span>Additional FTC potentially relevant to prerelease custody</span><b>'+daysLabel(r.prerelease)+'</b></div>'+
   '<p class="notice">'+sourceText+'. Earned and projected credits are intentionally not described as the same thing.</p>'+
 '</section>';
}
function gctHtml(r){
 return '<section class="result-panel full-only analysis-card"><h3>Good Conduct Time</h3>'+
   '<div class="timeline-row"><span>Approximate maximum modeled after entered disciplinary loss</span><b>'+daysLabel(r.gct)+'</b></div>'+
   '<div class="timeline-row"><span>Approximate release point after GCT only</span><b>'+fmt(r.afterGct)+'</b></div>'+
   '<p class="notice">18 U.S.C. § 3624(b) provides up to 54 days for each year of the sentence imposed for qualifying sentences. BOP makes the actual award and sentence computation.</p></section>';
}
function confidenceHtml(r,officialDate,eligibility,risk,detainer,rdapMonths){
 const rows=[
   ['Sentence start & length','Entered by user', 'entered'],
   ['Full-term date','Calendar calculation','calculated'],
   ['Approximate GCT date','Calculator estimate','calculated'],
   ['FSA dates','Future-credit scenario','modeled']
 ];
 if(rdapMonths>0)rows.push(['RDAP date','User-selected reduction scenario','modeled']);
 if(officialDate)rows.push(['BOP projected date','Entered from BOP record by user','entered']);
 rows.push(['RRC referral timing','General BOP planning reference','reference']);
 return '<section class="result-panel full-only analysis-card"><h3>How firm is each date?</h3><p class="subtle">The labels describe the source of each item—not a guarantee of release or placement.</p><div class="assumption-list">'+
   rows.map(x=>'<div class="assumption-row"><span>'+x[0]+'</span><b>'+x[1]+' '+statusTag(x[2],x[2]==='entered'?'Entered':x[2]==='modeled'?'Modeled':x[2]==='reference'?'Verify':'Calculated')+'</b></div>').join('')+
   '</div><div style="height:.65rem"></div><h3>Key assumptions to verify</h3><div class="assumption-list">'+
   '<div class="assumption-row"><span>FSA eligibility</span><b>'+eligibility+'</b></div>'+
   '<div class="assumption-row"><span>PATTERN / earning-rate selection</span><b>'+risk+'</b></div>'+
   '<div class="assumption-row"><span>Detainer / hold</span><b>'+detainer+'</b></div>'+
   '<div class="assumption-row"><span>RDAP reduction modeled</span><b>'+rdapMonths+' month(s)</b></div>'+
   '</div></section>';
}
function nextMoveHtml(r,officialDate){
 const base=officialDate||r.afterGct;
 const open=addMonths(base,-19), close=addMonths(base,-17);
 const baseLabel=officialDate?'the BOP projected date you entered':'the calculator\'s approximate GCT date';
 return '<section class="result-panel full-only next-move"><span class="status-chip status-amber">Planning reference</span><h3>Your next move: prepare before the RRC referral window</h3>'+
   '<p>BOP says an RRC referral recommendation is made approximately 17–19 months before release at a scheduled program review. Using '+baseLabel+' only as the reference point:</p>'+
   '<div class="timeline-row"><span>Approximate 19-month reference</span><b>'+fmt(open)+'</b></div>'+
   '<div class="timeline-row"><span>Approximate 17-month reference</span><b>'+fmt(close)+'</b></div>'+
   '<p class="subtle">Use this as a preparation window, not a promised referral date or placement decision. Actual timing and length are individualized by BOP.</p>'+
   '<div class="timeline-row"><span>Before this window</span><b>Verify release address, household plan, identification, employment/reentry contacts, program records, and questions for Unit Team.</b></div>'+
 '</section>';
}
function statutoryReferenceHtml(r){
 const tenPct=Math.round(r.sentenceDays*.10);
 const scaHome=Math.min(tenPct,183);
 return '<section class="result-panel full-only analysis-card"><h3>Prerelease-custody references</h3>'+
   '<div class="timeline-row"><span>Second Chance Act / § 3624(c) RRC authority</span><b>Up to 12 months, individualized</b></div>'+
   '<div class="timeline-row"><span>§ 3624(c)(2) home-confinement duration reference</span><b>Shorter of 10% of term or 6 months (about '+daysLabel(scaHome)+' for this sentence)</b></div>'+
   '<div class="timeline-row"><span>FSA prerelease custody under § 3624(g)</span><b>Separate statutory framework</b></div>'+
   '<p class="notice">These are legal-framework references, not a placement prediction. Section 3624(g)(10) states that the time limits in § 3624(c) do not apply to prerelease custody under § 3624(g).</p></section>';
}
function renderScenario(r,label,ctx){
 const ladder=[];
 ladder.push({date:ctx.start,title:'Federal sentence start',note:'Date entered in the calculator.',kind:'entered',math:['Start date entered: '+fmt(ctx.start)]});
 if(r.ftc>0 && ctx.eligibility!=='no'){
   ladder.push({date:r.fsaPrereleaseDate,title:'Modeled FSA prerelease-custody threshold',note:'Illustrative date if the modeled/entered FTC amount were earned and applied under applicable FSA rules.',kind:'modeled',
     math:['Approximate GCT date: '+fmt(r.afterGct),'FTC used in this scenario: '+daysLabel(r.ftc),'Calculation: approximate GCT date minus FTC scenario.']});
   ladder.push({date:r.fsaSupervisedDate,title:'Modeled FSA transfer-to-supervised-release threshold',note:'Illustrative date using no more than 365 FTC days toward supervised release.',kind:'modeled',
     math:['Approximate GCT date: '+fmt(r.afterGct),'FTC toward supervised release in this scenario: '+daysLabel(r.supervised),'Calculation: approximate GCT date minus up to 365 FTC days.']});
 }
 if(r.rdapDays>0){
   ladder.push({date:r.rdapStandaloneDate,title:'Separate RDAP reduction scenario',note:'Shown separately so it is not silently combined with FSA credit assumptions.',kind:'modeled',
     math:['Approximate GCT date: '+fmt(r.afterGct),'User-selected RDAP reduction: '+daysLabel(r.rdapDays)]});
 }
 ladder.push({date:r.afterGct,title:'Approximate statutory release after modeled GCT',note:'Calculator estimate only; BOP sentence computation controls.',kind:'calculated',
   math:['Full term: '+fmt(r.rawEnd),'Approximate GCT modeled: '+daysLabel(r.gct)]});
 ladder.push({date:r.rawEnd,title:'Full-term date before modeled credits',note:'Calendar sentence end from the entered start date and sentence length.',kind:'calculated',
   math:['Entered sentence length: '+ctx.months+' months','Entered start date: '+fmt(ctx.start)]});
 ladder.sort((a,b)=>a.date-b.date);
 
 const officialBlock=ctx.officialDate?'<div class="analysis-card summary-only"><h3>BOP date entered for comparison</h3><div class="timeline-row"><span>Current BOP projected release date entered</span><b>'+fmt(ctx.officialDate)+' '+statusTag('entered','Entered')+'</b></div><p class="notice">This calculator does not alter that BOP date. It uses it only for comparison and the optional RRC planning reference.</p></div>':'';
 const summary='<section class="result-panel summary-only"><h3>'+label+' scenario · date ladder</h3><div class="date-ladder">'+ladder.map(x=>ladderItem(x.date,x.title,x.note,x.kind,x.math)).join('')+'</div></section>';
 const knownEntered=r.ftcSource==='entered';
 const copyLines=[
   'Federal Custody Guide — planning estimate',
   'Sentence start: '+fmt(ctx.start),
   'Full term: '+fmt(r.rawEnd),
   'Approximate GCT: '+daysLabel(r.gct)+' → '+fmt(r.afterGct),
   'FTC scenario: '+daysLabel(r.ftc)+' ('+r.rate+' days per qualifying 30-day period scenario where applicable)',
   'Modeled FSA prerelease threshold: '+(r.ftc>0?fmt(r.fsaPrereleaseDate):'not modeled'),
   'Modeled supervised-release threshold: '+(r.ftc>0?fmt(r.fsaSupervisedDate):'not modeled'),
   r.rdapDays>0?'Separate RDAP scenario: '+daysLabel(r.rdapDays)+' → '+fmt(r.rdapStandaloneDate):'RDAP scenario: none',
   ctx.officialDate?'BOP projected date entered: '+fmt(ctx.officialDate):'BOP projected date entered: none',
   'Planning estimate only — BOP records and determinations control.'
 ];
 return {
   html:scaleHtml(r,ctx.start)+officialBlock+summary+creditsHtml(r,knownEntered)+gctHtml(r)+statutoryReferenceHtml(r)+confidenceHtml(r,ctx.officialDate,ctx.eligibilityLabel,ctx.riskLabel,ctx.detainerLabel,ctx.rdapMonths)+nextMoveHtml(r,ctx.officialDate),
   copy:copyLines.join('\n')
 };
}

$('#guidedCalc')?.addEventListener('submit',e=>{
 e.preventDefault();
 const months=sentenceMonths();
 const startVal=$('#sentenceStart').value;
 if(!startVal||months<=0){showStep(1);return;}
 const start=new Date(startVal+'T12:00:00');
 const eligibility=$('#fsaEligibility').value;
 const risk=$('#patternRisk').value;
 const participationMode=$('#participationMode').value;
 const knownPeriods=Number($('#knownPeriods').value||0);
 const knownFtcRaw=$('#knownFtc').value.trim();
 const knownFtc=knownFtcRaw===''?NaN:Number(knownFtcRaw);
 const gctLost=Number($('#gctLost').value||0);
 const rdapMonths=Number($('#rdapMonths').value||0);
 const officialRaw=$('#bopProjectedDate').value;
 const officialDate=officialRaw?new Date(officialRaw+'T12:00:00'):null;
 const detainer=$('#detainer').value;
 const base={months,start,eligibility,participationMode,knownPeriods,knownFtc,gctLost,rdapMonths};
 const riskLabel=$('#patternRisk').selectedOptions[0]?.textContent||risk;
 const eligibilityLabel=$('#fsaEligibility').selectedOptions[0]?.textContent||eligibility;
 const detainerLabel=$('#detainer').selectedOptions[0]?.textContent||detainer;
 const ctx={months,start,eligibility,officialDate,riskLabel,eligibilityLabel,detainerLabel,rdapMonths};

 let html='', warnings=[], copyParts=[];
 if(risk==='unknown' && eligibility!=='no' && !Number.isFinite(knownFtc)){
   const r10=calcScenario({...base,rate:10}), r15=calcScenario({...base,rate:15});
   const p10=renderScenario(r10,'10-day earning',ctx), p15=renderScenario(r15,'15-day earning',ctx);
   html=p10.html+'<div style="height:1.2rem"></div><hr><div style="height:.4rem"></div>'+p15.html;
   copyParts=[p10.copy,'',p15.copy];
   warnings.push('PATTERN/risk earning rate is unknown, so both 10-day and 15-day scenarios are shown. A 15-day earning rate depends on the applicable statutory and BOP criteria being met.');
 }else{
   const rate=(risk==='minimum'||risk==='low')?15:10;
   const r=calcScenario({...base,rate});
   const p=renderScenario(r,rate+'-day earning',ctx);
   html=p.html; copyParts=[p.copy];
   if(officialDate){
     const gap=Math.round((officialDate-r.fsaSupervisedDate)/86400000);
     html+='<section class="result-panel full-only analysis-card comparison '+(Math.abs(gap)<=30?'good':'attn')+'"><h3>Comparison with the BOP projected date you entered</h3><div class="timeline-row"><span>Entered BOP date</span><b>'+fmt(officialDate)+'</b></div><div class="timeline-row"><span>Difference from modeled FSA supervised-release threshold</span><b>'+Math.abs(gap)+' days '+(gap>0?'later':'earlier')+'</b></div><p class="notice">A difference does not establish a BOP error. The public calculator cannot see the complete sentence computation, earned/applied credits, detainers, or individual administrative determinations.</p></section>';
   }
 }
 if(eligibility==='unknown')warnings.push('FSA eligibility is not confirmed. FSA dates are scenarios only.');
 if(detainer==='yes')warnings.push('You indicated a detainer/hold may exist. It can affect release or placement planning and is not incorporated into the date math.');
 if(rdapMonths>0)warnings.push('RDAP is displayed as a separate user-selected scenario. The calculator does not establish RDAP eligibility or the actual reduction BOP may grant.');
 if(months<=12)warnings.push('No GCT was modeled because 18 U.S.C. § 3624(b) applies the GCT provision to a term of imprisonment of more than one year.');
 if(!Number.isFinite(knownFtc) && participationMode==='best' && eligibility!=='no')warnings.push('Future FTC shown under continuous participation is projected, not earned. BOP states that conditional FSA calculations are planning tools and must not be confused with the actual Projected Release Date.');
 $('#resultSummary').innerHTML=html;
 $('#resultWarnings').innerHTML=warnings.length?'<div class="banner" style="margin-top:1rem"><strong>Verify these items:</strong><ul>'+warnings.map(x=>'<li>'+x+'</li>').join('')+'</ul></div>':'';
 lastCopyText=copyParts.join('\n\n')+(warnings.length?'\n\nVerify: '+warnings.join(' | '):'');
 $('#resultsSection').classList.remove('result-hidden');
 $('#resultsSection').classList.remove('results-full');
 $('#summaryView')?.classList.add('active');$('#fullView')?.classList.remove('active');
 $('#resultsSection').scrollIntoView({behavior:'smooth',block:'start'});
});

$('#summaryView')?.addEventListener('click',()=>{$('#resultsSection')?.classList.remove('results-full');$('#summaryView')?.classList.add('active');$('#fullView')?.classList.remove('active');});
$('#fullView')?.addEventListener('click',()=>{$('#resultsSection')?.classList.add('results-full');$('#fullView')?.classList.add('active');$('#summaryView')?.classList.remove('active');});
$('#editInputs')?.addEventListener('click',()=>{showStep(1);$('#resultsSection')?.classList.add('result-hidden');});
$('#printResults')?.addEventListener('click',()=>{const sec=$('#resultsSection');sec?.classList.add('results-full');window.print();});
$('#copyResults')?.addEventListener('click',async()=>{
 if(!lastCopyText)return;
 try{await navigator.clipboard.writeText(lastCopyText);$('#copyResults').textContent='Copied';setTimeout(()=>$('#copyResults').textContent='Copy summary',1600)}
 catch{alert('Copy was not available. Use Print / Save PDF instead.')}
});

const chart=[13,18,24,30,36,48,60,84,120,180,240];
const tbody=$('#gctChart');
if(tbody) tbody.innerHTML=chart.map(m=>{const g=gctForMonths(m,0), approx=Math.max(0,m*30.4375-g);return '<tr><td>'+m+' months</td><td>'+g+' days</td><td>'+Math.round(approx/30.4375)+' months</td></tr>';}).join('');

$('#securityCalcForm')?.addEventListener('submit',e=>{
 e.preventDefault();
 const total=$$('.security-point').map(x=>Number(x.value||0)).filter(Number.isFinite).reduce((a,b)=>a+b,0);
 $('#securityCalcResult').innerHTML='<div class="calc-summary"><div class="wide"><small>Worksheet total</small><strong>'+total+'</strong></div></div><p class="notice">This total is not an official BOP security level. Compare each point, public-safety factor, override, and the final result with current BOP policy and your official form.</p>';
});
})();