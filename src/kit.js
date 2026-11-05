/* ---------- Launch kit (full version) ---------- */
const PF_FIELDS = [
  ["name","Product name",60,"input"],["url","Website URL",0,"input"],["tagline","Tagline",60,"input"],
  ["short","Short description",160,"textarea"],["long","Long description",500,"textarea"],
  ["maker","Your name",0,"input"],["email","Contact email",0,"input"],["twitter","X / Twitter URL",0,"input"],
  ["github","GitHub URL",0,"input"],["linkedin","LinkedIn URL",0,"input"],["category","Category / tags",0,"input"],["pricing","Pricing",0,"input"]
];
const profile = store.get("wcip_profile", {});

function fillForm(P){
  var RULES=[
    ["email",/e ?mail/],["github",/github|repository|source code/],["twitter",/twitter|x\.com|x handle/],["linkedin",/linkedin/],
    ["maker",/your name|full name|founder|maker|first name|author|contact name|submitter/],
    ["tagline",/tagline|slogan|one ?liner|headline|subtitle|catchphrase|pitch/],
    ["pricing",/pricing|price|cost/],["category",/categor|\btags?\b|topic|industry/],
    ["short",/short desc|summary|excerpt|brief|meta desc|one sentence/],
    ["long",/desc|about|details|tell us|what does|overview/],
    ["url",/url|website|web site|homepage|home page|\blink\b|domain|\bsite\b/],
    ["name",/(product|app|tool|startup|project|company|business|saas) ?name|\bname\b|title/]
  ];
  var els=[].slice.call(document.querySelectorAll('input:not([type]),input[type=text],input[type=url],input[type=email],input[type=search],textarea'))
    .filter(function(e){return !e.disabled&&!e.readOnly&&e.offsetParent!==null&&(!e.value||/^\s*https?:\/\/\s*$/.test(e.value));});
  function labelOf(e){var t="";var key=e.id||e.name;if(key){var l=document.querySelector('label[for="'+CSS.escape(key)+'"]');if(l)t+=" "+l.textContent;}var pl=e.closest("label");if(pl)t+=" "+pl.textContent;var lb=e.getAttribute("aria-labelledby");if(lb)lb.split(/\s+/).forEach(function(id){var x=document.getElementById(id);if(x)t+=" "+x.textContent;});return t;}
  function setVal(e,v){var proto=e.tagName==="TEXTAREA"?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,"value").set.call(e,v);e.dispatchEvent(new Event("input",{bubbles:true}));e.dispatchEvent(new Event("change",{bubbles:true}));e.style.outline="3px solid #1f5eff";}
  var n=0;
  els.forEach(function(e){
    var desc=[e.name,e.id,e.placeholder,e.getAttribute("aria-label"),e.getAttribute("autocomplete"),labelOf(e)].filter(Boolean).join(" ").toLowerCase().replace(/[_\-]+/g," ");
    if(/password|search|captcha|coupon|promo code/.test(desc))return;
    var key=null;
    if(e.type==="email")key="email";else{for(var i=0;i<RULES.length;i++){if(RULES[i][1].test(desc)){key=RULES[i][0];break;}}}
    if(!key&&e.type==="url")key="url";
    var ml=e.maxLength;
    if(key==="long"&&(e.tagName!=="TEXTAREA"||(ml>0&&ml<=200)))key=(ml>0&&ml<=70)?"tagline":"short";
    if(key==="url"&&e.tagName==="TEXTAREA")key="long";
    var v=key&&P[key];
    if(key==="short"&&!v)v=P.tagline;if(key==="long"&&!v)v=P.short;
    if(!v)return;
    if(ml>0&&v.length>ml)v=v.slice(0,ml);
    setVal(e,v);n++;
  });
  var t=document.createElement("div");t.textContent="Filled "+n+" field"+(n===1?"":"s")+". Review everything, then submit yourself.";
  t.style.cssText="position:fixed;z-index:2147483647;left:50%;top:16px;transform:translateX(-50%);background:#1b1b1a;color:#fff;padding:10px 14px;border-radius:8px;font:14px system-ui,sans-serif";
  document.body.appendChild(t);setTimeout(function(){t.remove();},4000);
  return n;
}

