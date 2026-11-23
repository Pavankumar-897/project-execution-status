/* PROJECT EXECUTION STATUS – mirrors the Excel workbook (PROJECTS + DASHBOARD sheets) */
const LISTS = {
  enquiry: ["SERVICE","PRODUCT","SOLUTION"],
  confirmation: ["YES","NO"],
  service: ["RELAY TESTING","RETRO FITTING","COMMISSIONING","OTHERS"],
  status: ["ON-GOING","COMPLETED"],
  state: ["ANDHRA PRADESH","ARUNACHAL PRADESH","ASSAM","BIHAR","CHHATTISGARH","GOA","GUJARAT","HARYANA","HIMACHAL PRADESH","JHARKHAND","KARNATAKA","KERALA","MADHYA PRADESH","MAHARASHTRA","MANIPUR","MEGHALAYA","MIZORAM","NAGALAND","ODISHA","PUNJAB","RAJASTHAN","SIKKIM","TAMIL NADU","TELANGANA","TRIPURA","UTTAR PRADESH","UTTARAKHAND","WEST BENGAL","JAMMU & KASHMIR"]
};
const FIELDS = ["enquiryNo","requestCode","enquiry","confirmation","customer","state","service","engineer","status"];
const HEADERS = ["ENQUIRY NUMBER","SERVICE REQUEST CODE","ENQUIRY","CONFIRMATION","COSTUMER NAME","SITE LOCATION , STATE","SERVICE REQUIRED","ENGINEER ASSIGNED","SITE STATUS"];
const SEED = [
 ["    PPS-2026-001  ", "        NOT REQ", "PRODUCT", "YES", "NTPC", "TELANGANA", "RETRO FITTING", "SARAN", "ON-GOING"],
 ["    PPS-2026-002", "", "SERVICE", "NO", "HPCL", "ANDHRA PRADESH", "RELAY TESTING", "SIVA", "COMPLETED"],
 ["    PPS-2026-003", "       23JBHKL", "SOLUTION", "YES", "APTRANSCO", "ANDHRA PRADESH", "COMMISSIONING", "ROHIT", "COMPLETED"],
 ["    PPS-2026-004", "       23JBHKM", "SERVICE", "YES", "TNTRANSCO", "TAMILNADU", "RELAY TESTING", "SIVA", "ON-GOING"],
 ["    PPS-2026-005", "       23JBHKN", "SOLUTION", "YES", "HPCL", "GUJARAT", "RETRO FITTING", "SARAN", "ON-GOING"],
 ["    PPS-2026-006", "       23JBHNM", "SERVICE", "YES", "TNTRANSCO", "MAHARASHTRA", "RELAY TESTING", "ROHIT", "COMPLETED"],
 ["    PPS-2026-007", "", "SERVICE", "NO", "KPTCL", "KERALA ", "RETRO FITTING", "MANIKANTA", "COMPLETED"],
 ["    PPS-2026-008", "       23JBHNP", "SOLUTION", "YES", "MSETCL", "MAHARASHTRA", "COMMISSIONING", "PAVAN", "COMPLETED"]
].map(r => Object.fromEntries(FIELDS.map((f,i)=>[f,r[i]])));

