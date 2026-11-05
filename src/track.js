const NS = "wcip-hf24h";
const REF = (() => {
  let r = (new URLSearchParams(location.search).get("ref") || "").toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 12);
  try { if (r) sessionStorage.setItem("wcip_ref", r); else r = sessionStorage.getItem("wcip_ref") || "direct"; } catch (e) { r = r || "direct"; }
  return r;
})();
const SENT = new Set();
function track(ev){
  if (location.protocol === "file:" || location.hostname === "localhost" || location.hostname === "127.0.0.1") return;
  const key = ev + "_" + REF;
  if (SENT.has(key)) return;
  SENT.add(key);
  try { fetch(`https://abacus.jasoncameron.dev/hit/${NS}/${key}`, {mode:"no-cors", keepalive:true}).catch(() => {}); } catch (e) {}
}
track("visit");
document.addEventListener("click", e => { if (e.target.closest("#buy")) track("buy"); });
