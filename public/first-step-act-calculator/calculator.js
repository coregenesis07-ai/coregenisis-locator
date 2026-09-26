(()=> {
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
let step=1, unit='years';

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
const fmt=d=>Number.isNaN(d.getTime())?'—':d.toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'});
const daysLabel=n=>Math.max(0,Math.round(n))+' days';

function gctForMonths(months,lost){
 if(months<=12)return 0;
 const max=Math.round((months/12)*54);
 return Math.max(0,max-Math.max(0,lost||0));
}
function estimateFtc(periods,rate){return Math.max(0,Math.floor(periods))*rate;}
function calcScenario({months,start,rate,eligibility,participationMode,knownPeriods,knownFtc,gctLost,rdapMonths}){
 const rawEnd=addMonths(start,months);
 const gct=gctForMonths(months,gctLost);
 const afterGct=addDays(rawEnd,-gct);
 let ftc=0, periods=0;
 if(eligibility!=='no'){
   if(Number.isFinite(knownFtc)){ftc=Math.max(0,knownFtc);}
   else if(participationMode==='known'){periods=Math.max(0,Math.floor(knownPeriods));ftc=estimateFtc(periods,rate);}
   else{
     periods=Math.max(0,Math.floor(diffDays(start,afterGct)/30));
     ftc=estimateFtc(periods,rate);
   }
 }
 const supervised=Math.min(ftc,365);
 const prerelease=Math.max(0,ftc-365);
 const rdapDays=Math.round(Math.max(0,rdapMonths)*30.4375);
 const afterFtc=addDays(afterGct,-supervised);
 const modeled=addDays(afterFtc,-rdapDays);
 return {rawEnd,gct,afterGct,ftc,periods,supervised,prerelease,rdapDays,modeled,rate};
}
function renderScenario(r,label){
 return '<div class="calc-summary">'+
  '<div><small>Raw sentence end</small><strong>'+fmt(r.rawEnd)+'</strong></div>'+
  '<div><small>Approx. GCT modeled</small><strong>'+daysLabel(r.gct)+'</strong></div>'+
  '<div><small>'+label+' FTC modeled</small><strong>'+daysLabel(r.ftc)+'</strong></div>'+
  '<div><small>FTC used toward supervised-release date</small><strong>'+daysLabel(r.supervised)+'</strong></div>'+
  '<div><small>Additional FTC potentially relevant to prerelease custody</small><strong>'+daysLabel(r.prerelease)+'</strong></div>'+
  '<div><small>RDAP reduction modeled</small><strong>'+daysLabel(r.rdapDays)+'</strong></div>'+
  '<div class="wide"><small>Illustrative planning date</small><strong>'+fmt(r.modeled)+'</strong></div>'+
 '</div>';
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
 const base={months,start,eligibility,participationMode,knownPeriods,knownFtc,gctLost,rdapMonths};

 let html='';
 let warnings=[];
 if(risk==='unknown' && eligibility!=='no' && !Number.isFinite(knownFtc)){
   const r10=calcScenario({...base,rate:10}), r15=calcScenario({...base,rate:15});
   html='<h3>10-day earning scenario</h3>'+renderScenario(r10,'10-day')+
        '<h3 style="margin-top:1.2rem">15-day earning scenario</h3>'+renderScenario(r15,'15-day');
   warnings.push('PATTERN/risk earning rate is unknown, so both statutory earning-rate scenarios are shown.');
 }else{
   const rate=(risk==='minimum'||risk==='low')?15:10;
   const r=calcScenario({...base,rate});
   html=renderScenario(r,rate+'-day');
   const official=$('#bopProjectedDate').value;
   if(official){
     const od=new Date(official+'T12:00:00'), gap=Math.round((od-r.modeled)/86400000);
     html+='<div class="card comparison '+(Math.abs(gap)<=30?'good':'attn')+'" style="margin-top:1rem"><b>Comparison with the BOP projected date you entered</b><p>Your entered BOP date: '+fmt(od)+'</p><p>Difference from this illustrative model: '+Math.abs(gap)+' days '+(gap>0?'later':'earlier')+'.</p><p class="notice">A difference does not prove an error. BOP uses individual sentence-computation data and applied credits that this public tool cannot see.</p></div>';
   }
 }
 if(eligibility==='unknown')warnings.push('FSA eligibility is not confirmed. The calculator modeled credits only as a planning scenario.');
 if($('#detainer').value==='yes')warnings.push('You indicated a detainer/hold may exist. That can affect placement or release planning and is not incorporated into this date math.');
 if(rdapMonths>0)warnings.push('RDAP reduction was modeled because you selected it; this does not establish RDAP eligibility or the actual reduction BOP will grant.');
 if(months<=12)warnings.push('No GCT was modeled because 18 U.S.C. § 3624(b) applies the GCT provision to a term of imprisonment of more than one year.');
 $('#resultSummary').innerHTML=html;
 $('#resultWarnings').innerHTML=warnings.length?'<div class="banner" style="margin-top:1rem"><strong>Verify these items:</strong><ul>'+warnings.map(x=>'<li>'+x+'</li>').join('')+'</ul></div>':'';
 $('#resultsSection').classList.remove('result-hidden');
 $('#resultsSection').scrollIntoView({behavior:'smooth',block:'start'});
});

$('#editInputs')?.addEventListener('click',()=>{showStep(1);$('#resultsSection')?.classList.add('result-hidden');});

const chart=[13,18,24,30,36,48,60,84,120,180,240];
const tbody=$('#gctChart');
if(tbody) tbody.innerHTML=chart.map(m=>{const g=gctForMonths(m,0), approx=Math.max(0,m*30.4375-g);return '<tr><td>'+m+' months</td><td>'+g+' days</td><td>'+Math.round(approx/30.4375)+' months</td></tr>';}).join('');

$('#securityCalcForm')?.addEventListener('submit',e=>{
 e.preventDefault();
 const total=$$('.security-point').map(x=>Number(x.value||0)).filter(Number.isFinite).reduce((a,b)=>a+b,0);
 $('#securityCalcResult').innerHTML='<div class="calc-summary"><div class="wide"><small>Worksheet total</small><strong>'+total+'</strong></div></div><p class="notice">This total is not an official BOP security level. Compare each point, public-safety factor, override, and the final result with current BOP policy and your official form.</p>';
});
})();