const KEY = "pes.projects.v1";
const PKEY = "pes.people.v1";
const DEFAULT_PEOPLE = {
  engineers: ["SARAN","SIVA","ROHIT","MANIKANTA","PAVAN"],
  customers: ["NTPC","HPCL","APTRANSCO","TNTRANSCO","KPTCL","MSETCL"]
};
let rows = load();
let people = loadPeople();
function loadPeople(){ try{ const s=localStorage.getItem(PKEY); if(s) return JSON.parse(s);}catch(e){} return structuredClone(DEFAULT_PEOPLE); }
function savePeople(){ try{ localStorage.setItem(PKEY, JSON.stringify(people)); }catch(e){} push(); }
// make sure every engineer/customer used in the rows is in the lists
function syncPeople(){
  rows.forEach(r=>{
    const e=(r.engineer||"").trim(), c=(r.customer||"").trim();
    if(e && !people.engineers.includes(e)) people.engineers.push(e);
    if(c && !people.customers.includes(c)) people.customers.push(c);
  });
  savePeople();
}
syncPeople();
// MANAGE ENGINEERS / CUSTOMERS : add, rename (edit), delete
const FIELD_OF = { engineers:"engineer", customers:"customer" };
function openManager(kind){
  const label = kind==="engineers" ? "Engineers" : "Customers";
  const field = FIELD_OF[kind];
  document.getElementById("mgr")?.remove();
  const dlg = document.createElement("dialog"); dlg.id="mgr";
  dlg.innerHTML = `<h3>Manage ${label}</h3><div class="mgr-add"><input id="mgrNew" placeholder="New ${label.slice(0,-1).toLowerCase()} name"><button class="btn primary" id="mgrAdd">Add</button></div><ul id="mgrList"></ul><div class="mgr-foot"><button class="btn" id="mgrClose">Close</button></div>`;
  document.body.appendChild(dlg); dlg.showModal();
  const used = n => rows.filter(r=>(r[field]||"").trim()===n).length;
  const draw = () => {
    dlg.querySelector("#mgrList").innerHTML = people[kind].map((n,i)=>
      `<li><span>${esc(n)} <small>(${used(n)} projects)</small></span><span><button class="btn mini" data-ren="${i}">Edit</button><button class="btn mini danger" data-delp="${i}">Delete</button></span></li>`).join("") || "<li>No names yet</li>";
  };
  const refresh = () => { savePeople(); save(); draw(); renderGrid(); renderDashboard(); };
  const add = () => {
    const inp = dlg.querySelector("#mgrNew"); const name = inp.value.trim().toUpperCase();
    if(!name) return;
    if(people[kind].includes(name)){ alert(name+" already exists."); return; }
    people[kind].push(name); inp.value=""; refresh();
  };
  dlg.querySelector("#mgrAdd").onclick = add;
  dlg.querySelector("#mgrNew").addEventListener("keydown",e=>{ if(e.key==="Enter") add(); });
  dlg.querySelector("#mgrClose").onclick = () => dlg.close();
  dlg.addEventListener("close",()=>dlg.remove());
  dlg.addEventListener("click",e=>{
    const t=e.target;
    if(t.dataset.ren!==undefined){                         // EDIT / RENAME
      const old = people[kind][t.dataset.ren];
      const nn = (prompt("Edit name:", old)||"").trim().toUpperCase();
      if(!nn || nn===old) return;
      if(people[kind].includes(nn)){ alert(nn+" already exists."); return; }
      people[kind][t.dataset.ren] = nn;
      rows.forEach(r=>{ if((r[field]||"").trim()===old) r[field]=nn; });  // update projects too
      refresh();
    }
    if(t.dataset.delp!==undefined){                        // DELETE
      const old = people[kind][t.dataset.delp], n = used(old);
      if(!confirm(n ? `${old} is used in ${n} project(s). Delete anyway? Those projects will become unassigned.` : `Delete ${old}?`)) return;
      people[kind].splice(t.dataset.delp,1);
      rows.forEach(r=>{ if((r[field]||"").trim()===old) r[field]=""; });
      refresh();
    }
  });
  draw();
}
document.addEventListener("click",e=>{ const k=e.target.dataset?.add; if(k) openManager(k); });
function load(){ try{ const s=localStorage.getItem(KEY); if(s) return JSON.parse(s);}catch(e){} return structuredClone(SEED); }
function save(){ try{ localStorage.setItem(KEY, JSON.stringify(rows)); }catch(e){} push(); }
const $ = s => document.querySelector(s);
const esc = s => String(s??"").replace(/[&<>"]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const uniq = f => [...new Set(rows.map(r=>(r[f]||"").trim()).filter(Boolean))];
const countBy = (f,v) => rows.filter(r=>(r[f]||"").trim()===v).length;

/* ---------- Tabs ---------- */
document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{
  document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("active",t===b));
  document.querySelectorAll(".panel").forEach(p=>p.classList.toggle("active",p.id===b.dataset.tab));
  try{ localStorage.setItem("pes.tab", b.dataset.tab); }catch(e){}
  if(b.dataset.tab==="dashboard") renderDashboard();
});

