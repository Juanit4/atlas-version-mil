/* =========================================================================
   ATLAS · ROUTER (una sola web, cuatro vistas)
   #intro      → ¿Qué es ATLAS?  (SIEMPRE es la entrada: primera visita o la número mil)
   #umbral     → elegir mirada y puerta      (#umbral/mirada abre directo el cambio de mirada)
   #recorrido  → caminar el parque           (#recorrido/capa-seguridad, #recorrido/compara)
   #archivo    → consultar la evidencia      (#archivo/procesa, #archivo/normativa…)
   #oportunidades → explorar oportunidades (abierto para todos) + ATLAS Norte
   #compara    → comparar parques (página propia, desde el botón de arriba)
   Entre vistas: un fundido corto. "Atrás" del navegador funciona.
   ========================================================================= */
(function (A) {
  const VIEWS = ["intro", "umbral", "recorrido", "archivo", "oportunidades", "compara", "norte"];
  const ALIAS = { jugar: "recorrido", leer: "archivo", evidencia: "archivo", caminar: "recorrido" };
  const TITLES = { intro: "ATLAS · Qué es", umbral: "ATLAS · territorios compartidos", recorrido: "ATLAS · Caminar el parque", archivo: "ATLAS · Consultar la evidencia", oportunidades: "ATLAS · Explorar oportunidades", compara: "ATLAS · Compará", norte: "ATLAS Norte" };
  let current = null;

  /* Nombre y color de la mirada en la barra superior */
  A.updateMirada = function () {
    const m = A.store.get("mirada", null), p = m && window.ATLAS_INFORME.perfiles.find(x => x.id === m.perfil);
    document.getElementById("mirada-dot").style.background = p ? p.color : "#111";
    document.getElementById("mirada-name").textContent = p ? p.nombre : "Elegir mirada";
    document.body.dataset.perfil = p ? p.id : "";
    return p;
  };

  function parse() {
    const raw = location.hash.replace(/^#\/?/, "");
    let [view, sub] = raw.split("/");
    view = ALIAS[view] || view;
    if (!VIEWS.includes(view)) {
      if (raw && document.getElementById(raw)) { sub = raw; view = "recorrido"; }
      else view = "intro";
    }
    return [view, sub];
  }

  function apply(view, sub, changed) {
    if (changed && current === "archivo") A.archivo.hide();
    if (changed && current === "oportunidades") A.oport.hide();
    if (changed && current === "compara") A.compara.hide();
    if (changed && current === "norte") A.norte.hide();
    current = view;
    document.querySelectorAll("[data-sec]").forEach(a => a.classList.toggle("on", a.dataset.sec === view));
    document.body.dataset.view = view;
    document.title = TITLES[view];
    const p = A.updateMirada();
    if (["recorrido", "archivo", "oportunidades"].includes(view)) { const m = A.store.get("mirada", {}) || {}; m.camino = view; A.store.set("mirada", m); }
    if (view === "intro") { if (changed) scrollTo(0, 0); A.intro.update(); }
    if (view === "umbral") { if (changed) scrollTo(0, 0); A.umbral.show(sub); }
    if (view === "archivo") { if (changed) scrollTo(0, 0); A.archivo.show(sub); }
    if (view === "oportunidades") { if (changed) scrollTo(0, 0); A.oport.show(sub); }
    if (view === "compara") { if (changed) scrollTo(0, 0); A.compara.show(sub); }
    if (view === "norte") { if (changed) scrollTo(0, 0); A.norte.show(sub); }
    if (view === "recorrido") {
      A.setMiradaRecorrido(p ? p.id : null);
      if (changed && !sub) { scrollTo(0, 0); A.city.welcome(p ? p.nombre : ""); }
      A.recorridoRefresh();
      if (sub) requestAnimationFrame(() => requestAnimationFrame(() => {
        const el = document.getElementById(sub);
        if (el) el.scrollIntoView({ block: el.classList.contains("chapter") ? (A.sm ? "end" : "center") : "start" });
      }));
    }
  }

  /* Fundido corto entre vistas (sin símbolos que crecen) */
  const veil = A.h("div", { class: "veil", "aria-hidden": "true" }, document.body);
  function transition(done) {
    if (A.reduced) { done(); return; }
    veil.classList.add("on");
    setTimeout(() => { done(); requestAnimationFrame(() => veil.classList.remove("on")); }, 180);
  }

  function route(first) {
    const [view, sub] = parse();
    const changed = view !== current;
    if (!changed || first === true) { apply(view, sub, changed); return; }
    transition(() => apply(view, sub, true));
  }

  // En celular, las tres secciones pasan a una barra fija abajo (fuera de la barra superior)
  (function () {
    const nav = document.getElementById("sections"), bar = document.querySelector(".topbar"), cmp = bar.querySelector(".cmp-btn");
    const mq = matchMedia("(max-width:760px)");
    const place = () => { if (mq.matches) document.body.appendChild(nav); else bar.insertBefore(nav, cmp); };
    mq.addEventListener("change", place); place();
  })();

  // Botones con data-route y data-scroll
  document.addEventListener("click", e => {
    if (e.target.closest("[data-intro-done]")) A.intro.done();
    const r = e.target.closest("[data-route]");
    if (r) { e.preventDefault(); location.hash = "#" + r.dataset.route; return; }
    const sc = e.target.closest("[data-scroll]");
    if (sc) {
      e.preventDefault();
      const el = document.getElementById(sc.dataset.scroll);
      if (el) el.scrollIntoView({ behavior: A.reduced ? "auto" : "smooth" });
    }
  });
  addEventListener("hashchange", () => route());
  addEventListener("scroll", () => { if (current === "intro") requestAnimationFrame(A.intro.update); }, { passive: true });

  /* La entrada SIEMPRE es "¿Qué es ATLAS?": se ignora cualquier enlace guardado (#umbral, #recorrido…) */
  if (location.hash !== "#intro") history.replaceState(null, "", location.pathname + location.search + "#intro");
  route(true);
})(window.ATLAS);
