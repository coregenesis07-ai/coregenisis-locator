const BOP_ENDPOINT = "https://www.bop.gov/PublicInfo/execute/inmateloc";
const BOP_LOCATOR = "https://www.bop.gov/inmateloc/";

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const allowed = new Set([
      "https://federalcustodyguide.com",
      "https://www.federalcustodyguide.com"
    ]);
    const cors = {
      "Access-Control-Allow-Origin": allowed.has(origin) ? origin : "https://federalcustodyguide.com",
      "Vary": "Origin",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
      "Access-Control-Allow-Headers": "Accept,Content-Type",
      "Access-Control-Max-Age": "86400",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    };

    if (request.method === "OPTIONS") return new Response(null,{status:204,headers:cors});
    if (request.method !== "GET" || url.pathname !== "/api/bop-search") {
      return json({error:"Not found"},404,cors);
    }

    const q=(url.searchParams.get("q")||"").trim();
    if(q.length<2 || q.length>100) return json({error:"Enter a valid BOP register number or full name."},400,cors);

    const params=new URLSearchParams({todo:"query",output:"json"});
    const digits=q.replace(/\D/g,"");
    if(digits.length===8){
      const reg=digits.slice(0,5)+"-"+digits.slice(5);
      params.set("inmateNumType","IRN");
      params.set("inmateNum",reg);
    } else {
      const parts=q.replace(/\s+/g," ").split(" ").filter(Boolean);
      if(parts.length<2) return json({error:"For a name search, enter at least first and last name."},400,cors);
      params.set("nameFirst",parts[0]);
      params.set("nameLast",parts[parts.length-1]);
      if(parts.length>2) params.set("nameMiddle",parts.slice(1,-1).join(" "));
    }

    try{
      const response=await fetch(BOP_ENDPOINT+"?"+params.toString(),{
        headers:{
          "Accept":"application/json,text/plain;q=0.9,*/*;q=0.1",
          "User-Agent":"FederalCustodyGuide/1.0 (+independent public information service)"
        },
        redirect:"follow"
      });
      if(!response.ok) return json({error:"The official BOP lookup service did not return a successful response."},502,cors);
      const text=await response.text();
      let data;
      try{data=JSON.parse(text)}catch{return json({error:"The official BOP service returned an unexpected response."},502,cors)}
      if(data?.Captcha===true) return json({error:"The official BOP service requires additional verification right now. Please verify directly at BOP.gov."},503,cors);

      const rows=Array.isArray(data?.InmateLocator)?data.InmateLocator:[];
      return json({
        source:"Federal Bureau of Prisons",
        source_url:BOP_LOCATOR,
        checked_at:new Date().toISOString(),
        notice:"Verify current custody and release information at BOP.gov.",
        results:rows.map(row=>({
          name:[row?.nameFirst,row?.nameMiddle,row?.nameLast,row?.suffix].filter(Boolean).join(" ")||"Name unavailable",
          register_number:String(row?.inmateNum||""),
          facility_name:String(row?.faclName||""),
          facility_type:String(row?.faclType||""),
          projected_release_date:String(row?.projRelDate||""),
          actual_release_date:String(row?.actRelDate||"")
        }))
      },200,cors);
    }catch(err){
      return json({error:"Unable to reach the official BOP lookup service right now."},502,cors);
    }
  }
};

function json(data,status,headers){
  return new Response(JSON.stringify(data),{
    status,
    headers:{...headers,"Content-Type":"application/json; charset=utf-8"}
  });
}