/* ---------- PROJECTS grid ---------- */
function selectHTML(field, opts, val, i){
  const all = opts.includes(val)||!val ? opts : [val,...opts];
  return `<select data-i="${i}" data-f="${field}"><option value=""></option>${all.map(o=>`<option ${o===val?"selected":""}>${esc(o)}</option>`).join("")}</select>`;
}
// SERVICE REQUIRED: dropdown; choose OTHERS to type your own service name
const MAIN_SERVICES = LISTS.service.filter(x=>x!=="OTHERS");
function serviceCell(r,i){
  const v=(r.service||"").trim();
  const other = v && !MAIN_SERVICES.includes(v);          // "OTHERS" or a typed custom service
  const sel = `<select data-i="${i}" data-f="serviceSel"><option value=""></option>${MAIN_SERVICES.map(o=>`<option ${o===v?"selected":""}>${o}</option>`).join("")}<option value="OTHERS" ${other?"selected":""}>OTHERS</option></select>`;
  const box = other ? `<input class="other-in" data-i="${i}" data-f="serviceOther" placeholder="Type service…" value="${esc(v==="OTHERS"?"":v)}">` : "";
  return `<td class="svc">${sel}${box}</td>`;
}
function renderGrid(){
  const q = $("#search").value.toLowerCase(), fs=$("#fStatus").value, fe=$("#fEngineer").value;
  const tb = $("#grid tbody"); let shown=0;
  tb.innerHTML = rows.map((r,i)=>{
    if(q && !FIELDS.some(f=>(r[f]||"").toLowerCase().includes(q))) return "";
    if(fs && r.status!==fs) return ""; if(fe && r.engineer!==fe) return "";
    shown++;
    const t=(f)=>`<td><input data-i="${i}" data-f="${f}" value="${esc(r[f])}"></td>`;
    const s=(f,o)=>`<td>${selectHTML(f,o,r[f],i)}</td>`;
    return `<tr>${t("enquiryNo")}${t("requestCode")}${s("enquiry",LISTS.enquiry)}${s("confirmation",LISTS.confirmation)}${s("customer",people.customers)}${s("state",LISTS.state)}${serviceCell(r,i)}${s("engineer",people.engineers)}${s("status",LISTS.status)}<td class="del"><button class="x" data-del="${i}" title="Delete">✕</button></td></tr>`;
  }).join("");
  $("#count").textContent = `${shown} of ${rows.length} projects`;
  if(document.body.classList.contains("ro")) tb.querySelectorAll("input,select").forEach(x=>x.disabled=true);
  fillFilters();
}
function fillFilters(){
  const keep=(sel,vals)=>{const v=sel.value; sel.innerHTML=sel.options[0].outerHTML+vals.map(x=>`<option>${esc(x)}</option>`).join(""); sel.value=v;};
  keep($("#fStatus"),LISTS.status); keep($("#fEngineer"),[...people.engineers].sort());
}
$("#grid").addEventListener("change",e=>{
  const t=e.target; if(t.dataset.f===undefined) return;
  const i=t.dataset.i, f=t.dataset.f, val=t.value.trim();
  if(f==="serviceSel"){ rows[i].service = val; }                       // OTHERS -> text box appears
  else if(f==="serviceOther"){ rows[i].service = val || "OTHERS"; }   // typed custom service
  else rows[i][f]=val;
  save(); renderGrid();
  if(f==="serviceSel" && val==="OTHERS") document.querySelector(`.other-in[data-i="${i}"]`)?.focus();
});
$("#grid").addEventListener("click",e=>{
  const i=e.target.dataset.del; if(i===undefined) return;
  if(confirm("Delete this project?")){ rows.splice(i,1); save(); renderGrid(); }
});
["#search","#fStatus","#fEngineer"].forEach(s=>$(s).addEventListener("input",renderGrid));
$("#addRow").onclick=()=>{
  const n = rows.reduce((m,r)=>Math.max(m,parseInt((r.enquiryNo||"").split("-").pop())||0),0)+1;
  rows.push({enquiryNo:`PPS-2026-${String(n).padStart(3,"0")}`,requestCode:"",enquiry:"",confirmation:"",customer:"",state:"",service:"",engineer:"",status:"ON-GOING"});
  save(); renderGrid(); $("#grid").parentElement.scrollTop=1e9;
};

