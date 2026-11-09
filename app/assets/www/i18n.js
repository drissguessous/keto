/* Langues de l'application : français (source), arabe (droite à gauche), anglais, espagnol, amazigh (tifinagh).
   - Le choix est gardé sur le téléphone (localStorage « ketofamille_lang »).
   - Les traductions d'une langue sont dans lang/<code>.js (interface, programme, recettes), chargé avant app.js.
   - L'interface est traduite à l'affichage : chaque texte affiché est cherché dans le dictionnaire
     (les nombres sont remplacés par # et le prénom par {name} pour la recherche). */
(function () {
  "use strict";
  var LANGS = {
    fr: { label: "Français", dir: "ltr", locale: "fr-FR" },
    ar: { label: "العربية", dir: "rtl", locale: "ar-MA" },
    en: { label: "English", dir: "ltr", locale: "en-GB" },
    es: { label: "Español", dir: "ltr", locale: "es-ES" },
    zgh: { label: "ⵜⴰⵎⴰⵣⵉⵖⵜ", dir: "ltr", locale: "fr-FR" }
  };
  var KEY = "ketofamille_lang";
  function detect() {
    var nav = (navigator.language || "fr").toLowerCase();
    if (nav.indexOf("ar") === 0) return "ar";
    if (nav.indexOf("en") === 0) return "en";
    if (nav.indexOf("es") === 0) return "es";
    if (nav.indexOf("zgh") === 0 || nav.indexOf("tzm") === 0 || nav.indexOf("ber") === 0) return "zgh";
    return "fr";
  }
  var lang = null;
  try { lang = localStorage.getItem(KEY); } catch (e) {}
  if (!LANGS[lang]) lang = detect();

  var I18N = window.I18N = {
    LANGS: LANGS, lang: lang, locale: LANGS[lang].locale, dict: {}, recipesTranslated: lang === "fr", names: [],
    set: function (code) { try { localStorage.setItem(KEY, code); } catch (e) {} location.reload(); },
    // appelé par lang/<code>.js
    apply: function (data) {
      I18N.dict = data.ui || {};
      I18N.contentLang = data.contentLang || null; // ex. amazigh : recettes et programme en arabe
      if (data.content) {
        ["PROGRAM", "TIPS", "FOODS", "FAQ"].forEach(function (k) { if (data.content[k]) window[k] = data.content[k]; });
      }
      if (data.recipes && window.RECIPES) {
        var n = 0;
        window.RECIPES.forEach(function (r) {
          var t = data.recipes[r.id]; if (!t) return;
          r.title = t.t || r.title; r.steps = t.s || r.steps; r.tips = t.p != null ? t.p : r.tips;
          if (t.i) r.ingredients.forEach(function (ing, k) { if (t.i[k]) ing.name = t.i[k]; });
          n++;
        });
        I18N.recipesTranslated = n > window.RECIPES.length * 0.9;
      }
      if (window.ING_NAMES) Object.keys(window.ING_NAMES).forEach(function (k) {
        var v = I18N.dict[window.ING_NAMES[k]]; if (v) window.ING_NAMES[k] = v;
      });
    }
  };

  var NUM = /\d+(?:[.,]\d+)?/g;
  function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
  // traduit un texte affiché ; renvoie null si inconnu
  I18N.t = function (s) {
    if (lang === "fr" || !s) return null;
    var d = I18N.dict, core = s.trim();
    if (!core) return null;
    var lead = s.slice(0, s.indexOf(core.charAt(0))), trail = s.slice(s.lastIndexOf(core.charAt(core.length - 1)) + 1);
    if (d[core]) return lead + d[core] + trail;
    // modèle : nombres -> #, prénoms -> {name}
    var name = null, tpl = core;
    for (var i = 0; i < I18N.names.length; i++) {
      var nm = I18N.names[i];
      if (nm && tpl.indexOf(nm) >= 0) { name = nm; tpl = tpl.replace(new RegExp(esc(nm), "g"), "{name}"); break; }
    }
    var nums = tpl.match(NUM) || [];
    tpl = tpl.replace(NUM, "#");
    var out = d[tpl];
    if (!out && core.indexOf(" · ") > 0) {
      // texte composé « A · B · C » : on traduit chaque morceau séparément
      var parts = core.split(" · "), anyT = false;
      parts = parts.map(function (p) { var x = I18N.t(p); if (x != null) { anyT = true; return x; } return p; });
      return anyT ? lead + parts.join(" · ") + trail : null;
    }
    if (!out) return null;
    var k = 0;
    out = out.replace(/#/g, function () { return nums[k++] || ""; });
    if (name) out = out.replace(/\{name\}/g, name);
    return lead + out + trail;
  };

  var ATTRS = ["placeholder", "aria-label", "title", "alt"];
  function walk(node) {
    if (node.nodeType === 3) {
      var v = I18N.t(node.nodeValue); if (v != null && v !== node.nodeValue) node.nodeValue = v; return;
    }
    if (node.nodeType !== 1 || node.tagName === "SCRIPT" || node.tagName === "STYLE" || node.tagName === "TEXTAREA") return;
    if (node.hasAttribute && node.hasAttribute("data-notr")) return;
    for (var i = 0; i < ATTRS.length; i++) {
      var a = node.getAttribute(ATTRS[i]);
      if (a) { var t = I18N.t(a); if (t != null && t !== a) node.setAttribute(ATTRS[i], t); }
    }
    for (var c = node.firstChild; c; c = c.nextSibling) walk(c);
  }
  I18N.translateTree = walk;

  // direction et langue du document dès le chargement
  document.documentElement.setAttribute("lang", lang === "zgh" ? "zgh-Tfng" : lang);
  document.documentElement.setAttribute("dir", LANGS[lang].dir);

  if (lang !== "fr") {
    document.write('<script src="lang/' + lang + '.js"><\/script>');
    var start = function () {
      walk(document.body);
      new MutationObserver(function (ms) {
        ms.forEach(function (m) {
          if (m.type === "characterData") walk(m.target);
          else if (m.type === "attributes") walk(m.target);
          else m.addedNodes.forEach(walk);
        });
      }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
  }
})();
