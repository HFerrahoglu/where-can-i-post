// Builds the free page (dist/free/index.html) and the paid single-file kit (dist/full/where-can-i-post-full.html).
// Usage: node build.js [BUY_URL]
const fs = require("fs");
const path = require("path");
const R = p => fs.readFileSync(path.join(__dirname, p), "utf8");

const BUY = process.argv[2] || process.env.BUY_URL || "#kit";
const base = [...JSON.parse(R("data/channels.free.json")), ...(fs.existsSync(path.join(__dirname, "data/channels.full.json")) ? JSON.parse(R("data/channels.full.json")) : [])];
let extra = [];
if (fs.existsSync(path.join(__dirname, "data/channels.extra.json"))) extra = JSON.parse(R("data/channels.extra.json"));

// Rows whose "quote" is a summary/translation, not a verbatim quote.
const NOT_VERBATIM = new Set(["r-sideproject","r-alphaandbetausers","r-coolgithubprojects","r-imadethis","r-smallbusiness","r-selfhosted","betalist","saashub","microlaunch","peerlist","tinystartups","eksisozluk","donanimhaber"]);
const OVERRIDES = { donanimhaber: { quote: "General forum rules contain no explicit advertising or AI clause." } };

const ids = new Set();
const all = [...base, ...extra.map(e => Object.assign({ tier: "full" }, e))].filter(c => {
  if (!c.id || ids.has(c.id)) return false; ids.add(c.id); return true;
}).map(c => Object.assign({}, c, OVERRIDES[c.id] || {}, { quote_exact: c.quote_exact === false ? false : !NOT_VERBATIM.has(c.id) }));

// Validate
const REQ = ["id","name","url","category","cost","new_account","ai_text","self_promo","time_to_visible","quote","source_url","source_type","verified"];
for (const c of all) for (const k of REQ) if (c[k] === undefined || c[k] === "") throw new Error(`Missing ${k} in ${c.id}`);

const free = all.filter(c => c.tier === "free");
const tpl = R("src/app.html");
const strip = list => JSON.stringify(list.map(({ tier, ...rest }) => rest));

function page({ full }) {
  let s = tpl;
  s = s.replace("/*FULL*/false", full ? "true" : "false");
  s = s.replace("/*DATA*/[]", strip(full ? all : free));
  s = s.replace("/*LOCKED*/0", String(full ? 0 : all.length - free.length));
  s = s.replace('"/*BUY*/"', JSON.stringify(BUY));
  if (full) {
    s = s.replace("<!--KIT-->", R("src/kit.html"));
    s = s.replace("<!--SALES-->", "");
    s = s.replace("<!--KITJS-->", "<script>\n" + R("src/kit.js") + "\n</script>");
    s = s.replace("/*TRACK*/", "function track(){}");
    s = s.replace("<!--PRIVACY-->", "<p><strong>Privacy.</strong> This file makes no network requests of its own. Your profile and tracker are saved only in this browser's local storage.</p>");
    s = s.replace("<title>Where Can I Post?</title>", "<title>Where Can I Post? Full Kit</title>");
  } else {
    s = s.replace("<!--KIT-->", "");
    s = s.replace("<!--SALES-->", R("src/sales.html").replace("__TOTAL__", all.length).replace("__FREE__", free.length).replace("__BUY__", BUY));
    s = s.replace("<!--KITJS-->", "");
    s = s.replace("/*TRACK*/", R("src/track.js"));
    s = s.replace("<!--PRIVACY-->", "<p><strong>Privacy.</strong> No cookies, no sign-up, no personal data. Anonymous counts of page loads, filter clicks and buy-button clicks go to a public counter (abacus.jasoncameron.dev), tagged only with the <code>?ref=</code> of the link you came from.</p>");
  }
  if (/\/\*(FULL|DATA|LOCKED|BUY|TRACK)\*\/|<!--(KIT|SALES|KITJS|PRIVACY)-->/.test(s)) throw new Error("Unreplaced placeholder");
  return s;
}

fs.mkdirSync(path.join(__dirname, "dist/free"), { recursive: true });
fs.mkdirSync(path.join(__dirname, "dist/full"), { recursive: true });
fs.writeFileSync(path.join(__dirname, "dist/free/index.html"), page({ full: false }));
fs.writeFileSync(path.join(__dirname, "dist/full/where-can-i-post-full.html"), page({ full: true }));
fs.writeFileSync(path.join(__dirname, "dist/full/channels.json"), JSON.stringify(all, null, 2));
console.log(`free: ${free.length} channels, full: ${all.length} channels, buy: ${BUY}`);
