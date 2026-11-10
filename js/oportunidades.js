/* =========================================================================
   ATLAS · EXPLORAR OPORTUNIDADES (abierto para todos)
   01 · Dónde se cruzan las miradas: un mapa del parque + un ranking que
        se reordena en vivo con cada aporte anónimo. Cada oportunidad
        muestra sus tres miradas (lo que se pide, lo que se puede, lo que
        se sostiene) y el triángulo negro aparece cuando las tres coinciden.
   02 · Contexto para decidir: cifras claras.
   (ATLAS Norte vive en su propia vista, solo para el sector privado.)
   ========================================================================= */
(function (A) {
  const s = A.s, h = A.h, D = A.D, I = window.ATLAS_INFORME, M = I.matriz;
  const root = document.getElementById("op");
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ---------- Datos compartidos con ATLAS Norte ---------- */
  const VALID = {
    "Nuevos centros comerciales": ["no", "No permitido dentro del predio (sin grandes superficies)."],
    "Desarrollo inmobiliario": ["cond", "Solo en el lote privado (22% del predio) y sin superar la altura de la zona."],
    "Estacionamiento": ["rev", "En revisión: compite con superficie verde."],
    "Polo tecnológico": ["rev", "En revisión: requiere definir el uso del galpón."],
    "Espacios de cowork": ["rev", "En revisión: el uso del galpón está a definir."]
  };
  const valid = n => VALID[n] || ["ok", "Compatible con la normativa del predio. Validado por el sector público."];
  const VLAB = { ok: ["Validada", "#00e887", 1], cond: ["Con condiciones", "#f8e544", .7], rev: ["En revisión", "#c9c9c4", .4], no: ["No permitida", "#ff5a4e", 0] };
  const COST = {
    gastro: { proy: "Café y patio gastronómico en el Galpón Mitre", m2: 320, inv: [180, 260], plazo: "8 meses", ret: 4.5 },
    deporte: { proy: "Canchas y estaciones deportivas en el sector Skate", m2: 900, inv: [120, 200], plazo: "6 meses", ret: 5 },
    cultura: { proy: "Ciclo cultural anual en el galpón y la plaza Lacroze", m2: 600, inv: [40, 70], plazo: "3 meses", ret: 2.5 },
    infra: { proy: "Módulos de baños públicos con mantenimiento por concesión", m2: 60, inv: [90, 140], plazo: "5 meses", ret: 4 },
    comercio: { proy: "Locales de barrio en planta baja del lote privado", m2: 400, inv: [500, 800], plazo: "14 meses", ret: 5.5 },
    tec: { proy: "Laboratorio de innovación urbana en el galpón", m2: 450, inv: [220, 340], plazo: "10 meses", ret: 4 },
    inmo: { proy: "Vivienda en el lote privado sobre Moldes", m2: 6000, inv: [9800, 12400], plazo: "30 meses", ret: 3.5 },
    otros: { proy: "Sombra, arbolado nativo y bancos con mantenimiento", m2: 1500, inv: [60, 110], plazo: "4 meses", ret: 3 }
  };
  const SH = { "Mejora de espacios verdes y mobiliario": "Verde y mobiliario", "Baños públicos y servicios básicos": "Baños públicos", "Actividades culturales y eventos": "Cultura y eventos", "Gastronomía y servicios": "Gastronomía", "Infraestructura deportiva": "Deporte", "Accesibilidad y movilidad": "Accesibilidad", "Equipamiento administrativo": "Equip. administrativo", "Nuevos centros comerciales": "Centros comerciales", "Desarrollo inmobiliario": "Desarrollo inmobiliario" };
  const corto = n => SH[n] || n;

  /* Puntaje de convergencia: demanda (ciudadanía) + validación (sector público) + potencial (sector privado) */
  function puntos(zona) {
    const all = A.aportes.todos().filter(a => !zona || A.zonaCerca(a.x, a.y).id === zona);
    const pt = {}; all.forEach(a => pt[a.tema] = (pt[a.tema] || 0) + 1);
    if (!zona) { const ap = A.aportes.apoyos(); Object.keys(ap).forEach(t => pt[t] = (pt[t] || 0) + ap[t]); }
    const max = Math.max(1, ...Object.values(pt));
    return M.items.map(([n, dem, pot, tipo, imp, ac], i) => {
      const k = (pt[n] || 0) / max, v = valid(n);
      const d = zona ? k : A.clamp(dem * .55 + k * .45), val = VLAB[v[0]][2];
      return { i, n, tipo, pot, dem: d, val, v, aportes: pt[n] || 0, score: Math.round(100 * (d * .4 + val * .3 + pot * .3)) };
    }).sort((a, b) => b.score - a.score);
  }
  A.OPORT = { VALID, valid, VLAB, COST, puntos, corto };

  let built = false, stopSim = null, unsub = null, sel = null;
  const st = { off: new Set(), live: true, zona: null };

  function build() {
    built = true;
    root.innerHTML = `
      <header class="op-hero">
        <p class="kicker">Explorar oportunidades · Parque Ferroviario Colegiales</p>
        <h1>Dónde se cruzan lo que se pide, lo que se puede y lo que se sostiene.</h1>
        <p class="op-lead">Cada aporte de quienes usan el parque mueve este ranking. Las oportunidades son públicas: cualquiera puede verlas y desarrollarlas.</p>
      </header>
      <section class="op-sec op-live">
        <div class="op-kpis" id="op-kpis">
          <div class="ok1"><span>Aportes recibidos</span><b id="k-tot">0</b><small>todos anónimos</small></div>
          <div class="ok2"><span>Llegando ahora</span><b id="k-min">0</b><small>por minuto</small><svg id="k-spark" viewBox="0 0 120 30" preserveAspectRatio="none"></svg></div>
          <div class="ok3"><span>Oportunidades validadas</span><b id="k-val">0</b><small>por el sector público</small></div>
          <div class="ok4"><span>La que más subió</span><b id="k-up">—</b><small id="k-up2">desde que abriste la página</small></div>
        </div>
        <div class="op-ticker"><label class="sw"><input type="checkbox" id="op-live" checked><span>En vivo</span></label><p id="op-tick"></p><a class="btn small" href="#recorrido/suma-voz">Sumá tu voz →</a></div>
        <div class="op-mapw"><svg id="op-map" preserveAspectRatio="xMidYMid meet" aria-label="Mapa de oportunidades"></svg><div class="op-mapnote" id="op-mapnote"></div></div>
        <div class="op-race-h">
          <div><h2>La carrera de las oportunidades</h2><p>El puntaje suma las tres miradas. Cuando las tres coinciden, aparece el triángulo negro.</p></div>
          <div class="op-formula"><span style="--c:#9b6cff"><i></i>Lo que se pide <b>40</b></span><em>+</em><span style="--c:#00e887"><i></i>Lo que se puede <b>30</b></span><em>+</em><span style="--c:#08b8f8"><i></i>Lo que se sostiene <b>30</b></span><em>=</em><span class="tot">${A.tri("#111")} <b>100</b></span></div>
        </div>
        <div class="op-filt"><div class="chips" id="op-tipos">${Object.entries(M.tipos).map(([k, [n, c]]) => `<button class="chip on" style="--c:${c}" data-t="${k}">${n}</button>`).join("")}</div><span id="op-zona"></span></div>
        <ol class="op-rank op-race" id="op-rank"></ol>
      </section>
      <section class="op-sec">
        <div class="op-sec-h"><span class="op-n">02</span><div><h2>Contexto para decidir</h2><p>Los números que importan antes de desarrollar algo acá.</p></div></div>
        <div class="op-ctx" id="op-ctx"></div>
      </section>
      <section class="op-sec op-norte-cta" id="op-norte"></section>`;
    root.querySelectorAll("[data-t]").forEach(b => b.onclick = () => { const k = b.dataset.t; st.off.has(k) ? st.off.delete(k) : st.off.add(k); b.classList.toggle("on"); drawRank(); });
    root.querySelector("#op-live").onchange = e => { st.live = e.target.checked; };
    base = Object.fromEntries(puntos().map(p => [p.n, p.score]));
    initMap(); drawRank(); context(); kpis();
  }

  /* ---------------- KPIs en vivo ---------------- */
  let base = {}, rate = Array(24).fill(0).map(() => 10 + Math.random() * 6), shown = { tot: 0 };
  function kpis(bump) {
    const tot = A.aportes.todos().length + Object.values(A.aportes.apoyos()).reduce((a, b) => a + b, 0) + 312;
    const P = puntos(), val = P.filter(p => p.v[0] === "ok").length;
    const up = P.map(p => [p, p.score - (base[p.n] ?? p.score)]).sort((a, b) => b[1] - a[1])[0];
    if (bump) { rate.push(Math.min(30, rate[rate.length - 1] * .7 + 4 + Math.random() * 10)); rate.shift(); }
    const el = id => root.querySelector(id);
    countTo(el("#k-tot"), tot); el("#k-min").textContent = Math.round(rate[rate.length - 1]);
    el("#k-val").innerHTML = `${val}<small> de ${P.length}</small>`;
    el("#k-up").textContent = up && up[1] > 0 ? corto(up[0].n) : "—";
    el("#k-up2").innerHTML = up && up[1] > 0 ? `<em>▲ +${up[1]} puntos</em> desde que abriste la página` : "todavía nada se movió";
    const mx = Math.max(...rate);
    el("#k-spark").innerHTML = `<path d="M${rate.map((v, i) => `${(i / 23 * 120).toFixed(1)} ${(28 - v / mx * 26).toFixed(1)}`).join("L")}" fill="none" stroke="#111" stroke-width="1.5"/><circle cx="120" cy="${(28 - rate[23] / mx * 26).toFixed(1)}" r="2.5" fill="#ff5a4e"/>`;
  }
  function countTo(el, v) { const from = +(el.dataset.v || 0); el.dataset.v = v; if (A.reduced || !from) { el.textContent = A.fmt(v); return; }
    let t = 0; const stop = A.loop(dt => { t = Math.min(1, t + dt * 2); el.textContent = A.fmt(Math.round(A.lerp(from, v, A.ease(t)))); if (t >= 1) stop(); }); }

  /* ---------------- Mapa (fusionado con el ranking) ---------------- */
  let mapG = null, mapSvg = null;
  const VB = [70, 180, 1480, 280];
  function initMap() {
    mapSvg = root.querySelector("#op-map");
    A.drawParkBase(mapSvg, { labels: "min" });
    mapSvg.setAttribute("viewBox", VB.join(" "));
    mapG = s("g", {}, mapSvg);
    addEventListener("resize", () => { if (document.body.dataset.view === "oportunidades") drawMap(); });
  }
  function drawMap() {
    if (!mapG) return;
    A.clear(mapG);
    const r = mapSvg.getBoundingClientRect(); mapSvg.style.setProperty("--k", r.width ? (VB[2] / r.width).toFixed(3) : 1.6);
    const K = r.width ? VB[2] / r.width : 1.6;
    const all = A.aportes.todos(), note = root.querySelector("#op-mapnote");
    if (sel) {
      const pins = all.filter(a => a.tema === sel.n), col = M.tipos[sel.tipo][1];
      pins.forEach((a, k) => { const g = s("g", { class: "op-pin", style: `--d:${k * 40}ms` }, mapG);
        s("circle", { cx: a.x, cy: a.y, r: 9 * K, fill: col, stroke: "#111", "stroke-width": 1.4, "vector-effect": "non-scaling-stroke" }, g); });
      note.innerHTML = `<b>${pins.length}</b> ${pins.length === 1 ? "lugar donde se pidió" : "lugares donde se pidió"} <span class="hl" style="--c:${col}">${corto(sel.n).toLowerCase()}</span> <button class="linkbtn" data-unsel>Ver todo</button>`;
      note.querySelector("[data-unsel]").onclick = () => { sel = null; drawRank(); drawMap(); };
      return;
    }
    const byZ = {}; all.forEach(a => { const z = A.zonaCerca(a.x, a.y); (byZ[z.id] = byZ[z.id] || []).push(a); });
    const zs = Object.entries(byZ).sort((a, b) => b[1].length - a[1].length), mx = zs[0][1].length;
    zs.forEach(([zid, arr], i) => {
      const z = D.parque.zonas.find(x => x.id === zid), tc = {}; arr.forEach(a => tc[a.tema] = (tc[a.tema] || 0) + 1);
      const top = Object.entries(tc).sort((a, b) => b[1] - a[1])[0][0], tipo = (M.items.find(it => it[0] === top) || [, , , "otros"])[3];
      const rr = (12 + Math.sqrt(arr.length / mx) * 26) * K;
      const g = s("g", { class: "op-zb" + (st.zona === zid ? " on" : ""), tabindex: 0, role: "button", "aria-label": `${z.nombre}: ${arr.length} aportes`, style: "cursor:pointer" }, mapG);
      s("circle", { cx: z.x, cy: z.y, r: rr, fill: M.tipos[tipo][1], "fill-opacity": .75, stroke: "#111", "stroke-width": st.zona === zid ? 3 : 1.2, "vector-effect": "non-scaling-stroke" }, g);
      s("text", { x: z.x, y: z.y + 5 * K, "text-anchor": "middle", "font-size": 14 * K, "font-weight": 600, fill: "#111" }, g, arr.length);
      if (i < 4 || st.zona === zid) A.sign(g, z.x, z.y - rr, corto(top), M.tipos[tipo][1], { dir: i % 2 ? "s" : "n", len: 18, sub: z.corto });
      g.onclick = () => { st.zona = st.zona === zid ? null : zid; drawRank(); drawMap(); };
      g.onkeydown = e => { if (e.key === "Enter") g.onclick(); };
    });
    note.innerHTML = st.zona ? `Mostrando lo que se pide en <b>${D.parque.zonas.find(z => z.id === st.zona).nombre}</b> <button class="linkbtn" data-z0>Ver todo el parque</button>` : `Cada círculo es una zona: el número son los aportes y el color, lo que más se pide ahí.`;
    const z0 = note.querySelector("[data-z0]"); if (z0) z0.onclick = () => { st.zona = null; drawRank(); drawMap(); };
  }

  /* ---------------- Ranking (se reordena en vivo) ---------------- */
  const venn = p => {
    const t = Math.min(p.dem, p.val, p.pot), on = t >= .45;
    return `<svg viewBox="0 0 60 54" class="op-venn" aria-hidden="true">
      <circle cx="22" cy="20" r="15" fill="#9b6cff" fill-opacity="${(.15 + p.dem * .7).toFixed(2)}" stroke="#111" stroke-width=".8"/>
      <circle cx="38" cy="20" r="15" fill="#00e887" fill-opacity="${(.15 + p.val * .7).toFixed(2)}" stroke="#111" stroke-width=".8"/>
      <circle cx="30" cy="34" r="15" fill="#08b8f8" fill-opacity="${(.15 + p.pot * .7).toFixed(2)}" stroke="#111" stroke-width=".8"/>
      <path d="${A.shape("reuleaux", 30, 25, 7)}" fill="#111" opacity="${on ? 1 : 0}" class="op-tri"/></svg>`;
  };
  /* ---------------- La carrera (filas fijas que se reordenan y crecen) ---------------- */
  const rows = {};
  function topZona(n) { const c = {}; A.aportes.todos().filter(a => a.tema === n).forEach(a => c[a.zona] = (c[a.zona] || 0) + 1); const e = Object.entries(c).sort((a, b) => b[1] - a[1])[0]; return e ? e[0] : null; }
  function drawRank() {
    const ol = root.querySelector("#op-rank"); if (!ol) return;
    const P = puntos(st.zona);
    const zEl = root.querySelector("#op-zona");
    zEl.innerHTML = st.zona ? `<span class="chip on zchip">Zona: ${D.parque.zonas.find(z => z.id === st.zona).corto} <button aria-label="Quitar zona">×</button></span>` : "";
    if (st.zona) zEl.querySelector("button").onclick = () => { st.zona = null; drawRank(); drawMap(); };
    const prev = {}; Object.values(rows).forEach(r => { if (r.li.isConnected) prev[r.n] = r.li.getBoundingClientRect().top; });
    let k = 0;
    P.forEach(p => {
      let r = rows[p.n];
      if (!r) {
        const li = h("li", { "data-n": p.n, style: `--c:${M.tipos[p.tipo][1]}` });
        li.innerHTML = `<button class="op-row"><span class="op-pos"></span><span class="op-vw"></span><span class="op-name"><b>${p.n}</b><span class="op-meta"></span></span>
          <span class="op-track"><span class="seg s1"></span><span class="seg s2"></span><span class="seg s3"></span><span class="op-end"></span></span>
          <span class="op-score"><b></b><small class="op-trend"></small></span></button><div class="op-det"></div>`;
        li.querySelector(".op-row").onclick = () => { sel = sel && sel.n === p.n ? null : puntos(st.zona).find(x => x.n === p.n); drawRank(); drawMap(); };
        r = rows[p.n] = { n: p.n, li, last: null };
      }
      const hide = st.off.has(p.tipo);
      r.li.hidden = hide; if (!hide) k++;
      const VL = VLAB[p.v[0]], open = sel && sel.n === p.n, z = topZona(p.n);
      r.li.classList.toggle("open", !!open); r.li.classList.toggle("no", p.v[0] === "no");
      r.li.querySelector(".op-pos").textContent = hide ? "" : k;
      r.li.querySelector(".op-vw").innerHTML = venn(p);
      r.li.querySelector(".op-meta").innerHTML = `<i class="sq"></i>${M.tipos[p.tipo][0]} · <em class="vk ${p.v[0]}"></em>${VL[0]}${z ? ` · más pedida en <b>${z}</b>` : ""}`;
      const w1 = p.dem * 40, w2 = p.val * 30, w3 = p.pot * 30;
      const t = r.li.querySelector(".op-track");
      t.querySelector(".s1").style.width = w1 + "%"; t.querySelector(".s2").style.width = w2 + "%"; t.querySelector(".s3").style.width = w3 + "%";
      t.querySelector(".s1").title = `Se pide: ${Math.round(w1)} de 40`; t.querySelector(".s2").title = `Se puede: ${Math.round(w2)} de 30`; t.querySelector(".s3").title = `Se sostiene: ${Math.round(w3)} de 30`;
      t.querySelector(".op-end").style.left = (w1 + w2 + w3) + "%";
      const sc = r.li.querySelector(".op-score b"); countTo(sc, p.score);
      const d = p.score - (base[p.n] ?? p.score), tr = r.li.querySelector(".op-trend");
      tr.textContent = d > 0 ? `▲ ${d}` : d < 0 ? `▼ ${-d}` : "de 100"; tr.className = "op-trend" + (d > 0 ? " up" : d < 0 ? " down" : "");
      r.li.querySelector(".op-det").innerHTML = open ? detail(p) : "";
      const nb = r.li.querySelector("[data-norte]"); if (nb) nb.onclick = () => { location.hash = "#norte/" + encodeURIComponent(p.n); };
      ol.appendChild(r.li);
    });
    Object.values(rows).forEach(r => {
      const was = prev[r.n], now = r.li.getBoundingClientRect().top;
      if (was != null && Math.abs(was - now) > 2 && !A.reduced) { r.li.style.transition = "none"; r.li.style.transform = `translateY(${was - now}px)`; requestAnimationFrame(() => { r.li.style.transition = "transform .7s cubic-bezier(.2,.8,.2,1)"; r.li.style.transform = ""; }); }
    });
  }
  function detail(p) {
    const quotes = A.aportes.todos().filter(a => a.tema === p.n).slice(-3).reverse(), c = COST[p.tipo], VL = VLAB[p.v[0]];
    const priv = (A.store.get("mirada", {}) || {}).perfil === "privado";
    return `<div class="op-x">
      <div class="op-x3">
        <div style="--c:#9b6cff"><p class="lsub">Lo que se pide</p><b class="big">${p.aportes}</b><span>aportes y apoyos anónimos</span>
          ${quotes.length ? `<ul>${quotes.map(q => `<li>«${esc(q.texto)}» <small>${q.zona}</small></li>`).join("")}</ul>` : ""}</div>
        <div style="--c:#00e887"><p class="lsub">Lo que se puede</p><b class="big"><i class="vk ${p.v[0]}"></i> ${VL[0]}</b><span>${p.v[1]}</span></div>
        <div style="--c:#08b8f8"><p class="lsub">Lo que se sostiene</p><b class="big">${Math.round(p.pot * 100)}%</b><span>potencial de desarrollo</span>
          <p class="small">Inversión de referencia: USD ${A.fmt(c.inv[0])}k – ${A.fmt(c.inv[1])}k ${A.tag(false)}</p></div>
      </div>
      <div class="row-btns">${p.v[0] === "no" ? `<span class="muted small">Sin validación pública no se pueden armar propuestas.</span>` : priv ? `<button class="btn small norte-go" data-norte>${A.tri("#fff")} Analizar con ATLAS Norte</button>` : ""}<a class="btn ghost small" href="#recorrido/suma-voz">Sumá tu voz</a></div></div>`;
  }

  function tick(a) {
    const el = root.querySelector("#op-tick"); if (!el || !a || !a.texto) return;
    const ac = A.accion(a.accion);
    el.innerHTML = `<span class="op-tk">${A.icon(ac.forma, ac.color)}<b>${a.mio ? "Vos" : ac.nombre}</b> «${esc(a.texto)}» <em>→ ${corto(a.tema)} · ${a.zona}</em></span>`;
  }
  function onAporte(a) {
    if (!built) return;
    tick(a); drawRank(); drawMap(); kpis(true);
    if (a && a.tema) { const li = root.querySelector(`li[data-n="${CSS.escape(a.tema)}"]`); if (li) { li.classList.remove("ping"); void li.offsetWidth; li.classList.add("ping"); } }
  }

  /* ---------------- Contexto ---------------- */
  function context() {
    const c = D.capas.censo, T = D.capas.transito, pk = arr => arr.indexOf(Math.max(...arr)), e = D.capas.personas.edad;
    const top = Object.entries(e).reduce((a, b) => b[1] > a[1] ? b : a);
    root.querySelector("#op-ctx").innerHTML = `
      <div class="cx-card" style="--c:#08b8f8"><p class="lsub">Lo edificable</p><b>19.268 m²</b><p>Es el lote privado: el 22% de los 87.582 m² del predio.</p>
        <div class="cx-sq"><i style="--s:100%"></i><i class="in" style="--s:${Math.sqrt(.22) * 100}%"></i></div>${A.tag(true)}</div>
      <div class="cx-card" style="--c:#08b8f8"><p class="lsub">Lo que vale el suelo</p><b>USD ${A.fmt(c.m2Pozo.valor)}</b><p>el m² en pozo, contra USD ${A.fmt(c.m2Usado.valor)} de un usado: <strong>+${Math.round((c.m2Pozo.valor / c.m2Usado.valor - 1) * 100)}%</strong>.</p>
        <div class="cx-bars"><span style="--w:${c.m2Usado.valor / c.m2Pozo.valor * 100}%">Usado</span><span class="hot" style="--w:100%">Pozo</span></div>${A.tag(true)}</div>
      <div class="cx-card" style="--c:#9b6cff"><p class="lsub">Quién está cerca</p><b>+80.000</b><p>vecinos en el área de influencia. En la Comuna 13 viven ${A.fmt(c.poblacionComuna.valor)} personas.</p>${A.tag(true)}</div>
      <div class="cx-card" style="--c:#9b6cff"><p class="lsub">Quién usa el parque</p><b>${top[1]}%</b><p>son ${top[0].toLowerCase()}, el grupo más grande.</p>
        <div class="cx-dots">${Object.entries(e).map(([k, v]) => `<span class="${k === top[0] ? "on" : ""}" style="--s:${Math.sqrt(v) * 7}px" title="${k}: ${v}%"></span>`).join("")}</div>${A.tag(false)}</div>
      <div class="cx-card" style="--c:#f8e544"><p class="lsub">Cuándo hay más gente</p><b>${String(pk(T.finde)).padStart(2, "0")}:00</b><p>los fines de semana (${Math.max(...T.finde)} personas). De lunes a viernes, a las ${String(pk(T.semana)).padStart(2, "0")}:00.</p>
        <div class="cx-spark">${T.finde.map((v, i) => `<i style="--h:${v / Math.max(...T.finde) * 100}%" class="${i === pk(T.finde) ? "on" : ""}"></i>`).join("")}</div>${A.tag(false)}</div>`;
  }

  function norteCTA() {
    const el = root.querySelector("#op-norte"); if (!el) return;
    const priv = (A.store.get("mirada", {}) || {}).perfil === "privado";
    el.hidden = !priv;
    el.innerHTML = priv ? `<div class="nc"><svg viewBox="0 0 120 110" class="nc-tri"><circle cx="45" cy="42" r="32" fill="#9b6cff" opacity=".8"/><circle cx="75" cy="42" r="32" fill="#00e887" opacity=".8"/><circle cx="60" cy="68" r="32" fill="#08b8f8" opacity=".8"/><path d="${A.shape("reuleaux", 60, 52, 16)}" fill="#111"/></svg>
      <div><p class="kicker">Para tu empresa</p><h2>ATLAS Norte</h2><p>La inteligencia que nace donde coinciden las tres miradas: encuentra la oportunidad para tu rubro, la tasa, la presupuesta y arma el proyecto.</p><a class="btn" href="#norte">Abrir ATLAS Norte →</a></div></div>` : "";
  }

  A.oport = {
    show() {
      if (!built) build();
      norteCTA(); drawRank(); requestAnimationFrame(drawMap); context(); kpis();
      const last = A.aportes.todos().slice(-1)[0]; tick(last);
      if (!unsub) unsub = A.aportes.on(onAporte);
      if (!stopSim) { let acc = 0; stopSim = A.loop(dt => { if (!st.live || document.body.dataset.view !== "oportunidades") return; acc += dt; if (acc > 2.6) { acc = 0; A.aportes.simular(); } }); }
    },
    hide() { if (stopSim) { stopSim(); stopSim = null; } }
  };
})(window.ATLAS);