function renderProfile(){
  $("#pf").innerHTML = PF_FIELDS.map(([k,l,max,tag]) => {
    const v = esc(profile[k] || "");
    const ctl = tag === "textarea" ? `<textarea id="pf_${k}" data-k="${k}">${v}</textarea>` : `<input type="text" id="pf_${k}" data-k="${k}" value="${v}">`;
    return `<div class="field"><label for="pf_${k}">${l}${max ? `<span class="cnt" id="cnt_${k}"></span>` : ""}</label><div class="row">${ctl}<button class="copy" data-copy="${k}">Copy</button></div></div>`;
  }).join("");
  PF_FIELDS.forEach(([k,,max]) => max && count(k, max));
}
function count(k, max){
  const el = $("#cnt_"+k); if (!el) return;
  const n = (profile[k] || "").length;
  el.textContent = `${n}/${max}`; el.classList.toggle("over", n > max);
}
function bookmarklet(){
  const clean = {}; Object.keys(profile).forEach(k => { if (profile[k]) clean[k] = profile[k]; });
  return "javascript:" + encodeURIComponent("(" + fillForm.toString() + ")(" + JSON.stringify(clean) + ");void 0");
}
function updateBm(){ $("#bmlink").href = bookmarklet(); }

function renderTracker(){
  const t = store.get("wcip_tracker", {});
  const opts = ["to do","submitted","live","rejected","skipped"];
  $("#trk tbody").innerHTML = [...CHANNELS].sort((a,b)=>a.name.localeCompare(b.name)).map(c => {
    const r = t[c.id] || {};
    return `<tr data-id="${c.id}"><td><a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.name)}</a></td>
      <td><select data-f="status">${opts.map(o => `<option${(r.status||"to do")===o?" selected":""}>${o}</option>`).join("")}</select></td>
      <td><input type="text" data-f="date" placeholder="YYYY-MM-DD" value="${esc(r.date||"")}" style="min-width:110px"></td>
      <td><input type="text" data-f="notes" value="${esc(r.notes||"")}" style="min-width:160px"></td></tr>`;
  }).join("");
}
function csv(rows){ return rows.map(r => r.map(x => { const s = String(x ?? ""); return /[",\n]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s; }).join(",")).join("\n"); }
function download(name, text, type){
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], {type})); a.download = name;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
const DATA_COLS = ["id","name","url","category","language","audience","cost","cost_note","new_account","min_account_days","new_account_note","ai_text","ai_note","self_promo","self_promo_note","time_to_visible","time_note","posting_days","quote","quote_exact","source_url","source_type","verified"];

document.addEventListener("input", e => {
  const k = e.target.dataset && e.target.dataset.k;
  if (k && e.target.id === "pf_" + k){ profile[k] = e.target.value; store.set("wcip_profile", profile); const f = PF_FIELDS.find(x => x[0] === k); if (f && f[2]) count(k, f[2]); updateBm(); }
  const tr = e.target.closest && e.target.closest("#trk tr[data-id]");
  if (tr){ const t = store.get("wcip_tracker", {}); const id = tr.dataset.id; t[id] = t[id] || {}; t[id][e.target.dataset.f] = e.target.value; if (e.target.dataset.f === "status" && !t[id].date && e.target.value !== "to do"){ t[id].date = new Date().toISOString().slice(0,10); tr.querySelector('[data-f="date"]').value = t[id].date; } store.set("wcip_tracker", t); }
});
document.addEventListener("change", e => { if (e.target.closest && e.target.closest("#trk tr[data-id]")) e.target.dispatchEvent(new Event("input", {bubbles:true})); });
document.addEventListener("click", e => {
  const c = e.target.closest("[data-copy]");
  if (c){ const v = profile[c.dataset.copy] || ""; if (!v) return toast("That field is empty"); (navigator.clipboard ? navigator.clipboard.writeText(v) : Promise.reject()).then(() => toast("Copied"), () => { const f = $("#pf_" + c.dataset.copy); f.select(); document.execCommand("copy"); toast("Copied"); }); }
  const tb = e.target.closest("#kittabs button");
  if (tb){ document.querySelectorAll("#kittabs button").forEach(b => b.setAttribute("aria-pressed", String(b === tb))); document.querySelectorAll("[data-pane]").forEach(p => p.hidden = p.dataset.pane !== tb.dataset.t); }
  if (e.target.id === "bmlink"){ e.preventDefault(); toast("Drag this button to your bookmarks bar"); }
  if (e.target.id === "trkcsv"){ const t = store.get("wcip_tracker", {}); download("launch-tracker.csv", csv([["channel","url","status","date","notes"], ...CHANNELS.map(c => [c.name, c.url, (t[c.id]||{}).status||"to do", (t[c.id]||{}).date||"", (t[c.id]||{}).notes||""])]), "text/csv"); }
  if (e.target.id === "dcsv") download("launch-channels-2026-11-05.csv", csv([DATA_COLS, ...CHANNELS.map(c => DATA_COLS.map(k => c[k]))]), "text/csv");
  if (e.target.id === "djson") download("launch-channels-2026-11-05.json", JSON.stringify(CHANNELS, null, 2), "application/json");
});
renderProfile(); updateBm(); renderTracker();
