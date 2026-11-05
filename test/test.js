// End-to-end tests: node test/test.js
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");
let fails = 0;
const ok = (cond, msg) => { console.log((cond ? "  PASS " : "  FAIL ") + msg); if (!cond) fails++; };
const read = p => fs.readFileSync(path.join(__dirname, "..", p), "utf8");

function load(file, url = "https://hferrahoglu.github.io/where-can-i-post/?ref=test") {
  const dom = new JSDOM(read(file), { runScripts: "dangerously", url, pretendToBeVisual: true,
    beforeParse(w){ w.fetch = () => Promise.resolve({}); } });
  return dom;
}
function setState(w, st){
  for (const [k, v] of Object.entries(st)) w.document.querySelector(`#finder .seg[data-k="${k}"] button[data-v="${v}"]`).click();
}
function statusOf(w, name){
  const card = [...w.document.querySelectorAll("#results details.card")].find(d => d.querySelector(".nm").textContent === name);
  return card ? (card.classList.contains("ok") ? "ok" : card.classList.contains("warn") ? "warn" : "bad") : null;
}

console.log("1) Free page: finder logic");
{
  const dom = load("dist/free/index.html"); const w = dom.window; const d = w.document;
  setState(w, { age: "0", ai: "yes", need: "24h", budget: "zero" });
  ok(d.querySelectorAll("#results details.card").length === 12, "renders 12 free channels");
  ok(statusOf(w, "Hacker News (Show HN)") === "bad", "HN closed: new account + AI text");
  ok(statusOf(w, "Product Hunt") === "bad", "Product Hunt closed: 7-day wait");
  ok(statusOf(w, "r/webdev") === "bad", "r/webdev closed: AI + commercial");
  ok(statusOf(w, "Uneed") === "bad", "Uneed closed for 24h need (50+ days)");
  ok(statusOf(w, "r/SideProject") === "warn", "r/SideProject open with new-account filter caveat");
  ok(statusOf(w, "Mastodon (mastodon.social)") === "warn", "Mastodon caveat: AI disclosure");
  ok(statusOf(w, "r/SaaS") === "bad", "r/SaaS closed: 60-day age + AI");
  ok(statusOf(w, "DEV Community (dev.to)") === "bad", "dev.to closed: AI-assisted posts may not self-promote");
  ok(statusOf(w, "r/indiehackers") === "bad" && !![...d.querySelectorAll("#results details.card")].find(x => x.querySelector(".nm").textContent === "r/indiehackers").querySelector(".chip.fh"), "r/indiehackers closed for brand-new account, first-hand badge");
  ok(statusOf(w, "r/webdev") === "bad" && /90 days old/.test([...d.querySelectorAll("#results details.card")].find(x => x.querySelector(".nm").textContent === "r/webdev").textContent), "r/webdev shows the ~90-day AutoModerator gate");
  setState(w, { age: "365", ai: "no", need: "any", budget: "paid" });
  ok(statusOf(w, "Hacker News (Show HN)") !== "bad", "HN not closed for old account, human text");
  ok(statusOf(w, "Uneed") === "ok", "Uneed open when no rush");
  ok(statusOf(w, "r/SaaS") !== "bad", "r/SaaS not closed for 90+ day account");
  ok(statusOf(w, "DEV Community (dev.to)") !== "bad", "dev.to not closed for human-written text");
  ok(statusOf(w, "r/indiehackers") !== "bad", "r/indiehackers not closed for 90+ day account");
  ok(/38 more channels/.test(d.querySelector("#lockbox").textContent), "lock box shows 38 more channels");
  ok(!!d.querySelector("#buy") && !d.querySelector("#kittabs"), "free page has buy button, no kit");
  ok(/\$7/.test(d.querySelector("#kit").parentElement.textContent), "price $7 shown");
  ok(/Refunds/.test(d.body.textContent) && /hferrahoglu@gmail.com/.test(d.body.textContent), "refund policy + contact present");
  ok(/AI agent \(Claude/.test(d.body.textContent), "AI-built disclosure present");
  const quotes = [...d.querySelectorAll(".rule")].map(r => r.textContent);
  ok(quotes.every(q => /Source: /.test(q) && /checked 2026-11-05/.test(q)), "every card shows source + date");
  ok(quotes.some(q => /^Rule summary:/.test(q.trim())), "non-verbatim rows labelled 'Rule summary'");
  const sp = [...d.querySelectorAll("#results details.card")].find(x => x.querySelector(".nm").textContent === "r/SideProject");
  ok(!!sp.querySelector(".chip.fh") && /removed right away by Reddit/.test(sp.textContent), "first-hand badge + note on r/SideProject");
  ok(!!d.querySelector('meta[property="og:image"]'), "og:image meta present");
}

console.log("2) Full kit: renders all channels, profile, bookmarklet, tracker, export");
{
  const dom = load("dist/full/where-can-i-post-full.html", "https://kit.test/where-can-i-post-full.html"); const w = dom.window; const d = w.document;
  ok(d.querySelectorAll("#results details.card").length === 50, "renders 50 channels");
  ok(!d.querySelector("#buy") && !!d.querySelector("#kittabs"), "no buy button, kit present");
  ok(!/abacus/.test(read("dist/full/where-can-i-post-full.html")), "full file contains no tracking calls");
  const tag = d.querySelector("#pf_tagline");
  tag.value = "A".repeat(65); tag.dispatchEvent(new w.Event("input", { bubbles: true }));
  ok(d.querySelector("#cnt_tagline").textContent === "65/60" && d.querySelector("#cnt_tagline").classList.contains("over"), "tagline counter flags over-limit");
  const nm = d.querySelector("#pf_name"); nm.value = "Acme"; nm.dispatchEvent(new w.Event("input", { bubbles: true }));
  ok(JSON.parse(w.localStorage.getItem("wcip_profile")).name === "Acme", "profile persisted to localStorage");
  ok(decodeURIComponent(d.querySelector("#bmlink").getAttribute("href")).includes('"name":"Acme"'), "bookmarklet embeds updated profile");
  const row = d.querySelector('#trk tr[data-id="hn"] select'); row.value = "submitted"; row.dispatchEvent(new w.Event("input", { bubbles: true }));
  const t = JSON.parse(w.localStorage.getItem("wcip_tracker"));
  ok(t.hn.status === "submitted" && /^\d{4}-\d{2}-\d{2}$/.test(t.hn.date), "tracker saves status and auto-dates");
}

console.log("3) Autofill on a real directory form (Launching Next, fetched 2026-11-05)");
if (!fs.existsSync(path.join(__dirname, "fixtures/launchingnext.com_submit_.html"))) { console.log("  SKIP fixture missing: curl -s https://www.launchingnext.com/submit/ -o test/fixtures/launchingnext.com_submit_.html"); console.log(fails ? fails + " FAILED" : "ALL PASSED"); process.exit(fails ? 1 : 0); }
{
  const kit = read("src/kit.js");
  const fnSrc = kit.slice(kit.indexOf("function fillForm(P){"), kit.indexOf("\nfunction renderProfile"));
  const P = { name: "Where Can I Post?", url: "https://hferrahoglu.github.io/where-can-i-post/", tagline: "Launch-channel rules for new accounts", short: "See which launch channels accept your post.", long: "Long description here.", maker: "Hamza", email: "test@example.test", category: "marketing, launch" };
  function runOn(html){
    const dom = new JSDOM(html, { runScripts: "outside-only", pretendToBeVisual: true });
    const w = dom.window;
    Object.defineProperty(w.HTMLElement.prototype, "offsetParent", { get(){ return this.parentNode; } });
    if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s).replace(/["\\]/g, "\\$&");
    const events = [];
    w.document.addEventListener("input", e => events.push(e.target.name || e.target.id), true);
    const n = w.eval("(" + fnSrc.replace("function fillForm(P){", "function(P){") + ")(" + JSON.stringify(P) + ")");
    return { w, d: w.document, n, events };
  }
  const real = runOn(read("test/fixtures/launchingnext.com_submit_.html"));
  const v = name => real.d.querySelector(`input[name="${name}"],textarea[name="${name}"]`).value;
  ok(v("startupname") === P.name, "startupname <- product name");
  ok(v("startupurl") === P.url, "startupurl (prefilled https://) <- URL");
  ok(v("description") === P.tagline, "headline field <- tagline");
  ok(v("fulldescription") === P.long, "full description <- long description");
  ok(v("tags") === P.category, "tags <- category");
  ok(v("user") === P.maker, "Your Name <- maker");
  ok(v("email") === P.email, "email <- email");
  ok(v("math") === "", "captcha-like math question left empty");
  ok(real.events.includes("startupname"), "input events dispatched (React-safe)");
  ok(!real.d.querySelector('input[type=submit]').dataset.clicked, "never submits");

  const synth = runOn(`<form>
    <input aria-label="Product name"><input placeholder="https://yourproduct.com" type="url">
    <input placeholder="Tagline (max 60 chars)" maxlength="60"><textarea placeholder="Describe your product"></textarea>
    <input name="twitter_handle"><input type="password" name="pw"><input name="existing" value="keep me" aria-label="Name">
    <input type="checkbox" name="agree"></form>`);
  const q = s => synth.d.querySelector(s).value;
  ok(q('[aria-label="Product name"]') === P.name, "aria-label match");
  ok(q('input[type=url]') === P.url, "type=url match");
  ok(q('[placeholder^="Tagline"]') === P.tagline, "placeholder tagline");
  ok(q('textarea') === P.long, "textarea description <- long");
  ok(q('[name=pw]') === "", "password untouched");
  ok(q('[name=existing]') === "keep me", "existing value untouched");
}

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