/* ---------- DASHBOARD (same formulas as the Excel sheet) ---------- */
const PALETTE=["#2563eb","#16a34a","#f59e0b","#dc2626","#8b5cf6","#0891b2","#db2777","#65a30d"];
const charts={};
function table(id, head, data){
  $(id).innerHTML = `<tr>${head.map(h=>`<th>${h}</th>`).join("")}</tr>`+data.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join("")}</tr>`).join("");
}
function chart(id,type,labels,datasets,opts={}){
  if(typeof Chart==="undefined"){ return; } // offline: tables still render
  charts[id]?.destroy();
  charts[id]=new Chart($(id),{type,data:{labels,datasets},options:{responsive:true,maintainAspectRatio:false,...opts,
    plugins:{legend:{display:type==="pie"||datasets.length>1},...(opts.plugins||{})}}});
}
function renderDashboard(){
  const total=rows.filter(r=>r.enquiryNo).length;
  const kp=[
    ["TOTAL PROJECTS",total,"#2563eb"],
    ["Confirmed (YES)",countBy("confirmation","YES"),"#16a34a"],
    ["Not Confirmed (NO)",countBy("confirmation","NO"),"#dc2626"],
    ["Engineer Not Assigned",rows.filter(r=>r.enquiryNo&&!(r.engineer||"").trim()).length,"#f59e0b"],
    ["Site On-going",countBy("status","ON-GOING"),"#0891b2"],
    ["Site Completed",countBy("status","COMPLETED"),"#16a34a"]];
  $("#kpis").innerHTML=kp.map(([l,v,c])=>`<div class="kpi" style="border-left-color:${c}"><b>${v}</b><span>${l}</span></div>`).join("");

  const two=l=>String(l).split(" ");
  const svc=LISTS.service.slice(0,3).map(s=>[s,countBy("service",s)]);
  const eng=people.engineers.map(e=>[e,countBy("engineer",e)]);
  const cus=people.customers.map(c=>[c,countBy("customer",c)]);
  const sta=LISTS.status.map(s=>[s,countBy("status",s)]);
  const ss=LISTS.service.slice(0,3).map(s=>{const done=rows.filter(r=>r.service===s&&r.status==="COMPLETED").length;return [s,done,countBy("service",s)-done];});
  table("#tService",["SERVICE","COUNT"],svc);
  table("#tEngineer",["Engineer","Projects"],eng);
  table("#tCustomer",["Customer","Projects"],cus);
  table("#tStatus",["SITE STATUS","COUNT"],sta);
  table("#tSvcStatus",["SERVICE","COMPLETED","ON&#8209;GOING"],ss);

  chart("#cService","bar",svc.map(x=>two(x[0])),[{label:"COUNT",data:svc.map(x=>x[1]),backgroundColor:PALETTE[0]}],{plugins:{legend:{display:false}},scales:{x:{ticks:{maxRotation:0,minRotation:0,autoSkip:false,font:{size:11}}},y:{beginAtZero:true,ticks:{precision:0}}}});
  chart("#cEngineer","bar",eng.map(x=>x[0]),[{label:"Projects",data:eng.map(x=>x[1]),backgroundColor:PALETTE[1]}],{indexAxis:"y",plugins:{legend:{display:false}},scales:{x:{beginAtZero:true,ticks:{precision:0}}}});
  chart("#cCustomer","pie",cus.map(x=>x[0]),[{data:cus.map(x=>x[1]),backgroundColor:PALETTE}]);
  chart("#cStatus","pie",sta.map(x=>x[0]),[{data:sta.map(x=>x[1]),backgroundColor:["#0891b2","#16a34a"]}]);
  chart("#cSvcStatus","bar",ss.map(x=>two(x[0])),[
    {label:"COMPLETED",data:ss.map(x=>x[1]),backgroundColor:"#16a34a"},
    {label:"ON-GOING",data:ss.map(x=>x[2]),backgroundColor:"#0891b2"}],{plugins:{legend:{display:true,position:"top"}},scales:{x:{ticks:{maxRotation:0,minRotation:0,autoSkip:false,font:{size:11}}},y:{beginAtZero:true,ticks:{precision:0,stepSize:1},grace:"10%"}}});
}

/* ---------- Import / Export ---------- */
function toAOA(){ return [HEADERS,...rows.map(r=>FIELDS.map(f=>r[f]||""))]; }
$("#exportXlsx").onclick=()=>{
  const wb=XLSX.utils.book_new();
  const ws=XLSX.utils.aoa_to_sheet(toAOA()); ws["!cols"]=HEADERS.map(()=>({wch:24}));
  XLSX.utils.book_append_sheet(wb,ws,"PROJECTS");
  XLSX.writeFile(wb,"PROJECT_EXECUTION_STATUS.xlsx");
};
$("#exportCsv").onclick=()=>{
  const csv=XLSX.utils.sheet_to_csv(XLSX.utils.aoa_to_sheet(toAOA()));
  const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"})); a.download="PROJECTS.csv"; a.click();
};
$("#importFile").onchange=async e=>{
  const f=e.target.files[0]; if(!f) return;
  const wb=XLSX.read(await f.arrayBuffer());
  const ws=wb.Sheets["PROJECTS"]||wb.Sheets[wb.SheetNames[0]];
  const aoa=XLSX.utils.sheet_to_json(ws,{header:1,defval:""}).slice(1).filter(r=>r.some(c=>String(c).trim()));
  rows=aoa.map(r=>Object.fromEntries(FIELDS.map((k,i)=>[k,String(r[i]??"").trim()])));
  save(); syncPeople(); renderGrid(); renderDashboard(); e.target.value="";
};


/* ================= SHARED LIVE DATA (GitHub only) =================
   The shared data is the file data.json inside your GitHub repository.
   - Everybody who opens the website link SEES the live data (auto-refresh every 10 s).
   - People who click "Enable editing" and paste the team token can ADD / EDIT / DELETE;
     every change is saved to data.json and appears for everyone. */
const GH = { owner:"Pavankumar-897", repo:"project-execution-status", branch:"main", file:"data.json" };
var keepLocal=false, cloudReady=false, pending=null, ghSha=null, ghEtag=null, dirty=false, writing=false, pushTimer=null;
const TKEY="pes.token";
const getToken=()=>{ try{ return localStorage.getItem(TKEY)||""; }catch(e){ return ""; } };
const API=`https://api.github.com/repos/${GH.owner}/${GH.repo}/contents/${GH.file}`;
const hdr=(x={})=>{ const h={Accept:"application/vnd.github+json",...x}; const t=getToken(); if(t) h.Authorization="Bearer "+t; return h; };
const b64d=s=>new TextDecoder().decode(Uint8Array.from(atob(s.replace(/\n/g,"")),c=>c.charCodeAt(0)));
const b64e=s=>btoa(unescape(encodeURIComponent(s)));
const norm=(r,p)=>JSON.stringify({rows:r.map(x=>FIELDS.map(f=>x[f]||"")),e:p.engineers,c:p.customers});
function setStatus(txt,ok){ const el=document.getElementById("cloud"); if(el){ el.textContent=txt; el.className="cloud "+(ok?"ok":"off"); } }
function liveStatus(){ setStatus(getToken()?"● Live (shared)":"● Live (view only)",true); }
function updateMode(){
  const ro=!getToken(); document.body.classList.toggle("ro",ro);
  const b=document.getElementById("tokenBtn"); if(b) b.textContent = ro ? "🔑 Enable editing" : "Editing ON – sign out";
  renderGrid();
}
function applyIncoming(){
  if(!pending) return;
  const a=document.activeElement;
  if(a && a.closest && a.closest("#grid, #mgr") && /INPUT|SELECT/.test(a.tagName)) return;   // don't disturb typing
  rows=pending.rows; people=pending.people; pending=null;
  try{ localStorage.setItem(KEY,JSON.stringify(rows)); localStorage.setItem(PKEY,JSON.stringify(people)); }catch(e){}
  renderGrid(); renderDashboard();
}
document.addEventListener("focusout",()=>setTimeout(applyIncoming,150));

