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
function savePeople(){ try{ localStorage.setItem(PKEY, JSON.stringify(people)); }catch(e){} }
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
function save(){ try{ localStorage.setItem(KEY, JSON.stringify(rows)); }catch(e){} }
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
function renderGrid(){
  const q = $("#search").value.toLowerCase(), fs=$("#fStatus").value, fe=$("#fEngineer").value;
  const tb = $("#grid tbody"); let shown=0;
  tb.innerHTML = rows.map((r,i)=>{
    if(q && !FIELDS.some(f=>(r[f]||"").toLowerCase().includes(q))) return "";
    if(fs && r.status!==fs) return ""; if(fe && r.engineer!==fe) return "";
    shown++;
    const t=(f)=>`<td><input data-i="${i}" data-f="${f}" value="${esc(r[f])}"></td>`;
    const s=(f,o)=>`<td>${selectHTML(f,o,r[f],i)}</td>`;
    return `<tr>${t("enquiryNo")}${t("requestCode")}${s("enquiry",LISTS.enquiry)}${s("confirmation",LISTS.confirmation)}${s("customer",people.customers)}${s("state",LISTS.state)}${s("service",LISTS.service)}${s("engineer",people.engineers)}${s("status",LISTS.status)}<td class="del"><button class="x" data-del="${i}" title="Delete">✕</button></td></tr>`;
  }).join("");
  $("#count").textContent = `${shown} of ${rows.length} projects`;
  fillFilters();
}
function fillFilters(){
  const keep=(sel,vals)=>{const v=sel.value; sel.innerHTML=sel.options[0].outerHTML+vals.map(x=>`<option>${esc(x)}</option>`).join(""); sel.value=v;};
  keep($("#fStatus"),LISTS.status); keep($("#fEngineer"),[...people.engineers].sort());
}
$("#grid").addEventListener("change",e=>{
  const t=e.target; if(t.dataset.f===undefined) return;
  rows[t.dataset.i][t.dataset.f]=t.value.trim(); save(); renderGrid();
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

renderGrid(); renderDashboard();

// open the same tab you were on before (refresh keeps the page)
try{ const t=localStorage.getItem("pes.tab"); if(t) document.querySelector(`.tab[data-tab="${t}"]`)?.click(); }catch(e){}
