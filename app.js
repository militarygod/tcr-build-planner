const $ = id => document.getElementById(id);
const LABEL = {electronics:"Electronics", rares:"Rare Materials", fuel:"Fuel", supplies:"Supplies", components:"Components", manpower:"Manpower", money:"Money"};
const nf = (n, d = 0) => Number(n).toLocaleString("en-US", {minimumFractionDigits: d, maximumFractionDigits: d});
const pct = n => (n >= 0 ? "+" : "") + Math.round(n * 100) + "%";
const r2 = n => Math.round(n * 100) / 100;

function opts(el, items) { el.innerHTML = items.map(i => `<option value="${i[0]}">${i[1]}</option>`).join(""); }

/* ---------- formulas ---------- */
function popMod(p) {
  const t = DATA.population;
  p = Math.min(10, Math.max(1, p));
  if (p === 10) return t[9];
  const i = Math.floor(p);
  return t[i - 1] + (t[i] - t[i - 1]) * (p - i);
}
function moraleMult(m) { return DATA.morale.offset + DATA.morale.slope * Math.min(100, Math.max(0, m)) / 100; }
function bonus(name, lvl) {
  if (!lvl) return 0;
  const b = DATA.buildings.find(x => x.name === name && x.level === "LVL" + lvl);
  return b && typeof b.prod === "number" ? b.prod - 1 : 0;
}

function calcProduction() {
  const base = parseFloat($("base").value) || 0;
  const rnd = $("rnd").checked;
  const bSum = bonus("Arms Industry", +$("ai").value) + bonus("Air Base", +$("ab").value) + bonus("Naval Base", +$("nb").value);
  let pop = 1 + popMod(parseFloat($("pop").value) || 1);
  let mor = moraleMult(parseFloat($("morale").value) || 0);
  if (rnd) { pop = r2(pop); mor = r2(mor); }
  const st = 1 + DATA.cityState[$("state").value];
  const sp = parseFloat($("speed").value);
  const hid = parseFloat($("hid").value) || 1;
  const total = base * (1 + bSum) * pop * mor * st * sp * hid;
  $("out").textContent = nf(total, 3);
  const rows = [["Base value", nf(base)], ["Buildings", "x" + nf(1 + bSum, 2) + " (" + pct(bSum) + ")"],
    ["Population", "x" + nf(pop, rnd ? 2 : 3)], ["Morale", "x" + nf(mor, rnd ? 2 : 3)],
    ["City state", "x" + nf(st, 2)], ["Game speed", "x" + nf(sp, 2)], ["Extra map multiplier", "x" + nf(hid, 2)]];
  $("steps").innerHTML = rows.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join("");
}

/* ---------- build plan ---------- */
let plan = [];
function levelsFor(name) { return DATA.buildings.filter(b => b.name === name); }
function refreshLevels() { opts($("blvl"), levelsFor($("bname").value).map(b => [b.code, b.level === "-" ? "Single level" : b.level.replace("LVL", "Level ")])); }

function renderPlan() {
  $("list").innerHTML = plan.length ? plan.map((p, i) =>
    `<div class="item"><span>${p.qty} x ${p.b.name}${p.b.level === "-" ? "" : " " + p.b.level.replace("LVL", "Lv")}</span><button class="x" data-i="${i}" type="button" aria-label="Remove">Remove</button></div>`).join("")
    : '<p class="mute">Nothing added yet. Pick a building and add it.</p>';
  const tot = DATA.resources.map((_, k) => plan.reduce((s, p) => s + p.b.cost[k] * p.qty, 0));
  const hrs = plan.reduce((s, p) => s + p.b.hours * p.qty, 0);
  $("totals").innerHTML = "<tr><th>Resource</th><th>Total cost</th></tr>" + DATA.resources.map((r, k) => `<tr><td>${LABEL[r]}</td><td>${nf(tot[k])}</td></tr>`).join("");
  $("time").textContent = plan.length ? `Build time if made one after another: ${nf(hrs, 1)} hours (${nf(hrs / 24, 2)} days).` : "";
}

/* ---------- setup ---------- */
const lv = [[0, "None"], [1, "Level 1"], [2, "Level 2"], [3, "Level 3"], [4, "Level 4"], [5, "Level 5"]];
opts($("res"), DATA.resources.map(r => [r, LABEL[r]]));
opts($("state"), Object.keys(DATA.cityState).map(s => [s, s]));
["ai", "ab", "nb"].forEach(id => opts($(id), lv));
const names = [...new Set(DATA.buildings.map(b => b.name))];
opts($("bname"), names.map(n => [n, n]));
refreshLevels();

function setBase() {
  const k = $("res").value, v = DATA.baseProduction[k];
  $("base").value = v === undefined ? "" : v;
  $("base").placeholder = v === undefined ? "Base value not known yet" : "";
  calcProduction();
}
$("res").value = "supplies"; setBase();
$("res").addEventListener("change", setBase);
["base", "morale", "pop", "state", "speed", "ai", "ab", "nb", "hid", "rnd"].forEach(id => $(id).addEventListener("input", calcProduction));
$("bname").addEventListener("change", refreshLevels);
$("add").addEventListener("click", () => {
  const b = DATA.buildings.find(x => x.code === $("blvl").value);
  const qty = Math.max(1, parseInt($("bqty").value) || 1);
  const hit = plan.find(p => p.b.code === b.code);
  if (hit) hit.qty += qty; else plan.push({b, qty});
  renderPlan();
});
$("list").addEventListener("click", e => { const i = e.target.dataset.i; if (i !== undefined) { plan.splice(i, 1); renderPlan(); } });
$("ex").addEventListener("click", () => {
  $("res").value = "supplies"; setBase();
  $("morale").value = 82; $("pop").value = 4.3; $("state").value = "Homeland"; $("speed").value = "1";
  $("ai").value = 3; $("ab").value = 0; $("nb").value = 3; $("hid").value = 1; $("rnd").checked = true;
  calcProduction();
});
renderPlan();