async function fetchRemote(force){
  if(dirty||writing) return;
  try{
    const h=hdr(); if(ghEtag && !force) h["If-None-Match"]=ghEtag;
    const res=await fetch(API+"?ref="+GH.branch+(force?"&t="+Date.now():""),{headers:h,cache:"no-cache"});
    if(res.status===304){ cloudReady=true; liveStatus(); return; }
    if(res.status===404){ cloudReady=true; ghSha=null; liveStatus(); if(getToken()) push(); return; }  // first run: create data.json
    if(!res.ok) throw new Error(res.status);
    ghEtag=res.headers.get("ETag"); const j=await res.json(); ghSha=j.sha;
    if(keepLocal){ keepLocal=false; cloudReady=true; push(); return; }   // upload THIS device's data as the shared data
    const v=JSON.parse(b64d(j.content));
    const nr=(v.rows||[]).map(r=>Object.fromEntries(FIELDS.map(f=>[f,r[f]??""])));
    const np={engineers:v.people?.engineers||[],customers:v.people?.customers||[]};
    cloudReady=true; liveStatus();
    if(norm(nr,np)!==norm(rows,people)){ pending={rows:nr,people:np}; applyIncoming(); }
  }catch(e){ setStatus("● Offline – showing saved copy",false); }
}
function push(){
  if(!cloudReady || !getToken()) return;
  dirty=true; clearTimeout(pushTimer); pushTimer=setTimeout(()=>doWrite(0),1200); setStatus("● Saving…",false);
}
async function doWrite(retry){
  pushTimer=null; writing=true;
  try{
    const body={message:"Update project data",content:b64e(JSON.stringify({rows,people},null,1)),branch:GH.branch};
    if(ghSha) body.sha=ghSha;
    const res=await fetch(API,{method:"PUT",headers:hdr({"Content-Type":"application/json"}),body:JSON.stringify(body)});
    if((res.status===409||res.status===422) && retry<3){          // someone saved just before us: take the new version id and retry
      const g=await fetch(API+"?ref="+GH.branch+"&t="+Date.now(),{headers:hdr(),cache:"no-store"});
      ghSha = g.ok ? (await g.json()).sha : null;
      writing=false; return doWrite(retry+1);
    }
    if(!res.ok) throw new Error(res.status);
    const j=await res.json(); ghSha=j.content.sha; ghEtag=null; dirty=!!pushTimer; liveStatus();
  }catch(e){ dirty=false; setStatus("● Save failed – check token",false); fetchRemote(true); }
  finally{ writing=false; }
}
document.getElementById("tokenBtn").onclick=()=>{
  if(getToken()){ if(confirm("Turn editing OFF on this device?")){ try{localStorage.removeItem(TKEY);}catch(e){} updateMode(); liveStatus(); } return; }
  const t=(prompt("Paste the team GitHub token to enable editing:")||"").trim();
  if(t){
    try{ localStorage.setItem(TKEY,t); }catch(e){}
    updateMode(); fetchRemote(true);
  }
};
function initCloud(){
  updateMode(); fetchRemote(true);
  setInterval(()=>fetchRemote(false),10000);
  document.addEventListener("visibilitychange",()=>{ if(!document.hidden) fetchRemote(false); });
}
initCloud();
renderGrid(); renderDashboard();

// open the same tab you were on before (refresh keeps the page)
try{ const t=localStorage.getItem("pes.tab"); if(t) document.querySelector(`.tab[data-tab="${t}"]`)?.click(); }catch(e){}
