(()=> {
  const $=s=>document.querySelector(s);
  const $$=s=>[...document.querySelectorAll(s)];
  const addMonths=(d,m)=>{const x=new Date(d.getTime());const day=x.getDate();x.setDate(1);x.setMonth(x.getMonth()+m);const last=new Date(x.getFullYear(),x.getMonth()+1,0).getDate();x.setDate(Math.min(day,last));return x;};
  const minusDays=(d,n)=>{const x=new Date(d.getTime());x.setDate(x.getDate()-n);return x;};
  const fmt=d=>Number.isNaN(d.getTime())?'—':d.toLocaleDateString();

  const form=$('#fsaCalcForm'), out=$('#fsaCalcResult');
  if(form && out){
    form.addEventListener('submit',e=>{
      e.preventDefault();
      const startVal=$('#calcStart').value;
      const years=Math.max(0,Number($('#calcYears').value||0));
      const months=Math.max(0,Number($('#calcMonths').value||0));
      const totalMonths=Math.round(years*12+months);
      const periods=Math.max(0,Math.floor(Number($('#calcFsaPeriods').value||0)));
      const rate=Number($('#calcFsaRate').value||10)===15?15:10;
      const rdapMonths=Math.min(12,Math.max(0,Number($('#calcRdap').value||0)));
      if(!startVal || totalMonths<=0){
        out.innerHTML='<div class="banner" style="margin-top:1rem">Enter a valid sentence start date and sentence length.</div>';
        return;
      }

      const start=new Date(startVal+'T12:00:00');
      const grossEnd=addMonths(start,totalMonths);
      const sentenceYears=totalMonths/12;
      const gctDays=$('#calcGct').checked && totalMonths>12 ? Math.round(sentenceYears*54) : 0;
      const ftcDays=periods*rate;
      const supervisedFtc=Math.min(ftcDays,365);
      const additionalFtc=Math.max(0,ftcDays-365);
      const rdapDays=Math.round(rdapMonths*30.4375);
      const combinedDays=gctDays+ftcDays+rdapDays;
      const modeledDate=minusDays(grossEnd,combinedDays);

      out.innerHTML=`
        <div class="calc-summary">
          <div><small>Sentence end before modeled credits</small><strong>${fmt(grossEnd)}</strong></div>
          <div><small>Approximate maximum GCT</small><strong>${gctDays} days</strong></div>
          <div><small>Modeled FSA Time Credits</small><strong>${ftcDays} days</strong></div>
          <div><small>Modeled RDAP reduction</small><strong>${rdapDays} days</strong></div>
          <div class="wide"><small>Illustrative combined planning date</small><strong>${fmt(modeledDate)}</strong></div>
        </div>
        <p class="notice">FTC breakdown for planning: up to ${supervisedFtc} modeled days fall within the 12-month supervised-release cap; ${additionalFtc} additional modeled FTC days may be relevant to prerelease custody if the applicable BOP criteria are met.</p>
        <div class="banner"><strong>Not an official release date:</strong> actual credit earning and application depend on eligibility, successful participation, risk assessments, individual records, disciplinary status, sentence computation and BOP determinations.</div>`;
    });
  }

  const securityForm=$('#securityCalcForm'), securityOut=$('#securityCalcResult');
  if(securityForm && securityOut){
    securityForm.addEventListener('submit',e=>{
      e.preventDefault();
      const total=$$('.security-point').map(x=>Number(x.value||0)).filter(Number.isFinite).reduce((a,b)=>a+b,0);
      securityOut.innerHTML=`<div class="calc-summary"><div class="wide"><small>Worksheet total</small><strong>${total}</strong></div></div><p class="notice">This total is not an official BOP security level. Compare each point value, any public-safety factors, overrides, and the final classification with the current BOP policy and your official form.</p>`;
    });
  }
})();