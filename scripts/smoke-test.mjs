const base=(process.env.BASE_URL||"").replace(/\/$/,"");
if(!base){
  console.error("Set BASE_URL to the deployed preview origin.");
  process.exit(2);
}

const checks=[];

async function check(name,path,opts={}){
  try{
    const res=await fetch(base+path,opts);
    const ct=res.headers.get("content-type")||"";
    let body;
    if(ct.includes("application/json")) body=await res.json();
    else body=(await res.text()).slice(0,300);
    const ok=opts.expectedStatus ? res.status===opts.expectedStatus : res.ok;
    checks.push({name,status:res.status,ok,body});
  }catch(error){
    checks.push({name,status:0,ok:false,body:String(error)});
  }
}

await check("health","/api/health");
await check("data status","/api/data-status");
await check("facilities","/api/facilities?q=Beckley");
await check("policies","/api/policies?q=compassionate");
await check("rules","/api/rules");
await check("updates","/api/updates");
await check("deadlines","/api/deadlines");
await check("knowledge search","/api/search?q=First%20Step");
await check("invalid inmate search","/api/bop-search?q=a",{expectedStatus:400});

for(const c of checks){
  console.log(`${c.ok?"PASS":"FAIL"}  ${c.name}  HTTP ${c.status}`);
}
if(checks.some(c=>!c.ok)){
  console.error("\nOne or more preview smoke tests failed.");
  process.exit(1);
}
console.log("\nAll preview smoke tests passed.");
