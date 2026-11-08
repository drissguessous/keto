/* Keto Famille — application hors ligne, données stockées sur le téléphone (localStorage). */
(function () {
  "use strict";

  // ---------- Utilitaires ----------
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pad = (n) => String(n).padStart(2, "0");
  const dkey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseKey = (k) => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d); };
  const daysBetween = (a, b) => Math.round((parseKey(b) - parseKey(a)) / 86400000);
  const fmt = (n, dec = 0) => (n == null || isNaN(n) ? "–" : Number(n).toLocaleString("fr-FR", { maximumFractionDigits: dec, minimumFractionDigits: dec }));
  const fmtDate = (k, opt = { weekday: "short", day: "numeric", month: "short" }) => parseKey(k).toLocaleDateString("fr-FR", opt);
  const uid = () => Math.random().toString(36).slice(2, 9);
  const RECIPES = (window.RECIPES || []);
  const byId = Object.fromEntries(RECIPES.map((r) => [r.id, r]));
  const CATS = { "petit-dej": "Petit-déj", dejeuner: "Déjeuner", diner: "Dîner", accompagnement: "Accompagnements", collation: "Collation", dessert: "Dessert", boisson: "Boissons" };
  const LOOK = window.ING_LOOK || {};
  const PROTEINS = {
    volaille: ["poulet_blanc", "poulet_cuisse", "poulet_entier", "dinde", "dinde_fumee", "foie_volaille"],
    viande: ["boeuf_hache", "boeuf_steak", "boeuf_ragout", "kefta", "agneau_epaule", "agneau_cotelette", "veau", "merguez", "cachir"],
    poisson: ["saumon", "saumon_fume", "thon_frais", "thon_boite", "thon_huile", "sardine", "sardine_boite", "maquereau", "merlan", "dorade", "loup", "cabillaud", "crevette", "calamar", "moules", "surimi"]
  };
  const hasAny = (r, ids) => r.ingredients.some((i) => ids.includes(i.ing));
  const isVeggie = (r) => !hasAny(r, [...PROTEINS.volaille, ...PROTEINS.viande, ...PROTEINS.poisson]);

  // Illustration générée pour chaque recette (pas de photo) : assiette + ingrédients principaux
  const CAT_BG = { "petit-dej": ["#fde9c9", "#f7d49a"], dejeuner: ["#e3efd0", "#c9e0a8"], diner: ["#dfe6ef", "#c3d0e2"],
    accompagnement: ["#e8f1dc", "#d3e6bd"], collation: ["#f6e3d3", "#ecc9ad"], dessert: ["#f6dde4", "#ecc0cd"], boisson: ["#dcefee", "#bfe0de"] };
  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function illus(r, size) {
    let seed = hash(r.id);
    const rnd = () => ((seed = Math.imul(seed ^ (seed >>> 15), 2246822507) >>> 0) % 1000) / 1000;
    const bg = CAT_BG[r.category] || CAT_BG.dejeuner;
    const ings = r.ingredients.filter((i) => i.ing && LOOK[i.ing] && !["sel", "poivre", "eau", "bouillon", "erythritol", "stevia", "levure_chimique", "vanille"].includes(i.ing));
    const top = ings.slice().sort((a, b) => (b.qty == null ? 0 : 1) - (a.qty == null ? 0 : 1)).slice(0, 7);
    const colors = (top.length ? top : [{ ing: "x" }]).map((i) => (LOOK[i.ing] || ["#c8e278"])[0]);
    const emojis = [...new Set(top.map((i) => LOOK[i.ing][1]))].filter((e) => e !== r.emoji).slice(0, 4);
    const isDrink = r.category === "boisson";
    let food = "";
    for (let k = 0; k < 9; k++) {
      const a = rnd() * Math.PI * 2, d = 6 + rnd() * 26, rr = 9 + rnd() * 12;
      food += `<circle cx="${(60 + Math.cos(a) * d).toFixed(1)}" cy="${(60 + Math.sin(a) * d).toFixed(1)}" r="${rr.toFixed(1)}" fill="${colors[k % colors.length]}" opacity=".9"/>`;
    }
    const around = emojis.map((e, k) => {
      const a = -Math.PI / 2 + (k + 0.5) * (Math.PI * 2 / Math.max(emojis.length, 1)) + rnd() * 0.4;
      return `<text x="${(60 + Math.cos(a) * 50).toFixed(1)}" y="${(64 + Math.sin(a) * 50).toFixed(1)}" font-size="15" text-anchor="middle">${e}</text>`;
    }).join("");
    const plate = isDrink
      ? `<rect x="38" y="24" width="44" height="74" rx="10" fill="#ffffff" opacity=".9"/><rect x="42" y="40" width="36" height="54" rx="7" fill="${colors[0]}"/>`
      : `<circle cx="60" cy="60" r="43" fill="#fff"/><circle cx="60" cy="60" r="36" fill="#f4f1ea"/><g clip-path="url(#c${r.id.length})">${food}</g>`;
    return `<svg viewBox="0 0 120 120" width="${size}" height="${size}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs><linearGradient id="g${hash(r.id)}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bg[0]}"/><stop offset="1" stop-color="${bg[1]}"/></linearGradient>
      <clipPath id="c${r.id.length}"><circle cx="60" cy="60" r="34"/></clipPath></defs>
      <rect width="120" height="120" fill="url(#g${hash(r.id)})"/>${plate}${around}
      <text x="60" y="${isDrink ? 76 : 72}" font-size="${isDrink ? 26 : 30}" text-anchor="middle">${r.emoji}</text></svg>`;
  }
  const SLOTS = [["petit-dej", "Petit-déjeuner"], ["dejeuner", "Déjeuner"], ["diner", "Dîner"], ["collation", "Collation"]];

  // ---------- Stockage ----------
  const KEY = "ketofamille_v1";
  let db;
  try { db = JSON.parse(localStorage.getItem(KEY)) || null; } catch (e) { db = null; }
  if (!db || !db.profiles) db = { profiles: {}, current: null };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { toast("Stockage plein ou indisponible"); } };
  const P = () => db.profiles[db.current] || null;
  const dayLog = (p, k = dkey()) => (p.log[k] = p.log[k] || { meals: [], tasks: {}, water: 0 });

  // ---------- Calculs nutritionnels ----------
  function targets(p) {
    const w = +p.weight || 70, h = +p.height || 170, a = +p.age || 35;
    const bmr = 10 * w + 6.25 * h - 5 * a + (p.sex === "h" ? 5 : -161);
    const tdee = bmr * (+p.activity || 1.375);
    let kcal = p.goal === "perte" ? tdee * 0.8 : tdee;
    const floor = p.sex === "h" ? 1500 : 1200; // jamais en dessous d'un plancher raisonnable
    kcal = Math.round(Math.max(kcal, floor) / 10) * 10;
    const ref = Math.max(+p.goalWeight || w, w * 0.85);
    const protein = Math.round(Math.min(Math.max(ref * 1.5, 60), 180));
    const carbs = +p.carbLimit || 25;
    const fat = Math.max(Math.round((kcal - protein * 4 - carbs * 4) / 9), 40);
    return { kcal, protein, carbs, fat, bmr: Math.round(bmr), tdee: Math.round(tdee) };
  }
  const bmi = (w, h) => (w && h ? w / Math.pow(h / 100, 2) : null);
  const latestWeight = (p) => {
    const ks = Object.keys(p.log).filter((k) => p.log[k].weight).sort();
    return ks.length ? p.log[ks[ks.length - 1]].weight : +p.weight;
  };
  const programDay = (p) => Math.max(1, daysBetween(p.startDate, dkey()) + 1);
  const programWeek = (p) => Math.min(4, Math.ceil(Math.min(programDay(p), 28) / 7));
  const totals = (meals) => meals.reduce((t, m) => ({
    kcal: t.kcal + m.kcal, fat: t.fat + m.fat, protein: t.protein + m.protein, carbs: t.carbs + m.carbs
  }), { kcal: 0, fat: 0, protein: 0, carbs: 0 });

  // Menu du jour : déterministe à partir du numéro de jour, avec remplacements possibles
  function menuFor(p, k) {
    const n = daysBetween(p.startDate, k) + 1000;
    const swaps = (p.swaps && p.swaps[k]) || {};
    const res = {};
    SLOTS.forEach(([slot], i) => {
      const pool = RECIPES.filter((r) => r.category === slot || (slot === "collation" && r.category === "dessert" && n % 3 === 0));
      if (!pool.length) return;
      const pick = pool[(n * (i * 2 + 3) + i * 7) % pool.length];
      res[slot] = byId[swaps[slot]] || pick;
    });
    return res;
  }

  // ---------- Interface générique ----------
  let toastTimer;
  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
  }
  function openSheet(html, onMount) {
    $("#sheetCard").innerHTML = html; $("#sheet").hidden = false; if (onMount) onMount($("#sheetCard"));
  }
  function closeSheet() { $("#sheet").hidden = true; }
  $("#sheet").addEventListener("click", (e) => { if (e.target.id === "sheet") closeSheet(); });
  $("#backBtn").addEventListener("click", () => history.back());
  $("#profileChip").addEventListener("click", () => showProfileSwitcher());

  function ring(value, max, color, label, unit) {
    const r = 36, c = 2 * Math.PI * r, pct = Math.min(value / (max || 1), 1);
    const over = value > max;
    return `<div><div class="ring"><svg width="84" height="84" viewBox="0 0 84 84">
      <circle cx="42" cy="42" r="${r}" fill="none" stroke="#ece6da" stroke-width="8"/>
      <circle cx="42" cy="42" r="${r}" fill="none" stroke="${over ? "var(--red)" : color}" stroke-width="8" stroke-linecap="round"
        stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct)}"/></svg>
      <div class="val">${fmt(value)}<small>/ ${fmt(max)} ${unit}</small></div></div>
      <div class="gauge-label">${label}</div></div>`;
  }

  // ---------- Routeur ----------
  const routes = {};
  function render() {
    const hash = location.hash.replace(/^#\/?/, "") || "aujourdhui";
    const [name, arg] = hash.split("/");
    const p = P();
    $("#profileChip").textContent = p ? "👤 " + p.name : "";
    if (!p && name !== "nouveau") { location.replace("#/nouveau"); return; }
    const top = ["aujourdhui", "programme", "recettes", "suivi", "profil"];
    $("#backBtn").hidden = top.includes(name) || name === "nouveau";
    document.querySelectorAll("#tabs a").forEach((a) => a.classList.toggle("active", a.dataset.tab === name || (name === "recette" && a.dataset.tab === "recettes")));
    $("#tabs").style.display = name === "nouveau" ? "none" : "";
    const fn = routes[name] || routes.aujourdhui;
    $("#view").innerHTML = "";
    fn(decodeURIComponent(arg || ""));
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", render);
  const setTitle = (t) => ($("#title").textContent = t);

  // ---------- Profil : création / édition ----------
  function profileForm(p, isNew) {
    p = p || { sex: "f", activity: "1.375", goal: "perte", carbLimit: 25 };
    const seg = (name, opts, val) => `<div class="seg" data-name="${name}">${opts.map(([v, l]) =>
      `<button type="button" data-v="${v}" class="${String(val) === String(v) ? "on" : ""}">${l}</button>`).join("")}</div>`;
    return `<form id="pform" autocomplete="off">
      <label class="f">Prénom<input name="name" required maxlength="24" value="${esc(p.name || "")}" placeholder="Ex. Samira"></label>
      <div class="f" style="font-weight:600;font-size:14px;margin-bottom:14px">Sexe ${seg("sex", [["f", "Femme"], ["h", "Homme"]], p.sex)}</div>
      <div class="grid2">
        <label class="f">Âge<input name="age" type="number" inputmode="numeric" min="18" max="99" required value="${esc(p.age || "")}"></label>
        <label class="f">Taille (cm)<input name="height" type="number" inputmode="numeric" min="120" max="230" required value="${esc(p.height || "")}"></label>
        <label class="f">Poids actuel (kg)<input name="weight" type="number" inputmode="decimal" step="0.1" min="35" max="250" required value="${esc(p.weight || "")}"></label>
        <label class="f">Poids visé (kg)<input name="goalWeight" type="number" inputmode="decimal" step="0.1" min="35" max="250" required value="${esc(p.goalWeight || "")}"></label>
      </div>
      <div class="f" style="font-weight:600;font-size:14px;margin-bottom:14px">Objectif ${seg("goal", [["perte", "Perdre du poids"], ["maintien", "Maintenir"]], p.goal)}</div>
      <label class="f">Activité physique<select name="activity">
        ${[["1.2", "Sédentaire (bureau, peu de marche)"], ["1.375", "Légère (marche, 1–2 séances/sem.)"], ["1.55", "Modérée (3–4 séances/sem.)"], ["1.725", "Intense (sport quotidien)"]]
          .map(([v, l]) => `<option value="${v}" ${String(p.activity) === v ? "selected" : ""}>${l}</option>`).join("")}
      </select></label>
      <div class="f" style="font-weight:600;font-size:14px;margin-bottom:14px">Glucides nets par jour ${seg("carbLimit", [[20, "20 g strict"], [25, "25 g"], [30, "30 g souple"]], p.carbLimit)}</div>
      <label class="f">Date de début du programme<input name="startDate" type="date" required value="${esc(p.startDate || dkey())}"></label>
      ${isNew ? `<p class="warn">⚠️ Le keto ne convient pas à tout le monde. Parlez-en à votre médecin avant de commencer si vous êtes enceinte ou allaitez, avez un diabète traité, une maladie des reins ou du foie, un traitement pour la tension, ou des antécédents de troubles alimentaires. Réservé aux adultes.</p>` : ""}
      <button class="btn block" type="submit">${isNew ? "Commencer mon programme" : "Enregistrer"}</button>
    </form>`;
  }
  function bindProfileForm(onSave) {
    const f = $("#pform");
    f.querySelectorAll(".seg").forEach((s) => s.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      s.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
    }));
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(f).entries());
      f.querySelectorAll(".seg").forEach((s) => { const on = $("button.on", s); if (on) data[s.dataset.name] = on.dataset.v; });
      ["age", "height", "weight", "goalWeight", "carbLimit"].forEach((k) => (data[k] = +String(data[k]).replace(",", ".")));
      data.name = data.name.trim();
      if (!data.name) return toast("Indiquez un prénom");
      onSave(data);
    });
  }

  routes.nouveau = () => {
    setTitle("Bienvenue");
    const first = !Object.keys(db.profiles).length;
    $("#view").innerHTML = `
      ${first ? `<div class="welcome"><img src="icon.png" alt=""><h2>Keto Famille</h2>
        <p class="muted">Un programme keto simple sur 4 semaines, des recettes complètes et un suivi au quotidien. Gratuit, sans compte, vos données restent sur ce téléphone.</p></div>` : ""}
      <div class="card"><h2>${first ? "Créons votre profil" : "Nouveau profil"}</h2>${profileForm(null, true)}</div>
      ${first ? `<button class="btn ghost block" id="demo">Découvrir avec un profil de démonstration</button>` : `<button class="btn ghost block" onclick="history.back()">Annuler</button>`}`;
    bindProfileForm((data) => {
      const id = uid();
      db.profiles[id] = Object.assign(data, { id, log: {}, favorites: [], swaps: {} });
      db.profiles[id].log[dkey()] = { meals: [], tasks: {}, water: 0, weight: data.weight };
      db.current = id; save(); toast("Profil créé, bon courage " + data.name + " !");
      location.hash = "#/aujourdhui";
    });
    const d = $("#demo"); if (d) d.addEventListener("click", createDemo);
  };

  // Profil de démonstration avec 3 semaines d'historique simulé
  function createDemo() {
    const id = "demo";
    const start = new Date(); start.setDate(start.getDate() - 20);
    const p = { id, name: "Démo Amina", sex: "f", age: 42, height: 164, weight: 82, goalWeight: 70, goal: "perte",
      activity: "1.375", carbLimit: 25, startDate: dkey(start), log: {}, favorites: [], swaps: {}, demo: true };
    if (RECIPES[0]) p.favorites = RECIPES.slice(0, 4).map((r) => r.id);
    let w = 82;
    for (let i = 0; i <= 20; i++) {
      const d = new Date(start); d.setDate(d.getDate() + i);
      const k = dkey(d);
      w -= i < 6 ? 0.35 : 0.12 + (i % 3 === 0 ? -0.15 : 0.05);
      const entry = { meals: [], tasks: { 0: true, 1: i % 2 === 0, 2: i % 3 !== 0 }, water: 4 + (i % 5) };
      if (i % 2 === 0 || i === 20) entry.weight = Math.round(w * 10) / 10;
      entry.energy = i < 4 ? 2 : i % 4 === 0 ? 3 : 4;
      const menu = menuFor(p, k);
      Object.values(menu).forEach((r) => entry.meals.push(mealFrom(r, 1)));
      p.log[k] = entry;
    }
    db.profiles[id] = p; db.current = id; save();
    toast("Profil démo chargé"); location.hash = "#/aujourdhui";
  }

  function showProfileSwitcher() {
    const list = Object.values(db.profiles);
    openSheet(`<h2>Profils sur ce téléphone</h2>
      ${list.map((p) => `<button class="btn ${p.id === db.current ? "" : "light"} block" style="margin-bottom:8px" data-id="${p.id}">👤 ${esc(p.name)}</button>`).join("")}
      <button class="btn ghost block" id="addP">＋ Ajouter un membre de la famille</button>`, (el) => {
      el.querySelectorAll("[data-id]").forEach((b) => b.addEventListener("click", () => {
        db.current = b.dataset.id; save(); closeSheet(); toast("Profil : " + P().name); render();
      }));
      $("#addP", el).addEventListener("click", () => { closeSheet(); location.hash = "#/nouveau"; });
    });
  }

  // ---------- Journal ----------
  function mealFrom(r, portions = 1) {
    const m = r.macros;
    return { rid: r.id, name: r.title, emoji: r.emoji, portions,
      kcal: Math.round(m.kcal * portions), fat: Math.round(m.fat * portions), protein: Math.round(m.protein * portions), carbs: Math.round(m.carbs * portions * 10) / 10 };
  }
  function addMeal(r, portions = 1, k = dkey()) {
    const p = P(); dayLog(p, k).meals.push(mealFrom(r, portions)); save();
    toast(`${r.title} ajouté au journal`);
  }

  // ---------- Écran : Aujourd'hui ----------
  routes.aujourdhui = () => {
    const p = P(), t = targets(p), k = dkey(), log = dayLog(p, k);
    const day = programDay(p), wk = programWeek(p), week = PROGRAM[wk - 1];
    const tot = totals(log.meals);
    const menu = menuFor(p, k);
    const tip = TIPS[(day - 1) % TIPS.length];
    const h = new Date().getHours();
    setTitle("Aujourd'hui");
    $("#view").innerHTML = `
      <div class="card hero">
        <div class="row spread"><span class="badge">${day <= 28 ? `Jour ${day} / 28` : "Programme terminé 🎉"}</span>
          <span class="small muted">${fmtDate(k, { weekday: "long", day: "numeric", month: "long" })}</span></div>
        <h2 style="margin-top:12px">${h < 12 ? "Bonjour" : h < 18 ? "Bon après-midi" : "Bonsoir"} ${esc(p.name)} 👋</h2>
        <div class="muted">Semaine ${wk} · ${esc(week.title)} — ${esc(week.subtitle)}</div>
        <div class="progress" style="margin-top:12px"><div style="width:${Math.min(day, 28) / 28 * 100}%"></div></div>
      </div>

      <div class="card">
        <div class="row spread" style="margin-bottom:12px"><h2 style="margin:0">Mes compteurs du jour</h2><a class="small" style="color:var(--green);font-weight:700" href="#/journal">Journal ›</a></div>
        <div class="gauges">
          ${ring(Math.round(tot.carbs), t.carbs, "var(--avocado)", "Glucides nets", "g")}
          ${ring(tot.protein, t.protein, "var(--green-2)", "Protéines", "g")}
          ${ring(tot.kcal, t.kcal, "var(--amber)", "Calories", "")}
        </div>
      </div>

      <div class="card">
        <div class="row spread"><h2 style="margin:0">Menu du jour</h2><span class="small muted">Touchez un plat pour la recette</span></div>
        <div style="margin-top:8px">${SLOTS.map(([slot, label]) => {
          const r = menu[slot]; if (!r) return "";
          const eaten = log.meals.some((m) => m.rid === r.id);
          return `<div class="meal"><a class="emoji illus" href="#/recette/${r.id}" style="text-decoration:none">${illus(r, 48)}</a>
            <a class="grow" href="#/recette/${r.id}" style="text-decoration:none;color:inherit">
              <div class="slot">${label}</div><div class="name">${esc(r.title)}</div>
              <div class="meta">${r.macros.carbs} g glucides · ${r.macros.kcal} kcal</div></a>
            <div style="display:flex;flex-direction:column;gap:6px">
              <button class="mini-btn ${eaten ? "on" : ""}" data-eat="${r.id}">${eaten ? "✓ Mangé" : "J'ai mangé"}</button>
              <button class="mini-btn" data-swap="${slot}" style="background:transparent">🔄 Changer</button></div></div>`;
        }).join("")}</div>
      </div>

      <div class="card">
        <div class="row spread"><h2 style="margin:0">Eau</h2><span class="small muted">${log.water} / 8 verres</span></div>
        <div class="water" style="margin-top:10px">${Array.from({ length: 8 }, (_, i) => `<button data-w="${i + 1}" class="${i < log.water ? "on" : ""}">💧</button>`).join("")}</div>
      </div>

      <div class="card">
        <h2>Objectifs de la semaine ${wk}</h2>
        ${week.goals.map((g, i) => `<label class="check ${log.tasks[i] ? "done" : ""}"><input type="checkbox" data-task="${i}" ${log.tasks[i] ? "checked" : ""}><span>${esc(g)}</span></label>`).join("")}
      </div>

      <div class="card">
        <h2>Mon bilan rapide</h2>
        <div class="row" style="margin-bottom:12px">
          <input id="wIn" class="search" type="number" inputmode="decimal" step="0.1" placeholder="Poids du jour (kg)" value="${log.weight || ""}">
          <button class="btn" id="wSave">OK</button></div>
        <div class="small muted" style="margin-bottom:6px">Mon énergie aujourd'hui</div>
        <div class="emoji-pick">${["😫", "😕", "🙂", "😃", "🤩"].map((e, i) => `<button data-en="${i}" class="${log.energy === i ? "on" : ""}">${e}</button>`).join("")}</div>
      </div>

      <div class="card tip"><div class="small" style="font-weight:800;color:#8a5a0f;margin-bottom:4px">💡 CONSEIL DU JOUR</div>${esc(tip)}</div>
    `;
    const v = $("#view");
    v.querySelectorAll("[data-eat]").forEach((b) => b.addEventListener("click", () => {
      const idx = log.meals.findIndex((m) => m.rid === b.dataset.eat);
      if (idx >= 0) { log.meals.splice(idx, 1); save(); toast("Retiré du journal"); } else addMeal(byId[b.dataset.eat]);
      render();
    }));
    v.querySelectorAll("[data-swap]").forEach((b) => b.addEventListener("click", () => swapMeal(b.dataset.swap, k)));
    v.querySelectorAll("[data-w]").forEach((b) => b.addEventListener("click", () => {
      const n = +b.dataset.w; log.water = log.water === n ? n - 1 : n; save(); render();
      if (log.water === 8) toast("Bravo, objectif eau atteint 💧");
    }));
    v.querySelectorAll("[data-task]").forEach((c) => c.addEventListener("change", () => { log.tasks[c.dataset.task] = c.checked; save(); render(); }));
    v.querySelectorAll("[data-en]").forEach((b) => b.addEventListener("click", () => { log.energy = +b.dataset.en; save(); render(); }));
    $("#wSave").addEventListener("click", () => {
      const w = parseFloat(String($("#wIn").value).replace(",", "."));
      if (!w || w < 30 || w > 300) return toast("Poids invalide");
      log.weight = w; save(); toast("Poids enregistré"); render();
    });
  };

  function swapMeal(slot, k) {
    const p = P(); const pool = RECIPES.filter((r) => r.category === slot || (slot === "collation" && r.category === "dessert"));
    openSheet(`<h2>Remplacer : ${SLOTS.find((s) => s[0] === slot)[1]}</h2>
      <div class="recipe-list">${pool.map((r) => `<button class="recipe-item" style="border:0;text-align:left;width:100%" data-r="${r.id}">
        <div class="emoji illus">${illus(r, 58)}</div><div class="grow"><h3>${esc(r.title)}</h3><div class="meta">${r.macros.carbs} g glucides · ${r.prep + r.cook} min</div></div></button>`).join("")}</div>`, (el) => {
      el.querySelectorAll("[data-r]").forEach((b) => b.addEventListener("click", () => {
        p.swaps = p.swaps || {}; p.swaps[k] = p.swaps[k] || {}; p.swaps[k][slot] = b.dataset.r; save(); closeSheet(); render();
      }));
    });
  }

  // ---------- Écran : Journal ----------
  routes.journal = (arg) => {
    const p = P(), k = arg || dkey(), log = dayLog(p, k), t = targets(p), tot = totals(log.meals);
    setTitle("Journal · " + fmtDate(k));
    $("#view").innerHTML = `
      <div class="card"><h2>Total de la journée</h2>
        <div class="macros">
          <div><b style="color:${tot.carbs > t.carbs ? "var(--red)" : "inherit"}">${fmt(tot.carbs, 0)}</b><span>Glucides / ${t.carbs} g</span></div>
          <div><b>${fmt(tot.protein)}</b><span>Protéines / ${t.protein} g</span></div>
          <div><b>${fmt(tot.fat)}</b><span>Lipides / ${t.fat} g</span></div>
          <div><b>${fmt(tot.kcal)}</b><span>kcal / ${t.kcal}</span></div></div></div>
      <div class="card"><h2>Ce que j'ai mangé</h2>
        ${log.meals.length ? log.meals.map((m, i) => `<div class="meal"><div class="emoji">${m.emoji || "🍽️"}</div>
          <div class="grow"><div class="name">${esc(m.name)}</div><div class="meta">${m.portions !== 1 ? m.portions + " portions · " : ""}${m.carbs} g glucides · ${m.protein} g prot. · ${m.kcal} kcal</div></div>
          <button class="mini-btn" data-del="${i}" style="background:#fbeae6;color:var(--red)">✕</button></div>`).join("")
          : `<div class="empty">Rien pour l'instant.<br>Ajoutez un plat du menu ou une recette.</div>`}
      </div>
      <button class="btn block" id="addFree">＋ Ajouter un aliment libre</button>
      <a class="btn light block" style="margin-top:10px;text-decoration:none" href="#/recettes">Choisir une recette</a>`;
    $("#view").querySelectorAll("[data-del]").forEach((b) => b.addEventListener("click", () => { log.meals.splice(+b.dataset.del, 1); save(); render(); }));
    $("#addFree").addEventListener("click", () => openSheet(`<h2>Aliment libre</h2><form id="ff">
      <label class="f">Nom<input name="name" required placeholder="Ex. 30 g d'amandes"></label>
      <div class="grid2"><label class="f">Glucides nets (g)<input name="carbs" type="number" inputmode="decimal" step="0.1" value="0"></label>
      <label class="f">Protéines (g)<input name="protein" type="number" inputmode="decimal" value="0"></label>
      <label class="f">Lipides (g)<input name="fat" type="number" inputmode="decimal" value="0"></label>
      <label class="f">Calories<input name="kcal" type="number" inputmode="numeric" placeholder="auto"></label></div>
      <button class="btn block">Ajouter</button></form>`, (el) => {
      $("#ff", el).addEventListener("submit", (e) => {
        e.preventDefault(); const d = Object.fromEntries(new FormData(e.target).entries());
        const n = (x) => +String(x || 0).replace(",", ".") || 0;
        const m = { name: d.name, emoji: "🍽️", portions: 1, carbs: n(d.carbs), protein: n(d.protein), fat: n(d.fat) };
        m.kcal = n(d.kcal) || Math.round(m.carbs * 4 + m.protein * 4 + m.fat * 9);
        log.meals.push(m); save(); closeSheet(); render();
      });
    }));
  };

  // ---------- Écran : Programme ----------
  routes.programme = () => {
    const p = P(), t = targets(p), day = programDay(p), wk = programWeek(p);
    setTitle("Mon programme");
    $("#view").innerHTML = `
      <div class="card hero"><span class="badge">Mes objectifs quotidiens</span>
        <div class="macros" style="margin-top:12px">
          ${[["Glucides nets", t.carbs + " g"], ["Protéines", t.protein + " g"], ["Lipides", t.fat + " g"], ["Calories", t.kcal]].map(([l, v]) =>
            `<div style="background:rgba(255,255,255,.14)"><b>${v}</b><span style="color:rgba(255,255,255,.85)">${l}</span></div>`).join("")}</div>
        <p class="small muted" style="margin:12px 0 0">Calculé à partir de votre profil${p.goal === "perte" ? " avec un déficit modéré de 20 %" : ""}. Les glucides sont la règle d'or ; les calories sont un repère, mangez à votre faim.</p>
      </div>
      <div class="section-title">4 semaines pour s'installer</div>
      ${PROGRAM.map((w) => `<div class="card week ${w.week === wk ? "current" : ""}"><div class="num">${w.week}</div>
        <div class="grow"><div class="row spread"><h3 style="font-size:16px">${esc(w.title)}</h3>${w.week === wk ? `<span class="badge">En cours</span>` : w.week < wk ? `<span class="small muted">✓ Terminée</span>` : ""}</div>
        <div class="small muted" style="margin:2px 0 8px">${esc(w.subtitle)}</div>
        <p style="margin:0 0 8px;font-size:14.5px">${esc(w.text)}</p>
        <ul style="margin:0;padding-left:18px;font-size:14px">${w.goals.map((g) => `<li>${esc(g)}</li>`).join("")}</ul></div></div>`).join("")}
      <div class="section-title">Menus de la semaine</div>
      <div class="card">${Array.from({ length: 7 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() + i); const k = dkey(d); const m = menuFor(p, k);
        return `<details ${i === 0 ? "open" : ""}><summary>${i === 0 ? "Aujourd'hui" : fmtDate(k, { weekday: "long", day: "numeric", month: "short" })}</summary>
          ${SLOTS.map(([s, l]) => m[s] ? `<a class="meal" href="#/recette/${m[s].id}" style="text-decoration:none;color:inherit"><div class="emoji" style="width:38px;height:38px;font-size:20px">${m[s].emoji}</div>
          <div class="grow"><div class="slot">${l}</div><div class="name" style="font-size:14.5px">${esc(m[s].title)}</div></div></a>` : "").join("")}</details>`;
      }).join("")}
        <button class="btn light block" id="shop" style="margin-top:10px">🛒 Liste de courses des 7 jours</button></div>
      <div class="section-title">Guide des aliments</div>
      <div class="card"><h2 style="color:var(--green)">✅ À privilégier</h2>${foodList(FOODS.oui)}</div>
      <div class="card"><h2 style="color:var(--amber)">⚖️ Avec modération</h2>${foodList(FOODS.modere)}</div>
      <div class="card"><h2 style="color:var(--red)">⛔ À éviter</h2>${foodList(FOODS.non)}</div>
      <div class="section-title">Questions fréquentes</div>
      <div class="card">${FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}</div>`;
    $("#shop").addEventListener("click", shoppingList);
  };
  const foodList = (arr) => arr.map(([e, n, d]) => `<div class="food"><div class="e">${e}</div><div><b>${esc(n)}</b><div class="small muted">${esc(d)}</div></div></div>`).join("");

  function shoppingList() {
    const p = P(), agg = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(); d.setDate(d.getDate() + i);
      Object.values(menuFor(p, dkey(d))).forEach((r) => r.ingredients.forEach((ing) => {
        if (["eau", "sel", "poivre"].includes(ing.ing)) return;
        const key = ing.ing || ing.name.toLowerCase();
        agg[key] = agg[key] || { name: ing.name, g: 0 };
        agg[key].g += (ing.g || 0) / (r.servings || 1);
      }));
    }
    const items = Object.entries(agg).map(([k, v]) => {
      const it = { name: v.name, unit: "g", qty: v.g };
      if (k === "oeuf") { it.qty = Math.max(1, Math.round(v.g / 60)); it.unit = ""; it.name = "œufs"; }
      else if (v.g < 5) { it.qty = 0; }
      else it.qty = v.g >= 50 ? Math.ceil(v.g / 50) * 50 : Math.ceil(v.g / 5) * 5;
      return it;
    }).sort((a, b) => a.name.localeCompare(b.name, "fr"));
    const text = items.map((i) => "• " + (i.qty ? fmtQty(i.qty) + " " + i.unit + " " : "") + i.name).join("\n");
    openSheet(`<h2>🛒 Courses pour 7 jours (1 personne)</h2>
      <p class="small muted" style="margin-top:-6px">Multipliez selon le nombre de personnes à table.</p>
      ${items.map((i) => `<label class="check"><input type="checkbox"><span>${i.qty ? `<b>${fmtQty(i.qty)} ${esc(i.unit)}</b> ` : ""}${esc(i.name)}</span></label>`).join("")}
      <button class="btn block" id="copyList" style="margin-top:12px">Copier la liste</button>`, (el) => {
      $("#copyList", el).addEventListener("click", () => copyText(text));
    });
  }
  function copyText(text) {
    const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select();
    let ok = false; try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    ta.remove();
    if (!ok && navigator.clipboard) navigator.clipboard.writeText(text).then(() => toast("Copié"), () => toast("Copie impossible"));
    else toast(ok ? "Copié dans le presse-papiers" : "Copie impossible");
  }
  // Œufs et pièces : arrondi à la demi-unité (au moins 1) ; pincées : pas de mise à l'échelle fine
  function scaleQty(ing, factor) {
    const q = ing.qty * factor;
    if (ing.unit === "pincée") return String(Math.max(1, Math.round(q)));
    if (ing.unit === "pièce(s)") return fmtQty(Math.max(1, Math.round(q * 2) / 2));
    return fmtQty(q);
  }
  function fmtQty(q) {
    if (q >= 100) return String(Math.round(q / 5) * 5);
    if (q >= 10) return String(Math.round(q));
    const r = Math.round(q * 4) / 4;
    const whole = Math.floor(r), frac = r - whole;
    const f = { 0.25: "¼", 0.5: "½", 0.75: "¾" }[frac] || "";
    return (whole ? whole : "") + f || "¼";
  }

  // ---------- Écran : Recettes ----------
  let recFilter = "tout", recFilter2 = "", recQuery = "";
  routes.recettes = () => {
    const p = P();
    setTitle("Recettes keto");
    $("#view").innerHTML = `
      <input class="search" id="q" type="search" placeholder="🔍 Rechercher une recette, un ingrédient…" value="${esc(recQuery)}">
      <div class="chips" id="chips">${[["tout", "Toutes"], ["fav", "❤️ Favoris"], ...Object.entries(CATS)]
        .map(([v, l]) => `<button data-c="${v}" class="${recFilter === v ? "on" : ""}">${l}</button>`).join("")}</div>
      <div class="chips" id="chips2" style="padding-top:2px">${[["", "Tout"], ["volaille", "🍗 Volaille"], ["viande", "🥩 Viande"], ["poisson", "🐟 Poisson"], ["vege", "🥬 Végétarien"], ["rapide", "⚡ ≤ 20 min"], ["marocain", "🇲🇦 Marocain"], ["low", "📉 ≤ 3 g glucides"]]
        .map(([v, l]) => `<button data-c="${v}" class="${recFilter2 === v ? "on" : ""}">${l}</button>`).join("")}</div>
      <div class="small muted" id="rcount" style="margin:6px 4px 0"></div>
      <div class="recipe-list" id="rlist"></div>
      <button class="btn light block" id="more" style="margin-top:12px" hidden>Afficher plus de recettes</button>`;
    const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    let list = [], shown = 0;
    const item = (r) => `<a class="recipe-item" href="#/recette/${r.id}"><div class="emoji illus">${illus(r, 58)}</div>
        <div class="grow"><h3>${esc(r.title)} ${p.favorites.includes(r.id) ? '<span class="fav">♥</span>' : ""}</h3>
        <div class="meta">${CATS[r.category] || ""} · ${r.prep + r.cook} min · ${r.macros.carbs} g glucides · ${r.macros.kcal} kcal</div></div></a>`;
    const more = () => {
      const next = list.slice(shown, shown + 30); shown += next.length;
      $("#rlist").insertAdjacentHTML("beforeend", next.map(item).join(""));
      $("#more").hidden = shown >= list.length;
    };
    const draw = () => {
      const q = norm(recQuery.trim());
      list = RECIPES.filter((r) => {
        if (recFilter === "fav" && !p.favorites.includes(r.id)) return false;
        if (CATS[recFilter] && r.category !== recFilter) return false;
        if (recFilter2 === "volaille" && !hasAny(r, PROTEINS.volaille)) return false;
        if (recFilter2 === "viande" && !hasAny(r, PROTEINS.viande)) return false;
        if (recFilter2 === "poisson" && !hasAny(r, PROTEINS.poisson)) return false;
        if (recFilter2 === "vege" && !isVeggie(r)) return false;
        if (recFilter2 === "rapide" && r.prep + r.cook > 20) return false;
        if (recFilter2 === "marocain" && !(r.tags || []).some((t) => norm(t).includes("maroc"))) return false;
        if (recFilter2 === "low" && r.macros.carbs > 3) return false;
        if (q && !(r._s || (r._s = norm(r.title + " " + r.ingredients.map((i) => i.name).join(" ") + " " + (r.tags || []).join(" ")))).includes(q)) return false;
        return true;
      });
      shown = 0; $("#rlist").innerHTML = list.length ? "" : `<div class="empty">Aucune recette trouvée.</div>`;
      $("#rcount").textContent = list.length + (list.length > 1 ? " recettes" : " recette");
      more();
    };
    let timer;
    $("#q").addEventListener("input", (e) => { recQuery = e.target.value; clearTimeout(timer); timer = setTimeout(draw, 180); });
    const bindChips = (sel, set) => $(sel).addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return; set(b.dataset.c);
      $(sel).querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b)); draw();
    });
    bindChips("#chips", (v) => (recFilter = v));
    bindChips("#chips2", (v) => (recFilter2 = v));
    $("#more").addEventListener("click", more);
    draw();
  };

  routes.recette = (id) => {
    const r = byId[id], p = P();
    if (!r) { location.replace("#/recettes"); return; }
    let serv = r.servings;
    setTitle(r.title);
    const paint = () => {
      const fav = p.favorites.includes(r.id);
      $("#view").innerHTML = `
        <div class="card r-hero" style="padding:0;overflow:hidden"><div class="r-illus" style="background:linear-gradient(135deg,${(CAT_BG[r.category] || CAT_BG.dejeuner).join(",")})">${illus(r, 190)}</div>
          <div style="padding:14px 16px 18px"><h2>${esc(r.title)}</h2>
          <div class="meta">${CATS[r.category] || ""} · ${r.difficulty} · Préparation ${r.prep} min${r.cook ? ` · Cuisson ${r.cook} min` : ""} · ${r.servings} pers.</div>
          <div class="tags">${(r.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div></div></div>
        <div class="card"><h2>Valeurs nutritionnelles par portion</h2><div class="macros">
          <div><b>${r.macros.carbs}</b><span>Glucides nets (g)</span></div><div><b>${r.macros.protein}</b><span>Protéines (g)</span></div>
          <div><b>${r.macros.fat}</b><span>Lipides (g)</span></div><div><b>${r.macros.kcal}</b><span>kcal</span></div></div>
          ${(() => { const t = targets(p); const pc = (v, m) => Math.round(v / m * 100);
            return `<div class="small muted" style="margin-top:10px">Soit ${pc(r.macros.carbs, t.carbs)} % de vos glucides du jour, ${pc(r.macros.protein, t.protein)} % de vos protéines et ${pc(r.macros.kcal, t.kcal)} % de vos calories. Recette entière : ${r.macros.kcal * r.servings} kcal.</div>`; })()}
          <div class="row" style="margin-top:14px;gap:8px">
            <button class="btn grow" id="eat">＋ Ajouter au journal</button>
            <button class="btn light" id="fav" aria-label="Favori">${fav ? "♥" : "♡"}</button></div></div>
        <div class="card"><div class="row spread" style="margin-bottom:8px"><h2 style="margin:0">Ingrédients</h2>
          <div class="stepper"><button id="minus">−</button><b>${serv} pers.</b><button id="plus">+</button></div></div>
          <ul class="ing">${r.ingredients.map((i) => `<li><span class="q">${i.qty ? scaleQty(i, serv / r.servings) + " " + esc(i.unit || "") : esc(i.unit || "")}</span><span>${esc(i.name)}</span></li>`).join("")}</ul></div>
        <div class="card"><h2>Préparation</h2><p class="small muted" style="margin:-4px 0 6px">Touchez une étape pour la cocher.</p>
          <ol class="steps">${r.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol></div>
        ${r.tips ? `<div class="card tip"><div class="small" style="font-weight:800;color:#8a5a0f;margin-bottom:4px">💡 ASTUCE</div>${esc(r.tips)}</div>` : ""}`;
      $("#minus").onclick = () => { if (serv > 1) { serv--; paint(); } };
      $("#plus").onclick = () => { if (serv < 12) { serv++; paint(); } };
      $("#fav").onclick = () => {
        p.favorites = fav ? p.favorites.filter((x) => x !== r.id) : [...p.favorites, r.id]; save();
        toast(fav ? "Retiré des favoris" : "Ajouté aux favoris"); paint();
      };
      $("#eat").onclick = () => openSheet(`<h2>Combien de portions ?</h2>
        <div class="row" style="gap:8px">${[0.5, 1, 1.5, 2].map((n) => `<button class="btn light grow" data-n="${n}">${String(n).replace(".", ",")}</button>`).join("")}</div>`, (el) => {
        el.querySelectorAll("[data-n]").forEach((b) => b.addEventListener("click", () => { addMeal(r, +b.dataset.n); closeSheet(); }));
      });
      $("#view").querySelectorAll("ol.steps li").forEach((li) => li.addEventListener("click", () => li.classList.toggle("done")));
    };
    paint();
  };

  // ---------- Écran : Suivi ----------
  routes.suivi = () => {
    const p = P(), t = targets(p);
    const keys = Object.keys(p.log).sort();
    const weights = keys.filter((k) => p.log[k].weight).map((k) => [k, p.log[k].weight]);
    const cur = latestWeight(p), start = +p.weight, goal = +p.goalWeight;
    const lost = start - cur, toGo = cur - goal;
    const b = bmi(cur, p.height);
    const last7 = keys.slice(-7);
    const avgCarbs = last7.length ? last7.reduce((s, k) => s + totals(p.log[k].meals).carbs, 0) / last7.length : 0;
    let streak = 0;
    for (let d = new Date(); ; d.setDate(d.getDate() - 1)) {
      const l = p.log[dkey(d)];
      if (l && l.meals.length && totals(l.meals).carbs <= t.carbs) streak++;
      else if (dkey(d) === dkey() && (!l || !l.meals.length)) continue;
      else break;
      if (streak > 400) break;
    }
    setTitle("Mon suivi");
    $("#view").innerHTML = `
      <div class="card"><div class="stats">
        <div><b style="color:var(--green)">${lost >= 0 ? "−" : "+"}${fmt(Math.abs(lost), 1)}</b><span>kg depuis le début</span></div>
        <div><b>${fmt(cur, 1)}</b><span>kg aujourd'hui</span></div>
        <div><b>${toGo > 0 ? fmt(toGo, 1) : "🎯"}</b><span>${toGo > 0 ? "kg jusqu'à l'objectif" : "Objectif atteint !"}</span></div>
        <div><b>${fmt(b, 1)}</b><span>IMC</span></div>
        <div><b>${streak} 🔥</b><span>jours keto d'affilée</span></div>
        <div><b>${fmt(avgCarbs, 0)} g</b><span>glucides / jour (7 j)</span></div></div></div>
      <div class="card chart"><h2>Évolution du poids</h2>${weightChart(weights, goal)}</div>
      <div class="card"><h2>Mes journées</h2>
        ${keys.slice().reverse().slice(0, 30).map((k) => {
          const l = p.log[k], tt = totals(l.meals);
          return `<a class="hist" href="#/journal/${k}" style="text-decoration:none;color:inherit"><span>${fmtDate(k)}</span>
            <span class="muted">${l.weight ? fmt(l.weight, 1) + " kg · " : ""}${l.meals.length ? `<span style="color:${tt.carbs > t.carbs ? "var(--red)" : "var(--green)"};font-weight:700">${fmt(tt.carbs)} g gluc.</span>` : "—"}${l.energy != null ? " · " + ["😫", "😕", "🙂", "😃", "🤩"][l.energy] : ""} ›</span></a>`;
        }).join("") || `<div class="empty">Pas encore de données.</div>`}</div>`;
  };

  function weightChart(pts, goal) {
    if (pts.length < 2) return `<div class="empty">Enregistrez votre poids au moins deux fois pour voir la courbe.</div>`;
    const W = 340, H = 180, L = 34, R = 10, T = 12, B = 26;
    const ys = pts.map((p) => p[1]).concat(goal ? [goal] : []);
    let min = Math.floor(Math.min(...ys) - 1), max = Math.ceil(Math.max(...ys) + 1);
    const t0 = parseKey(pts[0][0]).getTime(), t1 = parseKey(pts[pts.length - 1][0]).getTime() || t0 + 1;
    const x = (k) => L + (W - L - R) * ((parseKey(k).getTime() - t0) / Math.max(t1 - t0, 1));
    const y = (v) => T + (H - T - B) * (1 - (v - min) / (max - min));
    const path = pts.map((p, i) => `${i ? "L" : "M"}${x(p[0]).toFixed(1)},${y(p[1]).toFixed(1)}`).join(" ");
    const area = `${path} L${x(pts[pts.length - 1][0]).toFixed(1)},${H - B} L${L},${H - B} Z`;
    const grid = [min, (min + max) / 2, max].map((v) => `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="#ece6da"/>
      <text x="${L - 6}" y="${y(v) + 4}" text-anchor="end" font-size="10" fill="#6b766d">${Math.round(v)}</text>`).join("");
    const goalLine = goal && goal >= min && goal <= max ? `<line x1="${L}" x2="${W - R}" y1="${y(goal)}" y2="${y(goal)}" stroke="#e0a43a" stroke-dasharray="4 4"/>
      <text x="${W - R}" y="${y(goal) - 4}" text-anchor="end" font-size="10" fill="#b07a1c">objectif ${goal} kg</text>` : "";
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Courbe de poids">${grid}${goalLine}
      <path d="${area}" fill="#c8e278" opacity=".35"/><path d="${path}" fill="none" stroke="#28573a" stroke-width="2.5" stroke-linejoin="round"/>
      ${pts.map((p) => `<circle cx="${x(p[0])}" cy="${y(p[1])}" r="3" fill="#28573a"/>`).join("")}
      <text x="${L}" y="${H - 6}" font-size="10" fill="#6b766d">${fmtDate(pts[0][0], { day: "numeric", month: "short" })}</text>
      <text x="${W - R}" y="${H - 6}" font-size="10" fill="#6b766d" text-anchor="end">${fmtDate(pts[pts.length - 1][0], { day: "numeric", month: "short" })}</text></svg>`;
  }

  // ---------- Écran : Profil ----------
  routes.profil = () => {
    const p = P(), t = targets(p);
    setTitle("Mon profil");
    $("#view").innerHTML = `
      <div class="card"><h2>${esc(p.name)}</h2>
        <div class="small muted">Métabolisme de base ≈ ${t.bmr} kcal · Dépense estimée ≈ ${t.tdee} kcal/jour</div></div>
      <div class="card"><h2>Modifier mes informations</h2>${profileForm(p, false)}</div>
      <div class="card"><h2>Famille et sauvegarde</h2>
        <button class="btn light block" id="switch" style="margin-bottom:8px">👨‍👩‍👧 Changer / ajouter un profil</button>
        <button class="btn light block" id="export" style="margin-bottom:8px">📤 Sauvegarder mes données</button>
        <button class="btn light block" id="import" style="margin-bottom:8px">📥 Restaurer une sauvegarde</button>
        <button class="btn danger block" id="del">Supprimer ce profil</button></div>
      <p class="small muted" style="text-align:center">Keto Famille v1.1 · gratuit · hors ligne<br>Vos données restent uniquement sur ce téléphone.<br>Ces conseils ne remplacent pas l'avis d'un médecin.</p>`;
    bindProfileForm((data) => { Object.assign(p, data); save(); toast("Profil mis à jour"); render(); });
    $("#switch").onclick = showProfileSwitcher;
    $("#export").onclick = () => {
      const json = JSON.stringify(db);
      openSheet(`<h2>Sauvegarde</h2><p class="small muted">Copiez ce texte et gardez-le (WhatsApp à vous-même, notes…). Il permet de tout restaurer sur un autre téléphone.</p>
        <textarea rows="6" readonly>${esc(json)}</textarea><button class="btn block" id="cp" style="margin-top:10px">Copier</button>`, (el) => { $("#cp", el).onclick = () => copyText(json); });
    };
    $("#import").onclick = () => openSheet(`<h2>Restaurer</h2><p class="small muted">Collez ici le texte de sauvegarde. Les profils actuels seront remplacés.</p>
      <textarea rows="6" id="imp"></textarea><button class="btn block" id="go" style="margin-top:10px">Restaurer</button>`, (el) => {
      $("#go", el).onclick = () => {
        try { const d = JSON.parse($("#imp", el).value); if (!d.profiles) throw 0; db = d; if (!db.profiles[db.current]) db.current = Object.keys(db.profiles)[0] || null; save(); closeSheet(); toast("Données restaurées"); location.hash = "#/aujourdhui"; render(); }
        catch (e) { toast("Texte de sauvegarde invalide"); }
      };
    });
    $("#del").onclick = () => openSheet(`<h2>Supprimer « ${esc(p.name)} » ?</h2><p class="muted">Tout l'historique de ce profil sera effacé définitivement.</p>
      <button class="btn danger block" id="yes">Oui, supprimer</button><button class="btn ghost block" style="margin-top:8px" id="no">Annuler</button>`, (el) => {
      $("#no", el).onclick = closeSheet;
      $("#yes", el).onclick = () => { delete db.profiles[p.id]; db.current = Object.keys(db.profiles)[0] || null; save(); closeSheet(); location.hash = db.current ? "#/aujourdhui" : "#/nouveau"; render(); };
    });
  };

  render();
})();
