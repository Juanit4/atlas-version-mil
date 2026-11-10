/* =========================================================================
   ATLAS · COMPARÁ (página propia, se abre desde el botón de arriba)
   Elegí de 2 a 4 parques y comparalos con las mismas capas de ATLAS:
     01 En vivo · 02 Horarios · 03 Quiénes van · 04 Qué hacen y qué prefieren
     05 Qué piden · arriba de todo: Buscador de equipamiento y Agenda
   Todos los conteos son anónimos (sensores y encuestas sin datos personales).
   ========================================================================= */
(function (A) {
  const s = A.s, h = A.h, D = A.D, C = A.COMPARA, PQ = A.PARQUES;
  const root = document.getElementById("cp");
  const hh = n => String(n).padStart(2, "0") + ":00";
  const byId = id => PQ.find(p => p.id === id);
  const st = { sel: ["colegiales", "centenario"], modo: "semana", hora: 12, escala: "personas", dim: "edad", eq: "skate", fP: new Set(), fT: new Set(), mes: 10 };
  const ic = (d) => `<svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="#111" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const EQIC = {
    skate: ic('<path d="M5 20h22"/><circle cx="10" cy="24" r="2"/><circle cx="22" cy="24" r="2"/><path d="M8 16l4-8h6l3 8"/>'),
    juegos: ic('<path d="M6 26V10l10-5 10 5v16"/><path d="M11 26v-8h10v8"/><circle cx="16" cy="12" r="2"/>'),
    canil: ic('<circle cx="10" cy="11" r="2.5"/><circle cx="22" cy="11" r="2.5"/><circle cx="6" cy="17" r="2"/><circle cx="26" cy="17" r="2"/><path d="M11 25c0-5 2.5-8 5-8s5 3 5 8c0 2-2 2-5 1-3 1-5 1-5-1z"/>'),
    bicisenda: ic('<circle cx="8" cy="21" r="5"/><circle cx="24" cy="21" r="5"/><path d="M8 21l5-9h7l4 9M13 12l3 9h3M18 8h4"/>'),
    postas: ic('<path d="M6 16h20M9 11v10M23 11v10M5 13v6M27 13v6"/>'),
    canchas: ic('<rect x="5" y="7" width="22" height="18" rx="1"/><path d="M16 7v18"/><circle cx="16" cy="16" r="3.5"/>'),
    banos: ic('<circle cx="10" cy="7" r="2.5"/><circle cx="22" cy="7" r="2.5"/><path d="M7 12h6v8h-6zM10 20v6M19 12h6l1 8h-8zM22 20v6"/>'),
    gastro: ic('<path d="M8 4v8a3 3 0 0 0 6 0V4M11 12v16M22 4c-3 2-3 9 0 11v13"/>'),
    feria: ic('<path d="M4 12l3-6h18l3 6"/><path d="M4 12c0 2 2 3 4 3s4-1 4-3c0 2 2 3 4 3s4-1 4-3c0 2 2 3 4 3s4-1 4-3M6 15v11h20V15"/>'),
    anfiteatro: ic('<path d="M4 24c4-12 20-12 24 0M8 24c3-7 13-7 16 0"/><path d="M13 11l3-5 3 5"/>'),
    huerta: ic('<path d="M16 28V14M16 14c0-5 4-8 9-8 0 5-4 8-9 8zM16 18c0-4-3-7-8-7 0 4 3 7 8 7z"/><path d="M6 28h20"/>'),
    lago: ic('<path d="M4 14c3-2 5-2 8 0s5 2 8 0 5-2 8 0M4 20c3-2 5-2 8 0s5 2 8 0 5-2 8 0M4 26c3-2 5-2 8 0s5 2 8 0 5-2 8 0"/>')
  };
  let built = false, live = [], FW = 640;

  function build() {
    built = true;
    st.modo = A.park.isWeekend() ? "finde" : "semana"; st.hora = new Date().getHours();
    root.innerHTML = `
      <header class="cp-hero">
        <p class="kicker">Compará parques</p>
        <h1>Los mismos ojos para leer otros parques.</h1>
        <p class="cp-lead">Elegí de 2 a 4 parques. Ferroviario Colegiales y Centenario salen de las lecturas de ATLAS; el resto son ejemplos con la misma estructura.</p>
        <div class="chips cp-pick" id="cp-pick">${PQ.map(p => `<button class="chip" data-p="${p.id}" style="--c:${p.color}"><i class="sq" style="--c:${p.color}"></i>${p.corto}</button>`).join("")}</div>
      </header>
      <div class="cp-bar" id="cp-bar">
        <div class="chips" role="group" aria-label="Tipo de día"><button class="chip" data-modo="semana">Lunes a viernes</button><button class="chip" data-modo="finde">Fin de semana</button></div>
        <label class="cmp-hour"><span>Hora</span><input type="range" min="0" max="23" step="1" aria-label="Hora del día"><b></b></label>
        <button class="chip" data-ahora>Ahora</button>
        <nav class="cp-index" aria-label="Secciones">${[["equip", "Buscador"], ["agenda", "Agenda"], ["live", "En vivo"], ["horas", "Horarios"], ["quien", "Quiénes van"], ["hacen", "Qué hacen"], ["piden", "Qué piden"]].map(([id, n]) => `<a href="#compara/${id}" data-go="${id}">${n}</a>`).join("")}</nav>
      </div>
      <div class="cp-tools">
        <section class="cp-sec cp-tool cp-search" id="cs-equip">
          <div class="cpt-h"><span class="cpt-ic">${A.tri("#111")}</span><div><h2>¿Qué buscás?</h2><p>Encontrá en qué parque está y a qué hora conviene ir.</p></div></div>
          <div class="eq-tiles" id="cp-eq">${Object.entries(C.EQUIP).map(([k, e]) => `<button data-eq="${k}">${EQIC[k] || ""}<span>${e.nombre}</span></button>`).join("")}</div>
          <div id="cp-eqr"></div>
        </section>
        <section class="cp-sec cp-tool cp-agenda" id="cs-agenda">
          <div class="cpt-h"><span class="cpt-ic cal-ic"><b id="cp-today"></b></span><div><h2>Agenda de los parques</h2><p>Lo que viene en todos los parques. Filtrá por parque o por tipo.</p></div></div>
          <div class="cp-filt"><div class="chips" id="cp-fp">${PQ.map(p => `<button class="chip" data-fp="${p.id}"><i class="sq" style="--c:${p.color}"></i>${p.corto}</button>`).join("")}</div><div class="chips" id="cp-ft">${Object.entries(C.TIPOS_EV).map(([k, [n, c]]) => `<button class="chip" data-ft="${k}"><i class="sq" style="--c:${c}"></i>${n}</button>`).join("")}</div></div>
          <div class="cp-next" id="cp-next"></div>
          <details class="cp-caldet"><summary>Ver el calendario del mes</summary><div class="cp-cal" id="cp-cal"></div></details>
        </section>
      </div>
      ${sec("live", "01", "En vivo", "Cuánta gente hay ahora. Cada punto son 2 personas.", `<div class="cp-live" id="cp-live"></div>`)}
      ${sec("horas", "02", "Horarios", "¿Cuándo se llena cada uno?", `<div class="chips" id="cp-esc"><button class="chip" data-e="personas">Personas</button><button class="chip" data-e="ha">Por hectárea</button></div><svg class="cmp-chart" id="cp-flow" viewBox="0 0 640 240"></svg><p class="readout" id="cp-flow-r"></p>`)}
      ${sec("quien", "03", "Quiénes van", "Cada círculo es el porcentaje de gente de ese grupo.", `<div class="chips" id="cp-dim">${Object.entries({ edad: "Edad", genero: "Género", mascota: "Mascotas", compania: "Compañía" }).map(([k, n]) => `<button class="chip" data-dim="${k}">${n}</button>`).join("")}</div><div id="cp-who"></div>`)}
      ${sec("hacen", "04", "Qué hacen y qué prefieren", "El círculo lleno es lo que hacen hoy; el anillo, lo que preferirían.", `<div id="cp-act"></div>`)}
      ${sec("piden", "05", "Qué piden", "Cuanto más grande, más se repite. Con borde negro: se pide en más de un parque.", `<div id="cp-voc"></div>`)}
      <p class="small muted cp-foot">Datos de ejemplo ${A.tag(false)} salvo que se indique. Todos los conteos son anónimos: los sensores cuentan personas, no las identifican.</p>`;

    root.querySelectorAll("[data-p]").forEach(b => b.onclick = () => {
      const id = b.dataset.p, i = st.sel.indexOf(id);
      if (i >= 0) { if (st.sel.length > 2) st.sel.splice(i, 1); } else { if (st.sel.length >= 4) st.sel.shift(); st.sel.push(id); }
      buildLive(); update();
    });
    root.querySelectorAll("[data-go]").forEach(a => a.onclick = e => { e.preventDefault(); go(a.dataset.go); });
    const bar = root.querySelector("#cp-bar");
    bar.querySelectorAll("[data-modo]").forEach(b => b.onclick = () => { st.modo = b.dataset.modo; update(); });
    bar.querySelector("input").oninput = e => { st.hora = +e.target.value; update(); };
    bar.querySelector("[data-ahora]").onclick = () => { st.hora = new Date().getHours(); st.modo = A.park.isWeekend() ? "finde" : "semana"; update(); };
    root.querySelectorAll("[data-e]").forEach(b => b.onclick = () => { st.escala = b.dataset.e; update(); });
    root.querySelectorAll("[data-dim]").forEach(b => b.onclick = () => { st.dim = b.dataset.dim; update(); });
    root.querySelectorAll("[data-eq]").forEach(b => b.onclick = () => { st.eq = b.dataset.eq; update(); });
    const tog = (set, k) => set.has(k) ? set.delete(k) : set.add(k);
    root.querySelectorAll("[data-fp]").forEach(b => b.onclick = () => { tog(st.fP, b.dataset.fp); agenda(); });
    root.querySelectorAll("[data-ft]").forEach(b => b.onclick = () => { tog(st.fT, b.dataset.ft); agenda(); });
    const flow = root.querySelector("#cp-flow");
    flow.addEventListener("pointermove", ev => { const q = A.svgPoint(flow, ev); st.hora = A.clamp(Math.round((q.x - 44) / (FW - 64) * 23), 0, 23); update(); });
    addEventListener("resize", () => { if (document.body.dataset.view === "compara") { fitK(); drawFlow(); } });
    buildLive(); agenda();
  }
  const sec = (id, n, t, sub, body) => `<section class="cp-sec" id="cs-${id}"><div class="op-sec-h"><span class="op-n">${n}</span><div><h2>${t}</h2><p>${sub}</p></div></div><div class="cp-body">${body}</div></section>`;
  function go(id) { const el = root.querySelector("#cs-" + id); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - 128, behavior: A.reduced ? "auto" : "smooth" }); }
  const sel = () => st.sel.map(byId);
  const legend = () => `<p class="cmp-legend">${sel().map(p => `<span><i style="--c:${p.color}"></i>${p.corto}</span>`).join("")}</p>`;

  /* ---------------- 01 · planos en vivo ---------------- */
  const G = A.parkGeom;
  const FERRO = (() => {
    const k = .385, ox = 300 - (95 + 1536) / 2 * k, oy = 150 - 271 * k, tr = ([x, y]) => [x * k + ox, y * k + oy];
    return { outline: G.park.map(tr), path: G.mainPath.map(tr), spots: D.parque.zonas.filter(z => A.inPark(z.x, z.y)).map(z => tr([z.x, z.y])) };
  })();
  const ring = (rx, ry) => Array.from({ length: 41 }, (_, i) => { const a = i / 40 * Math.PI * 2; return [300 + Math.cos(a) * rx, 150 + Math.sin(a) * ry]; });
  function geo(p) {
    if (p.id === "colegiales") return { path: FERRO.path, loop: false, spots: FERRO.spots };
    const sc = Math.min(1.25, .7 + Math.sqrt(p.ha) / 10);
    return { path: ring(100 * sc, 70 * sc), loop: true, spots: [[300, 150], [250, 120], [355, 125], [260, 185], [345, 180]], sc };
  }
  function drawMini(svg, p, g) {
    if (p.id === "colegiales") {
      s("path", { d: "M" + FERRO.outline.map(q => q.map(v => v.toFixed(1)).join(" ")).join("L") + "Z", fill: p.color, "fill-opacity": .2, stroke: "#111", "stroke-width": 1.4, "vector-effect": "non-scaling-stroke" }, svg);
      s("path", { d: "M" + FERRO.path.map(q => q.map(v => v.toFixed(1)).join(" ")).join("L"), fill: "none", stroke: "#fff", "stroke-width": 4, "stroke-linecap": "round" }, svg);
      return;
    }
    s("path", { d: A.shape(p.forma, 300, 150, 120 * g.sc), fill: p.color, "fill-opacity": .2, stroke: "#111", "stroke-width": 1.4 }, svg);
    s("path", { d: "M" + g.path.map(q => q.map(v => v.toFixed(1)).join(" ")).join("L"), fill: "none", stroke: "#fff", "stroke-width": 4 }, svg);
    if (p.equip.includes("lago")) s("ellipse", { cx: 300, cy: 150, rx: 40, ry: 26, fill: "#cfeffd", stroke: "#111", "stroke-width": 1 }, svg);
  }
  function buildLive() {
    const el = root.querySelector("#cp-live"); el.innerHTML = ""; live.forEach(c => c.dots = []); live = [];
    el.dataset.n = st.sel.length;
    sel().forEach(p => {
      const card = h("article", { class: "cmp-card", style: `--c:${p.color}` }, el, `
        <header><span class="cmp-badge">${p.estado}</span><h3>${p.nombre}</h3><p>${p.barrio} · ${A.fmt(p.m2)} m²</p></header>
        <svg class="cmp-map" viewBox="0 0 600 300" preserveAspectRatio="xMidYMid meet" aria-label="Plano de ${p.nombre} con personas en vivo"></svg>
        <dl class="cmp-metrics"><div><dt>Ahora</dt><dd data-m="n"></dd></div><div><dt>Por ha</dt><dd data-m="d"></dd></div><div><dt>Pico</dt><dd data-m="p"></dd></div></dl>`);
      const svg = card.querySelector("svg"), g = geo(p);
      drawMini(svg, p, g);
      live.push({ p, g, card, svg, peopleG: s("g", {}, svg), dots: [], target: 0 });
    });
    root.querySelectorAll("[data-p]").forEach(b => b.classList.toggle("on", st.sel.includes(b.dataset.p)));
    requestAnimationFrame(fitK);
  }
  const fitK = () => live.forEach(c => { const r = c.svg.getBoundingClientRect(); if (r.width) c.svg.style.setProperty("--k", (600 / r.width).toFixed(3)); });
  const along = (path, t) => {
    const segs = []; let tot = 0;
    for (let i = 1; i < path.length; i++) { const l = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]); segs.push(l); tot += l; }
    let d = t * tot;
    for (let i = 0; i < segs.length; i++) { if (d <= segs[i]) { const k = d / segs[i]; return [A.lerp(path[i][0], path[i + 1][0], k), A.lerp(path[i][1], path[i + 1][1], k)]; } d -= segs[i]; }
    return path[path.length - 1];
  };
  A.loop(dt => {
    if (document.body.dataset.view !== "compara") return;
    live.forEach(c => {
      const alive = c.dots.filter(d => !d.dying);
      if (alive.length < c.target) for (let i = 0; i < Math.min(4, c.target - alive.length); i++) {
        c.dots.push({ walker: Math.random() < .6, t: Math.random(), v: (Math.random() < .5 ? -1 : 1) * A.rand(.01, .025), off: A.rand(-6, 6),
          spot: c.g.spots[Math.floor(Math.random() * c.g.spots.length)], ang: Math.random() * 6.28, rad: A.rand(4, 22), a: 0, el: s("circle", { r: 3, fill: "#111" }, c.peopleG) });
      } else if (alive.length > c.target) alive.slice(0, Math.min(4, alive.length - c.target)).forEach(d => d.dying = true);
      for (let i = c.dots.length - 1; i >= 0; i--) {
        const d = c.dots[i];
        d.a = A.clamp(d.a + (d.dying ? -dt * 2 : dt * 1.5));
        if (d.dying && d.a <= 0) { d.el.remove(); c.dots.splice(i, 1); continue; }
        let x, y;
        if (d.walker) {
          d.t += d.v * dt; if (d.t > 1 || d.t < 0) { if (c.g.loop) d.t = (d.t + 1) % 1; else { d.v *= -1; d.t = A.clamp(d.t); } }
          [x, y] = along(c.g.path, d.t); y += d.off * .6; if (c.g.loop) x += d.off * .5;
        } else { d.ang += dt * .2; x = d.spot[0] + Math.cos(d.ang) * d.rad * .6; y = d.spot[1] + Math.sin(d.ang) * d.rad * .35; }
        d.el.setAttribute("cx", x.toFixed(1)); d.el.setAttribute("cy", y.toFixed(1)); d.el.setAttribute("opacity", (d.a * .9).toFixed(2));
      }
    });
  });

  /* ---------------- 02 · horarios ---------------- */
  function drawFlow() {
    const svg = root.querySelector("#cp-flow"); A.clear(svg);
    FW = Math.max(300, Math.round(svg.getBoundingClientRect().width) || 640);
    svg.setAttribute("viewBox", `0 0 ${FW} 240`);
    const P = sel(), val = (p, i) => p.transito[st.modo][i] / (st.escala === "ha" ? p.ha : 1);
    const max = Math.max(...P.flatMap(p => p.transito[st.modo].map((_, i) => val(p, i)))) * 1.08;
    const X = i => 44 + i / 23 * (FW - 64), Y = v => 200 - v / max * 180;
    [0, .5, 1].forEach(f => { s("line", { x1: 44, x2: FW - 20, y1: Y(max * f), y2: Y(max * f), stroke: "#e6e6e2" }, svg); s("text", { x: 36, y: Y(max * f) + 4, "text-anchor": "end", class: "ax" }, svg, A.fmt(max * f)); });
    [0, 6, 12, 18, 23].forEach(i => s("text", { x: X(i), y: 222, "text-anchor": "middle", class: "ax" }, svg, hh(i)));
    s("line", { x1: X(st.hora), x2: X(st.hora), y1: 14, y2: 200, stroke: "#111", "stroke-dasharray": "3 4" }, svg);
    P.forEach(p => {
      const d = p.transito[st.modo].map((_, i) => (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(val(p, i)).toFixed(1)).join("");
      s("path", { d, fill: "none", stroke: "#111", "stroke-width": 5, "stroke-linejoin": "round" }, svg);
      s("path", { d, fill: "none", stroke: p.color, "stroke-width": 3, "stroke-linejoin": "round" }, svg);
      s("circle", { cx: X(st.hora), cy: Y(val(p, st.hora)), r: 5.5, fill: p.color, stroke: "#111", "stroke-width": 1.5 }, svg);
    });
    root.querySelector("#cp-flow-r").innerHTML = `${hh(st.hora)} · ${st.modo === "finde" ? "fin de semana" : "lunes a viernes"}: ` +
      P.map(p => `<b>${A.fmt(val(p, st.hora))}</b> en ${p.corto}`).join(", ") + (st.escala === "ha" ? " (por hectárea)" : "") + ".";
  }

  /* ---------------- 03 · quiénes (círculos) ---------------- */
  function drawWho() {
    const P = sel(), keys = Object.keys(P[0].personas[st.dim]);
    root.querySelector("#cp-who").innerHTML = `<div class="cg" style="--n:${P.length}">
      <div class="cg-h"><span></span>${P.map(p => `<b style="--c:${p.color}"><i class="sq" style="--c:${p.color}"></i>${p.corto}</b>`).join("")}</div>
      ${keys.map(k => { const vals = P.map(p => p.personas[st.dim][k] || 0), mx = Math.max(...vals);
        return `<div class="cg-r"><span>${k}</span>${P.map((p, j) => `<div class="cg-c"><i class="${vals[j] === mx && mx ? "top" : ""}" style="--s:${(Math.sqrt(vals[j]) * 11).toFixed(0)}px;--c:${p.color}"><b>${vals[j]}%</b></i></div>`).join("")}</div>`; }).join("")}</div>`;
  }

  /* ---------------- 04 · qué hacen / qué prefieren (círculo y anillo) ---------------- */
  function drawAct() {
    const P = sel();
    root.querySelector("#cp-act").innerHTML = `<p class="cp-key"><span><i class="k-h"></i>Hacen hoy</span><span><i class="k-p"></i>Preferirían</span><span><i class="k-up"></i>Lo que más falta</span></p>
      <div class="cg" style="--n:${P.length}">
      <div class="cg-h"><span></span>${P.map(p => `<b style="--c:${p.color}"><i class="sq" style="--c:${p.color}"></i>${p.corto}</b>`).join("")}</div>
      ${C.ACTIV.map((a, i) => `<div class="cg-r"><span>${a}</span>${P.map(p => {
        const hz = p.hacen[i], pr = p.prefieren[i], gap = C.ACTIV.map((_, k) => p.prefieren[k] - p.hacen[k]), top = gap.indexOf(Math.max(...gap)) === i;
        return `<div class="cg-c act${top ? " falta" : ""}"><i style="--s:${(Math.sqrt(hz) * 11).toFixed(0)}px;--c:${p.color}"></i><em style="--s:${(Math.sqrt(pr) * 11).toFixed(0)}px"></em><small>${hz}→${pr}%</small></div>`; }).join("")}</div>`).join("")}</div>`;
  }

  /* ---------------- 05 · qué piden (burbujas) ---------------- */
  const VT = { queja: "#ff8a7a", recomendacion: "#00e887", pedido: "#f8e544" };
  function drawVoc() {
    const P = sel(), cnt = {};
    P.forEach(p => new Set(p.voces.map(w => w.t)).forEach(t => cnt[t] = (cnt[t] || 0) + 1));
    const rep = Object.keys(cnt).filter(t => cnt[t] > 1);
    root.querySelector("#cp-voc").innerHTML = `<div class="vb-grid" style="--n:${P.length}">${P.map(p => {
      const t = [...p.voces].sort((a, b) => b.n - a.n).slice(0, 6), max = t[0].n;
      return `<div class="vb-park"><p class="vb-name"><i class="sq" style="--c:${p.color}"></i>${p.corto}</p><div class="vb-bubs">${t.map(w =>
        `<span class="${rep.includes(w.t) ? "both" : ""}" style="--s:${(46 + w.n / max * 58).toFixed(0)}px;--c:${VT[w.tipo]}" title="${w.n} menciones"><b>${w.t}</b></span>`).join("")}</div></div>`; }).join("")}</div>
      <p class="cmp-key"><span><i style="--c:${VT.queja}"></i>Queja</span><span><i style="--c:${VT.pedido}"></i>Pedido</span><span><i style="--c:${VT.recomendacion}"></i>Recomendación</span>${rep.length ? `<span><b>${rep.length}</b> ${rep.length === 1 ? "tema se repite" : "temas se repiten"} entre parques</span>` : ""}</p>`;
  }

  /* ---------------- Buscador de equipamiento ---------------- */
  function drawEq() {
    root.querySelectorAll("[data-eq]").forEach(b => b.classList.toggle("on", b.dataset.eq === st.eq));
    const E = C.EQUIP[st.eq], con = PQ.filter(p => p.equip.includes(st.eq));
    const rows = con.map(p => {
      const u = C.usoEquip(p, st.eq, st.modo), max = Math.max(...u), ahora = u[st.hora];
      const tranq = u.map((v, i) => [v, i]).filter(([, i]) => i >= 8 && i <= 21).sort((a, b) => a[0] - b[0])[0][1];
      return { p, u, max, ahora, pico: u.indexOf(max), tranq, nivel: ahora / Math.max(1, max) };
    }).sort((a, b) => a.nivel - b.nivel);
    const lvl = n => n > .75 ? ["Lleno", "#ff5a4e"] : n > .4 ? ["Movido", "#f8e544"] : ["Tranquilo", "#00e887"];
    const gauge = n => { const a = Math.PI * (1 - n), x = 40 + Math.cos(a) * 30, y = 40 - Math.sin(a) * 30;
      return `<svg viewBox="0 0 80 46" class="eq-g"><path d="M10 40A30 30 0 0 1 70 40" fill="none" stroke="#e6e6e2" stroke-width="8"/><path d="M10 40A30 30 0 0 1 70 40" fill="none" stroke="${lvl(n)[1]}" stroke-width="8" stroke-dasharray="${(n * 94.2).toFixed(1)} 200"/><line x1="40" y1="40" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#111" stroke-width="2.5" stroke-linecap="round"/><circle cx="40" cy="40" r="3.5" fill="#111"/></svg>`; };
    root.querySelector("#cp-eqr").innerHTML = con.length ? `
      <p class="eq-h"><b>${E.nombre}</b> en <b>${con.length}</b> de ${PQ.length} parques · a las ${hh(st.hora)}${rows[0] ? `, el más tranquilo es <span class="hl" style="--c:#00e887">${rows[0].p.corto}</span>` : ""}</p>
      <div class="eq-cards">${rows.map((r, k) => { const [ln, lc] = lvl(r.nivel); return `<article class="eq-card${k === 0 ? " best" : ""}" style="--c:${r.p.color}">
        <header><i class="sq" style="--c:${r.p.color}"></i><b>${r.p.corto}</b><span>${r.p.barrio}</span></header>
        <div class="eq-now">${gauge(r.nivel)}<span style="--c:${lc}">${ln}</span></div>
        <svg viewBox="0 0 240 34" class="eq-spark">${r.u.map((v, i) => `<rect x="${i * 10}" y="${32 - v / r.max * 30}" width="8" height="${Math.max(1, v / r.max * 30)}" rx="1.5" fill="${i === st.hora ? "#111" : r.p.color}"/>`).join("")}</svg>
        <p><span>Se llena <b>${hh(r.pico)}</b></span><span>Mejor ir <b>${hh(r.tranq)}</b></span></p></article>`; }).join("")}</div>` : `<p class="muted">Ningún parque cargado tiene ${E.nombre.toLowerCase()} todavía.</p>`;
  }

  /* ---------------- Agenda ---------------- */
  function agenda() {
    root.querySelectorAll("[data-fp]").forEach(b => b.classList.toggle("on", st.fP.has(b.dataset.fp)));
    root.querySelectorAll("[data-ft]").forEach(b => b.classList.toggle("on", st.fT.has(b.dataset.ft)));
    const ok = e => (!st.fP.size || st.fP.has(e.parque)) && (!st.fT.size || st.fT.has(e.tipo));
    const EV = C.eventos.filter(ok), M = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    const DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
    const now = new Date(), hoy = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    root.querySelector("#cp-today").textContent = now.getDate();
    const next = EV.filter(e => e.fecha >= hoy).slice(0, 8);
    const rel = f => { const d = Math.round((new Date(f + "T12:00") - new Date(hoy + "T12:00")) / 864e5); return d === 0 ? "Hoy" : d === 1 ? "Mañana" : d < 7 ? `En ${d} días` : ""; };
    root.querySelector("#cp-next").innerHTML = next.length ? next.map(e => { const p = byId(e.parque), [tn, tc] = C.TIPOS_EV[e.tipo], dt = new Date(e.fecha + "T12:00");
      return `<article class="ev-card" style="--c:${tc}"><div class="ev-date"><span>${DIAS[dt.getDay()]}</span><b>${dt.getDate()}</b><span>${M[dt.getMonth()].slice(0, 3)}</span></div>
        <div class="ev-body2">${rel(e.fecha) ? `<em>${rel(e.fecha)}</em>` : ""}<p>${e.titulo}</p><span><i class="sq" style="--c:${p.color}"></i>${p.corto} · ${e.hora}</span><small>${tn}</small></div></article>`; }).join("") : `<p class="muted">No hay eventos próximos con esos filtros.</p>`;
    const y = 2026, m = st.mes, first = new Date(y, m, 1), days = new Date(y, m + 1, 0).getDate(), off = (first.getDay() + 6) % 7;
    const key = d => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    let cells = ""; for (let i = 0; i < off; i++) cells += `<div class="d off"></div>`;
    for (let d = 1; d <= days; d++) { const evs = EV.filter(e => e.fecha === key(d));
      cells += `<div class="d${key(d) === hoy ? " hoy" : ""}${evs.length ? " has" : ""}"><span>${d}</span>${evs.map(e => `<i title="${e.titulo} · ${byId(e.parque).corto}" style="--c:${C.TIPOS_EV[e.tipo][1]};--b:${byId(e.parque).color}"></i>`).join("")}</div>`; }
    root.querySelector("#cp-cal").innerHTML = `<div class="cal"><div class="cal-h"><button class="chip" data-m="-1" ${m <= 10 ? "disabled" : ""}>←</button><b>${M[m]} ${y}</b><button class="chip" data-m="1" ${m >= 11 ? "disabled" : ""}>→</button></div>
        <div class="cal-g">${["L", "M", "M", "J", "V", "S", "D"].map(d => `<div class="wd">${d}</div>`).join("")}${cells}</div></div>`;
    root.querySelectorAll("#cp-cal [data-m]").forEach(b => b.onclick = () => { st.mes = A.clamp(st.mes + +b.dataset.m, 10, 11); agenda(); });
  }

  function update() {
    if (!built) return;
    const bar = root.querySelector("#cp-bar");
    bar.querySelector("input").value = st.hora; bar.querySelector(".cmp-hour b").textContent = hh(st.hora);
    bar.querySelectorAll("[data-modo]").forEach(b => b.classList.toggle("on", b.dataset.modo === st.modo));
    root.querySelectorAll("[data-e]").forEach(b => b.classList.toggle("on", b.dataset.e === st.escala));
    root.querySelectorAll("[data-dim]").forEach(b => b.classList.toggle("on", b.dataset.dim === st.dim));
    live.forEach(c => {
      const arr = c.p.transito[st.modo], v = arr[st.hora], max = Math.max(...arr);
      c.target = Math.min(160, Math.round(v / 2));
      c.card.querySelector('[data-m="n"]').textContent = A.fmt(v);
      c.card.querySelector('[data-m="d"]').textContent = A.fmt(v / c.p.ha);
      c.card.querySelector('[data-m="p"]').innerHTML = `${hh(arr.indexOf(max))}`;
    });
    drawFlow(); drawWho(); drawAct(); drawVoc(); drawEq();
  }

  A.compara = {
    show(sub) {
      if (!built) build();
      update(); requestAnimationFrame(() => { fitK(); drawFlow(); if (sub) go(sub); });
    },
    hide() {}
  };
})(window.ATLAS);
