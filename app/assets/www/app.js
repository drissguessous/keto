/* Keto Famille — application hors ligne, données stockées sur le téléphone (localStorage). */
(function () {
  "use strict";

  // Compatibilité anciennes WebView Android (Chrome < 73) et Safari < 12.1
  if (!Object.fromEntries) Object.fromEntries = (it) => { const o = {}; Array.from(it).forEach((kv) => { o[kv[0]] = kv[1]; }); return o; };
  if (window.Promise && !Promise.prototype.finally) Promise.prototype.finally = function (f) { return this.then((v) => { f(); return v; }, (e) => { f(); throw e; }); };

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
  // Virgule décimale française pour les valeurs issues des recettes (ex. 2.2 → « 2,2 »)
  const dc = (n) => String(n == null ? "–" : n).replace(".", ",");
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

  // ---------- Budget (prix moyens relevés au Maroc, en dirhams) ----------
  const PRICE_INFO = window.PRICE_INFO || { updated: "", sources: [] };
  const hasCost = (r) => typeof r.cost === "number";
  const dh = (v) => (v < 10 ? (Math.round(v * 2) / 2).toLocaleString("fr-FR") : Math.round(v)) + " DH";
  const BUDGETS = [[0, "Sans limite"], [15, "Économique"], [25, "Moyen"], [40, "Confort"]];
  const SLOT_SHARE = { "petit-dej": 0.6, dejeuner: 1, diner: 1, collation: 0.4 };
  const slotLimit = (p, slot) => (+p.budget > 0 ? +p.budget * (SLOT_SHARE[slot] || 1) : Infinity);
  function withinBudget(pool, limit) {
    if (limit === Infinity) return pool;
    const ok = pool.filter((r) => !hasCost(r) || r.cost <= limit);
    if (ok.length >= 6) return ok;
    return pool.slice().sort((a, b) => (a.cost || 0) - (b.cost || 0)).slice(0, 12); // budget très serré : les moins chères
  }
  // Prix : base (relevés Maroc) + prix corrigés par l'utilisateur (db.prices, en DH/kg)
  const BASE_PRICES = window.PRICES || {};
  const ING_NAMES = window.ING_NAMES || {};
  // unité d'affichage du prix : œufs à l'unité, le reste au kilo (ou au litre pour les liquides)
  const LIQUIDS = ["huile_olive", "huile_coco", "huile_argan", "huile_tournesol", "lait", "lait_amande", "lait_coco", "creme_liquide", "vinaigre", "sauce_soja", "citron", "bouillon"];
  const priceUnit = (id) => (id === "oeuf" ? { f: 0.06, u: "l'œuf" } : LIQUIDS.includes(id) ? { f: 1, u: "le litre" } : { f: 1, u: "le kg" });
  const priceOf = (id) => { const u = db.prices && db.prices[id]; return u != null ? u : (BASE_PRICES[id] ? BASE_PRICES[id][0] : null); };
  function recomputeCosts() {
    if (!Object.keys(BASE_PRICES).length) return;
    RECIPES.forEach((r) => {
      let tot = 0, ok = true;
      r.ingredients.forEach((i) => { const pr = priceOf(i.ing); if (pr == null) { ok = false; delete i.c; } else { i.c = (i.g || 0) / 1000 * pr; tot += i.c; } });
      if (ok) r.cost = Math.round(tot / r.servings * 10) / 10; else delete r.cost;
    });
  }
  recomputeCosts();
  const menuCost = (m) => Object.values(m).reduce((s, r) => s + (r.cost || 0), 0);

  // Menu du jour : déterministe à partir du numéro de jour, avec remplacements possibles et respect du budget
  function menuFor(p, k) {
    const n = daysBetween(p.startDate, k) + 1000;
    const swaps = (p.swaps && p.swaps[k]) || {};
    const res = {};
    SLOTS.forEach(([slot], i) => {
      const pool = withinBudget(RECIPES.filter((r) => r.category === slot || (slot === "collation" && r.category === "dessert" && n % 3 === 0)), slotLimit(p, slot));
      if (!pool.length) return;
      const pick = pool[(n * (i * 2 + 3) + i * 7) % pool.length];
      res[slot] = byId[swaps[slot]] || pick;
    });
    return res;
  }

  // ---------- Interface générique ----------
  let toastTimer;
  // Message bref ; avec onUndo, un bouton « Annuler » permet de revenir en arrière.
  function toast(msg, onUndo) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.toggle("has-action", !!onUndo);
    if (onUndo) {
      const b = document.createElement("button"); b.type = "button"; b.textContent = "Annuler";
      b.addEventListener("click", () => { t.classList.remove("show"); onUndo(); });
      t.appendChild(b);
    }
    t.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), onUndo ? 5000 : 2600);
  }

  // Feuilles du bas : bouton « Fermer », touche Échap et bouton Retour du téléphone les ferment.
  // Une entrée d'historique est ajoutée à l'ouverture pour que le Retour Android / iOS ferme la feuille
  // au lieu de quitter l'écran en dessous.
  let sheetOpen = false, afterSheet = null, lastFocus = null;
  function openSheet(html, onMount) {
    const card = $("#sheetCard");
    card.innerHTML = `<button type="button" class="sheet-close" aria-label="Fermer">✕ Fermer</button>` + html;
    const h = $("h2", card); if (h) { h.id = "sheetTitle"; card.setAttribute("aria-labelledby", "sheetTitle"); }
    $(".sheet-close", card).addEventListener("click", () => closeSheet());
    $("#sheet").hidden = false; card.scrollTop = 0;
    if (!sheetOpen) { lastFocus = document.activeElement; try { history.pushState({ kfSheet: 1 }, ""); } catch (e) {} }
    sheetOpen = true;
    if (onMount) onMount(card);
  }
  function hideSheet() {
    $("#sheet").hidden = true; sheetOpen = false;
    if (lastFocus && lastFocus.isConnected && lastFocus.focus) { try { lastFocus.focus(); } catch (e) {} }
    lastFocus = null;
  }
  // then : action à exécuter une fois la feuille fermée (ex. changer d'écran)
  function closeSheet(then) {
    if (!sheetOpen) { if (then) then(); return; }
    hideSheet();
    if (history.state && history.state.kfSheet) { afterSheet = then || null; history.back(); }
    else if (then) then();
  }
  window.addEventListener("popstate", (e) => {
    if (sheetOpen) hideSheet();
    // Entrée de feuille restée dans l'historique (feuille fermée par une navigation) : on la saute.
    else if (e.state && e.state.kfSheet && !afterSheet) { history.back(); return; }
    if (afterSheet) { const f = afterSheet; afterSheet = null; f(); }
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && sheetOpen) closeSheet(); });
  $("#sheet").addEventListener("click", (e) => { if (e.target.id === "sheet") closeSheet(); });
  $("#backBtn").addEventListener("click", () => history.back());
  $("#profileChip").addEventListener("click", () => showProfileSwitcher());

  function ring(value, max, color, label, unit) {
    const r = 36, c = 2 * Math.PI * r, pct = Math.min(value / (max || 1), 1);
    const over = value > max;
    return `<div role="img" aria-label="${label} : ${fmt(value)} sur ${fmt(max)} ${unit || "kcal"}${over ? ", limite dépassée" : ""}">
      <div class="ring" aria-hidden="true"><svg width="84" height="84" viewBox="0 0 84 84">
      <circle cx="42" cy="42" r="${r}" fill="none" stroke="#ece6da" stroke-width="8"/>
      <circle cx="42" cy="42" r="${r}" fill="none" stroke="${over ? "var(--red)" : color}" stroke-width="8" stroke-linecap="round"
        stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct)}"/></svg>
      <div class="val">${fmt(value)}<small>/ ${fmt(max)} ${unit}</small></div></div>
      <div class="gauge-label" aria-hidden="true">${label}${over ? ' <b class="over">dépassé</b>' : ""}</div></div>`;
  }

  // ---------- Routeur ----------
  const routes = {};
  let lastHash = null;
  function render() {
    const hash = location.hash.replace(/^#\/?/, "") || "aujourdhui";
    const [name, arg] = hash.split("/");
    const p = P();
    if (sheetOpen && !afterSheet) hideSheet();
    $("#profileChip").textContent = p ? "👤 " + p.name + " ▾" : "";
    $("#profileChip").setAttribute("aria-label", p ? "Profil actif : " + p.name + ". Changer ou ajouter un profil" : "Changer de profil");
    if (!p && name !== "nouveau") { location.replace("#/nouveau"); return; }
    const top = ["aujourdhui", "programme", "recettes", "suivi", "profil"];
    $("#backBtn").hidden = top.includes(name) || name === "nouveau";
    document.querySelectorAll("#tabs a").forEach((a) => {
      const on = a.dataset.tab === name || (name === "recette" && a.dataset.tab === "recettes") || (name === "prix" && a.dataset.tab === "profil");
      a.classList.toggle("active", on);
      if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    $("#tabs").style.display = name === "nouveau" ? "none" : "";
    const fn = routes[name] || routes.aujourdhui;
    // Même écran redessiné (ex. après avoir coché un verre d'eau) : on garde la position de défilement.
    const same = hash === lastHash, y = window.pageYOffset;
    lastHash = hash;
    $("#view").innerHTML = "";
    fn(decodeURIComponent(arg || ""));
    window.scrollTo(0, same ? y : 0);
  }
  window.addEventListener("hashchange", render);
  const setTitle = (t) => ($("#title").textContent = t);

  // ---------- Profil : création / édition ----------
  function profileForm(p, isNew) {
    p = p || { sex: "f", activity: "1.375", goal: "perte", carbLimit: 25 };
    const seg = (name, label, opts, val) => `<div class="f"><span class="f-label" id="lbl-${name}">${label}</span>
      <div class="seg" data-name="${name}" role="group" aria-labelledby="lbl-${name}">${opts.map(([v, l]) => {
        const on = String(val) === String(v);
        return `<button type="button" data-v="${v}" class="${on ? "on" : ""}" aria-pressed="${on}">${l}</button>`;
      }).join("")}</div></div>`;
    const num = (name, label, val, opts) => `<label class="f">${label}<input name="${name}" type="text" inputmode="${opts.dec ? "decimal" : "numeric"}"
      autocomplete="off" required value="${esc(val ? dc(val) : "")}" placeholder="${opts.ph}"></label>`;
    return `<form id="pform" autocomplete="off" novalidate>
      <label class="f">Prénom<input name="name" required maxlength="24" value="${esc(p.name || "")}" placeholder="Ex. Samira"></label>
      ${seg("sex", "Sexe", [["f", "Femme"], ["h", "Homme"]], p.sex)}
      <div class="grid2">
        ${num("age", "Âge (ans)", p.age, { ph: "Ex. 45" })}
        ${num("height", "Taille (cm)", p.height, { ph: "Ex. 165" })}
        ${num("weight", isNew ? "Poids actuel (kg)" : "Poids de départ (kg)", p.weight, { dec: 1, ph: "Ex. 78,5" })}
        ${num("goalWeight", "Poids visé (kg)", p.goalWeight, { dec: 1, ph: "Ex. 70" })}
      </div>
      ${isNew ? "" : `<p class="hint" style="margin-top:-6px">Le poids de départ sert de point de comparaison. Pour noter votre poids du jour, utilisez l'onglet Suivi.</p>`}
      ${seg("goal", "Objectif", [["perte", "Perdre du poids"], ["maintien", "Maintenir"]], p.goal)}
      <label class="f">Activité physique<select name="activity">
        ${[["1.2", "Sédentaire (bureau, peu de marche)"], ["1.375", "Légère (marche, 1–2 séances/sem.)"], ["1.55", "Modérée (3–4 séances/sem.)"], ["1.725", "Intense (sport quotidien)"]]
          .map(([v, l]) => `<option value="${v}" ${String(p.activity) === v ? "selected" : ""}>${l}</option>`).join("")}
      </select></label>
      ${seg("carbLimit", "Glucides nets par jour", [[20, "20 g strict"], [25, "25 g"], [30, "30 g souple"]], p.carbLimit)}
      <p class="hint" style="margin-top:-8px">Vous débutez ? Gardez 25 g, c'est le bon compromis.</p>
      ${seg("budget", "Budget par repas et par personne", BUDGETS.map(([v, l]) => [v, v ? l + " · " + v + " DH" : l]), p.budget == null ? (isNew ? 25 : 0) : p.budget)}
      <p class="hint" style="margin-top:-8px">Les menus proposés respectent ce budget (petit-déjeuner ≈ 60 %, collation ≈ 40 %). Prix moyens constatés au Maroc.</p>
      <label class="f">Date de début du programme<input name="startDate" type="date" required value="${esc(p.startDate || dkey())}"></label>
      ${isNew ? `<p class="warn">⚠️ Le keto ne convient pas à tout le monde. Parlez-en à votre médecin avant de commencer si vous êtes enceinte ou allaitez, avez un diabète traité, une maladie des reins ou du foie, un traitement pour la tension, ou des antécédents de troubles alimentaires. Réservé aux adultes.</p>` : ""}
      <p class="form-error" id="pformErr" role="alert" hidden></p>
      <button class="btn block" type="submit">${isNew ? "Commencer mon programme" : "Enregistrer"}</button>
    </form>`;
  }
  function bindProfileForm(onSave) {
    const f = $("#pform");
    f.querySelectorAll(".seg").forEach((s) => s.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      s.querySelectorAll("button").forEach((x) => { x.classList.toggle("on", x === b); x.setAttribute("aria-pressed", String(x === b)); });
    }));
    const err = $("#pformErr", f);
    f.addEventListener("input", (e) => { if (e.target.getAttribute("aria-invalid")) { e.target.removeAttribute("aria-invalid"); err.hidden = true; } });
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(f).entries());
      f.querySelectorAll(".seg").forEach((s) => { const on = $("button.on", s); if (on) data[s.dataset.name] = on.dataset.v; });
      ["age", "height", "weight", "goalWeight", "carbLimit", "budget"].forEach((k) => (data[k] = parseFloat(String(data[k] || "").replace(",", "."))));
      data.name = String(data.name || "").trim();
      // Vérifications avec un message clair et le champ concerné mis en évidence
      const checks = [
        ["name", !data.name, "Indiquez un prénom."],
        ["age", !(data.age >= 18 && data.age <= 99), "L'âge doit être compris entre 18 et 99 ans (programme réservé aux adultes)."],
        ["height", !(data.height >= 120 && data.height <= 230), "Indiquez la taille en centimètres, par exemple 165."],
        ["weight", !(data.weight >= 35 && data.weight <= 250), "Indiquez le poids en kilos, par exemple 78,5."],
        ["goalWeight", !(data.goalWeight >= 35 && data.goalWeight <= 250), "Indiquez le poids visé en kilos, par exemple 70."],
        ["goalWeight", data.goal === "perte" && data.goalWeight >= data.weight, "Pour perdre du poids, le poids visé doit être inférieur au poids actuel."],
        ["startDate", !data.startDate, "Choisissez une date de début."]
      ];
      const bad = checks.filter((c) => c[1])[0];
      if (bad) {
        const input = f.elements[bad[0]];
        err.textContent = bad[2]; err.hidden = false;
        if (input) { input.setAttribute("aria-invalid", "true"); input.focus(); }
        return;
      }
      err.hidden = true;
      onSave(data);
    });
  }

  routes.nouveau = () => {
    setTitle("Bienvenue");
    const first = !Object.keys(db.profiles).length;
    const onlyDemo = !first && Object.keys(db.profiles).every((id) => db.profiles[id].demo);
    $("#view").innerHTML = `
      ${first ? `<div class="welcome"><img src="icon.png" alt=""><h2>Keto Famille</h2>
        <p class="muted">Un programme keto simple sur 4 semaines, des recettes complètes et un suivi au quotidien. Gratuit, sans compte, vos données restent sur ce téléphone.</p>
        <button class="btn ghost block" id="demo" type="button">👀 Juste regarder : essayer avec un profil de démonstration</button></div>` : ""}
      <div class="card"><h2>${first || onlyDemo ? "Créons votre profil" : "Nouveau membre de la famille"}</h2>
        <p class="hint" style="margin-top:-4px">Environ 1 minute. Ces informations servent à calculer vos repères du jour.</p>${profileForm(null, true)}</div>
      ${first ? "" : `<button class="btn ghost block" type="button" id="cancelNew">Annuler</button>`}`;
    const c = $("#cancelNew"); if (c) c.addEventListener("click", () => history.back());
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
      activity: "1.375", carbLimit: 25, budget: 25, startDate: dkey(start), log: {}, favorites: [], swaps: {}, demo: true };
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
    openSheet(`<h2>Qui utilise l'application ?</h2>
      <p class="hint" style="margin-top:-6px">Chaque membre de la famille a son propre profil, son menu et son suivi.</p>
      ${list.map((p) => { const cur = p.id === db.current;
        return `<button class="btn ${cur ? "" : "light"} block profile-btn" style="margin-bottom:8px" data-id="${p.id}" ${cur ? 'aria-current="true"' : ""}>
          <span>👤 ${esc(p.name)}</span>${cur ? `<span class="small">✓ Profil actif</span>` : ""}</button>`; }).join("")}
      <button class="btn ghost block" id="addP">＋ Ajouter un membre de la famille</button>`, (el) => {
      el.querySelectorAll("[data-id]").forEach((b) => b.addEventListener("click", () => {
        db.current = b.dataset.id; save(); closeSheet(); toast("Profil : " + P().name); render();
      }));
      $("#addP", el).addEventListener("click", () => closeSheet(() => { location.hash = "#/nouveau"; }));
    });
  }

  // ---------- Journal ----------
  function mealFrom(r, portions = 1) {
    const m = r.macros;
    return { rid: r.id, name: r.title, emoji: r.emoji, portions,
      kcal: Math.round(m.kcal * portions), fat: Math.round(m.fat * portions), protein: Math.round(m.protein * portions), carbs: Math.round(m.carbs * portions * 10) / 10 };
  }
  function addMeal(r, portions = 1, k = dkey()) {
    const p = P(), meals = dayLog(p, k).meals, m = mealFrom(r, portions);
    meals.push(m); save();
    toast("Ajouté au journal ✓", () => { const i = meals.indexOf(m); if (i >= 0) { meals.splice(i, 1); save(); render(); } });
  }
  // Carte de saisie du poids, utilisée sur « Aujourd'hui » et « Suivi »
  const ENERGY = [["😫", "Épuisé"], ["😕", "Fatigué"], ["🙂", "Correct"], ["😃", "En forme"], ["🤩", "Super"]];
  function weightCard(log, title) {
    return `<div class="card"><h2>${title}</h2>
      <label class="f" for="wIn" style="margin-bottom:6px">Mon poids aujourd'hui (kg)</label>
      <div class="row" style="margin-bottom:6px">
        <input id="wIn" class="search" type="text" inputmode="decimal" autocomplete="off" placeholder="Ex. 78,5" value="${log.weight ? dc(log.weight) : ""}">
        <button class="btn" id="wSave" type="button">Enregistrer</button></div>
      <p class="hint" style="margin:0 0 14px">${log.weight ? `✓ Déjà noté aujourd'hui : <b>${fmt(log.weight, 1)} kg</b>. Vous pouvez le corriger.` : "Conseil : pesez-vous le matin, à jeun."}</p>
      <div class="f-label" id="enLbl">Mon énergie aujourd'hui</div>
      <div class="emoji-pick" role="group" aria-labelledby="enLbl">${ENERGY.map(([e, l], i) =>
        `<button type="button" data-en="${i}" class="${log.energy === i ? "on" : ""}" aria-pressed="${log.energy === i}" aria-label="${l}"><span aria-hidden="true">${e}</span><small aria-hidden="true">${l}</small></button>`).join("")}</div>
    </div>`;
  }
  function bindWeightCard(log) {
    const v = $("#view");
    v.querySelectorAll("[data-en]").forEach((b) => b.addEventListener("click", () => { log.energy = +b.dataset.en; save(); render(); }));
    const go = () => {
      const w = parseFloat(String($("#wIn").value).replace(",", "."));
      if (!w || w < 30 || w > 300) { $("#wIn").setAttribute("aria-invalid", "true"); $("#wIn").focus(); return toast("Indiquez un poids en kilos, par exemple 78,5"); }
      log.weight = Math.round(w * 10) / 10; save(); toast("Poids enregistré : " + fmt(log.weight, 1) + " kg"); render();
    };
    $("#wSave").addEventListener("click", go);
    $("#wIn").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); go(); } });
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
      ${p.demo ? `<div class="card demo-banner"><b>👀 Vous essayez l'application avec un profil de démonstration.</b>
        <span class="small">Les données sont inventées pour l'exemple.</span>
        <a class="btn block" href="#/nouveau" style="margin-top:10px">Créer mon vrai profil</a></div>` : ""}
      <div class="card hero">
        <div class="row spread"><span class="badge">${day <= 28 ? `Jour ${day} / 28` : "Programme terminé 🎉"}</span>
          <span class="small muted">${fmtDate(k, { weekday: "long", day: "numeric", month: "long" })}</span></div>
        <h2 style="margin-top:12px">${h < 12 ? "Bonjour" : h < 18 ? "Bon après-midi" : "Bonsoir"} ${esc(p.name)} 👋</h2>
        <div class="muted">Semaine ${wk} · ${esc(week.title)} — ${esc(week.subtitle)}</div>
        <div class="progress" style="margin-top:12px"><div style="width:${Math.min(day, 28) / 28 * 100}%"></div></div>
      </div>

      <div class="card">
        <h2>Mes compteurs du jour</h2>
        <div class="gauges">
          ${ring(Math.round(tot.carbs), t.carbs, "var(--avocado-ink)", "Glucides nets", "g")}
          ${ring(tot.protein, t.protein, "var(--green-2)", "Protéines", "g")}
          ${ring(tot.kcal, t.kcal, "var(--amber-ink)", "Calories", "kcal")}
        </div>
        <p class="hint" style="margin:10px 0 0;text-align:center">Le plus important : rester sous ${t.carbs} g de glucides nets.</p>
        <div class="row" style="gap:8px;margin-top:12px">
          <a class="btn light grow" href="#/journal">📋 Mon journal${log.meals.length ? ` (${log.meals.length})` : ""}</a>
          <button class="btn light grow" type="button" id="quickAdd">＋ Ajouter un repas</button></div>
      </div>

      <div class="card">
        <div class="row spread" style="align-items:baseline"><h2 style="margin-bottom:2px">Menu du jour</h2>${menuCost(menu) ? `<span class="cost-pill" title="Coût estimé par personne">≈ ${dh(menuCost(menu))} / pers.</span>` : ""}</div>
        ${+p.budget > 0 ? `<p class="hint" style="margin:0 0 2px">Budget choisi : ${p.budget} DH par repas et par personne (modifiable dans Profil).</p>` : ""}
        <p class="hint" style="margin:0 0 4px">Touchez un plat pour voir la recette. Après le repas, touchez « J'ai mangé ».</p>
        <div>${SLOTS.map(([slot, label]) => {
          const r = menu[slot]; if (!r) return "";
          const eaten = log.meals.some((m) => m.rid === r.id);
          return `<div class="meal"><a class="emoji illus" data-photo="${r.id}" href="#/recette/${r.id}" style="text-decoration:none" tabindex="-1" aria-hidden="true">${illus(r, 48)}</a>
            <a class="grow" href="#/recette/${r.id}" style="text-decoration:none;color:inherit">
              <div class="slot">${label}</div><div class="name">${esc(r.title)}</div>
              <div class="meta">${dc(r.macros.carbs)} g glucides · ${r.macros.kcal} kcal${hasCost(r) ? " · ≈ " + dh(r.cost) : ""}</div></a>
            <div class="meal-actions">
              <button class="mini-btn ${eaten ? "on" : ""}" type="button" data-eat="${r.id}" aria-pressed="${eaten}" aria-label="${eaten ? "Mangé : " + esc(r.title) + ". Toucher pour retirer du journal" : "J'ai mangé : " + esc(r.title)}">${eaten ? "✓ Mangé" : "J'ai mangé"}</button>
              <button class="mini-btn ghost" type="button" data-swap="${slot}" aria-label="Changer : ${label}">🔄 Changer</button></div></div>`;
        }).join("")}</div>
      </div>

      <div class="card">
        <div class="row spread"><h2 style="margin:0">Eau</h2><span class="small muted" aria-live="polite">${log.water} / 8 verres</span></div>
        <p class="hint" style="margin:4px 0 0">Touchez un verre à chaque fois que vous buvez (1 verre ≈ 25 cl).</p>
        <div class="water" role="group" aria-label="Verres d'eau bus aujourd'hui" style="margin-top:10px">${Array.from({ length: 8 }, (_, i) =>
          `<button type="button" data-w="${i + 1}" class="${i < log.water ? "on" : ""}" aria-pressed="${i < log.water}" aria-label="${i + 1} verre${i ? "s" : ""}">💧</button>`).join("")}</div>
        ${log.water ? `<button type="button" class="link-btn" id="wMinus">− Retirer un verre</button>` : ""}
      </div>

      ${weightCard(log, "Mon bilan rapide")}

      <div class="card">
        <h2>Objectifs de la semaine ${wk}</h2>
        ${week.goals.map((g, i) => `<label class="check ${log.tasks[i] ? "done" : ""}"><input type="checkbox" data-task="${i}" ${log.tasks[i] ? "checked" : ""}><span>${esc(g)}</span></label>`).join("")}
      </div>

      <div class="card tip"><div class="tip-title">💡 Conseil du jour</div>${esc(tip)}</div>
    `;
    const v = $("#view");
    v.querySelectorAll("[data-eat]").forEach((b) => b.addEventListener("click", () => {
      const idx = log.meals.findIndex((m) => m.rid === b.dataset.eat);
      if (idx >= 0) {
        const removed = log.meals.splice(idx, 1)[0]; save();
        toast("Retiré du journal", () => { log.meals.splice(idx, 0, removed); save(); render(); });
      } else addMeal(byId[b.dataset.eat]);
      render();
    }));
    v.querySelectorAll("[data-swap]").forEach((b) => b.addEventListener("click", () => swapMeal(b.dataset.swap, k)));
    v.querySelectorAll("[data-w]").forEach((b) => b.addEventListener("click", () => {
      const n = +b.dataset.w; log.water = log.water === n ? n - 1 : n; save(); render();
      if (log.water === 8) toast("Bravo, objectif eau atteint 💧");
    }));
    const wm = $("#wMinus"); if (wm) wm.addEventListener("click", () => { log.water = Math.max(0, log.water - 1); save(); render(); });
    $("#quickAdd").addEventListener("click", () => quickAddSheet(k));
    v.querySelectorAll("[data-task]").forEach((c) => c.addEventListener("change", () => { log.tasks[c.dataset.task] = c.checked; save(); render(); }));
    bindWeightCard(log);
  };

  // « Ajouter un repas » : trois chemins clairs pour noter ce que l'on a mangé
  function quickAddSheet(k) {
    openSheet(`<h2>Ajouter ce que j'ai mangé</h2>
      <a class="btn light block choice" href="#/recettes"><span class="ce" aria-hidden="true">🥑</span><span><b>Une recette de l'application</b><small>Cherchez-la puis touchez « Ajouter au journal »</small></span></a>
      <button class="btn light block choice" type="button" id="qaFree"><span class="ce" aria-hidden="true">✏️</span><span><b>Autre chose</b><small>Un aliment ou un plat préparé autrement</small></span></button>
      <a class="btn light block choice" href="#/journal/${k}"><span class="ce" aria-hidden="true">📋</span><span><b>Voir mon journal du jour</b><small>Tout ce que j'ai noté aujourd'hui</small></span></a>`, (el) => {
      el.querySelectorAll("a").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); const h = a.getAttribute("href"); closeSheet(() => { location.hash = h; }); }));
      $("#qaFree", el).addEventListener("click", () => freeFoodSheet(dayLog(P(), k)));
    });
  }
  function freeFoodSheet(log) {
    openSheet(`<h2>Ajouter un aliment</h2><form id="ff" novalidate>
      <label class="f">Qu'avez-vous mangé ?<input name="name" required placeholder="Ex. une poignée d'amandes"></label>
      <p class="hint" style="margin-top:-6px">Les valeurs sont facultatives. Si vous ne les connaissez pas, laissez vide.</p>
      <div class="grid2"><label class="f">Glucides nets (g)<input name="carbs" type="text" inputmode="decimal" placeholder="0"></label>
      <label class="f">Protéines (g)<input name="protein" type="text" inputmode="decimal" placeholder="0"></label>
      <label class="f">Lipides (g)<input name="fat" type="text" inputmode="decimal" placeholder="0"></label>
      <label class="f">Calories<input name="kcal" type="text" inputmode="numeric" placeholder="calcul auto"></label></div>
      <p class="form-error" id="ffErr" role="alert" hidden></p>
      <button class="btn block" type="submit">Ajouter au journal</button></form>`, (el) => {
      $("#ff", el).addEventListener("submit", (e) => {
        e.preventDefault(); const d = Object.fromEntries(new FormData(e.target).entries());
        if (!String(d.name || "").trim()) { const er = $("#ffErr", el); er.textContent = "Indiquez ce que vous avez mangé."; er.hidden = false; e.target.elements.name.focus(); return; }
        const n = (x) => +String(x || 0).replace(",", ".") || 0;
        const m = { name: d.name.trim(), emoji: "🍽️", portions: 1, carbs: n(d.carbs), protein: n(d.protein), fat: n(d.fat) };
        m.kcal = n(d.kcal) || Math.round(m.carbs * 4 + m.protein * 4 + m.fat * 9);
        log.meals.push(m); save(); closeSheet(); toast("Ajouté au journal ✓", () => { const i = log.meals.indexOf(m); if (i >= 0) { log.meals.splice(i, 1); save(); render(); } }); render();
      });
    });
  }

  function swapMeal(slot, k) {
    const p = P(); const pool = RECIPES.filter((r) => r.category === slot || (slot === "collation" && r.category === "dessert"));
    const label = SLOTS.find((s) => s[0] === slot)[1];
    const hasSwap = p.swaps && p.swaps[k] && p.swaps[k][slot];
    openSheet(`<h2>Remplacer : ${label}</h2>
      <p class="hint" style="margin-top:-6px">${pool.length} idées. Touchez celle qui vous fait envie.</p>
      ${hasSwap ? `<button class="btn ghost block" type="button" id="unswap" style="margin-bottom:10px">↩︎ Revenir au plat proposé</button>` : ""}
      <div class="recipe-list">${pool.map((r) => `<button type="button" class="recipe-item" style="border:0;text-align:left;width:100%" data-r="${r.id}">
        <div class="emoji illus" data-photo="${r.id}" aria-hidden="true">${illus(r, 58)}</div><div class="grow"><h3>${esc(r.title)}</h3><div class="meta">${dc(r.macros.carbs)} g glucides · ${r.prep + r.cook} min</div></div></button>`).join("")}</div>`, (el) => {
      el.querySelectorAll("[data-r]").forEach((b) => b.addEventListener("click", () => {
        p.swaps = p.swaps || {}; p.swaps[k] = p.swaps[k] || {}; p.swaps[k][slot] = b.dataset.r; save(); closeSheet(); toast("Plat remplacé"); render();
      }));
      const u = $("#unswap", el); if (u) u.addEventListener("click", () => { delete p.swaps[k][slot]; save(); closeSheet(); render(); });
    });
  }

  // ---------- Écran : Journal ----------
  routes.journal = (arg) => {
    const p = P(), k = arg || dkey(), log = dayLog(p, k), t = targets(p), tot = totals(log.meals);
    const isToday = k === dkey();
    setTitle(isToday ? "Mon journal du jour" : "Journal · " + fmtDate(k));
    const pct = (v, m) => Math.min(100, Math.round(v / (m || 1) * 100));
    const bar = (label, v, m, unit, dec) => `<div class="mbar"><div class="row spread"><span>${label}</span>
      <span><b class="${v > m ? "over-txt" : ""}">${fmt(v, dec || 0)}</b> / ${m} ${unit}${v > m ? " · dépassé" : ""}</span></div>
      <div class="progress" aria-hidden="true"><div style="width:${pct(v, m)}%;background:${v > m ? "var(--red)" : "var(--green-2)"}"></div></div></div>`;
    $("#view").innerHTML = `
      ${isToday ? "" : `<p class="hint" style="margin:0 4px 10px">Journal du ${fmtDate(k, { weekday: "long", day: "numeric", month: "long" })}</p>`}
      <div class="card"><h2>Total de la journée</h2>
        ${bar("Glucides nets", tot.carbs, t.carbs, "g", 0)}
        ${bar("Protéines", tot.protein, t.protein, "g")}
        ${bar("Lipides", tot.fat, t.fat, "g")}
        ${bar("Calories", tot.kcal, t.kcal, "kcal")}</div>
      <div class="card"><h2>Ce que j'ai mangé</h2>
        ${log.meals.length ? log.meals.map((m, i) => `<div class="meal"><div class="emoji" aria-hidden="true">${m.emoji || "🍽️"}</div>
          <div class="grow"><div class="name">${esc(m.name)}</div><div class="meta">${m.portions !== 1 ? dc(m.portions) + " portions · " : ""}${dc(m.carbs)} g glucides · ${m.protein} g prot. · ${m.kcal} kcal</div></div>
          <button class="mini-btn danger" type="button" data-del="${i}" aria-label="Retirer ${esc(m.name)} du journal">✕ Retirer</button></div>`).join("")
          : `<div class="empty">Rien de noté ${isToday ? "pour l'instant" : "ce jour-là"}.<br>Ajoutez un plat ci-dessous.</div>`}
      </div>
      <a class="btn block" href="#/recettes">🥑 Ajouter une recette de l'application</a>
      <button class="btn light block" type="button" id="addFree" style="margin-top:10px">✏️ Ajouter autre chose</button>`;
    $("#view").querySelectorAll("[data-del]").forEach((b) => b.addEventListener("click", () => {
      const i = +b.dataset.del, removed = log.meals.splice(i, 1)[0]; save(); render();
      toast("Retiré du journal", () => { log.meals.splice(i, 0, removed); save(); render(); });
    }));
    $("#addFree").addEventListener("click", () => freeFoodSheet(log));
  };

  // ---------- Écran : Programme ----------
  routes.programme = () => {
    const p = P(), t = targets(p), day = programDay(p), wk = programWeek(p);
    setTitle("Mon programme");
    $("#view").innerHTML = `
      <div class="card hero"><span class="badge">Mes objectifs quotidiens</span>
        <div class="macros" style="margin-top:12px">
          ${[["Glucides nets", t.carbs + " g"], ["Protéines", t.protein + " g"], ["Lipides", t.fat + " g"], ["Calories", t.kcal]].map(([l, v]) =>
            `<div style="background:rgba(255,255,255,.14)"><b>${v}</b><span style="color:#fff">${l}</span></div>`).join("")}</div>
        <p class="small" style="margin:12px 0 0">Calculé à partir de votre profil${p.goal === "perte" ? " avec un déficit modéré de 20 %" : ""}. Les glucides sont la règle d'or ; les calories sont un repère, mangez à votre faim.</p>
      </div>
      <div class="section-title">4 semaines pour s'installer</div>
      ${PROGRAM.filter((w) => w.week === wk).map((w) => `<div class="card week current"><div class="num">${w.week}</div>
        <div class="grow"><div class="row spread"><h3 style="font-size:16px">${esc(w.title)}</h3><span class="badge">En cours</span></div>
        <div class="small muted" style="margin:2px 0 8px">${esc(w.subtitle)}</div>
        <p style="margin:0 0 8px;font-size:14.5px">${esc(w.text)}</p>
        <ul style="margin:0;padding-left:18px;font-size:14px">${w.goals.map((g) => `<li>${esc(g)}</li>`).join("")}</ul></div></div>`).join("")}
      <div class="card">${PROGRAM.filter((w) => w.week !== wk).map((w) => `<details><summary>Semaine ${w.week} · ${esc(w.title)}${w.week < wk ? " ✓" : ""}</summary>
        <p class="small muted" style="margin:6px 0 4px">${esc(w.subtitle)}</p><p>${esc(w.text)}</p>
        <ul style="margin:8px 0 0;padding-left:18px;font-size:14px">${w.goals.map((g) => `<li>${esc(g)}</li>`).join("")}</ul></details>`).join("")}</div>
      <div class="section-title">Menus de la semaine</div>
      <div class="card">${Array.from({ length: 7 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() + i); const k = dkey(d); const m = menuFor(p, k);
        return `<details ${i === 0 ? "open" : ""}><summary>${i === 0 ? "Aujourd'hui" : fmtDate(k, { weekday: "long", day: "numeric", month: "short" })}</summary>
          ${SLOTS.map(([s, l]) => m[s] ? `<a class="meal" href="#/recette/${m[s].id}" style="text-decoration:none;color:inherit"><div class="emoji" aria-hidden="true" style="width:44px;height:44px;font-size:22px">${m[s].emoji}</div>
          <div class="grow"><div class="slot">${l}</div><div class="name" style="font-size:14.5px">${esc(m[s].title)}</div></div></a>` : "").join("")}</details>`;
      }).join("")}
        <button class="btn light block" id="shop" style="margin-top:10px">🛒 Liste de courses des 7 jours</button></div>
      <div class="section-title">Guide des aliments</div>
      <div class="card">
        <details><summary>✅ À privilégier</summary>${foodList(FOODS.oui)}</details>
        <details><summary>⚖️ Avec modération</summary>${foodList(FOODS.modere)}</details>
        <details><summary>⛔ À éviter</summary>${foodList(FOODS.non)}</details></div>
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
        agg[key] = agg[key] || { name: ing.name, g: 0, c: 0 };
        agg[key].g += (ing.g || 0) / (r.servings || 1);
        agg[key].c += (ing.c || 0) / (r.servings || 1);
      }));
    }
    const items = Object.entries(agg).map(([k, v]) => {
      const it = { name: v.name, unit: "g", qty: v.g, c: v.c };
      if (k === "oeuf") { it.qty = Math.max(1, Math.round(v.g / 60)); it.unit = ""; it.name = "œufs"; }
      else if (v.g < 5) { it.qty = 0; }
      else it.qty = v.g >= 50 ? Math.ceil(v.g / 50) * 50 : Math.ceil(v.g / 5) * 5;
      return it;
    }).sort((a, b) => a.name.localeCompare(b.name, "fr"));
    const total = items.reduce((s, i) => s + (i.c || 0), 0);
    const text = items.map((i) => "• " + (i.qty ? fmtQty(i.qty) + " " + i.unit + " " : "") + i.name + (i.c >= 1 ? " (≈ " + dh(i.c) + ")" : "")).join("\n") + (total ? "\n\nTotal estimé : ≈ " + dh(total) : "");
    openSheet(`<h2>🛒 Courses pour 7 jours (1 personne)</h2>
      ${total ? `<div class="cost-total">Budget estimé : <b>≈ ${dh(total)}</b> pour 7 jours, soit ≈ ${dh(total / 7)} par jour et par personne.</div>` : ""}
      <p class="hint" style="margin-top:-6px">Multipliez les quantités selon le nombre de personnes à table. Cochez au fur et à mesure dans le magasin.</p>
      <button class="btn light block" type="button" id="copyList" style="margin-bottom:8px">📋 Copier la liste (pour WhatsApp, notes…)</button>
      ${items.map((i) => `<label class="check"><input type="checkbox"><span class="grow">${i.qty ? `<b>${fmtQty(i.qty)} ${esc(i.unit)}</b> ` : ""}${esc(i.name)}</span>${i.c >= 0.5 ? `<span class="muted small">≈ ${dh(i.c)}</span>` : ""}</label>`).join("")}
      ${total ? `<p class="hint">Prix moyens constatés au Maroc${PRICE_INFO.updated ? " (" + esc(PRICE_INFO.updated) + ")" : ""}, à titre indicatif. Les quantités entamées (huile, épices…) servent plusieurs semaines : la dépense réelle est souvent plus faible. <a href="#/prix" class="link-btn" id="toPrix">Ajuster mes prix</a></p>` : ""}`, (el) => {
      $("#copyList", el).addEventListener("click", () => copyText(text));
      el.querySelectorAll(".check input").forEach((c) => c.addEventListener("change", () => c.parentNode.classList.toggle("done", c.checked)));
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
  // Filtres avancés : base du repas, temps, budget, glucides, calories, difficulté, tri
  const BASES = [
    ["oeufs", "🥚 Œufs", ["oeuf", "blanc_oeuf", "jaune_oeuf"]],
    ["poulet", "🍗 Poulet", ["poulet_blanc", "poulet_cuisse", "poulet_entier", "foie_volaille"]],
    ["dinde", "🦃 Dinde", ["dinde", "dinde_fumee"]],
    ["boeuf", "🥩 Bœuf / kefta", ["boeuf_hache", "boeuf_steak", "boeuf_ragout", "kefta"]],
    ["agneau", "🍖 Agneau", ["agneau_epaule", "agneau_cotelette", "merguez"]],
    ["veau", "🥩 Veau", ["veau"]],
    ["saumon", "🐟 Saumon", ["saumon", "saumon_fume"]],
    ["thon", "🐟 Thon", ["thon_frais", "thon_boite", "thon_huile"]],
    ["sardine", "🐟 Sardines / maquereau", ["sardine", "sardine_boite", "maquereau"]],
    ["poissonblanc", "🐟 Poisson blanc", ["merlan", "dorade", "loup", "cabillaud"]],
    ["mer", "🦐 Fruits de mer", ["crevette", "calamar", "moules", "surimi"]],
    ["fromage", "🧀 Fromage", ["mozzarella", "mozzarella_rapee", "emmental", "cheddar", "parmesan", "feta", "chevre", "halloumi", "edam", "jben", "ricotta", "fromage_creme", "mascarpone"]],
    ["tofu", "🧊 Tofu", ["tofu"]],
    ["choufleur", "🥦 Chou-fleur / brocoli", ["chou_fleur", "brocoli"]],
    ["courgette", "🥒 Courgette", ["courgette"]],
    ["aubergine", "🍆 Aubergine", ["aubergine"]],
    ["epinard", "🥬 Épinards / salade", ["epinard", "laitue", "roquette"]],
    ["champignon", "🍄 Champignons", ["champignon"]],
    ["avocat", "🥑 Avocat", ["avocat"]],
    ["amande", "🌰 Amande / noix", ["amande", "farine_amande", "amande_effilee", "noix", "noisette", "pecan", "macadamia"]],
    ["coco", "🥥 Coco", ["noix_coco_rapee", "farine_coco", "lait_coco", "creme_coco", "huile_coco"]],
    ["chocolat", "🍫 Chocolat / cacao", ["cacao", "chocolat_noir"]]
  ];
  const SORTS = [["", "Pertinence"], ["cost", "Moins cher"], ["time", "Plus rapide"], ["carbs", "Moins de glucides"], ["protein", "Plus de protéines"], ["kcal", "Moins de calories"]];
  let adv = { bases: [], time: 0, cost: 0, carbs: 0, kcal: 0, diff: "", sort: "" };
  const advCount = () => adv.bases.length + ["time", "cost", "carbs", "kcal", "diff"].filter((k) => adv[k]).length + (adv.sort ? 1 : 0);
  // les bases sont recherchées parmi les ingrédients principaux (en poids) de la recette
  const mainIngs = (r) => r._main || (r._main = r.ingredients.slice().sort((a, b) => (b.g || 0) - (a.g || 0)).slice(0, 4).map((i) => i.ing));
  routes.recettes = () => {
    const p = P();
    setTitle("Recettes keto");
    $("#view").innerHTML = `
      <label for="q" class="sr-only">Rechercher une recette ou un ingrédient</label>
      <div class="search-wrap"><span class="search-ico" aria-hidden="true">🔍</span>
        <input class="search" id="q" type="search" enterkeyhint="search" placeholder="Recette ou ingrédient (ex. poulet)" value="${esc(recQuery)}">
        <button type="button" class="search-clear" id="qClear" aria-label="Effacer la recherche" ${recQuery ? "" : "hidden"}>✕</button></div>
      <div class="chips-label" id="lblC1">Type de plat</div>
      <div class="chips" id="chips" role="group" aria-labelledby="lblC1">${[["tout", "Toutes"], ["fav", "❤️ Favoris"], ...Object.entries(CATS)]
        .map(([v, l]) => `<button type="button" data-c="${v}" class="${recFilter === v ? "on" : ""}" aria-pressed="${recFilter === v}">${l}</button>`).join("")}</div>
      <div class="chips-label" id="lblC2">Ingrédient principal et envies</div>
      <div class="chips" id="chips2" role="group" aria-labelledby="lblC2">${[["", "Tout"], ["volaille", "🍗 Volaille"], ["viande", "🥩 Viande"], ["poisson", "🐟 Poisson"], ["vege", "🥬 Végétarien"], ["rapide", "⚡ Rapide (20 min max)"], ["marocain", "🇲🇦 Marocain"], ["low", "📉 Très peu de glucides (3 g max)"], ["eco", "💰 Petit budget (15 DH max)"]]
        .map(([v, l]) => `<button type="button" data-c="${v}" class="${recFilter2 === v ? "on" : ""}" aria-pressed="${recFilter2 === v}">${l}</button>`).join("")}</div>
      <button type="button" class="btn ghost block" id="advBtn" style="margin-top:10px">⚙️ Plus de filtres : base du repas, temps, budget, tri${advCount() ? ` <span class="badge">${advCount()}</span>` : ""}</button>
      <div class="row spread" style="margin:6px 4px 0"><div class="small muted" id="rcount" aria-live="polite"></div>
        <button type="button" class="link-btn" id="resetF" hidden>Effacer les filtres</button></div>
      <div class="recipe-list" id="rlist"></div>
      <button class="btn light block" id="more" type="button" style="margin-top:12px" hidden>Afficher plus de recettes</button>`;
    const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    let list = [], shown = 0;
    const item = (r) => `<a class="recipe-item" href="#/recette/${r.id}"><div class="emoji illus" data-photo="${r.id}" aria-hidden="true">${illus(r, 58)}</div>
        <div class="grow"><h3>${esc(r.title)} ${p.favorites.includes(r.id) ? '<span class="fav" aria-label="favori">♥</span>' : ""}</h3>
        <div class="meta">${CATS[r.category] || ""} · ${r.prep + r.cook} min · ${dc(r.macros.carbs)} g glucides · ${r.macros.kcal} kcal${hasCost(r) ? " · ≈ " + dh(r.cost) + "/pers." : ""}</div></div></a>`;
    const more = () => {
      const next = list.slice(shown, shown + 30); shown += next.length;
      $("#rlist").insertAdjacentHTML("beforeend", next.map(item).join(""));
      $("#more").hidden = shown >= list.length;
      if (!$("#more").hidden) $("#more").textContent = "Afficher plus de recettes (" + (list.length - shown) + " restantes)";
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
        if (recFilter2 === "eco" && !(hasCost(r) && r.cost <= 15)) return false;
        if (adv.bases.length && !adv.bases.some((b) => { const ids = BASES.filter((x) => x[0] === b)[0][2]; return mainIngs(r).some((i) => ids.includes(i)); })) return false;
        if (adv.time && r.prep + r.cook > adv.time) return false;
        if (adv.cost && !(hasCost(r) && r.cost <= adv.cost)) return false;
        if (adv.carbs && r.macros.carbs > adv.carbs) return false;
        if (adv.kcal && r.macros.kcal > adv.kcal) return false;
        if (adv.diff && r.difficulty !== adv.diff) return false;
        if (q && !(r._s || (r._s = norm(r.title + " " + r.ingredients.map((i) => i.name).join(" ") + " " + (r.tags || []).join(" ")))).includes(q)) return false;
        return true;
      });
      const key = { cost: (r) => (hasCost(r) ? r.cost : 999), time: (r) => r.prep + r.cook, carbs: (r) => r.macros.carbs, protein: (r) => -r.macros.protein, kcal: (r) => r.macros.kcal }[adv.sort];
      if (key) list.sort((a, b) => key(a) - key(b));
      const filtered = recFilter !== "tout" || recFilter2 !== "" || q || advCount();
      shown = 0; $("#rlist").innerHTML = list.length ? "" : `<div class="empty">Aucune recette ne correspond${filtered ? " à ces choix" : ""}.
        ${filtered ? `<br><button type="button" class="btn light" id="resetF2" style="margin-top:12px">Effacer la recherche et les filtres</button>` : ""}</div>`;
      $("#rcount").textContent = list.length + (list.length > 1 ? " recettes" : " recette");
      $("#resetF").hidden = !filtered;
      $("#qClear").hidden = !recQuery;
      const r2 = $("#resetF2"); if (r2) r2.addEventListener("click", reset);
      more();
    };
    const syncChips = () => ["#chips", "#chips2"].forEach((sel, n) => $(sel).querySelectorAll("button").forEach((x) => {
      const on = x.dataset.c === (n ? recFilter2 : recFilter); x.classList.toggle("on", on); x.setAttribute("aria-pressed", String(on));
    }));
    const reset = () => { recFilter = "tout"; recFilter2 = ""; recQuery = ""; adv = { bases: [], time: 0, cost: 0, carbs: 0, kcal: 0, diff: "", sort: "" }; $("#q").value = ""; syncChips(); paintAdvBtn(); draw(); };
    const paintAdvBtn = () => { $("#advBtn").innerHTML = "⚙️ Plus de filtres : base du repas, temps, budget, tri" + (advCount() ? ` <span class="badge">${advCount()}</span>` : ""); };
    const opt = (name, v, label, cur) => `<button type="button" data-k="${name}" data-v="${v}" class="${String(cur) === String(v) ? "on" : ""}" aria-pressed="${String(cur) === String(v)}">${label}</button>`;
    $("#advBtn").addEventListener("click", () => {
      const draft = JSON.parse(JSON.stringify(adv));
      const body = () => `<h2>Filtres et tri</h2>
        <div class="chips-label">Base du repas (une ou plusieurs)</div>
        <div class="chips wrap" data-group="bases">${BASES.map(([v, l]) => `<button type="button" data-k="bases" data-v="${v}" class="${draft.bases.includes(v) ? "on" : ""}" aria-pressed="${draft.bases.includes(v)}">${l}</button>`).join("")}</div>
        ${[["Temps total", "time", [[0, "Peu importe"], [15, "15 min max"], [30, "30 min max"], [45, "45 min max"], [60, "1 h max"]]],
           ["Budget par portion", "cost", [[0, "Peu importe"], [10, "10 DH max"], [15, "15 DH max"], [25, "25 DH max"], [40, "40 DH max"]]],
           ["Glucides nets par portion", "carbs", [[0, "Peu importe"], [3, "3 g max"], [5, "5 g max"], [8, "8 g max"]]],
           ["Calories par portion", "kcal", [[0, "Peu importe"], [300, "300 kcal max"], [500, "500 kcal max"], [700, "700 kcal max"]]],
           ["Difficulté", "diff", [["", "Peu importe"], ["Facile", "Facile"], ["Moyen", "Moyen"]]],
           ["Trier par", "sort", SORTS]].map(([t, n, o]) => `<div class="chips-label">${t}</div><div class="chips wrap" data-group="${n}">${o.map(([v, l]) => opt(n, v, l, draft[n])).join("")}</div>`).join("")}
        <div class="row" style="gap:8px;margin-top:16px"><button type="button" class="btn ghost grow" id="advReset">Tout effacer</button><button type="button" class="btn grow" id="advApply">Voir les recettes</button></div>`;
      const mount = (el) => {
        el.querySelectorAll("[data-k]").forEach((b) => b.addEventListener("click", () => {
          const k = b.dataset.k, v = b.dataset.v;
          if (k === "bases") { const i = draft.bases.indexOf(v); if (i >= 0) draft.bases.splice(i, 1); else draft.bases.push(v); }
          else draft[k] = (k === "diff" || k === "sort") ? v : +v;
          el.innerHTML = body(); mount(el);
        }));
        $("#advReset", el).addEventListener("click", () => { draft.bases = []; ["time", "cost", "carbs", "kcal"].forEach((k) => (draft[k] = 0)); draft.diff = ""; draft.sort = ""; el.innerHTML = body(); mount(el); });
        $("#advApply", el).addEventListener("click", () => { adv = draft; closeSheet(); paintAdvBtn(); draw(); });
      };
      openSheet(body(), mount);
    });
    let timer;
    $("#q").addEventListener("input", (e) => { recQuery = e.target.value; clearTimeout(timer); timer = setTimeout(draw, 180); });
    $("#q").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); clearTimeout(timer); draw(); e.target.blur(); } });
    $("#qClear").addEventListener("click", () => { recQuery = ""; $("#q").value = ""; draw(); $("#q").focus(); });
    $("#resetF").addEventListener("click", reset);
    const bindChips = (sel, set) => $(sel).addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return; set(b.dataset.c); syncChips(); draw();
    });
    bindChips("#chips", (v) => (recFilter = v));
    bindChips("#chips2", (v) => (recFilter2 = v));
    $("#more").addEventListener("click", more);
    draw();
  };

  // ---------- Écran : Mes prix ----------
  let prixQuery = "", prixMine = false;
  routes.prix = (focus) => {
    setTitle("Mes prix");
    db.prices = db.prices || {};
    const ids = Object.keys(BASE_PRICES).filter((id) => !["eau", "sel"].includes(id));
    const norm = (x) => x.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    $("#view").innerHTML = `
      <div class="card"><h2>Des prix au plus juste</h2>
        <p style="margin:0">Les coûts des recettes, des menus et de la liste de courses sont calculés avec des <b>prix moyens constatés au Maroc</b>${PRICE_INFO.updated ? " (" + esc(PRICE_INFO.updated) + ")" : ""}. Si vous payez un produit plus ou moins cher, corrigez-le ici : tout se recalcule automatiquement.</p>
        <p class="hint" style="margin:8px 0 0">Vos prix restent sur ce téléphone et valent pour tous les profils de la famille.</p></div>
      <div class="search-wrap"><input class="search" id="pq" type="search" placeholder="🔍 Chercher un produit (poulet, tomate, fromage…)" value="${esc(prixQuery)}" aria-label="Chercher un produit"></div>
      <div class="chips" id="pchips"><button type="button" data-m="0" class="${prixMine ? "" : "on"}">Tous les produits</button><button type="button" data-m="1" class="${prixMine ? "on" : ""}">✏️ Mes prix modifiés (${Object.keys(db.prices).length})</button></div>
      <div class="card" id="plist" style="padding-top:6px"></div>
      ${Object.keys(db.prices).length ? `<button type="button" class="btn ghost block" id="pResetAll">Revenir à tous les prix moyens</button>` : ""}`;
    const draw = () => {
      const q = norm(prixQuery.trim());
      const list = ids.filter((id) => (!prixMine || db.prices[id] != null) && (!q || norm(ING_NAMES[id] || id).includes(q)))
        .sort((a, b) => (ING_NAMES[a] || a).localeCompare(ING_NAMES[b] || b, "fr"));
      $("#plist").innerHTML = list.length ? list.map((id) => {
        const u = priceUnit(id), mine = db.prices[id] != null, v = priceOf(id) * u.f;
        return `<button type="button" class="price-row" data-id="${id}"><span class="grow"><b>${esc(ING_NAMES[id] || id)}</b>
          <span class="small ${mine ? "mine" : "muted"}">${mine ? "✏️ Mon prix" : BASE_PRICES[id][1] ? "Prix moyen estimé" : "Prix moyen Maroc"}</span></span>
          <span class="price">${dh(v)}<small> ${u.u}</small></span></button>`;
      }).join("") : `<div class="empty">Aucun produit trouvé.</div>`;
      $("#plist").querySelectorAll("[data-id]").forEach((b) => b.addEventListener("click", () => editPrice(b.dataset.id, draw)));
    };
    let tm;
    $("#pq").addEventListener("input", (e) => { prixQuery = e.target.value; clearTimeout(tm); tm = setTimeout(draw, 150); });
    $("#pchips").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; prixMine = b.dataset.m === "1";
      $("#pchips").querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b)); draw(); });
    const ra = $("#pResetAll"); if (ra) ra.addEventListener("click", () => openSheet(`<h2>Revenir aux prix moyens ?</h2><p>Vos ${Object.keys(db.prices).length} prix modifiés seront remplacés par les prix moyens constatés au Maroc.</p>
      <button type="button" class="btn ghost block" id="no">Non, garder mes prix</button><button type="button" class="btn danger block" style="margin-top:8px" id="yes">Oui, revenir aux prix moyens</button>`, (el) => {
      $("#no", el).onclick = () => closeSheet();
      $("#yes", el).onclick = () => { db.prices = {}; save(); recomputeCosts(); closeSheet(); toast("Prix moyens rétablis"); render(); };
    }));
    draw();
    if (focus && BASE_PRICES[focus]) editPrice(focus, draw);
  };
  function editPrice(id, after) {
    const u = priceUnit(id), base = BASE_PRICES[id][0] * u.f, mine = db.prices && db.prices[id] != null;
    const cur = priceOf(id) * u.f;
    openSheet(`<h2>${esc(ING_NAMES[id] || id)}</h2>
      <p class="hint" style="margin-top:-6px">Prix moyen constaté au Maroc : <b>${dh(base)}</b> ${u.u}${BASE_PRICES[id][1] ? " (estimation)" : ""}.</p>
      <label class="f">Mon prix en dirhams, ${u.u}<input id="pv" type="text" inputmode="decimal" value="${String(Math.round(cur * 100) / 100).replace(".", ",")}" aria-describedby="pvErr"></label>
      <p class="form-error" id="pvErr" role="alert" hidden></p>
      <button type="button" class="btn block" id="pSave">Enregistrer mon prix</button>
      ${mine ? `<button type="button" class="btn ghost block" id="pBack" style="margin-top:8px">Revenir au prix moyen (${dh(base)})</button>` : ""}`, (el) => {
      const inp = $("#pv", el); setTimeout(() => { try { inp.focus(); inp.select(); } catch (e) {} }, 50);
      const done = (msg) => { save(); recomputeCosts(); closeSheet(); toast(msg); if (after) after(); };
      $("#pSave", el).onclick = () => {
        const v = parseFloat(String(inp.value).replace(",", ".").replace(/[^0-9.]/g, ""));
        if (!(v > 0 && v < 100000)) { const e = $("#pvErr", el); e.textContent = "Indiquez un prix en dirhams, par exemple 25 ou 12,50."; e.hidden = false; inp.setAttribute("aria-invalid", "true"); return; }
        db.prices = db.prices || {}; db.prices[id] = v / u.f; done("Prix enregistré, coûts recalculés");
      };
      const bk = $("#pBack", el); if (bk) bk.onclick = () => { delete db.prices[id]; done("Prix moyen rétabli"); };
    });
  }

  routes.recette = (id) => {
    const r = byId[id], p = P();
    if (!r) { location.replace("#/recettes"); return; }
    let serv = r.servings;
    setTitle(r.title);
    const paint = () => {
      const fav = p.favorites.includes(r.id);
      $("#view").innerHTML = `
        <div class="card r-hero" style="padding:0;overflow:hidden"><div class="r-illus" data-photo="${r.id}" data-big="1" style="background:linear-gradient(135deg,${(CAT_BG[r.category] || CAT_BG.dejeuner).join(",")})">${illus(r, 190)}</div>
          <div style="padding:14px 16px 18px"><h2>${esc(r.title)}</h2>
          <div class="meta">${CATS[r.category] || ""} · ${r.difficulty} · Préparation ${r.prep} min${r.cook ? ` · Cuisson ${r.cook} min` : ""} · ${r.servings} pers.</div>
          <div class="tags">${(r.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div></div></div>
        <div class="card"><h2>Valeurs nutritionnelles par portion</h2><div class="macros">
          <div><b>${dc(r.macros.carbs)} g</b><span>Glucides nets</span></div><div><b>${dc(r.macros.protein)} g</b><span>Protéines</span></div>
          <div><b>${dc(r.macros.fat)} g</b><span>Lipides</span></div><div><b>${r.macros.kcal}</b><span>kcal</span></div></div>
          ${(() => { const t = targets(p); const pc = (v, m) => Math.round(v / m * 100);
            return `<div class="small muted" style="margin-top:10px">Une portion = ${pc(r.macros.carbs, t.carbs)} % de vos glucides du jour, ${pc(r.macros.protein, t.protein)} % de vos protéines et ${pc(r.macros.kcal, t.kcal)} % de vos calories.</div>`; })()}
          <div class="row" style="margin-top:14px;gap:8px">
            <button class="btn grow" type="button" id="eat">＋ J'en ai mangé : ajouter au journal</button>
            <button class="btn light fav-btn ${fav ? "is-fav" : ""}" type="button" id="fav" aria-pressed="${fav}" aria-label="${fav ? "Retirer des favoris" : "Ajouter aux favoris"}">${fav ? "♥" : "♡"}<small>${fav ? "Favori" : "Favori"}</small></button></div></div>
        ${hasCost(r) ? `<div class="card"><div class="row spread" style="align-items:baseline"><h2 style="margin:0">Coût estimé</h2><span class="cost-pill">≈ ${dh(r.cost)} / portion</span></div>
          <p style="margin:8px 0 4px">Soit environ <b>${dh(r.cost * serv)}</b> pour ${serv} personne${serv > 1 ? "s" : ""}.${+p.budget > 0 ? (r.cost <= slotLimit(p, r.category === "petit-dej" ? "petit-dej" : r.category === "collation" || r.category === "dessert" ? "collation" : "dejeuner") ? " ✅ Dans votre budget." : " ⚠️ Au-dessus de votre budget.") : ""}</p>
          <details><summary>Détail par ingrédient</summary><ul class="ing">${r.ingredients.filter((i) => i.c > 0.05).sort((a, b) => b.c - a.c).map((i) =>
            `<li><span class="q">≈ ${dh(i.c * serv / r.servings)}</span><span class="grow">${esc(i.name)}${db.prices && db.prices[i.ing] != null ? ' <span class="mine small">✏️ mon prix</span>' : ""}</span><a class="link-btn" href="#/prix/${i.ing}" aria-label="Modifier le prix : ${esc(i.name)}">Modifier</a></li>`).join("")}</ul>
            <p class="hint">Prix moyens de détail constatés au Maroc${PRICE_INFO.updated ? " (" + esc(PRICE_INFO.updated) + ")" : ""} en grande surface et au marché. Les prix varient selon la ville, la saison et le magasin : c'est une estimation.</p></details></div>` : ""}
        <div class="card"><div class="row spread" style="margin-bottom:8px;flex-wrap:wrap"><h2 style="margin:0">Ingrédients</h2>
          <div class="stepper" role="group" aria-label="Nombre de personnes"><button type="button" id="minus" aria-label="Une personne de moins" ${serv <= 1 ? "disabled" : ""}>−</button>
            <b aria-live="polite">${serv} pers.</b><button type="button" id="plus" aria-label="Une personne de plus" ${serv >= 12 ? "disabled" : ""}>+</button></div></div>
          ${serv !== r.servings ? `<p class="hint" style="margin:0 0 6px">Quantités ajustées pour ${serv} personnes (recette prévue pour ${r.servings}).</p>` : ""}
          <ul class="ing">${r.ingredients.map((i) => `<li><span class="q">${i.qty ? scaleQty(i, serv / r.servings) + " " + esc(i.unit || "") : esc(i.unit || "")}</span><span>${esc(i.name)}</span></li>`).join("")}</ul></div>
        <div class="card"><h2>Préparation</h2><p class="hint" style="margin:-4px 0 6px">Touchez une étape quand elle est faite pour la griser.</p>
          <ol class="steps">${r.steps.map((s, i) => `<li role="button" tabindex="0" aria-pressed="false" data-step="${i}">${esc(s)}</li>`).join("")}</ol></div>
        ${r.tips ? `<div class="card tip"><div class="tip-title">💡 Astuce</div>${esc(r.tips)}</div>` : ""}`;
      $("#minus").onclick = () => { if (serv > 1) { serv--; paint(); } };
      $("#plus").onclick = () => { if (serv < 12) { serv++; paint(); } };
      $("#fav").onclick = () => {
        p.favorites = fav ? p.favorites.filter((x) => x !== r.id) : [...p.favorites, r.id]; save();
        toast(fav ? "Retiré des favoris" : "Ajouté aux favoris ♥ (retrouvez-les dans Recettes › Favoris)"); paint();
      };
      $("#eat").onclick = () => openSheet(`<h2>Quelle quantité avez-vous mangée ?</h2>
        <p class="hint" style="margin-top:-6px">1 portion = ${dc(r.macros.carbs)} g de glucides nets, ${r.macros.kcal} kcal.</p>
        <div class="portion-grid">${[[0.5, "½ portion", "petite part"], [1, "1 portion", "part normale"], [1.5, "1 portion ½", "bonne part"], [2, "2 portions", "double part"]].map(([n, l, s]) =>
          `<button type="button" class="btn light" data-n="${n}"><span>${l}</span><small>${s}</small></button>`).join("")}</div>`, (el) => {
        el.querySelectorAll("[data-n]").forEach((b) => b.addEventListener("click", () => { closeSheet(); addMeal(r, +b.dataset.n); }));
      });
      $("#view").querySelectorAll("ol.steps li").forEach((li) => {
        const tog = () => { li.classList.toggle("done"); li.setAttribute("aria-pressed", String(li.classList.contains("done"))); };
        li.addEventListener("click", tog);
        li.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tog(); } });
      });
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
    const lastK = weights.length ? weights[weights.length - 1][0] : null;
    const curLabel = lastK === dkey() ? "kg aujourd'hui" : lastK ? "kg (dernière pesée, " + fmtDate(lastK, { day: "numeric", month: "short" }) + ")" : "kg actuellement";
    const bmiTxt = b == null ? "" : b < 18.5 ? "maigreur" : b < 25 ? "normal" : b < 30 ? "surpoids" : "obésité";
    const todayLog = dayLog(p, dkey());
    setTitle("Mon suivi");
    $("#view").innerHTML = `
      ${weightCard(todayLog, "Noter mon poids")}
      <div class="card"><h2>Mon bilan</h2><div class="stats">
        <div><b style="color:var(--green)">${lost >= 0 ? "−" : "+"}${fmt(Math.abs(lost), 1)}</b><span>kg depuis le début</span></div>
        <div><b>${fmt(cur, 1)}</b><span>${curLabel}</span></div>
        <div><b>${toGo > 0 ? fmt(toGo, 1) : "🎯"}</b><span>${toGo > 0 ? "kg avant l'objectif (" + fmt(goal, 1) + " kg)" : "Objectif atteint !"}</span></div>
        <div><b>${fmt(b, 1)}</b><span>IMC${bmiTxt ? " · " + bmiTxt : ""}</span></div>
        <div><b>${streak} <span aria-hidden="true">🔥</span></b><span>jours d'affilée sous ${t.carbs} g de glucides</span></div>
        <div><b>${fmt(avgCarbs, 0)} g</b><span>glucides par jour en moyenne (7 derniers jours)</span></div></div>
        <p class="hint" style="margin:10px 0 0">L'IMC est un repère général ; il ne tient pas compte de la musculature.</p></div>
      <div class="card chart"><h2>Évolution du poids</h2>${weightChart(weights, goal)}</div>
      <div class="card"><h2>Mes journées</h2>
        <p class="hint" style="margin:-4px 0 6px">Touchez un jour pour voir ou corriger ce qui a été mangé.</p>
        ${keys.slice().reverse().slice(0, 30).map((k) => {
          const l = p.log[k], tt = totals(l.meals);
          return `<a class="hist" href="#/journal/${k}" style="text-decoration:none;color:inherit"><span>${k === dkey() ? "Aujourd'hui" : fmtDate(k)}</span>
            <span class="muted">${l.weight ? fmt(l.weight, 1) + " kg · " : ""}${l.meals.length ? `<span style="color:${tt.carbs > t.carbs ? "var(--red)" : "var(--green)"};font-weight:700">${fmt(tt.carbs)} g gluc.${tt.carbs > t.carbs ? " ⚠︎" : ""}</span>` : "rien noté"}${l.energy != null ? ' · <span role="img" aria-label="énergie : ' + ENERGY[l.energy][1] + '">' + ENERGY[l.energy][0] + "</span>" : ""} ›</span></a>`;
        }).join("") || `<div class="empty">Pas encore de données.</div>`}</div>`;
    bindWeightCard(todayLog);
  };

  function weightChart(pts, goal) {
    if (pts.length < 2) return `<div class="empty">Notez votre poids au moins deux jours différents pour voir la courbe (ci-dessus, « Noter mon poids »).</div>`;
    const W = 340, H = 190, L = 36, R = 10, T = 12, B = 26;
    const ys = pts.map((p) => p[1]).concat(goal ? [goal] : []);
    let min = Math.floor(Math.min(...ys) - 1), max = Math.ceil(Math.max(...ys) + 1);
    const t0 = parseKey(pts[0][0]).getTime(), t1 = parseKey(pts[pts.length - 1][0]).getTime() || t0 + 1;
    const x = (k) => L + (W - L - R) * ((parseKey(k).getTime() - t0) / Math.max(t1 - t0, 1));
    const y = (v) => T + (H - T - B) * (1 - (v - min) / (max - min));
    const path = pts.map((p, i) => `${i ? "L" : "M"}${x(p[0]).toFixed(1)},${y(p[1]).toFixed(1)}`).join(" ");
    const area = `${path} L${x(pts[pts.length - 1][0]).toFixed(1)},${H - B} L${L},${H - B} Z`;
    const grid = [min, (min + max) / 2, max].map((v) => `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="#ece6da"/>
      <text x="${L - 6}" y="${y(v) + 4}" text-anchor="end" font-size="12" fill="#5d685f">${Math.round(v)}</text>`).join("");
    const goalLine = goal && goal >= min && goal <= max ? `<line x1="${L}" x2="${W - R}" y1="${y(goal)}" y2="${y(goal)}" stroke="#e0a43a" stroke-dasharray="4 4"/>
      <text x="${W - R}" y="${y(goal) - 4}" text-anchor="end" font-size="12" fill="#8a5a0f">objectif ${goal} kg</text>` : "";
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Courbe de poids : de ${fmt(pts[0][1], 1)} kg le ${fmtDate(pts[0][0], { day: "numeric", month: "long" })} à ${fmt(pts[pts.length - 1][1], 1)} kg le ${fmtDate(pts[pts.length - 1][0], { day: "numeric", month: "long" })}">${grid}${goalLine}
      <path d="${area}" fill="#c8e278" opacity=".35"/><path d="${path}" fill="none" stroke="#28573a" stroke-width="2.5" stroke-linejoin="round"/>
      ${pts.map((p) => `<circle cx="${x(p[0])}" cy="${y(p[1])}" r="3" fill="#28573a"/>`).join("")}
      <text x="${L}" y="${H - 6}" font-size="12" fill="#5d685f">${fmtDate(pts[0][0], { day: "numeric", month: "short" })}</text>
      <text x="${W - R}" y="${H - 6}" font-size="12" fill="#5d685f" text-anchor="end">${fmtDate(pts[pts.length - 1][0], { day: "numeric", month: "short" })}</text></svg>`;
  }

  // ---------- Écran : Profil ----------
  routes.profil = () => {
    const p = P(), t = targets(p);
    setTitle("Mon profil");
    const nb = Object.keys(db.profiles).length;
    $("#view").innerHTML = `
      <div class="card"><h2>${esc(p.name)}${p.demo ? ` <span class="badge">Démonstration</span>` : ""}</h2>
        <div class="small muted">Métabolisme de base ≈ ${t.bmr} kcal · Dépense estimée ≈ ${t.tdee} kcal/jour</div>
        ${p.demo ? `<p class="hint" style="margin:8px 0 0">Ceci est un profil d'essai avec des données inventées. Créez votre propre profil quand vous êtes prêt(e), puis supprimez celui-ci.</p>` : ""}</div>
      <div class="card"><h2>Ma famille</h2>
        <p class="hint" style="margin-top:-4px">${nb > 1 ? nb + " profils sur ce téléphone." : "Un seul profil pour l'instant."} Chacun a son menu et son suivi.</p>
        <a class="btn light block" href="#/prix" style="margin-bottom:8px">💰 Mes prix : ajuster les prix des produits</a>
        <button class="btn block" type="button" id="switch">👨‍👩‍👧 Changer de profil ou ajouter un membre</button></div>
      <div class="card"><h2>Modifier mes informations</h2>${profileForm(p, false)}</div>
      <div class="card"><h2>Réglages et sauvegarde</h2>
        <label class="check" style="margin-bottom:8px"><input type="checkbox" id="photosToggle" ${db.photos !== false ? "checked" : ""}><span>Afficher de vraies photos des plats (Wikimedia Commons, nécessite internet)</span></label>
        <p class="hint">Vos données restent sur ce téléphone. Pensez à faire une sauvegarde de temps en temps, surtout avant de changer de téléphone.</p>
        <button class="btn light block" type="button" id="export" style="margin-bottom:8px">📤 Sauvegarder mes données</button>
        <button class="btn light block" type="button" id="import" style="margin-bottom:8px">📥 Restaurer une sauvegarde</button>
        <button class="btn danger block" type="button" id="del">🗑️ Supprimer le profil de ${esc(p.name)}</button></div>
      <p class="small muted" style="text-align:center">Keto Famille v1.4 · gratuit · fonctionne hors ligne<br>Vos données restent uniquement sur ce téléphone.<br>Ces conseils ne remplacent pas l'avis d'un médecin.</p>`;
    bindProfileForm((data) => { Object.assign(p, data); save(); toast("Profil mis à jour ✓"); render(); });
    $("#switch").onclick = showProfileSwitcher;
    $("#photosToggle").onchange = (e) => { db.photos = e.target.checked; save(); toast(db.photos ? "Photos activées" : "Photos désactivées"); };
    $("#export").onclick = () => {
      const json = JSON.stringify(db);
      openSheet(`<h2>Sauvegarder mes données</h2>
        <ol class="howto"><li>Touchez <b>Copier la sauvegarde</b>.</li><li>Collez-la dans un message WhatsApp envoyé à vous-même, ou dans vos notes.</li>
        <li>Pour la récupérer : Profil › <b>Restaurer une sauvegarde</b>, puis collez le texte.</li></ol>
        <button class="btn block" type="button" id="cp">📋 Copier la sauvegarde</button>
        <details style="margin-top:10px"><summary class="small">Voir le texte de sauvegarde</summary><textarea rows="5" readonly aria-label="Texte de sauvegarde">${esc(json)}</textarea></details>`, (el) => { $("#cp", el).onclick = () => copyText(json); });
    };
    $("#import").onclick = () => openSheet(`<h2>Restaurer une sauvegarde</h2><p class="small muted">Collez ici le texte de sauvegarde copié précédemment.</p>
      <textarea rows="6" id="imp" aria-label="Texte de sauvegarde à restaurer" placeholder="Collez le texte ici (appui long › Coller)"></textarea>
      <p class="warn" style="margin-top:10px">⚠️ Tous les profils actuellement sur ce téléphone seront remplacés par ceux de la sauvegarde.</p>
      <p class="form-error" id="impErr" role="alert" hidden></p>
      <button class="btn block" type="button" id="go" style="margin-top:10px">Remplacer par cette sauvegarde</button>`, (el) => {
      $("#go", el).onclick = () => {
        let d = null;
        try { d = JSON.parse($("#imp", el).value); if (!d || !d.profiles || typeof d.profiles !== "object") d = null; } catch (e) { d = null; }
        if (!d) { const er = $("#impErr", el); er.textContent = "Ce texte n'est pas une sauvegarde Keto Famille. Vérifiez qu'il a été collé en entier."; er.hidden = false; return; }
        const names = Object.keys(d.profiles).map((id) => d.profiles[id].name).join(", ");
        openSheet(`<h2>Confirmer la restauration ?</h2><p>La sauvegarde contient : <b>${esc(names || "aucun profil")}</b>.</p>
          <p class="muted">Les profils actuels seront effacés et remplacés.</p>
          <button class="btn block" type="button" id="yesImp">Oui, restaurer</button><button class="btn ghost block" type="button" style="margin-top:8px" id="noImp">Annuler</button>`, (el2) => {
          $("#noImp", el2).onclick = () => closeSheet();
          $("#yesImp", el2).onclick = () => {
            db = d; if (!db.profiles[db.current]) db.current = Object.keys(db.profiles)[0] || null; save(); recomputeCosts();
            closeSheet(() => { toast("Données restaurées ✓"); location.hash = db.current ? "#/aujourdhui" : "#/nouveau"; render(); });
          };
        });
      };
    });
    $("#del").onclick = () => openSheet(`<h2>Supprimer « ${esc(p.name)} » ?</h2><p class="muted">Tout l'historique de ce profil (repas, poids, suivi) sera effacé définitivement. Les autres profils ne sont pas touchés.</p>
      <button class="btn ghost block" type="button" id="no">Non, garder ce profil</button>
      <button class="btn danger block" type="button" style="margin-top:8px" id="yes">Oui, supprimer définitivement</button>`, (el) => {
      $("#no", el).onclick = () => closeSheet();
      $("#yes", el).onclick = () => {
        delete db.profiles[p.id]; db.current = Object.keys(db.profiles)[0] || null; save();
        closeSheet(() => { toast("Profil supprimé"); location.hash = db.current ? "#/aujourdhui" : "#/nouveau"; render(); });
      };
    });
  };

  // ---------- Photos réelles (Wikimedia Commons, licences libres) ----------
  // Le téléphone cherche une photo du plat sur Wikimedia Commons, la met en cache
  // et affiche l'auteur et la licence. Hors connexion : l'illustration reste affichée.
  const KW = window.PHOTO_KEYWORDS || {};
  const PKEY = "ketofamille_photos_v1";
  let pcache = {};
  try { pcache = JSON.parse(localStorage.getItem(PKEY)) || {}; } catch (e) { pcache = {}; }
  const psave = () => { try { localStorage.setItem(PKEY, JSON.stringify(pcache)); } catch (e) {} };
  const photosOn = () => db.photos !== false;
  const strip = (h) => { const d = document.createElement("div"); d.innerHTML = h || ""; return (d.textContent || "").trim().replace(/\s+/g, " "); };
  const pending = {}; let active = 0; const queue = [];
  function commonsSearch(q) {
    const url = "https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrnamespace=6&gsrlimit=8" +
      "&gsrsearch=" + encodeURIComponent(q + " filetype:bitmap") + "&prop=imageinfo&iiprop=url|mime|size|extmetadata&iiurlwidth=640";
    return fetch(url).then((r) => r.json()).then((d) => {
      const pages = Object.values((d.query && d.query.pages) || {}).sort((a, b) => a.index - b.index);
      for (const pg of pages) {
        const ii = pg.imageinfo && pg.imageinfo[0]; if (!ii) continue;
        if (!/jpeg|png|webp/.test(ii.mime) || ii.width < 400 || ii.height < 300) continue;
        const m = ii.extmetadata || {};
        const lic = strip(m.LicenseShortName && m.LicenseShortName.value);
        if (!lic) continue;
        return { u: ii.thumburl || ii.url, a: strip(m.Artist && m.Artist.value).slice(0, 60) || "Auteur inconnu", l: lic };
      }
      return null;
    });
  }
  function lookup(id) {
    const c = pcache[id];
    if (c && (c.u || Date.now() - (c.t || 0) < 7 * 864e5)) return Promise.resolve(c.u ? c : null);
    if (pending[id]) return pending[id];
    const r = byId[id]; if (!r) return Promise.resolve(null);
    const kw = KW[id] || [r.title, CATS[r.category] || "food"];
    pending[id] = new Promise((res) => queue.push(() => {
      active++;
      commonsSearch(kw[0]).then((x) => x || commonsSearch(kw[1])).then((x) => {
        pcache[id] = x ? Object.assign(x, { t: Date.now() }) : { t: Date.now() }; psave(); res(x);
      }).catch(() => res(null)).finally(() => { active--; delete pending[id]; pump(); });
    }));
    pump();
    return pending[id];
  }
  function pump() { while (active < 3 && queue.length) queue.shift()(); }
  function applyPhoto(el, x) {
    if (!x || !el.isConnected || el.dataset.done) return;
    const img = new Image();
    img.onload = () => {
      el.dataset.done = "1"; el.classList.add("has-photo");
      el.innerHTML = "";
      img.className = "photo"; img.alt = "";
      el.appendChild(img);
      if (el.dataset.big) {
        const cr = document.createElement("div"); cr.className = "credit";
        cr.textContent = "Photo : " + x.a + " · " + x.l + " · Wikimedia Commons (illustration du type de plat)";
        el.appendChild(cr);
      }
    };
    img.src = x.u;
  }
  const io = "IntersectionObserver" in window ? new IntersectionObserver((ents) => ents.forEach((e) => {
    if (!e.isIntersecting) return; io.unobserve(e.target);
    lookup(e.target.dataset.photo).then((x) => applyPhoto(e.target, x));
  }), { rootMargin: "200px" }) : null;
  function hydrate(root) {
    if (!photosOn() || !navigator.onLine && !Object.keys(pcache).length) return;
    root.querySelectorAll("[data-photo]:not([data-seen])").forEach((el) => {
      el.dataset.seen = "1";
      const c = pcache[el.dataset.photo];
      if (c && c.u) { applyPhoto(el, c); return; }
      if (!navigator.onLine) return;
      if (io) io.observe(el); else lookup(el.dataset.photo).then((x) => applyPhoto(el, x));
    });
  }
  new MutationObserver(() => hydrate(document.body)).observe(document.body, { childList: true, subtree: true });

  render();
})();
