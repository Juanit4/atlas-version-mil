/* =========================================================================
   ATLAS · CONSULTAR LA EVIDENCIA (antes "archivo")
   Portada → para empezar → la evidencia en círculos → UN SOLO SCROLL
   con secciones numeradas e índice fijo:
     01 Cómo se procesa · 02 Cómo se recolecta · 03 Relaciones ·
     04 Qué se puede hacer acá · 05 Patrimonio · 06 Quién viene y cuánto vale ·
     07 Números · 08 Fichas · 09 Noticias · 10 Biblioteca · 11 Cargar información
   + "Tu informe" en un panel lateral (lectura propia, exportable).
   Tono: sobrio y académico. Solo el sector público puede cargar información.
   ========================================================================= */
(function (A) {
  const s = A.s, h = A.h, I = window.ATLAS_INFORME, D = A.D;
  const wrap = document.querySelector(".archivo");
  const heroEl = document.getElementById("ar-hero");
  const startEl = document.getElementById("ar-start");
  const tabsEl = document.getElementById("ar-tabs");
  const main = document.getElementById("ar-main");
  const report = document.getElementById("ar-drawer");
  const fab = document.getElementById("ar-fab"), fabN = document.getElementById("ar-fab-n");
  const modal = document.getElementById("modal"), modalBody = document.getElementById("modal-body");

  const CATS = I.grupos.flatMap(g => g.cats.map(c => Object.assign({ grupo: g.nombre }, c)));
  const catById = id => CATS.find(c => c.id === id);
  const fuente = f => f.src ? I.fuentes[f.src] : f.fuenteTxt ? { fuente: f.fuenteTxt } : null;
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* Secciones del scroll: [id, título, bajada, función que la dibuja] */
  const SECS = [
    ["procesa", "Cómo se procesa", "El recorrido de un dato, en cinco pasos: recibir, ubicar, clasificar, relacionar y comparar. Cada mirada recibe una lectura distinta.", flujo],
    ["recoleccion", "Cómo se recolecta", "Diez fuentes alrededor del territorio. Tocá cada una para ver qué mide y cómo cuida la privacidad.", recoleccion],
    ["relaciones", "Relaciones", "Actores, temas, fichas y oportunidades conectados en una red viva. Filtrala por mirada o descargá el informe.", relaciones],
    ["normativa", "Qué se puede hacer acá", "Las reglas del predio en gráficos, y un simulador para probar tu idea.", normativa],
    ["patrimonio", "Patrimonio e historia", "De playón ferroviario a parque: los hechos más importantes en una sola línea.", patrimonio],
    ["poblacion", "Quién viene y cuánto vale", "Quiénes viven alrededor, quiénes usan el parque y cuánto vale el suelo.", poblacion],
    ["numeros", "Números", "El impacto del parque, contado desde la mirada que elijas.", indicadores],
    ["fichas", "Fichas", "Todo lo que sabemos, ordenado por tema y en palabras simples.", biblioteca],
    ["noticias", "Noticias de la zona", "Lo que publicaron los medios y los vecinos sobre el parque.", noticiasZona],
    ["biblioteca", "Biblioteca", "Normativas, manuales, informes y bibliografía que sostienen a ATLAS.", academia],
    ["cargar", "Cargar información", "Exclusivo para el sector público, responsable de validar.", cargar]
  ];
  let stops = {}, curSec = null;
  const setStop = fn => { stops[curSec] = fn; };
  const stopAll = () => { Object.values(stops).forEach(f => f && f()); stops = {}; };
  /* Curaduría: por dónde empezar según la mirada */
  const EMPEZAR = {
    ciudadanos: ["f15", "f09", "f10"],
    publico:    ["f02", "f07", "f27"],
    privado:    ["f23", "f05", "f22"],
    libre:      ["f02", "f14", "f21"]
  };

  /* ---------- Estado ---------- */
  const st = {
    territorio: "colegiales", perfil: null, cats: new Set(), estado: "todos", origen: "todos",
    tab: "biblioteca", q: "", orden: "categoria", solo: false, open: null, temas: false
  };
  let inf = A.store.get("informe", { items: {}, lecturas: [] });
  const saveInf = () => { A.store.set("informe", inf); renderReport(); if (typeof renderDots === "function" && dotsData) renderDots(); };

  /* Registro de todo lo que se puede sumar al informe (fichas + indicadores + matriz) */
  const REG = {};
  I.fichas.forEach(f => REG[f.id] = { tipo: "Ficha", titulo: f.titulo, cat: f.cat, estado: f.estado, real: f.real, f });
  const regExtra = (id, titulo, real, cat) => REG[id] = { tipo: "Indicador", titulo, real, cat };
  [["i-flujo", "Personas por hora", false, "usos"], ["i-seg", "Seguridad percibida por hora", false, "seguridad"],
   ["i-ruido", "Ruido por fuente", false, "ambiente"], ["i-sup", "¿Cuánto mide el parque?", true, "contexto"]].forEach(a => regExtra(...a));

  function applyPerfil(id) {
    st.perfil = id || null;
    const p = I.perfiles.find(x => x.id === id);
    st.cats = new Set(p ? p.sugeridas : CATS.map(c => c.id));
  }
  applyPerfil(null);

  const visibles = () => I.fichas.filter(f =>
    st.cats.has(f.cat) &&
    (st.estado === "todos" || f.estado === st.estado) &&
    (st.origen === "todos" || (st.origen === "real") === f.real) &&
    (!st.solo || inf.items[f.id]) &&
    (!st.q || (f.titulo + " " + f.texto + " " + f.relacion).toLowerCase().includes(st.q.toLowerCase()))
  );

  /* =====================================================================
     PORTADA
     ===================================================================== */
  function renderHero() {
    const terr = D.espacios.find(e => e.id === st.territorio), act = terr.estado === "activo";
    const real = I.fichas.filter(f => f.real).length, contra = I.fichas.filter(f => f.estado === "contradictorio").length;
    const rev = I.fichas.filter(f => f.estado === "revision").length;
    heroEl.innerHTML = `
      <p class="kicker ar-k">Evidencia · ${terr.nombre} · Comuna ${terr.comuna}</p>
      <h2 class="ar-title">${act ? "Lo que sabemos del parque,<br>de dónde lo sabemos<br><span>y qué falta saber.</span>" : terr.estado === "completado" ? `${terr.nombre}<br><span>se leyó para comparar.</span>` : `${terr.nombre}<br><span>todavía no tiene lectura.</span>`}</h2>
      <div class="ar-mirada"><span class="muted">Leyendo como</span>
        ${I.perfiles.map(p => `<button class="mpill${st.perfil === p.id ? " on" : ""}" style="--c:${p.color}" data-perfil="${p.id}"><i></i>${p.nombre}</button>`).join("")}
        <button class="mpill${st.perfil ? "" : " on"}" style="--c:#111" data-perfil=""><i></i>Mirada libre</button>
      </div>
      ${act ? `<div class="ar-stats">
        <button data-stat="todos"><b>${I.fichas.length}</b><span>fichas</span></button>
        <button data-stat="real"><b>${real}</b><span>con fuente verificada</span></button>
        <button data-stat="contradictorio"><b>${contra}</b><span>${contra === 1 ? "dato que se contradice" : "datos que se contradicen"}</span></button>
        <button data-stat="revision"><b>${rev}</b><span>en revisión</span></button>
      </div>` : ""}
      <div class="ar-meta">
        <label>Territorio <select id="f-terr">${D.espacios.map(e => `<option value="${e.id}"${e.id === st.territorio ? " selected" : ""}>${e.nombre}${e.estado === "activo" ? " · parque actual" : e.estado === "completado" ? " · completado (comparación)" : " · sin relevar"}</option>`).join("")}</select></label>
        <button class="linkbtn" data-how>¿Cómo funciona?</button> <button class="linkbtn" data-guia>Ver la guía</button>
      </div>`;
    heroEl.querySelector("#f-terr").onchange = e => { st.territorio = e.target.value; refresh(); };
    heroEl.querySelectorAll("[data-perfil]").forEach(b => b.onclick = () => {
      applyPerfil(b.dataset.perfil);
      const m = A.store.get("mirada", {}) || {}; m.perfil = st.perfil; A.store.set("mirada", m); A.updateMirada && A.updateMirada();
      refresh();
    });
    heroEl.querySelectorAll("[data-stat]").forEach(b => b.onclick = () => {
      const k = b.dataset.stat;
      st.tab = "biblioteca"; st.q = ""; st.solo = false;
      st.estado = ["contradictorio", "revision"].includes(k) ? k : "todos";
      st.origen = k === "real" ? "real" : "todos";
      if (k !== "todos" || true) st.cats = new Set(CATS.map(c => c.id));
      refresh(); goSec("fichas");
    });
  }

  /* Recorrido de línea blanca con dos puntos (como las teselas del moodboard) */
  function route(seed) {
    let n = [...seed].reduce((a, c) => a * 31 + c.charCodeAt(0), 7);
    const r = () => ((n = (n * 9301 + 49297) % 233280) / 233280);
    let x = 10 + r() * 20, y = 60 - r() * 20, d = `M${x.toFixed(0)} ${y.toFixed(0)}`, pts = [[x, y]];
    for (let k = 0; k < 5; k++) { if (k % 2) y = A.clamp(y + (r() - .5) * 50, 8, 64); else x = A.clamp(x + 10 + r() * 22, 8, 104); d += `L${x.toFixed(0)} ${y.toFixed(0)}`; pts.push([x, y]); }
    const [a0, b0] = pts[0], [a1, b1] = pts[pts.length - 1];
    return `<svg class="route" viewBox="0 0 112 72" aria-hidden="true"><path d="${d}" fill="none" stroke="#fff" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>
      <circle cx="${a0}" cy="${b0}" r="4" fill="#fff"/><circle cx="${a1}" cy="${b1}" r="4" fill="#fff"/></svg>`;
  }

  function renderStart() {
    const terr = D.espacios.find(e => e.id === st.territorio);
    if (terr.estado !== "activo") { startEl.innerHTML = ""; return; }
    const p = I.perfiles.find(x => x.id === st.perfil);
    const ids = EMPEZAR[st.perfil || "libre"];
    startEl.innerHTML = `<p class="kicker">Para empezar${p ? `, <span class="hl" style="--c:${p.color}">desde tu mirada</span>` : ""}</p>
      <div class="ar-cards">${ids.map((id, i) => {
        const f = I.fichas.find(x => x.id === id), e = I.estados[f.estado], c = catById(f.cat), fu = fuente(f);
        const bg = ["#9b6cff", "#08b8f8", "#00e887"][i];
        return `<button class="ar-card" data-open="${id}" style="--c:${e.color};--tile:${bg};--d:${i * .12 + .35}s">${route(id)}
          <span class="ar-card-cat">${A.icon(c.forma, "#77776f", false)} ${c.nombre}</span>
          <b>${f.titulo}</b>
          <span class="ar-card-why">${f.relacion}</span>
          <span class="ar-card-meta"><i></i>${e.nombre} · ${fu ? fu.fuente : "ejemplo"}</span>
          <span class="ar-card-go">Abrir ficha →</span></button>`;
      }).join("")}</div>`;
    startEl.querySelectorAll("[data-open]").forEach(b => b.onclick = () => openFicha(b.dataset.open));
  }

  /* =====================================================================
     LA EVIDENCIA EN CÍRCULOS (scroll): fichas → por estado → tu informe
     ===================================================================== */
  const dotsEl = document.getElementById("ar-dots");
  let dotsData = null;
  function renderDots() {
    const terr = D.espacios.find(e => e.id === st.territorio);
    if (terr.estado !== "activo") { dotsEl.innerHTML = ""; dotsData = null; return; }
    const F = I.fichas, real = F.filter(f => f.real).length;
    const enInf = F.filter(f => inf.items[f.id]).length;
    dotsEl.innerHTML = `<div class="ar-dots-stage">
      <div class="ar-dots-txt">
        <div class="adt"><p class="kicker">La evidencia, en círculos</p><h3>${F.length} fichas</h3><p>Cada círculo es un dato del parque. Los llenos tienen fuente verificada (${real}); los vacíos son de ejemplo (${F.length - real}).</p></div>
        <div class="adt"><p class="kicker">Por estado</p><h3>No todo está igual de firme</h3><p>Se ordenan según su estado: validados, en revisión, contradictorios y desactualizados.</p></div>
        <div class="adt"><p class="kicker">Tu informe</p><h3>${enInf ? `${enInf} en tu informe` : "Tu informe está vacío"}</h3><p>${enInf ? "Los amarillos son los que elegiste. Tocá cualquiera para abrirlo." : "Dale prioridad a una ficha y aparece acá en amarillo."}</p>
          <button class="btn small" data-open-inf>Abrir tu informe</button></div>
      </div>
      <svg class="ar-dots-svg" viewBox="0 0 600 420" aria-hidden="true"></svg></div>`;
    const sv = dotsEl.querySelector("svg");
    const est = Object.keys(I.estados);
    const lbls = est.map((k, i) => s("text", { x: 75 + i * 150, y: 380, "text-anchor": "middle", "font-size": 13, "font-family": "Inter Tight", fill: "#111", opacity: 0 }, sv,
      `${I.estados[k].nombre} · ${F.filter(f => f.estado === k).length}`));
    let sd = 5; const r = () => ((sd = (sd * 9301 + 49297) % 233280) / 233280);
    const items = F.map((f, i) => {
      const g = s("g", { style: "cursor:pointer" }, sv);
      const c = s("circle", { r: 13 }, g);
      s("title", {}, g, f.titulo);
      g.onclick = () => openFicha(f.id);
      // posiciones
      const A0 = [40 + r() * 520, 30 + r() * 320];
      const ei = est.indexOf(f.estado), j = F.filter((x, k) => k < i && x.estado === f.estado).length;
      const a = j * 2.4, rr = 17 * Math.sqrt(j);
      const B0 = [75 + ei * 150 + Math.cos(a) * rr, 200 + Math.sin(a) * rr];
      const C0 = [60 + (i % 8) * 68, 70 + Math.floor(i / 8) * 68];
      return { f, g, c, A0, B0, C0 };
    });
    dotsData = { items, lbls };
    dotsEl.querySelector("[data-open-inf]").onclick = openDrawer;
    updateDots();
  }
  function updateDots() {
    if (!dotsData) return;
    const p = A.progress(dotsEl), f = A.clamp(p * 3, 0, 2.999), k = Math.floor(f), t = A.ease(A.seg(f - k, .55, 1));
    dotsEl.querySelectorAll(".adt").forEach((el, i) => el.classList.toggle("on", i === k));
    const P = [it => it.A0, it => it.B0, it => it.C0];
    dotsData.items.forEach(it => {
      const a = P[k](it), b = P[Math.min(2, k + 1)](it);
      it.g.setAttribute("transform", `translate(${A.lerp(a[0], b[0], t).toFixed(1)} ${A.lerp(a[1], b[1], t).toFixed(1)})`);
      const inI = !!inf.items[it.f.id], ec = I.estados[it.f.estado].color;
      const fillAt = st => st === 0 ? (it.f.real ? "#111" : "#fff") : st === 1 ? ec : (inI ? A.C.acento : "#e6e6e2");
      const kk = t > .5 ? Math.min(2, k + 1) : k;
      it.c.setAttribute("fill", fillAt(kk));
      it.c.setAttribute("stroke", kk === 2 && inI ? "#111" : kk === 0 ? "#111" : "none");
      it.c.setAttribute("stroke-width", 1.5);
      it.c.setAttribute("r", kk === 2 && inI ? 17 : 13);
    });
    const lo = k === 0 ? t : k === 1 ? 1 - t : 0;
    dotsData.lbls.forEach(l => l.setAttribute("opacity", lo));
  }
  addEventListener("scroll", () => { if (document.body.dataset.view === "archivo") requestAnimationFrame(updateDots); }, { passive: true });

  /* Índice fijo: salta a cada sección y marca dónde estás */
  function renderTabs() {
    const terr = D.espacios.find(e => e.id === st.territorio);
    tabsEl.style.display = terr.estado === "activo" ? "" : "none";
    tabsEl.innerHTML = SECS.map(([id, n], i) => `<button data-go="${id}"${id === "cargar" ? ` class="lock${st.perfil === "publico" ? " open" : ""}"` : ""}><span>${String(i + 1).padStart(2, "0")}</span>${n}</button>`).join("");
    tabsEl.querySelectorAll("[data-go]").forEach(b => b.onclick = () => goSec(b.dataset.go));
  }
  function goSec(id) {
    const el = document.getElementById("ev-" + id); if (!el) return;
    const y = el.getBoundingClientRect().top + scrollY - (tabsEl.offsetHeight + 70);
    scrollTo({ top: y, behavior: A.reduced ? "auto" : "smooth" });
  }
  function spy() {
    if (document.body.dataset.view !== "archivo") return;
    let cur = null; const y = innerHeight * .35;
    SECS.forEach(([id]) => { const el = document.getElementById("ev-" + id); if (el && el.getBoundingClientRect().top < y) cur = id; });
    tabsEl.querySelectorAll("[data-go]").forEach(b => b.classList.toggle("on", b.dataset.go === cur));
    const on = tabsEl.querySelector(".on"); if (on && tabsEl.scrollWidth > tabsEl.clientWidth) { const r = on.offsetLeft - tabsEl.clientWidth / 2 + on.offsetWidth / 2; if (Math.abs(tabsEl.scrollLeft - r) > 40) tabsEl.scrollLeft = r; }
  }
  addEventListener("scroll", () => requestAnimationFrame(spy), { passive: true });

  /* Filtros que viven dentro de "Fichas" (no estorban en las demás secciones) */
  function filtrosHTML() {
    const p = I.perfiles.find(x => x.id === st.perfil);
    return `<div class="ar-filters">
      <div class="chips">${[["todos", "Todas"], ["real", "Con fuente"], ["ejemplo", "Ejemplo"]]
        .map(([k, n]) => `<button class="chip${st.origen === k ? " on" : ""}" data-origen="${k}">${n}</button>`).join("")}</div>
      <button class="chip temas-toggle${st.temas ? " on" : ""}" data-temas>Temas · ${st.cats.size} de ${CATS.length} ${st.temas ? "▴" : "▾"}</button>
    </div>
    ${st.temas ? `<div class="ar-temas">
      <div class="lrow small"><span class="muted">${p ? `Los marcados con • son los sugeridos para ${p.nombre.toLowerCase()}.` : "Elegí los temas que te interesan."}</span>
        <span><button class="linkbtn" data-allcats>Todos</button> · <button class="linkbtn" data-nocats>Ninguno</button></span></div>
      ${I.grupos.map(g => `<div class="tg"><p class="lsub">${g.nombre}</p><div class="chips">${g.cats.map(c =>
        `<button class="chip${st.cats.has(c.id) ? " on" : ""}" style="--c:${p ? p.color : "#111"}" data-cat="${c.id}">${p && p.sugeridas.includes(c.id) ? "• " : ""}${c.nombre}</button>`).join("")}</div></div>`).join("")}
    </div>` : ""}`;
  }
  function bindFiltros(tp) {
    tp.querySelectorAll("[data-origen]").forEach(b => b.onclick = () => { st.origen = b.dataset.origen; renderSec("fichas"); });
    tp.querySelector("[data-temas]").onclick = () => { st.temas = !st.temas; renderSec("fichas"); };
    tp.querySelectorAll("[data-cat]").forEach(b => b.onclick = () => { const c = b.dataset.cat; st.cats.has(c) ? st.cats.delete(c) : st.cats.add(c); renderSec("fichas"); });
    const all = tp.querySelector("[data-allcats]"); if (all) all.onclick = () => { st.cats = new Set(CATS.map(c => c.id)); renderSec("fichas"); };
    const none = tp.querySelector("[data-nocats]"); if (none) none.onclick = () => { st.cats.clear(); renderSec("fichas"); };
  }

  /* =====================================================================
     CONTENIDO
     ===================================================================== */
  function renderMain() {
    stopAll();
    const terr = D.espacios.find(e => e.id === st.territorio);
    if (terr.estado === "completado") {
      main.innerHTML = `<div class="lcard empty">
        <p>${terr.nombre} tiene una lectura completada solo de sus capas sociales: circulación, quiénes van y qué piden. Se usa para comparar con el parque actual.</p>
        <div class="row" style="max-width:460px"><a class="btn" href="#recorrido/compara">Ver la comparación →</a><button class="btn ghost" id="back-col">Volver a Colegiales</button></div></div>`;
      main.querySelector("#back-col").onclick = () => { st.territorio = "colegiales"; refresh(); };
      return;
    }
    if (terr.estado !== "activo") {
      const votos = (A.store.get("votos", {})[terr.id] || 0);
      main.innerHTML = `<div class="lcard empty">
        <p>Cuando haya fuentes, voces y evidencias de ${terr.nombre}, vas a poder consultarlas acá. Mientras tanto, podés votar para que sea el próximo territorio relevado.</p>
        <p class="mono small">${votos} votos</p>
        <div class="row" style="max-width:440px"><button class="btn" id="vote">Votar este territorio</button><button class="btn ghost" id="back-col">Volver a Colegiales</button></div></div>`;
      main.querySelector("#vote").onclick = () => { const v = A.store.get("votos", {}); v[terr.id] = (v[terr.id] || 0) + 1; A.store.set("votos", v); renderMain(); };
      main.querySelector("#back-col").onclick = () => { st.territorio = "colegiales"; refresh(); };
      return;
    }
    main.innerHTML = SECS.map(([id, n, bajada], i) => `<section class="ev-sec" id="ev-${id}">
      <header class="ev-h"><span class="ev-n">${String(i + 1).padStart(2, "0")}</span><div><h3>${n}</h3><p>${bajada}</p></div></header>
      <div class="ev-body" id="evb-${id}"></div></section>`).join("");
    SECS.forEach(([id]) => renderSec(id));
  }
  /* Vuelve a dibujar solo una sección (no mueve el scroll del resto) */
  function renderSec(id) {
    const body = document.getElementById("evb-" + id), sec = SECS.find(x => x[0] === id);
    if (!body || !sec) return;
    if (stops[id]) { stops[id](); delete stops[id]; }
    curSec = id; sec[3](body); curSec = null;
  }

  /* ---------------- DOCUMENTOS ---------------- */
  function documentos(tp) {
    tp.innerHTML = `<div class="lcard"><p class="kicker">Fuentes</p><h3>Notas, datos, normas y manuales para citar</h3>
      <p class="small muted">Notas, datos oficiales, normativa y el manual de ATLAS.</p><div class="docs" id="docs"></div></div>`;
    const docs = tp.querySelector("#docs");
    I.documentos.forEach(d => {
      const fu = d.src ? I.fuentes[d.src] : null, url = d.url || (fu && fu.url);
      const el = h(url ? "a" : "button", Object.assign({ class: "doc" }, url ? { href: url, target: "_blank", rel: "noopener" } : {}), docs,
        `<span class="doc-type">${d.tipo}</span><b>${d.titulo}</b><span class="small muted">${fu ? fu.fuente : url ? new URL(url).hostname : "ATLAS"}</span><span class="doc-go">${url ? "Abrir ↗" : "Leer →"}</span>`);
      if (d.accion === "manual") el.onclick = openHow;
    });
  }

  /* ---------------- 03 · RELACIONES: descarga ---------------- */
  function relacionesMD() {
    const p = I.perfiles, fichas = I.fichas;
    let m = `# Informe de relaciones · ATLAS · Parque Ferroviario Colegiales\n\nFecha: ${new Date().toLocaleDateString("es-AR")}\n\n## Actores y temas\n\n`;
    p.forEach(a => { m += `### ${a.nombre}\n\n${a.sugeridas.map(c => `- ${catById(c) ? catById(c).nombre : c}: ${fichas.filter(f => f.cat === c).length} fichas`).join("\n")}\n\n`; });
    const t = fichas.filter(f => f.tension && f.id < f.tension);
    m += `## Tensiones\n\n${t.map(f => { const o = fichas.find(x => x.id === f.tension); return `- **${f.titulo}** ↔ **${o.titulo}**\n  ${f.relacion}`; }).join("\n")}\n\n`;
    m += `## Fichas por estado\n\n${Object.entries(I.estados).map(([k, v]) => `- ${v.nombre}: ${fichas.filter(f => f.estado === k).length}`).join("\n")}\n\n---\nGenerado con ATLAS\n`;
    return m;
  }
  const saveFile = (txt, name) => { const a = h("a", { href: URL.createObjectURL(new Blob([txt], { type: "text/markdown" })), download: name }, document.body); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); };

  /* =====================================================================
     08 · FICHAS (lenguaje simple, por temática)
     ===================================================================== */
  const ESTADO_SIMPLE = { validado: "Confirmado", revision: "Lo estamos revisando", contradictorio: "Las fuentes no coinciden", desactualizado: "Dato viejo" };
  const CAT_COL = { contexto: "#08b8f8", poblacion: "#9b6cff", voces: "#9b6cff", usos: "#9b6cff", movilidad: "#08b8f8", seguridad: "#ff8a7a", ambiente: "#00e887", patrimonio: "#f8e544", normas: "#00e887", obras: "#08b8f8", gestion: "#00e887", participacion: "#9b6cff", antecedentes: "#c9c9c4" };
  const PREGUNTAS = [
    ["¿Es seguro de noche?", "seguridad"], ["¿Cuánta gente va?", "usos"], ["¿Qué se puede construir?", "normas"],
    ["¿Qué pide la gente?", "voces"], ["¿Cómo llego?", "movilidad"], ["¿Qué tiene de histórico?", "patrimonio"], ["¿Quién decide y cuánto cuesta?", "gestion"]
  ];
  function biblioteca(tp) {
    const list = visibles();
    const total = I.fichas.length;
    const solo1 = st.cats.size === 1 ? [...st.cats][0] : null;
    tp.innerHTML = `
      <div class="fx-ask">
        <label class="fx-q"><span>¿Qué querés saber del parque?</span><input type="search" id="q" placeholder="Escribí una palabra: luz, baños, árboles, ruido…" value="${esc(st.q)}" aria-label="Buscar en las fichas"></label>
        <div class="fx-sug">${PREGUNTAS.map(([t, c]) => `<button class="chip${solo1 === c ? " on" : ""}" data-pq="${c}">${t}</button>`).join("")}</div>
      </div>
      <div class="fx-tiles">${CATS.map(c => { const n = I.fichas.filter(f => f.cat === c.id).length; if (!n) return "";
        return `<button class="fx-tile${solo1 === c.id ? " on" : !solo1 && st.cats.has(c.id) ? "" : solo1 ? " off" : ""}" data-tile="${c.id}" style="--c:${CAT_COL[c.id] || "#111"}">${A.icon(c.forma, "#111", false)}<b>${c.nombre}</b><span>${n} ficha${n > 1 ? "s" : ""}</span></button>`; }).join("")}</div>
      <div class="fx-bar">
        <p><b>${list.length}</b> de ${total} fichas ${solo1 ? `sobre <span class="hl" style="--c:${CAT_COL[solo1]}">${catById(solo1).nombre.toLowerCase()}</span>` : ""}${st.q ? ` con «${esc(st.q)}»` : ""}</p>
        <div class="chips">${Object.entries(ESTADO_SIMPLE).map(([k, n]) => `<button class="chip est${st.estado === k ? " on" : ""}" data-ev="${k}" style="--c:${I.estados[k].color}"><i></i>${n}</button>`).join("")}</div>
        ${solo1 || st.q || st.estado !== "todos" ? `<button class="linkbtn" data-clear>Ver todas</button>` : ""}
      </div>
      <div id="lib" class="fx-list"></div>
      <p class="ev-note">Cada ficha dice <b>qué sabemos</b>, <b>de dónde sale</b> y <b>qué falta saber</b>. Las marcadas «ejemplo» todavía no tienen una fuente verificada.</p>`;
    tp.querySelectorAll("[data-tile],[data-pq]").forEach(b => b.onclick = () => {
      const c = b.dataset.tile || b.dataset.pq;
      st.cats = solo1 === c ? new Set(CATS.map(x => x.id)) : new Set([c]); st.q = ""; renderSec("fichas");
    });
    tp.querySelectorAll("[data-ev]").forEach(b => b.onclick = () => { st.estado = st.estado === b.dataset.ev ? "todos" : b.dataset.ev; renderSec("fichas"); });
    const cl = tp.querySelector("[data-clear]"); if (cl) cl.onclick = () => { st.cats = new Set(CATS.map(x => x.id)); st.q = ""; st.estado = "todos"; st.origen = "todos"; renderSec("fichas"); };
    const q = tp.querySelector("#q");
    q.oninput = () => { st.q = q.value; clearTimeout(q._t); q._t = setTimeout(() => { st.cats = new Set(CATS.map(x => x.id)); renderSec("fichas"); const n = main.querySelector("#q"); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 300); };
    const lib = tp.querySelector("#lib");
    if (!list.length) { lib.innerHTML = `<p class="muted">No encontramos fichas con eso. Probá otra palabra o tocá «Ver todas».</p>`; return; }
    CATS.filter(c => list.some(f => f.cat === c.id)).forEach(c => {
      const sec = h("section", { class: "fx-group", id: "grupo-" + c.id, style: `--c:${CAT_COL[c.id] || "#111"}` }, lib,
        `<header>${A.icon(c.forma, "#111", false)}<b>${c.nombre}</b><span>${list.filter(f => f.cat === c.id).length}</span></header>`);
      list.filter(f => f.cat === c.id).forEach(f => sec.appendChild(fichaEl(f)));
    });
  }

  function fichaEl(f) {
    const e = I.estados[f.estado], fu = fuente(f), pr = inf.items[f.id];
    const d = h("details", { class: "ficha fx" + (pr ? " added" : ""), id: "ficha-" + f.id });
    if (st.open === f.id) d.open = true;
    const tens = f.tension ? I.fichas.find(x => x.id === f.tension) : null;
    d.innerHTML = `<summary><span class="fx-est" style="--c:${e.color}">${ESTADO_SIMPLE[f.estado]}</span>
        <span class="ft">${f.titulo}</span>${A.tag(f.real)}${pr ? `<span class="pill">en tu informe</span>` : ""}<span class="fx-open" aria-hidden="true">+</span></summary>
      <div class="fbody">
        <p class="fx-txt">${f.texto}</p>
        <div class="fcols">
          <div><p class="lsub">Lo que se relaciona</p><p>${f.relacion}</p></div>
          <div><p class="lsub">Lo que falta saber</p><p>${f.falta}</p></div>
        </div>
        ${tens ? `<p class="tension">⚡ Choca con otra ficha: <button class="linkbtn" data-open="${tens.id}">${tens.titulo}</button></p>` : ""}
        <p class="small muted">Fuente: ${fu ? (fu.url ? `<a href="${fu.url}" target="_blank" rel="noopener">${fu.fuente} ↗</a>` : fu.fuente) : "todavía sin fuente (ejemplo)"}</p>
        <div class="factions">
          <div class="chips"><span class="lsub" style="margin:0 6px 0 0">¿Te sirve?</span>${["Alta", "Media", "Baja"].map(p => `<button class="chip${pr === p ? " on" : ""}" style="--c:#f8e544" data-pr="${p}">${p === "Alta" ? "Mucho" : p === "Media" ? "Algo" : "Poco"}</button>`).join("")}
            ${pr ? `<button class="chip" data-pr="">Quitar</button>` : ""}</div>
          ${f.capa && A.layers.some(l => l.id === f.capa) ? `<a class="to-recorrido" href="#recorrido/capa-${f.capa}">${A.icon("circulo", "#9b6cff")} Verlo en el parque →</a>` : ""}
        </div>
      </div>`;
    d.addEventListener("toggle", () => { if (d.open) st.open = f.id; });
    d.querySelectorAll("[data-pr]").forEach(b => b.onclick = () => {
      if (b.dataset.pr) inf.items[f.id] = b.dataset.pr; else delete inf.items[f.id];
      st.open = f.id; saveInf(); renderSec("fichas");
    });
    d.querySelectorAll("[data-open]").forEach(b => b.onclick = () => openFicha(b.dataset.open));
    return d;
  }

  function openFicha(id) {
    const f = I.fichas.find(x => x.id === id); if (!f) return;
    st.cats = new Set(CATS.map(c => c.id)); st.estado = "todos"; st.origen = "todos"; st.q = ""; st.solo = false;
    st.open = id; st.orden = "categoria";
    refresh();
    requestAnimationFrame(() => { const el = document.getElementById("ficha-" + id); if (el) { el.scrollIntoView({ block: "center", behavior: "smooth" }); el.classList.add("flash"); } });
  }

  /* =====================================================================
     07 · NÚMEROS: el impacto contado desde cada mirada
     ===================================================================== */
  function indicadores(tp) {
    const C = D.capas, pk = arr => arr.indexOf(Math.max(...arr));
    const aportes = A.aportes ? A.aportes.todos().length : 24;
    const val = I.fichas.filter(f => f.estado === "validado").length;
    const MIR = {
      ciudadanos: { n: "Ciudadanía", c: "#9b6cff", q: "¿Qué cambia en mi día a día?", cifras: [
        ["+250", "árboles plantados", "Más sombra y aire más limpio en verano.", true],
        ["14.200 m²", "de parque abierto", "Equivale a casi 2 canchas de fútbol profesional.", true],
        [`${String(pk(C.transito.finde)).padStart(2, "0")}:00`, "la hora más concurrida del fin de semana", `Hasta ${Math.max(...C.transito.finde)} personas al mismo tiempo.`, false],
        [`${C.seguridad.porHora[22]}/100`, "seguridad percibida a las 22 h", `De día llega a ${Math.max(...C.seguridad.porHora)}/100: la noche es el gran pendiente.`, false]] },
      publico: { n: "Sector público", c: "#00e887", q: "¿A cuántas personas alcanza y qué hay que atender?", cifras: [
        ["+80.000", "vecinos en el área de influencia", "Población que usa o puede usar el parque.", true],
        [String(aportes), "aportes anónimos de la gente", "Reclamos, pedidos y propuestas para priorizar.", false],
        [`${val} de ${I.fichas.length}`, "fichas confirmadas", "El resto está en revisión, se contradice o es viejo.", true],
        [`${Math.max(...C.ruido.fuentes.map(f => f.db))} dB`, "ruido máximo (paso del tren)", "Por encima de 65 dB el ruido afecta la salud.", false]] },
      privado: { n: "Sector privado", c: "#08b8f8", q: "¿Cuánto vale y cuánto se mueve?", cifras: [
        [`USD ${A.fmt(C.censo.m2Pozo.valor)}`, "el m² en pozo", `${Math.round((C.censo.m2Pozo.valor / C.censo.m2Usado.valor - 1) * 100)}% más que un usado (USD ${A.fmt(C.censo.m2Usado.valor)}).`, true],
        ["19.268 m²", "de lote privado (22% del predio)", "Lo único edificable para desarrollo privado.", true],
        ["+80.000", "personas en el área de influencia", "Público potencial para servicios y comercio.", true],
        [String(Math.max(...C.transito.finde)), "personas en la hora pico del finde", "El momento de mayor demanda de servicios.", false]] }
    };
    const cur = MIR[st.mirNum || st.perfil] ? (st.mirNum || st.perfil) : "ciudadanos", M0 = MIR[cur];
    tp.innerHTML = `
      <div class="nm-pick"><p>Contar el impacto desde la mirada de</p>
        <div class="nm-tabs">${Object.entries(MIR).map(([k, m]) => `<button class="${k === cur ? "on" : ""}" data-mn="${k}" style="--c:${m.c}"><i></i>${m.n}</button>`).join("")}</div></div>
      <div class="nm-head" style="--c:${M0.c}"><h4>${M0.q}</h4></div>
      <div class="nm-cifras" style="--c:${M0.c}">${M0.cifras.map(([v, l, d, real], i) => `<div class="nm-c" style="--d:${i * .08}s"><b>${v}</b><span>${l}</span><p>${d}</p>${A.tag(real)}</div>`).join("")}</div>
      <p class="ev-sub">Para mirar más de cerca</p>
      <div class="ind-grid" id="ind"></div>`;
    tp.querySelectorAll("[data-mn]").forEach(b => b.onclick = () => { st.mirNum = b.dataset.mn; renderSec("numeros"); });
    const grid = tp.querySelector("#ind");
    const card = (id, titulo, real, cat, bajada) => {
      regExtra(id, titulo, real, cat);
      const c = h("div", { class: "lcard ind" }, grid, `<div class="lrow"><b>${titulo}</b>${A.tag(real)}</div><p class="small muted">${bajada}</p><div class="ind-body"></div>
        <button class="chip addind${inf.items[id] ? " on" : ""}" style="--c:#f8e544">${inf.items[id] ? "✓ En tu informe" : "+ Sumar a tu informe"}</button>`);
      c.querySelector(".addind").onclick = () => { inf.items[id] ? delete inf.items[id] : inf.items[id] = "Media"; saveInf(); renderSec("numeros"); };
      return c.querySelector(".ind-body");
    };
    // Personas por hora
    let modo = "semana";
    const b1 = card("i-flujo", "Personas por hora", false, "usos", "Pasá el cursor por las barras.");
    const ch = h("div", { class: "chips" }, b1, `<button class="chip on" style="--c:#9b6cff" data-m="semana">Lunes a viernes</button><button class="chip" style="--c:#9b6cff" data-m="finde">Fin de semana</button>`);
    const out1 = h("div", { class: "nm-read" }, b1);
    const bars = h("div", { class: "bars", style: "--c:#9b6cff;height:110px" }, b1);
    h("div", { class: "bars-axis" }, b1, "<span>00</span><span>06</span><span>12</span><span>18</span><span>23</span>");
    const draw1 = (sel) => {
      const arr = C.transito[modo], max = Math.max(...arr), i = sel ?? arr.indexOf(max);
      bars.innerHTML = arr.map((v, k) => `<i style="height:${v / max * 100}%" class="${k === i ? "on" : ""}" data-h="${k}"></i>`).join("");
      out1.innerHTML = `<b>${arr[i]}</b> personas a las ${String(i).padStart(2, "0")}:00 ${sel == null ? "· el pico" : ""}`;
      bars.querySelectorAll("i").forEach(b => b.onmouseenter = () => draw1(+b.dataset.h));
    };
    ch.querySelectorAll("[data-m]").forEach(b => b.onclick = () => { modo = b.dataset.m; ch.querySelectorAll(".chip").forEach(x => x.classList.toggle("on", x === b)); draw1(); });
    draw1();
    // Seguridad
    const b2 = card("i-seg", "¿Qué tan seguro se siente?", false, "seguridad", "De 0 a 100, hora por hora. Arrastrá el cursor.");
    const out2 = h("div", { class: "nm-read" }, b2);
    const sv = s("svg", { viewBox: "0 0 320 150", class: "dial" }, b2);
    const arr = C.seguridad.porHora, X = i => 14 + i * 12.6, Y = v => 130 - v * 1.15;
    s("rect", { x: X(19), y: 10, width: X(23) - X(19) + 6, height: 120, fill: "#ff8a7a", "fill-opacity": .14 }, sv);
    s("rect", { x: 8, y: 10, width: X(6) - 8, height: 120, fill: "#ff8a7a", "fill-opacity": .14 }, sv);
    s("path", { d: "M" + arr.map((v, i) => `${X(i)} ${Y(v)}`).join("L") + `L${X(23)} 130L${X(0)} 130Z`, fill: "#f8e544", "fill-opacity": .35 }, sv);
    s("path", { d: "M" + arr.map((v, i) => `${X(i)} ${Y(v)}`).join("L"), fill: "none", stroke: "#111", "stroke-width": 2 }, sv);
    [0, 6, 12, 18, 23].forEach(i => s("text", { x: X(i), y: 145, "text-anchor": "middle", fill: "#77776f", "font-size": 9 }, sv, String(i).padStart(2, "0")));
    const cur2 = s("line", { y1: 10, y2: 130, stroke: "#111", "stroke-dasharray": "3 3" }, sv);
    const dot = s("circle", { r: 6, fill: "#f8e544", stroke: "#111", "stroke-width": 1.5 }, sv);
    const setH = i => { i = A.clamp(Math.round(i), 0, 23); cur2.setAttribute("x1", X(i)); cur2.setAttribute("x2", X(i)); dot.setAttribute("cx", X(i)); dot.setAttribute("cy", Y(arr[i]));
      const v = arr[i]; out2.innerHTML = `<b>${v}/100</b> a las ${String(i).padStart(2, "0")}:00 · ${v >= 75 ? "se siente seguro" : v >= 50 ? "más o menos" : "se siente inseguro"}`; };
    const mv = ev => setH((A.svgPoint(sv, ev).x - 14) / 12.6);
    sv.addEventListener("pointerdown", ev => { sv.setPointerCapture(ev.pointerId); mv(ev); });
    sv.addEventListener("pointermove", ev => { if (sv.hasPointerCapture(ev.pointerId) || ev.pointerType === "mouse") mv(ev); });
    setH(new Date().getHours());
    // Ruido
    const b3 = card("i-ruido", "¿Qué hace ruido?", false, "ambiente", "Decibeles por fuente. La línea marca 65 dB: arriba de eso molesta.");
    const fr = [...C.ruido.fuentes].sort((a, b) => b.db - a.db);
    b3.innerHTML = `<div class="nm-noise">${fr.map(f => `<div><span>${f.nombre}</span><p><i style="--w:${(f.db - 30) / 60 * 100}%;--c:${f.db >= 65 ? "#ff5a4e" : "#00e887"}"></i><em style="left:${(35 / 60 * 100).toFixed(1)}%"></em></p><b>${f.db} dB</b></div>`).join("")}</div>`;
    // Superficie
    const b4 = card("i-sup", "¿Cuánto mide el parque?", true, "contexto", "Tres fuentes, tres números distintos. Tocá cada cuadrado.");
    const sup = [["Predio total (Perfil 2021)", 87582, "#e6e6e2"], ["Espacio público (La Nación)", 30000, "#08b8f8"], ["Verde (La Nación)", 19000, "#00e887"], ["Relevado por ATLAS", 14200, "#f8e544"]];
    const o4 = h("div", { class: "nm-read" }, b4, "<b>87.582 m²</b> · predio total");
    const sv4 = s("svg", { viewBox: "0 0 320 170" }, b4);
    sup.forEach(([n, v, c], i) => {
      const side = Math.sqrt(v / 87582) * 160;
      const r = s("rect", { x: 4, y: 166 - side, width: side, height: side, fill: c, stroke: "#111", "stroke-width": 1, style: "cursor:pointer" }, sv4);
      r.onclick = r.onmouseenter = () => o4.innerHTML = `<b>${A.fmt(v)} m²</b> · ${n}`;
    });
    s("text", { x: 180, y: 40, fill: "#ff5a4e", "font-size": 12, "font-weight": 600 }, sv4, "las fuentes no coinciden");
    const lk = h("button", { class: "linkbtn small" }, b4, "Ver la ficha →"); lk.onclick = () => openFicha("f02");
  }

  /* =====================================================================
     03 · RELACIONES: red viva (actores · temas · fichas · oportunidades)
     ===================================================================== */
  function relaciones(tp) {
    tp.innerHTML = `<div class="rl-top"><div class="chips" id="rl-f">
        <button class="chip on" data-rf="all">Toda la red</button>
        ${I.perfiles.map(p => `<button class="chip" data-rf="${p.id}" style="--c:${p.color}"><i class="sq" style="--c:${p.color}"></i>${p.nombre}</button>`).join("")}
        <button class="chip" data-rf="tension" style="--c:#ff5a4e"><i class="sq" style="--c:#ff5a4e"></i>Solo tensiones</button></div>
        <button class="btn small" data-net="md">Descargar informe de relaciones</button></div>
      <div class="net-wrap rl-wrap"><svg id="net" viewBox="0 0 1000 600"></svg>
        <div class="rl-legend"><span><i class="c" style="--c:#9b6cff"></i>Actores</span><span><i class="t"></i>Temas</span><span><i class="f"></i>Fichas</span><span><i class="o"></i>Oportunidades</span><span><i class="x"></i>Tensión</span></div></div>
      <div id="net-info" class="net-info rl-info">Tocá un nodo para ver con qué se conecta. Podés arrastrarlos.</div>`;
    const svg = tp.querySelector("#net"), info = tp.querySelector("#net-info"), W = 1000, H = 600;
    const P = I.perfiles, fichas = I.fichas, M = I.matriz;
    const N = [], E = [];
    const add = n => { n.x = W / 2 + A.rand(-260, 260); n.y = H / 2 + A.rand(-180, 180); n.vx = n.vy = 0; n.ph = Math.random() * 6.28; N.push(n); return n; };
    const actorN = P.map((a, i) => { const n = add({ id: a.id, kind: "actor", label: a.nombre, r: 34, color: a.color, fx: [W / 2, 150, W - 150][i], fy: [70, H - 70, H - 70][i] }); n.x = n.fx; n.y = n.fy; return n; });
    const cats = CATS.filter(c => fichas.some(f => f.cat === c.id));
    const catN = cats.map(c => add({ id: c.id, kind: "cat", label: c.nombre, r: 15, color: "#111", forma: c.forma }));
    const fN = fichas.map(f => add({ id: f.id, kind: "ficha", label: f.titulo, r: 5.5, color: I.estados[f.estado].color, f }));
    // Oportunidades (de la matriz) conectadas a los temas que las sostienen
    const OP_CAT = { gastro: ["usos", "voces"], deporte: ["usos", "ambiente"], cultura: ["patrimonio", "participacion"], infra: ["seguridad", "movilidad"], comercio: ["normas", "contexto"], tec: ["obras", "gestion"], inmo: ["normas", "contexto", "antecedentes"], otros: ["ambiente", "voces"] };
    const opN = M.items.slice(0, 9).map(([n, d, p, tipo]) => add({ id: "op-" + n, kind: "op", label: n, r: 9, color: M.tipos[tipo][1], tipo }));
    const byId = id => N.find(n => n.id === id);
    fN.forEach(n => { const c = byId(n.f.cat); if (c) E.push({ a: n, b: c, len: 46 }); });
    catN.forEach(c => P.forEach(a => { if (a.sugeridas.includes(c.id)) E.push({ a: c, b: byId(a.id), len: 210, weak: true, col: a.color }); }));
    fN.forEach(n => { if (n.f.tension) { const o = byId(n.f.tension); if (o && n.id < o.id) E.push({ a: n, b: o, len: 110, tension: true }); } });
    opN.forEach(o => (OP_CAT[o.tipo] || []).forEach(c => { const cn = byId(c); if (cn) E.push({ a: o, b: cn, len: 90, op: true, col: o.color }); }));
    opN.forEach(o => { const v = M.items.find(x => x[0] === o.label)[5]; ({ u: "ciudadanos", p: "publico", v: "privado" }); [...v].forEach(ch => { const a = byId({ u: "ciudadanos", p: "publico", v: "privado" }[ch]); if (a) E.push({ a: o, b: a, len: 260, weak: true, col: a.color }); }); });

    const gE = s("g", {}, svg), gP = s("g", {}, svg), gN = s("g", {}, svg);
    E.forEach(e => e.el = s("line", { stroke: e.tension ? "#ff5a4e" : e.col || "#bdbdb7", "stroke-opacity": e.weak ? .28 : e.op ? .5 : .55, "stroke-width": e.tension ? 2 : e.weak ? 1 : 1.2, "stroke-dasharray": e.tension ? "6 4" : e.op ? "2 4" : "none", class: e.tension ? "rl-tens" : "" }, gE));
    let sel = null, filt = "all";
    N.forEach(n => {
      n.g = s("g", { style: "cursor:pointer;touch-action:none", class: "rl-n rl-" + n.kind }, gN);
      if (n.kind === "cat") s("path", { d: A.shape(n.forma, 0, 0, n.r), fill: "#fff", stroke: "#111", "stroke-width": 1.5 }, n.g);
      else if (n.kind === "op") s("path", { d: A.shape("reuleaux", 0, 0, n.r), fill: n.color, stroke: "#111", "stroke-width": 1 }, n.g);
      else if (n.kind === "actor") { s("circle", { r: n.r + 8, fill: "none", stroke: n.color, "stroke-width": 1.5, class: "rl-halo" }, n.g); s("circle", { r: n.r, fill: n.color, stroke: "#111", "stroke-width": 1.4 }, n.g); }
      else s("circle", { r: n.r, fill: n.color, stroke: "#111", "stroke-width": .8 }, n.g);
      n.t = s("text", { y: n.kind === "actor" ? 4 : n.r + 13, "text-anchor": "middle", class: "rl-t rl-t-" + n.kind }, n.g, n.kind === "ficha" || n.kind === "op" ? "" : n.label);
      let drag = false, moved = 0;
      n.g.addEventListener("pointerdown", ev => { drag = true; moved = 0; n.g.setPointerCapture(ev.pointerId); });
      n.g.addEventListener("pointermove", ev => { if (!drag) return; const q = A.svgPoint(svg, ev); moved += Math.abs(q.x - n.x) + Math.abs(q.y - n.y); n.x = q.x; n.y = q.y; n.vx = n.vy = 0; });
      n.g.addEventListener("pointerup", () => { drag = false; if (moved < 6) select(n); });
      n.g.addEventListener("pointerenter", () => { if (!sel && (n.kind === "ficha" || n.kind === "op")) n.t.textContent = n.label.length > 36 ? n.label.slice(0, 34) + "…" : n.label; });
      n.g.addEventListener("pointerleave", () => { if (!sel && (n.kind === "ficha" || n.kind === "op")) n.t.textContent = ""; });
    });
    // Pulsos que viajan por las conexiones (la red está viva)
    const pulses = Array.from({ length: 90 }, () => ({ e: E[Math.floor(Math.random() * E.length)], t: Math.random(), v: A.rand(.25, .6), el: s("circle", { r: 2.4 }, gP) }));
    function visible(e) {
      if (filt === "all") return true;
      if (filt === "tension") return e.tension;
      const a = byId(filt); return e.a === a || e.b === a || (e.a.kind === "ficha" && I.perfiles.find(p => p.id === filt).sugeridas.includes(e.a.f.cat)) || (e.a.kind === "op" && e.b.kind === "cat" && I.perfiles.find(p => p.id === filt).sugeridas.includes(e.b.id));
    }
    function paint() {
      const nb = new Set(sel ? [sel] : []);
      if (sel) E.forEach(e => { if (e.a === sel) nb.add(e.b); if (e.b === sel) nb.add(e.a); });
      const act = new Set(); E.forEach(e => { if (visible(e)) { act.add(e.a); act.add(e.b); } });
      N.forEach(m => m.g.style.opacity = sel ? (nb.has(m) ? 1 : .12) : (filt === "all" || act.has(m) ? 1 : .12));
      E.forEach(e => e.el.style.opacity = sel ? (e.a === sel || e.b === sel ? 1 : .05) : (visible(e) ? 1 : .05));
      N.forEach(m => { if (m.kind === "ficha" || m.kind === "op") m.t.textContent = sel && nb.has(m) ? (m.label.length > 30 ? m.label.slice(0, 28) + "…" : m.label) : ""; });
    }
    function select(n) {
      sel = sel === n ? null : n; paint();
      if (!sel) { info.innerHTML = "Tocá un nodo para ver con qué se conecta. Podés arrastrarlos."; return; }
      const near = E.filter(e => e.a === sel || e.b === sel).map(e => e.a === sel ? e.b : e.a);
      const lab = { actor: "Actor", cat: "Tema", ficha: "Ficha", op: "Oportunidad" }[sel.kind];
      if (sel.kind === "ficha") info.innerHTML = `<span class="rl-k">${lab}</span><b>${sel.label}</b> ${A.tag(sel.f.real)}<p>${sel.f.relacion}</p><button class="linkbtn" data-open="${sel.id}">Abrir ficha →</button>`;
      else info.innerHTML = `<span class="rl-k">${lab}</span><b>${sel.label}</b><p>Se conecta con ${near.length}: ${near.slice(0, 10).map(m => m.kind === "ficha" ? `<button class="linkbtn" data-open="${m.id}">${m.label}</button>` : `<span>${m.label}</span>`).join(" · ")}${near.length > 10 ? "…" : ""}</p>`;
      info.querySelectorAll("[data-open]").forEach(b => b.onclick = () => openFicha(b.dataset.open));
    }
    tp.querySelectorAll("[data-rf]").forEach(b => b.onclick = () => { filt = b.dataset.rf; sel = null; tp.querySelectorAll("[data-rf]").forEach(x => x.classList.toggle("on", x === b)); paint(); });
    tp.querySelector('[data-net="md"]').onclick = () => saveFile(relacionesMD(), "atlas-relaciones-colegiales.md");
    let T = 0;
    setStop(A.loop(dt => {
      if (document.body.dataset.view !== "archivo") return;
      T += dt;
      for (let i = 0; i < N.length; i++) for (let j = i + 1; j < N.length; j++) {
        const a = N[i], b = N[j]; let dx = b.x - a.x, dy = b.y - a.y; const d2 = dx * dx + dy * dy + .01; if (d2 > 40000) continue; const d = Math.sqrt(d2);
        const f = 700 * (a.r + b.r) / d2; dx /= d; dy /= d; a.vx -= dx * f; a.vy -= dy * f; b.vx += dx * f; b.vy += dy * f;
      }
      E.forEach(e => { const dx = e.b.x - e.a.x, dy = e.b.y - e.a.y, d = Math.hypot(dx, dy) || 1, k = (d - e.len) * (e.weak ? .003 : .025); e.a.vx += dx / d * k * 10; e.a.vy += dy / d * k * 10; e.b.vx -= dx / d * k * 10; e.b.vy -= dy / d * k * 10; });
      N.forEach(n => {
        if (n.kind === "actor") { n.vx += (n.fx - n.x) * .25; n.vy += (n.fy - n.y) * .25; }
        // deriva suave permanente
        n.vx += Math.cos(T * .7 + n.ph) * .5; n.vy += Math.sin(T * .9 + n.ph) * .5;
        n.vy += (H / 2 - n.y) * .003; n.vx += (W / 2 - n.x) * .002;
        n.vx *= .8; n.vy *= .8;
        n.x = A.clamp(n.x + n.vx * dt * 6, 24, W - 24); n.y = A.clamp(n.y + n.vy * dt * 6, 24, H - 24);
        n.g.setAttribute("transform", `translate(${n.x.toFixed(1)} ${n.y.toFixed(1)})`);
      });
      E.forEach(e => { e.el.setAttribute("x1", e.a.x.toFixed(1)); e.el.setAttribute("y1", e.a.y.toFixed(1)); e.el.setAttribute("x2", e.b.x.toFixed(1)); e.el.setAttribute("y2", e.b.y.toFixed(1)); });
      pulses.forEach(p => {
        p.t += dt * p.v; if (p.t > 1) { p.t = 0; p.e = E[Math.floor(Math.random() * E.length)]; }
        const on = sel ? (p.e.a === sel || p.e.b === sel) : visible(p.e);
        p.el.setAttribute("cx", A.lerp(p.e.a.x, p.e.b.x, p.t).toFixed(1)); p.el.setAttribute("cy", A.lerp(p.e.a.y, p.e.b.y, p.t).toFixed(1));
        p.el.setAttribute("fill", p.e.tension ? "#ff5a4e" : p.e.col || "#111"); p.el.setAttribute("opacity", on ? .9 : 0);
      });
    }));
  }

  /* =====================================================================
     01 · CÓMO SE PROCESA (el gráfico principal + los 5 pasos explicados)
     ===================================================================== */
  const PASOS = [
    { n: "Recibir", d: "Juntamos todo lo que llega: lo que la gente cuenta, lo que miden los sensores y lo que publican las instituciones. Se limpia y se sacan duplicados.", ej: "Llega un aporte anónimo: «Poca luz sobre el borde de las vías»." },
    { n: "Geolocalizar", d: "Cada dato se ubica en un lugar del parque. Así sabemos dónde pasa cada cosa.", ej: "Se ubica en el sector Pérgolas, junto a las vías." },
    { n: "Clasificar", d: "Se ordena por tema (seguridad, ambiente, usos…) y por quién lo dice.", ej: "Tema: iluminación y seguridad. Lo dice la ciudadanía." },
    { n: "Relacionar", d: "Se cruza con otros datos para encontrar coincidencias y tensiones.", ej: "Coincide con el sensor: después de las 20 h baja la gente y la seguridad percibida." },
    { n: "Comparar", d: "Se compara con otros momentos y otros parques para ver qué funciona.", ej: "En Centenario la iluminación nocturna sumó gente a la noche." }
  ];
  /* Detalle de cada forma de ingresar información */
  const ENTRA = {
    dicen: { ej: ["Aportes anónimos en la app (reclamos, pedidos, propuestas)", "Entrevistas a vecinos, trabajadores y organizaciones", "Reseñas y comentarios públicos en redes", "Consultas y audiencias públicas"], frec: "Todos los días", cuanto: "≈ 40 aportes por semana", proc: "Se lee cada texto, se le asigna un tema y una zona, y se borra todo lo que pueda identificar a alguien.", priv: "Sin nombre, sin cuenta y sin ubicación del teléfono.", va: ["ciudadanos", "publico", "privado"] },
    hacen: { ej: ["Conteo de personas por zona y por hora", "Recorridos y permanencias observadas", "Usos: deporte, juegos, picnic, mascotas", "Registros del equipo en el territorio"], frec: "Continua (sensores) y cada 3 meses (observación)", cuanto: "≈ 2.400 registros por día", proc: "Se agrupa por hora y por zona para ver cuándo y dónde se usa el parque.", priv: "Se cuentan personas, nunca se las identifica.", va: ["publico", "privado"] },
    muestra: { ej: ["Ruido (decibeles) y clima", "Estado de la vegetación y del equipamiento", "Accesos, cruces y movilidad", "Imágenes de drones a gran altura"], frec: "Continua y una vez por mes (drones)", cuanto: "≈ 9.000 mediciones por día", proc: "Se ubica cada medición en el plano y se compara con días anteriores.", priv: "Las imágenes no permiten reconocer personas y se borran al procesarse.", va: ["ciudadanos", "publico"] },
    definen: { ej: ["Código Urbanístico y leyes del predio", "Permisos, obras y licitaciones", "Presupuesto y precios del suelo", "Censos y datos abiertos"], frec: "Cada vez que cambian", cuanto: "17 documentos relevados", proc: "Se resume en reglas claras: qué se puede, qué no y con qué condiciones.", priv: "Información pública.", va: ["ciudadanos", "publico", "privado"] }
  };
  function flujo(tp) {
    const F = I.flujo;
    tp.innerHTML = `<div class="lcard"><p class="kicker">Recolectar · Procesar · Explorar</p><h3>Cómo viaja un dato por ATLAS</h3>
      <p class="small muted">Tocá una forma de ingresar información o un actor.</p>
      <div class="fl-two"><div class="net-wrap"><svg id="fl" viewBox="0 0 900 460"></svg></div><div id="fl-info" class="fl-info"></div></div></div>
      <div class="pr-steps">
        <div class="pr-vis"><svg id="pr-svg" viewBox="0 0 470 500" aria-label="Las cinco capas del procesamiento"></svg></div>
        <div class="pr-txt">
          <p class="ev-sub">Los 5 pasos, uno por uno</p>
          <ol class="pr-list">${PASOS.map((p, i) => `<li data-ps="${i}"><button><span class="pr-n">${i + 1}</span><b>${p.n}</b><i class="pr-bar"></i></button><div class="pr-d"><p>${p.d}</p><p class="pr-ej"><span>Ejemplo</span>${p.ej}</p></div></li>`).join("")}</ol>
        </div>
      </div>
      <div class="pr-out"><p class="ev-sub">Qué recibe cada actor</p><div class="pr-3">${F.salidas.map(o => `<div style="--c:${o.color}"><i></i><b>${o.nombre}</b><p>${o.recibe[0].toUpperCase() + o.recibe.slice(1)}.</p></div>`).join("")}</div></div>`;
    const svg = tp.querySelector("#fl"), info = tp.querySelector("#fl-info");
    const CX0 = 450, CY0 = 230;
    const gL = s("g", {}, svg), gP = s("g", {}, svg), gN = s("g", {}, svg);
    s("path", { d: A.shape("reuleaux", CX0, CY0, 52), fill: "#111" }, gN);
    s("text", { x: CX0, y: CY0 + 82, "text-anchor": "middle", fill: "#111", "font-size": 14, "font-weight": 600, "letter-spacing": 2 }, gN, "ATLAS");
    s("text", { x: CX0, y: CY0 + 100, "text-anchor": "middle", fill: "#77776f", "font-size": 11 }, gN, "recibir · ubicar · clasificar · relacionar · comparar");
    const paths = [], boxes = {};
    const mk = (x1, y1, x2, y2, col, owner) => { for (let i = 0; i < 5; i++) { const o = (i - 2) * 6, mx = (x1 + x2) / 2;
      const el = s("path", { d: `M${x1} ${y1 + o}C${mx} ${y1 + o + Math.sin(i) * 30},${mx} ${y2 + o * .3 - Math.cos(i) * 30},${x2} ${y2 + o * .3}`, fill: "none", stroke: col, "stroke-opacity": .35, "stroke-width": 1.2 }, gL);
      paths.push({ el, owner, col, len: 0 }); } };
    const NOM = Object.fromEntries(F.salidas.map(o => [o.id, o]));
    const showIn = e => { const m = ENTRA[e.id];
      return `<div class="fl-card" style="--c:${e.color}"><p class="fl-k">Forma de ingresar información</p><h4>${e.nombre}</h4><p>${e.detalle[0].toUpperCase() + e.detalle.slice(1)}. Llega por: ${e.via.toLowerCase()}.</p>
        <p class="lsub">Qué incluye</p><ul>${m.ej.map(x => `<li>${x}</li>`).join("")}</ul>
        <div class="fl-kv"><div><span>Cada cuánto</span><b>${m.frec}</b></div><div><span>Cuánto llega</span><b>${m.cuanto}</b> ${A.tag(false)}</div></div>
        <p class="lsub">Qué hace ATLAS con esto</p><p>${m.proc}</p>
        <p class="fl-priv">🔒 ${m.priv}</p>
        <p class="lsub">A quién le sirve</p><p class="fl-to">${m.va.map(id => `<span style="--c:${NOM[id].color}"><i></i>${NOM[id].nombre}</span>`).join("")}</p></div>`; };
    const showOut = o => `<div class="fl-card" style="--c:${o.color}"><p class="fl-k">Actor</p><h4>${o.nombre}</h4><p>Recibe ${o.recibe}.</p>
        <p class="lsub">Le llega desde</p><p class="fl-to">${F.entradas.filter(e => ENTRA[e.id].va.includes(o.id)).map(e => `<span style="--c:${e.color}"><i></i>${e.nombre}</span>`).join("")}</p></div>`;
    F.entradas.forEach((e, i) => {
      const y = 60 + i * 110; mk(190, y, CX0 - 50, CY0, e.color, e.id);
      const g = s("g", { style: "cursor:pointer", class: "fl-n" }, gN);
      boxes[e.id] = s("rect", { x: 10, y: y - 30, width: 180, height: 60, rx: 12, fill: "#fff", stroke: "#111", "stroke-width": 1.2 }, g);
      s("circle", { cx: 26, cy: y - 10, r: 5, fill: e.color, stroke: "#111" }, g);
      s("text", { x: 38, y: y - 6, fill: "#111", "font-size": 14, "font-weight": 600 }, g, e.nombre);
      s("text", { x: 24, y: y + 14, fill: "#77776f", "font-size": 10.5 }, g, e.detalle.length > 30 ? e.detalle.slice(0, 29) + "…" : e.detalle);
      g.onclick = () => focus(e.id, showIn(e));
    });
    F.salidas.forEach((o, i) => {
      const y = 90 + i * 140; mk(CX0 + 50, CY0, 710, y, o.color, o.id);
      const g = s("g", { style: "cursor:pointer", class: "fl-n" }, gN);
      boxes[o.id] = s("circle", { cx: 740, cy: y, r: 26, fill: o.color, stroke: "#111", "stroke-width": 1.2 }, g);
      s("text", { x: 774, y: y + 5, fill: "#111", "font-size": 15, "font-weight": 600 }, g, o.nombre);
      g.onclick = () => focus(o.id, showOut(o));
    });
    paths.forEach(p => p.len = p.el.getTotalLength());
    let focusId = null;
    function focus(id, html) {
      focusId = id;
      Object.entries(boxes).forEach(([k, b]) => b.setAttribute("stroke-width", k === id ? 3 : 1.2));
      paths.forEach(p => { p.el.setAttribute("stroke-opacity", p.owner === focusId ? .7 : .06); p.el.setAttribute("stroke-width", p.owner === focusId ? 2 : 1.2); });
      info.innerHTML = html;
    }
    focus(F.entradas[0].id, showIn(F.entradas[0]));
    const parts = Array.from({ length: 90 }, () => ({ p: paths[Math.floor(Math.random() * paths.length)], t: Math.random(), el: s("circle", { r: 3, stroke: "#111", "stroke-width": .5 }, gP) }));

    /* --- Las cinco capas, con contenido de verdad --- */
    const ps = tp.querySelector("#pr-svg"), cx = 215, iso = (x, y, cy) => [cx + (x - y) * .95, cy + (x + y) * .4];
    const P2 = (pts) => "M" + pts.map(q => q.map(v => v.toFixed(1)).join(" ")).join("L") + "Z";
    const LY = PASOS.map((_, i) => 70 + i * 88), layers = [];
    for (let k = 0; k < 6; k++) s("path", { d: `M${120 + k * 38} 4V${LY[0] - 44}`, stroke: "#111", "stroke-width": 1, "stroke-dasharray": "2 3", class: "pr-in" }, ps);
    PASOS.forEach((p, i) => {
      const g = s("g", { class: "pr-layer", style: "cursor:pointer" }, ps), cy = LY[i];
      s("path", { d: P2([[-115, -115], [115, -115], [115, 115], [-115, 115]].map(([x, y]) => iso(x, y, cy))), fill: "#fff", stroke: "#111", "stroke-width": 1.2, class: "pr-plane" }, g);
      for (let k = -115 + 46; k < 115; k += 46) { const a = iso(k, -115, cy), b = iso(k, 115, cy), c = iso(-115, k, cy), d = iso(115, k, cy);
        s("path", { d: `M${a.join(" ")}L${b.join(" ")}M${c.join(" ")}L${d.join(" ")}`, stroke: "#111", "stroke-opacity": .1 }, g); }
      const cont = s("g", {}, g), items = [];
      let sd = i * 7 + 3; const r = () => ((sd = (sd * 9301 + 49297) % 233280) / 233280);
      const parkShape = () => s("path", { d: P2([[-95, -40], [95, -60], [100, 40], [-90, 55]].map(([x, y]) => iso(x, y, cy))), fill: "#00e887", "fill-opacity": .18, stroke: "#00e887", "stroke-width": 1 }, cont);
      if (i === 0) { // RECIBIR: llegan íconos de distintas fuentes
        [["cel", "#9b6cff", -70, -50], ["chat", "#9b6cff", -20, 40], ["son", "#f8e544", 30, -30], ["doc", "#00e887", 70, 50], ["cam", "#f8e544", -60, 70], ["libro", "#00e887", 80, -70]].forEach(([id, c, x, y]) => {
          const [X, Y] = iso(x, y, cy), gi = s("g", {}, cont); s("circle", { cx: X, cy: Y - 4, r: 13, fill: c, "fill-opacity": .35, stroke: "#111", "stroke-width": .8 }, gi); icono(gi, id, X, Y - 4, "#111");
          gi.dataset.base = `translate(${X} ${Y}) scale(.62) translate(${-X} ${-Y})`; gi.setAttribute("transform", gi.dataset.base); items.push(gi); });
      }
      if (i === 1) { // GEOLOCALIZAR: el parque, puntos y pines
        parkShape();
        s("path", { d: "M" + [[-90, 10], [-30, -10], [20, 15], [90, -5]].map(([x, y]) => iso(x, y, cy).join(" ")).join("L"), fill: "none", stroke: "#111", "stroke-width": 1.4, "stroke-dasharray": "4 3" }, cont);
        for (let k = 0; k < 34; k++) { const [x, y] = iso(r() * 190 - 95, r() * 110 - 55, cy); s("circle", { cx: x, cy: y, r: 1.8, fill: "#111" }, cont); }
        [[-50, -20], [40, 20], [5, -45], [75, -10]].forEach(([a, b]) => { const [x, y] = iso(a, b, cy); items.push(s("path", { d: `M${x} ${y}c-6-8-8-11-8-15a8 8 0 0 1 16 0c0 4-2 7-8 15z`, fill: "#f8e544", stroke: "#111", "stroke-width": 1.2 }, cont)); });
      }
      if (i === 2) { // CLASIFICAR: grupos por tema con etiqueta
        [["Seguridad", "#ff8a7a", -60, -50], ["Ambiente", "#00e887", 55, -55], ["Usos", "#9b6cff", -55, 50], ["Normas", "#08b8f8", 55, 55]].forEach(([n, c, gx, gy]) => {
          for (let k = 0; k < 5; k++) { const [x, y] = iso(gx + (k % 3) * 16 - 16, gy + Math.floor(k / 3) * 16 - 8, cy); items.push(s("rect", { x: x - 6, y: y - 6, width: 12, height: 9, fill: c, stroke: "#111", "stroke-width": .8 }, cont)); }
          const [lx, ly] = iso(gx, gy - 26, cy); s("text", { x: lx, y: ly, "text-anchor": "middle", class: "pr-tag" }, cont, n); });
      }
      if (i === 3) { // RELACIONAR: manchas y conexiones que muestran coincidencias
        const B = [[-60, -30, "#ff8a7a", "poca luz"], [30, 10, "#9b6cff", "menos gente"], [70, -60, "#08b8f8", "norma"], [-20, 70, "#00e887", "arbolado"]].map(([a, b, c, n]) => { const [x, y] = iso(a, b, cy); return [x, y, c, n]; });
        [[0, 1], [1, 2], [0, 3]].forEach(([a, b], k) => s("path", { d: `M${B[a][0]} ${B[a][1]}Q${(B[a][0] + B[b][0]) / 2} ${(B[a][1] + B[b][1]) / 2 - 20} ${B[b][0]} ${B[b][1]}`, fill: "none", stroke: k ? "#111" : "#ff5a4e", "stroke-width": 1.3, "stroke-dasharray": k ? "none" : "4 3" }, cont));
        B.forEach(([x, y, c, n]) => { items.push(s("ellipse", { cx: x, cy: y, rx: 24, ry: 10, fill: c, "fill-opacity": .55, stroke: "#111", "stroke-width": .8 }, cont)); s("text", { x, y: y + 22, "text-anchor": "middle", class: "pr-tag" }, cont, n); });
      }
      if (i === 4) { // COMPARAR: dos parques, lado a lado, con barras
        [[-60, "Colegiales", "#9b6cff", [.5, .8, .4]], [60, "Centenario", "#00e887", [.7, .6, .8]]].forEach(([ox, n, c, v]) => {
          s("path", { d: P2([[ox - 45, -60], [ox + 45, -60], [ox + 45, 60], [ox - 45, 60]].map(([x, y]) => iso(x, y, cy))), fill: c, "fill-opacity": .14, stroke: c }, cont);
          v.forEach((h, k) => { const [x, y] = iso(ox - 20 + k * 20, 20 - k * 20, cy); items.push(s("rect", { x: x - 5, y: y - h * 40, width: 10, height: h * 40, fill: c, stroke: "#111", "stroke-width": .8, "data-h": h * 40, "data-y": y })); cont.appendChild(items[items.length - 1]); });
          const [lx, ly] = iso(ox, 70, cy); s("text", { x: lx, y: ly + 14, "text-anchor": "middle", class: "pr-tag" }, cont, n);
        });
      }
      const [lx, ly] = iso(115, -115, cy);
      s("line", { x1: lx + 4, y1: ly, x2: 448, y2: ly, stroke: "#111", "stroke-dasharray": "2 3", "stroke-opacity": .5 }, g);
      s("circle", { cx: 456, cy: ly, r: 11, fill: "#f8e544", stroke: "#111", "stroke-width": 1 }, g);
      s("text", { x: 456, y: ly + 4, "text-anchor": "middle", "font-size": 11, "font-weight": 600, fill: "#111" }, g, i + 1);
      g.onclick = () => go(i);
      layers.push({ g, items, i });
    });
    const lis = [...tp.querySelectorAll(".pr-list li")];
    let cur = 0, acc = 0;
    function go(i) { cur = i; acc = 0; layers.forEach((l, k) => { l.g.classList.toggle("on", k === i); l.g.style.opacity = k === i ? 1 : .4; }); lis.forEach((li, k) => li.classList.toggle("on", k === i)); }
    lis.forEach((li, i) => li.querySelector("button").onclick = () => go(i));
    go(0);
    let T = 0;
    setStop(A.loop(dt => {
      if (document.body.dataset.view !== "archivo") return;
      T += dt;
      parts.forEach(q => { q.t += dt * .22; if (q.t > 1) { q.t = 0; q.p = paths[Math.floor(Math.random() * paths.length)]; }
        const pt = q.p.el.getPointAtLength(q.t * q.p.len); q.el.setAttribute("cx", pt.x); q.el.setAttribute("cy", pt.y); q.el.setAttribute("fill", q.p.col); q.el.setAttribute("opacity", !focusId || q.p.owner === focusId ? .95 : .1); });
      acc += dt; if (acc > 6) go((cur + 1) % 5);
      const bar = lis[cur] && lis[cur].querySelector(".pr-bar"); if (bar) bar.style.setProperty("--p", (acc / 6 * 100).toFixed(1) + "%");
      const L = layers[cur];
      L.items.forEach((el, k) => {
        const w = Math.sin(T * 3 + k);
        if (cur === 0) el.setAttribute("transform", `translate(0 ${(-Math.abs(w) * 8).toFixed(1)}) ${el.dataset.base}`);
        else if (cur === 1) el.setAttribute("transform", `translate(0 ${(-Math.abs(w) * 6).toFixed(1)})`);
        else if (cur === 2) el.setAttribute("transform", `translate(0 ${(-Math.abs(w) * 4).toFixed(1)})`);
        else if (cur === 3) { if (el.tagName === "ellipse") el.setAttribute("fill-opacity", (.35 + .4 * (w + 1) / 2).toFixed(2)); }
        else { const hh2 = +el.dataset.h * (.6 + .4 * (Math.sin(T * 2 + k) + 1) / 2); el.setAttribute("height", hh2.toFixed(1)); el.setAttribute("y", (+el.dataset.y - hh2).toFixed(1)); }
      });
    }));
  }

  /* =====================================================================
     02 · CÓMO SE RECOLECTA (como la lámina: fuentes alrededor del territorio)
     ===================================================================== */
  const FUENTES = [
    { id: "dron", n: "Relevamiento con drones", t: "terr", mide: "Ocupación, estado de la vegetación y del equipamiento.", frec: "Una vez por mes", priv: "Vuelo alto: las imágenes no permiten reconocer personas y se borran al procesarse.", rate: 2 },
    { id: "cam", n: "Registro en territorio", t: "terr", mide: "Cámaras que solo cuentan personas por zona.", frec: "Continua", priv: "No guardan imágenes ni reconocen rostros: solo un número.", rate: 6 },
    { id: "bino", n: "Observación de campo", t: "pers", mide: "Usos, permanencias y recorridos observados por el equipo.", frec: "Cada tres meses", priv: "Se anotan conductas, nunca identidades.", rate: 1.5 },
    { id: "libro", n: "Normas y leyes", t: "inst", mide: "Código Urbanístico, leyes y restricciones del predio.", frec: "Cuando cambian", priv: "Información pública.", rate: 1, real: true },
    { id: "chat", n: "Entrevistas", t: "pers", mide: "Lo que cuentan vecinos, trabajadores y organizaciones.", frec: "Cada tres meses", priv: "Respuestas anónimas y agregadas.", rate: 1.5 },
    { id: "pila", n: "Proyectos existentes", t: "inst", mide: "Obras, licitaciones y propuestas sobre el predio.", frec: "Según cada proyecto", priv: "Información pública.", rate: 1, real: true },
    { id: "son", n: "Sensores de sonido", t: "terr", mide: "Nivel de ruido (decibeles) por zona.", frec: "Continua", priv: "Miden volumen. No graban audio.", rate: 5 },
    { id: "wifi", n: "Acceso a wifi público", t: "terr", mide: "Cantidad de conexiones por hora, para estimar presencia.", frec: "Continua", priv: "Se cuentan conexiones, sin guardar datos de los dispositivos.", rate: 4 },
    { id: "doc", n: "Datos oficiales", t: "inst", mide: "Censos, datos abiertos, presupuesto y precios.", frec: "Según cada fuente", priv: "Datos públicos y agregados.", rate: 1, real: true },
    { id: "cel", n: "App móvil", t: "pers", mide: "Reclamos, pedidos, propuestas, consejos y avisos.", frec: "Cada vez que alguien aporta", priv: "Sin nombre, sin cuenta y sin ubicación del dispositivo.", rate: 3 }
  ];
  const TCOL = { pers: "#9b6cff", terr: "#f8e544", inst: "#00e887" };
  function icono(g, id, x, y, c) {
    const st2 = { fill: "none", stroke: c, "stroke-width": 2, "stroke-linecap": "round", "stroke-linejoin": "round" };
    const P = (d, o = {}) => s("path", Object.assign({ d }, st2, o), g);
    if (id === "dron") { P(`M${x - 10} ${y}h20M${x - 14} ${y - 6}h8M${x + 6} ${y - 6}h8M${x - 10} ${y - 6}v6M${x + 10} ${y - 6}v6`); s("rect", Object.assign({ x: x - 6, y: y - 2, width: 12, height: 8, rx: 2 }, st2, { fill: c }), g); }
    else if (id === "cam") { s("rect", Object.assign({ x: x - 12, y: y - 8, width: 24, height: 17, rx: 3 }, st2), g); s("circle", Object.assign({ cx: x, cy: y, r: 5 }, st2), g); P(`M${x - 5} ${y - 8}l2-4h6l2 4`); }
    else if (id === "bino") { s("circle", Object.assign({ cx: x - 7, cy: y + 3, r: 6 }, st2), g); s("circle", Object.assign({ cx: x + 7, cy: y + 3, r: 6 }, st2), g); P(`M${x - 9} ${y - 3}l2-8h4l1 6M${x + 9} ${y - 3}l-2-8h-4l-1 6M${x - 1} ${y}h2`); }
    else if (id === "libro") P(`M${x} ${y - 7}c-4-3-9-3-13-2v17c4-1 9-1 13 2c4-3 9-3 13-2V${y - 9}c-4-1-9-1-13 2zM${x} ${y - 7}v17`);
    else if (id === "chat") { P(`M${x - 13} ${y - 10}h15v10h-9l-4 4v-4h-2z`); P(`M${x + 2} ${y - 2}h11v10h-2v4l-4-4h-5z`); }
    else if (id === "pila") { [6, 0, -6].forEach(o => s("ellipse", Object.assign({ cx: x, cy: y + o, rx: 12, ry: 4 }, st2, { fill: "#111" }), g)); }
    else if (id === "son") { s("rect", Object.assign({ x: x - 12, y: y - 4, width: 6, height: 8 }, st2), g); P(`M${x - 6} ${y - 4}l6-6v20l-6-6M${x + 4} ${y - 4}a6 6 0 0 1 0 8M${x + 8} ${y - 8}a12 12 0 0 1 0 16`); }
    else if (id === "wifi") { P(`M${x - 13} ${y - 4}a18 18 0 0 1 26 0M${x - 8} ${y + 1}a11 11 0 0 1 16 0M${x - 4} ${y + 6}a5 5 0 0 1 8 0`); s("circle", { cx: x, cy: y + 10, r: 2, fill: c }, g); }
    else if (id === "doc") { s("rect", Object.assign({ x: x - 9, y: y - 12, width: 18, height: 24, rx: 2 }, st2), g); P(`M${x - 5} ${y - 6}h10M${x - 5} ${y - 1}h10M${x - 5} ${y + 4}h10`); }
    else if (id === "cel") { s("rect", Object.assign({ x: x - 8, y: y - 13, width: 16, height: 26, rx: 3 }, st2), g); s("circle", { cx: x, cy: y + 9, r: 1.5, fill: c }, g); }
  }
  function recoleccion(tp) {
    tp.innerHTML = `<div class="rc-panel">
        <div class="rc-head"><div><p class="rc-k">Hoy en el parque</p><p class="rc-count"><b id="rc-n">0</b> datos recibidos</p></div>
          <div class="rc-leg">${[["pers", "Lo que cuentan las personas"], ["terr", "Lo que mide el territorio"], ["inst", "Lo que publican las instituciones"]].map(([k, n]) => `<button data-rt="${k}" style="--c:${TCOL[k]}"><i></i>${n}</button>`).join("")}</div></div>
        <svg id="rc" viewBox="0 0 1000 660" aria-label="Fuentes de datos alrededor del parque"></svg>
      </div>
      <div class="rc-info" id="rc-info"></div>
      <p class="ev-note"><b>Todo dato que involucra personas es 100% anónimo.</b> Sensores, cámaras, micrófonos y aportes se guardan como números agregados: nunca se identifica a nadie (Ley 25.326 de Protección de Datos Personales).</p>`;
    const sv = tp.querySelector("#rc"), info = tp.querySelector("#rc-info");
    const CX = 500, CY = 250, SX = .92, SY = .42, iso = (x, y) => [CX + (x - y) * SX, CY + (x + y) * SY];
    const gl = s("g", {}, sv), gt = s("g", {}, sv), gp = s("g", {}, sv), gi = s("g", {}, sv);
    const P = pts => "M" + pts.map(p => p.map(v => v.toFixed(1)).join(" ")).join("L") + "Z";
    const poly = (pts, o, par = gt) => s("path", Object.assign({ d: P(pts) }, o), par);
    // Suelo: manzana completa con veredas y calles
    poly([iso(-170, -170), iso(170, -170), iso(170, 170), iso(-170, 170)], { fill: "#f4f4f1", stroke: "#111", "stroke-width": 1.2 });
    poly([iso(-150, -150), iso(150, -150), iso(150, 150), iso(-150, 150)], { fill: "#fbfbf9", stroke: "#111", "stroke-width": .8 });
    // Calle con línea punteada (borde frontal)
    s("path", { d: `M${iso(-170, 160)}L${iso(170, 160)}`, stroke: "#111", "stroke-dasharray": "6 6", "stroke-opacity": .4 }, gt);
    // Vías del tren (borde trasero)
    s("path", { d: `M${iso(-170, -162)}L${iso(170, -162)}M${iso(-170, -156)}L${iso(170, -156)}`, stroke: "#111", "stroke-width": 1 }, gt);
    for (let k = -165; k < 170; k += 10) s("path", { d: `M${iso(k, -165)}L${iso(k, -153)}`, stroke: "#111", "stroke-width": .7, "stroke-opacity": .6 }, gt);
    // Edificios alrededor (líneas negras sobre blanco, como la lámina)
    const box = (x, y, w, d, hgt) => {
      const top = [iso(x, y), iso(x + w, y), iso(x + w, y + d), iso(x, y + d)].map(([a, b]) => [a, b - hgt]);
      poly([iso(x, y + d), iso(x + w, y + d), [iso(x + w, y + d)[0], iso(x + w, y + d)[1] - hgt], [iso(x, y + d)[0], iso(x, y + d)[1] - hgt]], { fill: "#fff", stroke: "#111", "stroke-width": .9 });
      poly([iso(x + w, y), iso(x + w, y + d), [iso(x + w, y + d)[0], iso(x + w, y + d)[1] - hgt], [iso(x + w, y)[0], iso(x + w, y)[1] - hgt]], { fill: "#ecece8", stroke: "#111", "stroke-width": .9 });
      poly(top, { fill: "#fff", stroke: "#111", "stroke-width": .9 });
      for (let f = 10; f < hgt - 4; f += 10) { const a = iso(x + 4, y + d), b = iso(x + w - 4, y + d); s("path", { d: `M${a[0]} ${a[1] - f}L${b[0]} ${b[1] - f}`, stroke: "#111", "stroke-opacity": .25, "stroke-dasharray": "3 3" }, gt); }
    };
    // Parque: forma irregular, senderos, árboles, juegos, bancos
    poly([iso(-140, -100), iso(30, -140), iso(140, -120), iso(140, 60), iso(60, 140), iso(-140, 130)], { fill: "#c9f7de", stroke: "#00b86b", "stroke-width": 1.2 });
    s("path", { d: `M${iso(-140, 20)}C${iso(-60, -40)} ${iso(10, 60)} ${iso(80, 0)}S${iso(130, -60)} ${iso(140, -60)}`, fill: "none", stroke: "#fff", "stroke-width": 9, "stroke-linecap": "round" }, gt);
    s("path", { d: `M${iso(-140, 20)}C${iso(-60, -40)} ${iso(10, 60)} ${iso(80, 0)}S${iso(130, -60)} ${iso(140, -60)}`, fill: "none", stroke: "#111", "stroke-width": .8, "stroke-dasharray": "2 4" }, gt);
    s("path", { d: `M${iso(-20, -130)}C${iso(-10, -60)} ${iso(30, 40)} ${iso(10, 135)}`, fill: "none", stroke: "#fff", "stroke-width": 7, "stroke-linecap": "round" }, gt);
    // Plaza central y juegos
    const [px, py] = iso(-60, 50); s("ellipse", { cx: px, cy: py, rx: 34, ry: 15, fill: "#f8e544", "fill-opacity": .6, stroke: "#111", "stroke-width": .8 }, gt);
    [[-70, 45], [-52, 58], [-48, 40]].forEach(([a, b], k) => { const [x, y] = iso(a, b); s("path", { d: A.shape(["triangulo", "circulo", "cuadrado"][k], x, y - 3, 5), fill: ["#ff8a7a", "#08b8f8", "#9b6cff"][k], stroke: "#111", "stroke-width": .6 }, gt); });
    // Galpón y estación (patrimonio)
    box(60, -135, 70, 30, 22);
    // Árboles (ordenados de atrás hacia adelante)
    let sd = 11; const r = () => ((sd = (sd * 9301 + 49297) % 233280) / 233280);
    const trees = Array.from({ length: 34 }, () => [r() * 250 - 130, r() * 230 - 110]).filter(([x, y]) => !(x > 50 && y < -95) && Math.hypot(x + 60, y - 50) > 30)
      .sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]));
    trees.forEach(([x, y]) => { const [X, Y] = iso(x, y), h2 = 9 + r() * 7;
      s("path", { d: `M${X} ${Y}V${Y - h2}`, stroke: "#111", "stroke-width": 1 }, gt);
      s("circle", { cx: X, cy: Y - h2 - 4, r: 6 + r() * 3, fill: r() > .3 ? "#00e887" : "#7ef0b6", stroke: "#111", "stroke-width": .8 }, gt); });
    // Bancos
    [[-100, 0], [20, 30], [100, -40]].forEach(([x, y]) => { const a = iso(x, y), b = iso(x + 12, y); s("path", { d: `M${a[0]} ${a[1]}L${b[0]} ${b[1]}`, stroke: "#111", "stroke-width": 2.5 }, gt); });
    // Edificios del frente y costados (después, para que tapen)
    [[-170, -150, 20, 40, 34], [-170, -100, 20, 50, 46], [-170, -40, 20, 60, 28], [150, -150, 20, 50, 40], [150, -90, 20, 40, 30], [150, 40, 20, 60, 50], [-170, 40, 20, 50, 38], [-170, 100, 20, 50, 30]].forEach(b => box(...b));

    // Fuentes: 5 a la izquierda y 5 a la derecha (como en la lámina), sin cruzarse
    const L = [iso(-150, -150), iso(-150, 150), iso(150, 150)], R2 = [iso(-150, -150), iso(150, -150), iso(150, 150)];
    const along = (poly3, t) => { const [a, b, c] = poly3, d1 = Math.hypot(b[0] - a[0], b[1] - a[1]), d2 = Math.hypot(c[0] - b[0], c[1] - b[1]), u = t * (d1 + d2);
      return u <= d1 ? [A.lerp(a[0], b[0], u / d1), A.lerp(a[1], b[1], u / d1)] : [A.lerp(b[0], c[0], (u - d1) / d2), A.lerp(b[1], c[1], (u - d1) / d2)]; };
    let filt = null, selF = null;
    const src = FUENTES.map((f, i) => {
      const left = i < 5, k = left ? i : i - 5, x = left ? 72 : 928, y = 70 + k * 104, c = TCOL[f.t];
      const [tx, ty] = along(left ? L : R2, .12 + k * .16);
      const sx = left ? x + 30 : x - 30;
      const path = s("path", { d: `M${sx} ${y}C${(sx + tx) / 2} ${y},${(sx + tx) / 2} ${ty},${tx} ${ty}`, fill: "none", stroke: "#111", "stroke-opacity": .5, "stroke-dasharray": "3 5" }, gl);
      s("circle", { cx: tx, cy: ty, r: 3, fill: "#111" }, gl);
      const g = s("g", { class: "rc-src", tabindex: 0, role: "button", "aria-label": f.n, style: "cursor:pointer" }, gi);
      s("circle", { cx: x, cy: y, r: 26, fill: c, stroke: "#111", "stroke-width": 1.4, class: "rc-ring" }, g);
      icono(g, f.id, x, y, "#111");
      const words = f.n.split(" "), half = Math.ceil(words.length / 2);
      [words.slice(0, half).join(" "), words.slice(half).join(" ")].forEach((t, j) => t && s("text", { x, y: y + 42 + j * 13, "text-anchor": "middle", class: "rc-lbl" }, g, t));
      g.onclick = () => pick(i); g.onkeydown = e => { if (e.key === "Enter") pick(i); };
      return { f, path, g, len: 0, c };
    });
    src.forEach(q => q.len = q.path.getTotalLength());
    // Bajada: del parque a la base ATLAS (centrada, sin cruzar fuentes)
    const bot = iso(170, 170);
    const ST = [["Anonimización", "sin datos personales", 320], ["Validación", "sector público", 500], ["Base ATLAS", "lista para leer", 680]];
    s("path", { d: `M${bot[0]} ${bot[1]}V575M320 575H680`, fill: "none", stroke: "#111", "stroke-opacity": .3 }, gl);
    ST.forEach(([t1, t2, x], k) => { const g = s("g", {}, gi);
      if (k === 2) s("path", { d: A.shape("reuleaux", x, 590, 24), fill: "#111" }, g);
      else s("rect", { x: x - 72, y: 568, width: 144, height: 44, rx: 22, fill: "#fff", stroke: "#111", "stroke-width": 1.4 }, g);
      s("text", { x: k === 2 ? x + 36 : x, y: k === 2 ? 588 : 588, "text-anchor": k === 2 ? "start" : "middle", class: "rc-st" }, g, t1);
      s("text", { x: k === 2 ? x + 36 : x, y: k === 2 ? 604 : 603, "text-anchor": k === 2 ? "start" : "middle", class: "rc-st2" }, g, t2); });
    const parts = Array.from({ length: 240 }, () => ({ s: null, t: Math.random(), phase: 0, el: s("circle", { r: 2.6, stroke: "#111", "stroke-width": .4 }, gp) }));
    const pickSrc = () => { const pool = src.filter(q => !filt || q.f.t === filt), tot = pool.reduce((a, q) => a + q.f.rate, 0); let rr = Math.random() * tot; for (const q of pool) { rr -= q.f.rate; if (rr <= 0) return q; } return pool[0]; };
    parts.forEach(p => p.s = pickSrc());
    const nEl = tp.querySelector("#rc-n"); let n = 9800 + Math.floor((new Date().getHours() * 60 + new Date().getMinutes()) * 7.3);
    function pick(i) { selF = selF === i ? null : i; const q = src[selF ?? 0];
      src.forEach((x, k) => { x.g.style.opacity = selF == null || k === selF ? 1 : .35; x.path.setAttribute("stroke-opacity", selF == null || k === selF ? .6 : .1); });
      info.innerHTML = selF == null ? "" : `<div class="rc-card" style="--c:${q.c}"><b>${q.f.n}</b>${A.tag(!!q.f.real)}<dl><div><dt>Qué mide</dt><dd>${q.f.mide}</dd></div><div><dt>Cada cuánto</dt><dd>${q.f.frec}</dd></div><div><dt>Privacidad</dt><dd>${q.f.priv}</dd></div></dl></div>`; }
    tp.querySelectorAll("[data-rt]").forEach(b => b.onclick = () => { filt = filt === b.dataset.rt ? null : b.dataset.rt; tp.querySelectorAll("[data-rt]").forEach(x => x.classList.toggle("off", !!filt && x.dataset.rt !== filt)); parts.forEach(p => p.s = pickSrc()); });
    const ctr = [CX, CY];
    setStop(A.loop(dt => {
      if (document.body.dataset.view !== "archivo") return;
      parts.forEach(p => {
        p.t += dt * (p.phase === 1 ? .9 : p.phase === 2 ? .45 : .35);
        if (p.t >= 1) { p.t = 0; p.phase = (p.phase + 1) % 3; if (p.phase === 0) p.s = pickSrc(); if (p.phase === 2 && Math.random() < .4) n++; }
        let x, y;
        if (p.phase === 0) { const pt = p.s.path.getPointAtLength(p.t * p.s.len); x = pt.x; y = pt.y; }
        else if (p.phase === 1) { const e = p.s.path.getPointAtLength(p.s.len); x = A.lerp(e.x, bot[0], p.t); y = A.lerp(e.y, bot[1], p.t); }
        else { const tx = ST[Math.min(2, Math.floor(p.t * 3))][2]; x = p.t < .25 ? bot[0] : A.lerp(bot[0], tx, Math.min(1, (p.t - .25) / .5)); y = p.t < .25 ? A.lerp(bot[1], 575, p.t / .25) : 575; }
        p.el.setAttribute("cx", x.toFixed(1)); p.el.setAttribute("cy", y.toFixed(1)); p.el.setAttribute("fill", p.phase === 2 ? "#111" : p.s.c);
        p.el.setAttribute("opacity", selF != null && p.s !== src[selF] ? .12 : p.phase === 1 ? .55 : .95);
      });
      nEl.textContent = A.fmt(n);
    }));
  }

  /* =====================================================================
     04 · QUÉ SE PUEDE HACER ACÁ (gráficos + "probá tu idea")
     ===================================================================== */
  const LUG = [
    { id: "moldes", n: "Lote privado sobre Moldes", d: "22% del predio. Lo único edificable.", maxPisos: 10, usos: ["vivienda", "oficinas", "local", "gastro"], x: 580, y: 20, w: 300, h: 110, c: "#08b8f8" },
    { id: "parque", n: "El parque", d: "Superficie verde y de uso público.", maxPisos: 0, usos: ["feria", "evento", "deporte", "huerta"], x: 20, y: 20, w: 545, h: 190, c: "#00e887" },
    { id: "galpon", n: "Galpón Mitre", d: "Estructura ferroviaria con uso a definir.", maxPisos: 0, usos: ["evento", "gastro", "feria", "cowork"], patr: "parcial", x: 580, y: 140, w: 145, h: 70, c: "#f8e544" },
    { id: "estacion", n: "Estación Colegiales", d: "Edificio con valor patrimonial.", maxPisos: 0, usos: ["evento"], patr: "total", x: 735, y: 140, w: 145, h: 70, c: "#f8e544" }
  ];
  const USOS = [
    ["vivienda", "Viviendas", "cuadrado", true], ["oficinas", "Oficinas", "cuadrado", true], ["local", "Local de barrio", "hexagono", true], ["shopping", "Centro comercial", "hexagono", true],
    ["gastro", "Café o restaurante", "circulo", false], ["feria", "Feria", "rombo", false], ["evento", "Evento o recital", "reuleaux", false], ["deporte", "Cancha o deporte", "triangulo", false],
    ["huerta", "Huerta comunitaria", "hexagono", false], ["cowork", "Espacio de trabajo", "cuadrado", false], ["talar", "Talar un árbol", "triangulo", false]
  ];
  function normativa(tp) {
    const R = D.capas.restricciones;
    const q = st.nq || (st.nq = { l: "moldes", u: "vivienda", p: 6, noche: false });
    tp.innerHTML = `
      <div class="nr-charts">
        <div class="nr-ch"><p class="ev-sub">¿De quién es el predio?</p><div class="nr-waffle" id="nr-w1"></div>
          <p class="nr-leg"><span><i style="--c:#00e887"></i><b>78%</b> uso de los vecinos</span><span><i style="--c:#08b8f8"></i><b>22%</b> construcción privada</span></p>${A.tag(true)}</div>
        <div class="nr-ch"><p class="ev-sub">¿Verde o cemento?</p><div class="nr-waffle" id="nr-w2"></div>
          <p class="nr-leg"><span><i style="--c:#00e887"></i><b>52%</b> superficie verde</span><span><i style="--c:#c9c9c4"></i><b>48%</b> superficie seca</span></p>${A.tag(true)}</div>
        <div class="nr-ch"><p class="ev-sub">¿Qué tan alto se puede?</p><svg id="nr-h" viewBox="0 0 300 170"></svg>
          <p class="nr-leg"><span>No más alto que los edificios de la zona.</span></p>${A.tag(false)}</div>
      </div>
      <div class="nr-try">
        <div class="nr-try-h"><span class="op-n">?</span><div><h4>Probá tu idea</h4><p>Elegí un lugar, qué querés hacer y te decimos si se puede, qué reglas aplican y qué necesitás.</p></div></div>
        <div class="nr-grid">
          <div>
            <p class="nr-step"><b>1</b> ¿Dónde?</p>
            <svg id="nr-map" viewBox="0 0 900 250" aria-label="Elegí un sector del predio"></svg>
            <p class="nr-step"><b>2</b> ¿Qué querés hacer?</p>
            <div class="nr-usos">${USOS.map(([id, n, f]) => `<button data-u="${id}" class="${q.u === id ? "on" : ""}">${A.icon(f, "#111", false)}<span>${n}</span></button>`).join("")}</div>
            <div class="nr-more">
              <label class="nr-pisos" ${USOS.find(u => u[0] === q.u)[3] ? "" : "hidden"}><span>¿Cuántos pisos?</span><input type="range" min="1" max="20" value="${q.p}" id="nr-p"><b id="nr-pv">${q.p}</b></label>
              <label class="sw"><input type="checkbox" id="nr-n" ${q.noche ? "checked" : ""}><span>Funciona de noche</span></label>
            </div>
          </div>
          <div class="nr-res" id="nr-res"></div>
        </div>
      </div>
      <p class="ev-sub">Todas las reglas</p>
      <div class="nr-rules">${R.reglas.map((r, i) => `<div class="${/no |No /.test(r.t) ? "no" : "si"}"><span class="nr-ico">${/no |No /.test(r.t) ? "✕" : "✓"}</span><p>${r.t}</p><small>${r.fuente || "A verificar con el Código Urbanístico"} ${A.tag(r.real)}</small></div>`).join("")}</div>`;
    const waffle = (el, a, ca, cb) => { el.innerHTML = Array.from({ length: 100 }, (_, i) => `<i style="--c:${i < a ? ca : cb};--d:${(i % 10 + Math.floor(i / 10)) * 12}ms"></i>`).join(""); };
    waffle(tp.querySelector("#nr-w1"), 78, "#00e887", "#08b8f8"); waffle(tp.querySelector("#nr-w2"), 52, "#00e887", "#c9c9c4");
    const hs = tp.querySelector("#nr-h");
    [[20, 4, "Casas de la zona", "#e6e6e2"], [90, 7, "Edificios vecinos", "#e6e6e2"], [160, 10, "Máximo en el lote", "#08b8f8"], [230, 20, "Torre (no permitida)", "#ff8a7a"]].forEach(([x, p, n, c]) => {
      const hh2 = p * 6.4; s("rect", { x, y: 140 - hh2, width: 50, height: hh2, fill: c, stroke: "#111", "stroke-width": 1, "stroke-dasharray": p === 20 ? "4 3" : "none" }, hs);
      for (let k = 1; k < p; k++) s("line", { x1: x, x2: x + 50, y1: 140 - k * 6.4, y2: 140 - k * 6.4, stroke: "#111", "stroke-opacity": .15 }, hs);
      s("text", { x: x + 25, y: 134 - hh2, "text-anchor": "middle", "font-size": 11, "font-weight": 600, fill: "#111" }, hs, p + " p");
      s("text", { x: x + 25, y: 156, "text-anchor": "middle", "font-size": 9, fill: "#44443f" }, hs, n.split(" ")[0]);
      s("text", { x: x + 25, y: 167, "text-anchor": "middle", "font-size": 9, fill: "#44443f" }, hs, n.split(" ").slice(1).join(" "));
    });
    s("line", { x1: 10, x2: 290, y1: 140 - 10 * 6.4, y2: 140 - 10 * 6.4, stroke: "#ff5a4e", "stroke-dasharray": "4 3" }, hs);
    // Mapa esquemático del predio
    const mp = tp.querySelector("#nr-map");
    s("path", { d: "M20 225H880", stroke: "#111", "stroke-width": 2 }, mp); s("path", { d: "M20 236H880", stroke: "#111", "stroke-width": 2, "stroke-dasharray": "2 8" }, mp);
    s("text", { x: 24, y: 252, "font-size": 13, fill: "#77776f" }, mp, "Vías del FFCC Mitre");
    LUG.forEach(l => {
      const g = s("g", { class: "nr-z" + (q.l === l.id ? " on" : ""), tabindex: 0, role: "button", "aria-label": l.n, style: "cursor:pointer" }, mp);
      s("rect", { x: l.x, y: l.y, width: l.w, height: l.h, rx: 8, fill: l.c, "fill-opacity": .35, stroke: "#111", "stroke-width": 1.2 }, g);
      if (l.w > 200) { s("text", { x: l.x + 14, y: l.y + 30, "font-size": 21, "font-weight": 600, fill: "#111" }, g, l.n); s("text", { x: l.x + 14, y: l.y + 54, "font-size": 15, fill: "#44443f" }, g, l.d); }
      else { const w = l.n.split(" "); s("text", { x: l.x + 12, y: l.y + 30, "font-size": 18, "font-weight": 600, fill: "#111" }, g, w[0]); s("text", { x: l.x + 12, y: l.y + 52, "font-size": 18, "font-weight": 600, fill: "#111" }, g, w.slice(1).join(" ")); }
      g.onclick = () => { q.l = l.id; renderSec("normativa"); };
    });
    tp.querySelectorAll("[data-u]").forEach(b => b.onclick = () => { q.u = b.dataset.u; renderSec("normativa"); });
    tp.querySelector("#nr-p").oninput = e => { q.p = +e.target.value; tp.querySelector("#nr-pv").textContent = q.p; evalua(); };
    tp.querySelector("#nr-n").onchange = e => { q.noche = e.target.checked; evalua(); };
    function evalua() {
      const l = LUG.find(x => x.id === q.l), U = USOS.find(x => x[0] === q.u), constr = U[3];
      const checks = [];
      const add = (ok, t) => checks.push([ok, t]);
      if (q.u === "talar") add(false, "No se pueden talar árboles sin autorización: son arbolado público.");
      if (q.u === "shopping") add(false, "No se permiten centros comerciales ni grandes superficies.");
      if (constr && q.u !== "shopping") {
        add(l.maxPisos > 0, l.maxPisos > 0 ? "Se puede construir: es el lote privado (22% del predio)." : l.patr ? "Edificio con valor patrimonial: no se puede demoler ni sumar construcción." : "Es superficie verde de uso público: no se puede construir.");
        if (l.maxPisos > 0) add(q.p <= l.maxPisos, q.p <= l.maxPisos ? `${q.p} pisos está dentro de la altura de la zona (hasta ${l.maxPisos}).` : `${q.p} pisos supera la altura de la zona (hasta ${l.maxPisos}).`);
        if (l.maxPisos > 0) add(l.usos.includes(q.u), l.usos.includes(q.u) ? "Ese uso está permitido en el lote." : "Ese uso no está permitido en el lote.");
      }
      if (!constr && q.u !== "talar") {
        add(l.usos.includes(q.u), l.usos.includes(q.u) ? `En ${l.n.toLowerCase()} se admite como uso ${l.maxPisos ? "" : "temporal o de bajo impacto"}.`.replace("  ", " ") : `En ${l.n.toLowerCase()} no está previsto ese uso.`);
        if (l.id === "parque") add(true, "No puede reducir la superficie verde (52% del predio).");
        if (l.patr) add(true, "Hay que conservar la estructura original.");
      }
      if (q.noche) add(l.id !== "parque" || q.u === "evento", l.id === "parque" && q.u !== "evento" ? "De noche, en el parque solo se autorizan eventos puntuales." : "Uso nocturno: requiere permiso por ruido e iluminación.");
      const okAll = checks.every(c => c[0]), some = checks.some(c => c[0]);
      const verdict = okAll ? ["Se puede", "ok", "#00e887"] : some ? ["Se puede con cambios", "cond", "#f8e544"] : ["No se puede", "no", "#ff5a4e"];
      const need = okAll ? (constr ? ["Permiso de obra de la Ciudad", "Aprobación del sector público en ATLAS", "Estudio de impacto en el barrio"] : ["Permiso de uso del espacio público", "Aviso a la Junta Comunal 13", "Aprobación del sector público en ATLAS"]) : [];
      const pis = constr && l.maxPisos ? Math.min(q.p, 20) : 0;
      tp.querySelector("#nr-res").innerHTML = `<div class="nr-v ${verdict[1]}" style="--c:${verdict[2]}"><span>${verdict[0]}</span><small>${U[1]} · ${l.n}</small></div>
        ${constr && l.maxPisos ? `<svg viewBox="0 0 200 150" class="nr-bld"><line x1="0" x2="200" y1="${140 - l.maxPisos * 6}" y2="${140 - l.maxPisos * 6}" stroke="#ff5a4e" stroke-dasharray="4 3"/><text x="198" y="${136 - l.maxPisos * 6}" text-anchor="end" font-size="10" fill="#ff5a4e">límite: ${l.maxPisos} pisos</text>
          <rect x="70" y="${140 - pis * 6}" width="60" height="${pis * 6}" fill="${q.p <= l.maxPisos ? "#08b8f8" : "#ff8a7a"}" stroke="#111"/>${Array.from({ length: pis }, (_, k) => `<line x1="70" x2="130" y1="${140 - k * 6}" y2="${140 - k * 6}" stroke="#111" stroke-opacity=".2"/>`).join("")}<line x1="0" x2="200" y1="140" y2="140" stroke="#111"/></svg>` : ""}
        <ul class="nr-checks">${checks.map(([ok, t]) => `<li class="${ok ? "ok" : "no"}"><i>${ok ? "✓" : "✕"}</i>${t}</li>`).join("")}</ul>
        ${need.length ? `<p class="lsub">Lo que vas a necesitar</p><ol class="nr-need">${need.map(x => `<li>${x}</li>`).join("")}</ol>` : `<p class="small">¿Querés ver qué sí se puede? <a href="#oportunidades">Mirá las oportunidades validadas →</a></p>`}`;
    }
    evalua();
  }

  /* =====================================================================
     05 · PATRIMONIO E HISTORIA: una sola línea de tiempo jerarquizada
     ===================================================================== */
  function patrimonio(tp) {
    const T = [
      { y: "Siglo XX", t: "El playón de cargas del ferrocarril", d: "El predio funciona como playón ferroviario del FFCC Mitre, junto a la Estación Colegiales.", n: 2, real: false, el: ["Estación Colegiales", "Galpón Mitre", "Vagones"] },
      { y: "2021", t: "Se decide urbanizar el ex playón", d: "87.582 m² en total: 78% para los vecinos y 22% para construcción privada.", n: 3, src: "pf" },
      { y: "2024", t: "Abre el parque", d: "El 27 de julio se inaugura la primera etapa, con más de 250 árboles.", n: 3, src: "ln" },
      { y: "2026", t: "Nuevo auge inmobiliario", d: "El entorno se valoriza: el m² en pozo llega a USD 3.200.", n: 2, src: "c26" },
      { y: "Oct 2026", t: "Relevamiento ATLAS", d: "Se lee el parque con sensores, voces y evidencias.", n: 1, real: false }
    ];
    const ELM = [
      ["Estación Colegiales", "Edificio ferroviario: se conserva, no se demuele.", "cuadrado"],
      ["Galpón Mitre", "Estructura ferroviaria con uso a definir en asamblea vecinal.", "hexagono"],
      ["Sector de los vagones", "Material rodante histórico, integrado al paisaje.", "rombo"]
    ];
    tp.innerHTML = `<div class="pt-line">${T.map((e, i) => `<button class="pt-ev n${e.n}" data-pt="${i}"><span class="pt-y">${e.y}</span><i class="pt-dot"></i><b>${e.t}</b><span class="pt-src">${e.src ? I.fuentes[e.src].fuente : "a verificar"}</span></button>`).join("")}</div>
      <div class="pt-detail" id="pt-d"></div>
      <p class="ev-sub">Lo que sigue en pie</p>
      <div class="pt-elm">${ELM.map(([n, d, f]) => `<div>${A.icon(f, "#111", false)}<b>${n}</b><p>${d}</p>${A.tag(false)}</div>`).join("")}</div>
      <div id="pat-f"></div>`;
    const show = i => { const e = T[i]; tp.querySelectorAll("[data-pt]").forEach(b => b.classList.toggle("on", +b.dataset.pt === i));
      tp.querySelector("#pt-d").innerHTML = `<span class="pt-dy">${e.y}</span><div><h4>${e.t}</h4><p>${e.d}</p>${e.el ? `<p class="small">De esta época quedan: <b>${e.el.join(", ")}</b>.</p>` : ""}<p class="small muted">${e.src ? `Fuente: <a href="${I.fuentes[e.src].url || "#"}" target="_blank" rel="noopener">${I.fuentes[e.src].fuente} ↗</a>` : "Dato a verificar"}</p></div>`; };
    tp.querySelectorAll("[data-pt]").forEach(b => b.onclick = () => show(+b.dataset.pt)); show(2);
    const box = tp.querySelector("#pat-f"); I.fichas.filter(f => f.cat === "patrimonio").forEach(f => box.appendChild(fichaEl(f)));
  }

  /* =====================================================================
     06 · QUIÉN VIENE Y CUÁNTO VALE
     ===================================================================== */
  function poblacion(tp) {
    const c = D.capas.censo, PP = D.capas.personas;
    const top = c.piramide.reduce((a, r) => r.m + r.v > a.m + a.v ? r : a);
    const ed = Object.entries(PP.edad), edTop = ed.reduce((a, b) => b[1] > a[1] ? b : a);
    const dif = Math.round((c.m2Pozo.valor / c.m2Usado.valor - 1) * 100);
    tp.innerHTML = `
      <div class="pb-kpis">
        <div class="pb-k" style="--c:#9b6cff"><span>Viven en la Comuna 13</span><b>${A.fmt(c.poblacionComuna.valor)}</b><small>${c.poblacionComuna.fuente} · dato viejo</small></div>
        <div class="pb-k" style="--c:#9b6cff"><span>Vecinos en el área del parque</span><b>+80.000</b><small>La Nación, 2024</small></div>
        <div class="pb-k" style="--c:#08b8f8"><span>El m² usado</span><b>USD ${A.fmt(c.m2Usado.valor)}</b><small>${c.m2Usado.fuente}</small></div>
        <div class="pb-k hot" style="--c:#08b8f8"><span>El m² en pozo</span><b>USD ${A.fmt(c.m2Pozo.valor)}</b><small><em>+${dif}%</em> que un usado · ${c.m2Pozo.fuente}</small></div>
      </div>
      <div class="pb-two">
        <div class="pb-card"><p class="ev-sub">Quiénes viven alrededor</p><h4>El grupo más grande tiene <span class="hl" style="--c:#9b6cff">${top.g} años</span></h4>
          <svg viewBox="0 0 440 270" id="pyr"></svg><p class="pb-leg"><span><i style="--c:#9b6cff"></i>Mujeres</span><span><i style="--c:#08b8f8"></i>Varones</span>${A.tag(false)}</p></div>
        <div class="pb-card"><p class="ev-sub">Quiénes usan el parque</p><h4>Sobre todo <span class="hl" style="--c:#f8e544">${edTop[0].toLowerCase()}</span>: ${edTop[1]}%</h4>
          <div class="pb-bub">${ed.map(([k, v]) => `<div class="${k === edTop[0] ? "top" : ""}"><i style="--s:${Math.sqrt(v) * 22}px"><b>${v}%</b></i><span>${k}</span></div>`).join("")}</div>
          <p class="ev-note">Quien usa el parque no es igual a quien vive alrededor: también llegan personas de otros barrios.</p>${A.tag(false)}</div>
      </div>`;
    const sv = tp.querySelector("#pyr"), max = 9;
    c.piramide.forEach((r, i) => {
      const y = 8 + i * 27, isT = r === top;
      s("rect", { x: 220 - 6 - r.m / max * 170, y, width: r.m / max * 170, height: 20, rx: 3, fill: "#9b6cff", "fill-opacity": isT ? 1 : .55, stroke: isT ? "#111" : "none" }, sv);
      s("rect", { x: 226, y, width: r.v / max * 170, height: 20, rx: 3, fill: "#08b8f8", "fill-opacity": isT ? 1 : .55, stroke: isT ? "#111" : "none" }, sv);
      s("text", { x: 220, y: y + 14, "text-anchor": "middle", "font-size": 10, fill: "#111", "font-weight": 600 }, sv, r.g);
      s("text", { x: 220 - 10 - r.m / max * 170, y: y + 14, "text-anchor": "end", "font-size": 10, fill: "#44443f" }, sv, r.m + "%");
      s("text", { x: 230 + r.v / max * 170, y: y + 14, "font-size": 10, fill: "#44443f" }, sv, r.v + "%");
    });
  }

  /* =====================================================================
     09 · NOTICIAS DE LA ZONA (amigable: tarjetas, temas y línea de tiempo)
     ===================================================================== */
  function noticiasZona(tp) {
    const NT = { seguridad: ["Seguridad", "#ff8a7a", "triangulo"], innovacion: ["Innovación", "#08b8f8", "hexagono"], urbanismo: ["Urbanismo", "#00e887", "cuadrado"] };
    const f = st.nt || "todas";
    const key = n => /\d/.test(n.fecha) ? n.fecha.split("/").reverse().join("") : "0";
    const NS = [...D.capas.noticias].sort((a, b) => key(b).localeCompare(key(a))), list = NS.filter(n => f === "todas" || n.tipo === f);
    const MES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
    const fecha = n => { if (!/\d/.test(n.fecha)) return ["", "Reciente"]; const [d, m, y] = n.fecha.split("/"); return [`${+d} ${MES[+m - 1]}`, y]; };
    tp.innerHTML = `<div class="nz-top"><p class="nz-lead">Todo lo que se dijo del parque, <b>en un solo lugar</b>.</p>
        <div class="chips">${[["todas", "Todas", "#111"], ...Object.entries(NT).map(([k, v]) => [k, v[0], v[1]])].map(([k, n, c]) => `<button class="chip${f === k ? " on" : ""}" data-nt="${k}" style="--c:${c}">${k !== "todas" ? `<i class="sq" style="--c:${c}"></i>` : ""}${n} <small>${k === "todas" ? NS.length : NS.filter(x => x.tipo === k).length}</small></button>`).join("")}</div></div>
      <div class="nz-grid">${list.map((n, i) => { const [dm, y] = fecha(n), t = NT[n.tipo];
        return `<article class="nz-card${i === 0 && f === "todas" ? " big" : ""}" style="--c:${t[1]}">
          <div class="nz-band">${A.icon(t[2], "#111", false)}<span>${t[0]}</span><time><b>${dm}</b> ${y}</time></div>
          <h4>${n.titulo}</h4>
          <div class="nz-foot"><span class="nz-medio"><i>${n.medio[0]}</i>${n.medio}</span>${n.url ? `<a class="btn small" href="${n.url}" target="_blank" rel="noopener">Leer la nota ↗</a>` : `<span class="nz-v">Aviso vecinal ${A.tag(false)}</span>`}</div></article>`; }).join("")}
      </div>
      <div class="nz-cta"><p><b>¿Pasó algo en el parque?</b> Contalo en «Sumá tu voz» y aparece acá.</p><a class="btn small" href="#recorrido/suma-voz">Contar algo →</a></div>`;
    tp.querySelectorAll("[data-nt]").forEach(b => b.onclick = () => { st.nt = b.dataset.nt; renderSec("noticias"); });
  }

  /* ---------------- 10 · BIBLIOTECA ACADÉMICA ---------------- */
  const BIB = {
    "Normativa": [
      ["Código Urbanístico de la Ciudad de Buenos Aires (Ley 6.099).", "https://static.buenosaires.gob.ar/sites/default/files/2026-05/cu_cuerpo_principal.pdf"],
      ["Ley Orgánica de Comunas N.º 1.777 (Ciudad de Buenos Aires, 2005).", null],
      ["Ley N.º 104 de Acceso a la Información Pública (Ciudad de Buenos Aires).", null],
      ["Ley N.º 25.326 de Protección de los Datos Personales (Argentina, 2000).", null]
    ],
    "Manuales": [
      ["ATLAS. Manual de uso: cómo leer y escribir el territorio.", "manual"],
      ["ATLAS. Protocolo de anonimización de sensores, cámaras y aportes.", "anon"],
      ["Iconoclasistas (2013). Manual de mapeo colectivo: recursos cartográficos críticos para procesos territoriales de creación colaborativa. Buenos Aires: Tinta Limón.", null]
    ],
    "Informes y datos": [
      ["Relevamiento ATLAS en el Parque Ferroviario Colegiales, 05/10/2026.", null],
      ["Buenos Aires Data: espacios verdes, arbolado y censos.", "https://data.buenosaires.gob.ar"],
      ["DGEyC CABA. Precio del m² en Colegiales, 1er trimestre 2026.", "https://servidos.ar/precio-m2-caba/colegiales"]
    ],
    "Bibliografía": [
      ["Arnstein, S. R. (1969). A Ladder of Citizen Participation. Journal of the American Institute of Planners, 35(4), 216–224.", null],
      ["Gehl, J. (2010). Cities for People. Washington, DC: Island Press.", null],
      ["Jacobs, J. (1961). The Death and Life of Great American Cities. Nueva York: Random House.", null],
      ["Lefebvre, H. (1968). Le droit à la ville. París: Anthropos.", null],
      ["Lynch, K. (1960). The Image of the City. Cambridge, MA: MIT Press.", null],
      ["Ostrom, E. (1990). Governing the Commons. Cambridge: Cambridge University Press.", null],
      ["Whyte, W. H. (1980). The Social Life of Small Urban Spaces. Washington, DC: The Conservation Foundation.", null]
    ]
  };
  function academia(tp) {
    const cargas = A.store.get("cargas", []);
    tp.innerHTML = Object.entries(BIB).map(([g, items]) => `<div class="ev-bib"><p class="ev-sub">${g}</p><ol>${items.map(([t, u]) =>
      `<li><span>${t}</span>${u === "manual" ? `<button class="linkbtn" data-how>Leer</button>` : u === "anon" ? `<button class="linkbtn" data-anon>Leer</button>` : u ? `<a href="${u}" target="_blank" rel="noopener">Abrir ↗</a>` : `<button class="linkbtn" data-cite="${esc(t)}">Copiar cita</button>`}</li>`).join("")}</ol></div>`).join("") +
      (cargas.length ? `<div class="ev-bib"><p class="ev-sub">Cargado por el sector público</p><ol>${cargas.map(c => `<li><span>${esc(c.titulo)} · ${esc(c.organismo)} (${c.fecha}). ${esc(c.tipo)}.</span><em class="pend">${c.estado}</em></li>`).join("")}</ol></div>` : "") +
      `<p class="ev-note"><b>Cómo citar ATLAS:</b> Fuentes, Oro y Zita (2026). ATLAS: plataforma participativa para leer territorios compartidos. Parque Ferroviario Colegiales. LAB VIII, Universidad Torcuato Di Tella.</p>`;
    tp.querySelectorAll("[data-cite]").forEach(b => b.onclick = () => { navigator.clipboard && navigator.clipboard.writeText(b.dataset.cite); b.textContent = "Copiada ✓"; });
    tp.querySelectorAll("[data-anon]").forEach(b => b.onclick = () => {
      modalBody.innerHTML = `<p class="kicker">Protocolo</p><h3>Anonimización</h3><ol class="steps6">
        <li><span>01</span><b>Cámaras</b><p>Cuentan personas en cuadro. No guardan imágenes ni reconocen rostros.</p></li>
        <li><span>02</span><b>Sonido</b><p>Miden decibeles. No graban audio.</p></li>
        <li><span>03</span><b>Movimiento</b><p>Registran pasos por minuto, sin seguimiento individual.</p></li>
        <li><span>04</span><b>Aportes</b><p>Sin nombre, cuenta ni ubicación del dispositivo. Solo texto, tema y zona.</p></li>
        <li><span>05</span><b>Publicación</b><p>Todo se muestra agregado. Nada permite reconstruir a una persona.</p></li>
        <li><span>06</span><b>Validación</b><p>El sector público valida antes de publicar o habilitar propuestas.</p></li></ol>`;
      modal.showModal();
    });
  }

  /* ---------------- 11 · CARGAR INFORMACIÓN (solo sector público) ---------------- */
  function cargar(tp) {
    if (st.perfil !== "publico") {
      tp.innerHTML = `<div class="ev-lock"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>
        <p><b>Solo para el sector público.</b> Quien regula y valida puede sumar normas, informes y datos. El resto puede consultar y descargar todo.</p>
        <button class="btn ghost small" data-asp>Entrar como sector público</button></div>`;
      tp.querySelector("[data-asp]").onclick = () => { applyPerfil("publico"); const m = A.store.get("mirada", {}) || {}; m.perfil = "publico"; A.store.set("mirada", m); A.updateMirada && A.updateMirada(); refresh(); setTimeout(() => goSec("cargar"), 300); };
      return;
    }
    tp.innerHTML = `<form class="ev-form" id="up">
        <label>Tipo <select class="inp" name="tipo"><option>Normativa</option><option>Informe</option><option>Dato</option><option>Manual</option><option>Proyecto</option></select></label>
        <label>Tema <select class="inp" name="tema">${CATS.map(c => `<option value="${c.id}">${c.nombre}</option>`).join("")}</select></label>
        <label class="wide">Título <input class="inp" name="titulo" required maxlength="140" placeholder="Ej: Resolución sobre usos del galpón Mitre"></label>
        <label>Organismo <input class="inp" name="organismo" required maxlength="80" placeholder="Ej: Junta Comunal 13"></label>
        <label>Fecha <input class="inp" name="fecha" type="date" required></label>
        <label class="wide">Archivo o enlace <input class="inp" name="archivo" type="file" accept=".pdf,.csv,.xlsx,.docx"></label>
        <label>Estado <select class="inp" name="estado"><option>Validado</option><option>En revisión</option></select></label>
        <button class="btn" type="submit">Cargar</button>
      </form><p class="ev-note">En la versión conectada, la carga requiere un usuario institucional verificado y queda registrada con fecha y organismo.</p><p class="ev-res" id="up-r"></p>`;
    tp.querySelector("#up").onsubmit = e => {
      e.preventDefault(); const fd = new FormData(e.target);
      const c = { tipo: fd.get("tipo"), tema: fd.get("tema"), titulo: fd.get("titulo"), organismo: fd.get("organismo"), fecha: fd.get("fecha"), estado: fd.get("estado"), archivo: fd.get("archivo") && fd.get("archivo").name || "" };
      const cs = A.store.get("cargas", []); cs.push(c); A.store.set("cargas", cs);
      tp.querySelector("#up-r").innerHTML = `<b class="ok">Cargado.</b> «${esc(c.titulo)}» ya figura en la Biblioteca.`;
      e.target.reset(); renderSec("biblioteca");
    };
  }

  /* =====================================================================
     COLUMNA DERECHA: escribir una lectura + informe
     ===================================================================== */
  function renderReport() {
    const ids = Object.keys(inf.items).filter(id => REG[id]);
    const order = { Alta: 0, Media: 1, Baja: 2 };
    ids.sort((a, b) => order[inf.items[a]] - order[inf.items[b]]);
    const p = I.perfiles.find(x => x.id === st.perfil) || { nombre: "Mirada libre", color: "#111" };
    const n = ids.length;
    if (+fabN.textContent !== n) { fabN.textContent = n; fab.classList.remove("bump"); void fab.offsetWidth; fab.classList.add("bump"); }
    fab.classList.toggle("has", n > 0);
    report.innerHTML = `
      <div class="ar-drawer-head"><p class="kicker" style="margin:0">Tu informe</p><button class="modal-x" data-close aria-label="Cerrar">×</button></div>
      <div class="lbox">
        <p class="kicker">Escribir una lectura</p>
        <p class="lq">Tu interpretación</p>
        <p class="small muted">Atlas organiza evidencia. La conclusión la construís vos.</p>
        <p class="small">Con esta selección: <b>${D.espacios.find(e => e.id === st.territorio).nombre}</b> · <span class="hl" style="--c:${p.color}">${p.nombre}</span> · ${st.cats.size} temas</p>
        <label class="field"><span>Título de la lectura</span><input id="l-tit" maxlength="90" placeholder="Ej: El borde de las vías concentra los reclamos"></label>
        <label class="field"><span>Hipótesis, observación o pregunta</span><textarea id="l-txt" rows="4" placeholder="Lo que ves cuando cruzás la evidencia…"></textarea></label>
        <p class="lsub">Contenidos seleccionados (${ids.length})</p>
        ${ids.length ? `<ul class="sel">${ids.map(id => `<li><span class="prio p-${inf.items[id]}">${inf.items[id]}</span><span>${REG[id].titulo}</span><button class="linkbtn" data-rm="${id}" aria-label="Quitar">×</button></li>`).join("")}</ul>`
          : `<p class="small muted">Todavía no agregaste contenidos. Marcá prioridad en una ficha o sumá un indicador.</p>`}
        <button class="btn" id="l-save"${ids.length ? "" : " disabled"}>Guardar en el informe</button>
      </div>
      <div class="lbox">
        <p class="kicker">Informe en construcción</p>
        <p class="lq">${inf.lecturas.length} lectura${inf.lecturas.length === 1 ? "" : "s"}</p>
        ${inf.lecturas.map((l, i) => `<div class="lect"><b>${esc(l.titulo)}</b><p>${esc(l.texto)}</p><span class="small muted">${l.items.length} evidencias · ${l.perfil} · ${new Date(l.fecha).toLocaleDateString("es-AR")}</span><button class="linkbtn" data-del="${i}">borrar</button></div>`).join("")}
        <div class="row" style="flex-wrap:wrap">
          <button class="btn small" id="r-md"${inf.lecturas.length || ids.length ? "" : " disabled"}>Descargar (.md)</button>
          <button class="btn ghost small" id="r-print"${inf.lecturas.length || ids.length ? "" : " disabled"}>Imprimir / PDF</button>
        </div>
        ${inf.lecturas.length || ids.length ? `<button class="linkbtn small" id="r-clear">Vaciar informe</button>` : ""}
      </div>`;
    report.querySelector("[data-close]").onclick = closeDrawer;
    report.querySelectorAll("[data-rm]").forEach(b => b.onclick = () => { delete inf.items[b.dataset.rm]; saveInf(); renderSec("fichas"); renderSec("numeros"); });
    report.querySelectorAll("[data-del]").forEach(b => b.onclick = () => { inf.lecturas.splice(+b.dataset.del, 1); saveInf(); });
    report.querySelector("#l-save").onclick = () => {
      const t = report.querySelector("#l-tit").value.trim() || "Lectura sin título", x = report.querySelector("#l-txt").value.trim();
      inf.lecturas.push({ titulo: t, texto: x, items: ids.map(id => ({ id, prioridad: inf.items[id] })), perfil: p.nombre, fecha: new Date().toISOString() });
      saveInf();
    };
    const md = report.querySelector("#r-md"); if (md) md.onclick = download;
    const pr = report.querySelector("#r-print"); if (pr) pr.onclick = printReport;
    const cl = report.querySelector("#r-clear"); if (cl) cl.onclick = () => { inf = { items: {}, lecturas: [] }; saveInf(); renderSec("fichas"); renderSec("numeros"); };
  }

  function buildMarkdown() {
    const terr = D.espacios.find(e => e.id === st.territorio), p = I.perfiles.find(x => x.id === st.perfil);
    const line = id => { const r = REG[id]; if (!r) return ""; const f = r.f, fu = f && fuente(f);
      return `- **[${inf.items[id] || "—"}]** ${r.titulo} · ${f ? I.estados[f.estado].nombre : "indicador"} · ${r.real ? "con fuente" : "ejemplo"}${fu ? ` · ${fu.fuente}${fu.url ? ` (${fu.url})` : ""}` : ""}`; };
    let m = `# Informe ATLAS · ${terr.nombre}\n\n${terr.barrio} · Comuna ${terr.comuna}\n\nMirada: ${p ? p.nombre : "libre"} · Fecha: ${new Date().toLocaleDateString("es-AR")}\nTemas: ${CATS.filter(c => st.cats.has(c.id)).map(c => c.nombre).join(", ")}\n\n`;
    if (inf.lecturas.length) { m += `## Lecturas\n\n`; inf.lecturas.forEach(l => { m += `### ${l.titulo}\n\n${l.texto || "_(sin texto)_"}\n\nEvidencia citada:\n${l.items.map(i => line(i.id)).join("\n")}\n\n`; }); }
    const ids = Object.keys(inf.items).filter(id => REG[id]);
    if (ids.length) {
      m += `## Evidencia seleccionada\n\n${ids.map(line).join("\n")}\n\n`;
      const falt = ids.map(id => REG[id].f).filter(Boolean);
      if (falt.length) m += `## Preguntas pendientes\n\n${falt.map(f => `- ${f.falta}`).join("\n")}\n\n`;
    }
    return m + `---\nGenerado con ATLAS · LAB VIII · Fuentes · Oro · Zita\n`;
  }
  function download() {
    const blob = new Blob([buildMarkdown()], { type: "text/markdown" });
    const a = h("a", { href: URL.createObjectURL(blob), download: "informe-atlas-colegiales.md" }, document.body);
    a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function printReport() {
    const html = buildMarkdown().replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/^### (.*)$/gm, "<h3>$1</h3>").replace(/^## (.*)$/gm, "<h2>$1</h2>").replace(/^# (.*)$/gm, "<h1>$1</h1>")
      .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>").replace(/^- (.*)$/gm, "<li>$1</li>").replace(/\n\n/g, "<br><br>");
    document.getElementById("print-report").innerHTML = html;
    window.print();
  }

  /* ---------- Modal "Cómo funciona" ---------- */
  function openHow() {
    modalBody.innerHTML = `<p class="kicker">Cómo funciona</p><h3>Atlas permite leer y escribir el territorio</h3>
      <ol class="steps6">${I.pasos.map(([t, d], i) => `<li><span>${String(i + 1).padStart(2, "0")}</span><b>${t}</b><p>${d}</p></li>`).join("")}</ol>
      <p class="small muted">Tres formas de leer el mismo espacio: <b>Caminar el parque</b> para recorrerlo y participar, <b>Consultar la evidencia</b> para leer a fondo y <b>Explorar oportunidades</b> para ver dónde se cruzan las tres miradas.</p>
      <p>Atlas no produce una solución. Produce condiciones para construir y discutir una lectura.</p>`;
    modal.showModal();
  }
  document.addEventListener("click", e => { if (e.target.closest("[data-how]")) openHow(); });

  /* ---------- Panel lateral "Tu informe" ---------- */
  function openDrawer() { report.hidden = false; requestAnimationFrame(() => report.classList.add("open")); fab.setAttribute("aria-expanded", "true"); }
  function closeDrawer() { report.classList.remove("open"); fab.setAttribute("aria-expanded", "false"); setTimeout(() => { if (!report.classList.contains("open")) report.hidden = true; }, 350); }
  fab.onclick = () => report.classList.contains("open") ? closeDrawer() : openDrawer();
  addEventListener("keydown", e => { if (e.key === "Escape" && report.classList.contains("open")) closeDrawer(); });
  document.getElementById("modal-x").onclick = () => modal.close();
  modal.addEventListener("click", e => { if (e.target === modal) modal.close(); });

  function refresh() { renderHero(); renderStart(); renderDots(); renderTabs(); renderMain(); renderReport(); }

  /* ---------- API para el router ---------- */
  A.archivo = {
    show(sub) {
      const m = A.store.get("mirada", null);
      if (m && m.fresh) { applyPerfil(m.perfil); st.tab = "biblioteca"; st.estado = "todos"; st.origen = "todos"; m.fresh = false; A.store.set("mirada", m); }
      else if (m && m.perfil !== st.perfil && !sub) applyPerfil(m.perfil);
      // Entrada amable: la portada aparece por partes
      wrap.classList.remove("enter"); void wrap.offsetWidth; wrap.classList.add("enter");
      if (sub && catById(sub)) {
        st.cats.add(sub); st.orden = "categoria"; st.estado = "todos"; st.origen = "todos"; st.q = ""; st.solo = false;
        refresh();
        setTimeout(() => { const el = document.getElementById("grupo-" + sub); if (el) { el.scrollIntoView({ block: "start", behavior: "smooth" }); el.classList.add("flash"); } }, 500);
        return;
      }
      refresh();
      if (sub && SECS.some(t => t[0] === sub)) setTimeout(() => goSec(sub), 400);
      else A.guia && A.guia.auto();
    },
    hide() { stopAll(); closeDrawer(); A.guia && A.guia.close(); }
  };
})(window.ATLAS);
