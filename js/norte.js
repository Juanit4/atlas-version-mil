/* =========================================================================
   ATLAS NORTE · exclusivo para empresas del sector privado suscriptas
   La IA que nace del triángulo negro: donde coinciden lo que se pide
   (ciudadanía), lo que se puede (sector público) y lo que se sostiene
   (sector privado). Encuentra, tasa, presupuesta y arma el proyecto.
   Reglas: solo trabaja con oportunidades validadas por el sector público
   y con datos ciudadanos 100% anónimos.
   ========================================================================= */
(function (A) {
  const s = A.s, h = A.h, D = A.D, M = window.ATLAS_INFORME.matriz;
  const root = document.getElementById("nt");
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const RUBROS = [
    { id: "gastro", n: "Gastronomía", tipos: ["gastro", "comercio"], emp: "Café de Barrio S.A." },
    { id: "inmo", n: "Desarrollo inmobiliario", tipos: ["inmo", "comercio"], emp: "Moldes Desarrollos" },
    { id: "cultura", n: "Cultura y eventos", tipos: ["cultura"], emp: "Productora Galpón" },
    { id: "servicios", n: "Servicios urbanos", tipos: ["infra", "otros"], emp: "Servicios Urbanos SRL" },
    { id: "deporte", n: "Deporte y recreación", tipos: ["deporte"], emp: "Club Activo" },
    { id: "tec", n: "Tecnología", tipos: ["tec"], emp: "Lab Urbano" }
  ];
  const st = { rubro: "gastro", focus: null };
  let built = false, stopHero = null;
  const O = () => A.OPORT;

  const rubro = () => RUBROS.find(r => r.id === st.rubro);
  function ranking() {
    const R = rubro();
    return O().puntos().filter(p => p.v[0] !== "no").map(p => {
      const fit = R.tipos.includes(p.tipo) ? 1 : .3;
      return Object.assign({}, p, { rel: Math.round(100 * (.45 * fit + .25 * p.dem + .2 * p.pot + .1 * p.val)) });
    }).sort((a, b) => b.rel - a.rel);
  }
  const focusP = () => { const r = ranking(); return (st.focus && r.find(p => p.n === st.focus)) || r[0]; };
  const priv = () => (A.store.get("mirada", {}) || {}).perfil === "privado";

  /* ---------- Presupuesto, tasación y retorno (estimaciones de ATLAS Norte) ---------- */
  function analisis(p) {
    const c = O().COST[p.tipo], mid = (c.inv[0] + c.inv[1]) / 2;
    const partes = [["Obra y adecuación", .52, "#08b8f8"], ["Equipamiento", .22, "#9b6cff"], ["Permisos y estudios", .08, "#00e887"], ["Diseño y dirección", .08, "#f8e544"], ["Imprevistos", .10, "#c9c9c4"]];
    const cen = D.capas.censo;
    const tasa = p.tipo === "inmo" ? { t: "Valor de venta estimado", v: `USD ${A.fmt(c.m2 * cen.m2Pozo.valor / 1000)}k`, d: `${A.fmt(c.m2)} m² × USD ${A.fmt(cen.m2Pozo.valor)} el m² en pozo` }
      : { t: "Valor del espacio (canon anual de referencia)", v: `USD ${A.fmt(Math.round(c.m2 * 38 / 1000))}k`, d: `${A.fmt(c.m2)} m² × USD 38 por m² al año en concesiones de espacio público` };
    return { c, mid, partes, tasa };
  }

  function build() {
    built = true;
    root.innerHTML = `
      <header class="nt-hero">
        <div class="nt-hero-t">
          <p class="nt-plan"><i></i>Plan empresas · suscripción activa</p>
          <h1>ATLAS <span>Norte</span></h1>
          <p class="nt-lead">La inteligencia artificial que nace donde coinciden <b style="--c:#9b6cff">lo que se pide</b>, <b style="--c:#00e887">lo que se puede</b> y <b style="--c:#08b8f8">lo que se sostiene</b>. Te avisa cuando aparece una oportunidad para tu rubro y te entrega el proyecto listo para presentar.</p>
          <div class="nt-rubro"><span>Tu rubro</span><div class="chips" id="nt-rub">${RUBROS.map(r => `<button class="chip" data-r="${r.id}">${r.n}</button>`).join("")}</div></div>
        </div>
        <svg class="nt-hero-v" id="nt-hero" viewBox="0 0 420 400" aria-hidden="true"></svg>
      </header>

      <section class="nt-sec">
        <h2 class="nt-h">Qué hace ATLAS Norte por tu empresa</h2>
        <ol class="nt-does">
          <li><span>1</span><b>Te avisa</b><p>Cruza los aportes anónimos, la normativa y el mercado. Cuando algo coincide con tu rubro, te llega un aviso.</p></li>
          <li><span>2</span><b>Tasa</b><p>Calcula cuánto vale el espacio o el desarrollo con los precios reales de la zona.</p></li>
          <li><span>3</span><b>Presupuesta</b><p>Estima inversión, plazos y retorno, y te deja probar escenarios.</p></li>
          <li><span>4</span><b>Arma el proyecto</b><p>Pasos, con quién hablar, riesgos y una presentación en PDF lista para enviar.</p></li>
        </ol>
      </section>

      <section class="nt-sec nt-two">
        <div class="nt-radar-w"><h2 class="nt-h">Radar: ¿qué te conviene más?</h2>
          <p class="nt-sub">ATLAS Norte escanea todas las oportunidades validadas y las acerca al centro según cuánto te convienen: cuánto se pide, si la norma lo permite y si encaja con tu rubro. <b>Cuanto más cerca del triángulo, mejor negocio para vos.</b></p>
          <div class="nt-radar-box"><svg id="nt-radar" viewBox="0 0 520 520"></svg><ol class="nt-det" id="nt-det"></ol></div></div>
        <div class="nt-inbox-w"><h2 class="nt-h">Tus alertas</h2><ul class="nt-inbox" id="nt-inbox"></ul><div id="nt-mail"></div></div>
      </section>

      <section class="nt-sec" id="nt-an"></section>

      <section class="nt-sec nt-chat-w">
        <h2 class="nt-h">Preguntale a ATLAS Norte</h2>
        <div class="nt-chat">
          <div class="nt-log" id="nt-log" aria-live="polite"></div>
          <div class="nt-sugs" id="nt-sugs"></div>
          <form class="nt-in" id="nt-form"><input id="nt-q" autocomplete="off" placeholder="Escribí lo que quieras: ¿cuánto cuesta?, ¿qué riesgos hay?, armame la presentación…" aria-label="Escribile a ATLAS Norte"><button class="btn" type="submit">Enviar</button></form>
        </div>
      </section>
      <p class="nt-foot">ATLAS Norte solo trabaja con oportunidades validadas por el sector público y con datos ciudadanos 100% anónimos. Las oportunidades siguen siendo públicas en Explorar oportunidades.</p>`;
    root.querySelectorAll("[data-r]").forEach(b => b.onclick = () => { st.rubro = b.dataset.r; st.focus = null; refresh(true); });
    root.querySelector("#nt-form").onsubmit = e => { e.preventDefault(); const q = root.querySelector("#nt-q"); if (!q.value.trim()) return; ask(q.value.trim()); q.value = ""; };
    hero();
  }

  /* ---------- Hero: tres círculos que convergen en el triángulo negro ---------- */
  function hero() {
    // Misma estética que "¿Qué es ATLAS?": círculos plenos, rótulos blancos chicos y el triángulo negro en el cruce
    const sv = root.querySelector("#nt-hero"); A.clear(sv);
    const OC = [210, 215], R = 95, Dd = 118, RRr = Dd / Math.sqrt(3), D0 = Math.sqrt(R * R - Dd * Dd / 4) - RRr / 2, LD = (D0 + RRr + R) / 2;
    const C = [["#9b6cff", "SE PIDE"], ["#00e887", "SE PUEDE"], ["#08b8f8", "SE SOSTIENE"]];
    const cs = C.map(([c, l], i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / 3;
      const ci = s("circle", { r: R, fill: c, "fill-opacity": .85 }, sv); return { ci, a, l }; });
    const tri = s("path", { d: A.shape("reuleaux", 0, 0, D0), fill: "#111" }, sv);
    const labs = cs.map(c => s("text", { "text-anchor": "middle", fill: "#fff", "font-size": 12, "font-weight": 600, "letter-spacing": 1, opacity: 0 }, sv, c.l));
    const nArrow = s("g", {}, sv); s("path", { d: "M210 22L220 40H200Z", fill: "#111" }, nArrow); s("text", { x: 210, y: 14, "text-anchor": "middle", "font-size": 12, "font-weight": 700, fill: "#111", "letter-spacing": 2 }, nArrow, "N");
    let T = 0; if (stopHero) stopHero();
    stopHero = A.loop(dt => {
      if (document.body.dataset.view !== "norte") return;
      T += dt; const k = A.ease(Math.min(1, T / 2)), breathe = 1 + Math.sin(T * 1.4) * .02;
      cs.forEach((c, i) => { const d = A.lerp(RRr + 70, RRr, k), x = OC[0] + Math.cos(c.a) * d, y = OC[1] + Math.sin(c.a) * d;
        c.ci.setAttribute("cx", x.toFixed(1)); c.ci.setAttribute("cy", y.toFixed(1));
        labs[i].setAttribute("x", (OC[0] + Math.cos(c.a) * (d + LD - RRr)).toFixed(1)); labs[i].setAttribute("y", (OC[1] + Math.sin(c.a) * (d + LD - RRr) + 4).toFixed(1));
        labs[i].setAttribute("opacity", Math.max(0, (k - .6) / .4).toFixed(2)); });
      tri.setAttribute("transform", `translate(${OC[0]} ${OC[1]}) scale(${(Math.max(0, (k - .5) / .5) * breathe).toFixed(3)})`);
      nArrow.setAttribute("opacity", Math.max(0, (k - .8) / .2).toFixed(2));
    });
  }

  /* ---------- Radar ---------- */
  let stopRadar = null;
  function radar() {
    const sv = root.querySelector("#nt-radar"); A.clear(sv); if (stopRadar) stopRadar();
    const R = ranking(), cx = 260, cy = 260, f = focusP();
    const ring = [[220, "Te conviene poco"], [160, "Te conviene"], [100, "Te conviene mucho"]];
    ring.forEach(([r, t2], i) => { s("circle", { cx, cy, r, fill: i === 2 ? "#f8e544" : "none", "fill-opacity": .12, stroke: "#111", "stroke-opacity": .18, "stroke-dasharray": i ? "3 5" : "none" }, sv);
      s("text", { x: cx, y: cy + r - 8, "text-anchor": "middle", "font-size": 10.5, "font-weight": 600, fill: "#77776f", "letter-spacing": .5 }, sv, t2.toUpperCase()); });
    const sweepG = s("g", {}, sv);
    s("path", { d: `M${cx} ${cy}L${cx - 230 * Math.sin(.6)} ${cy - 230 * Math.cos(.6)}A230 230 0 0 1 ${cx} ${cy - 230}Z`, fill: "#f8e544", opacity: .28 }, sweepG);
    s("line", { x1: cx, y1: cy, x2: cx, y2: cy - 230, stroke: "#111", "stroke-width": 1.2 }, sweepG);
    s("path", { d: A.shape("reuleaux", cx, cy + 2, 30), fill: "#111" }, sv);
    s("text", { x: cx, y: cy + 52, "text-anchor": "middle", "font-size": 11, "font-weight": 700, fill: "#111", "letter-spacing": 2 }, sv, "TU EMPRESA");
    const tipos = Object.keys(M.tipos), dots = [];
    R.forEach((p, k) => {
      const ang = (tipos.indexOf(p.tipo) / tipos.length) * Math.PI * 2 - Math.PI / 2 + (k % 3 - 1) * .2, dist = 48 + (1 - p.rel / 100) * 230;
      const x = cx + Math.cos(ang) * dist, y = cy + Math.sin(ang) * dist, on = f && f.n === p.n, col = M.tipos[p.tipo][1];
      const g = s("g", { class: "nt-dot" + (on ? " on" : ""), tabindex: 0, role: "button", "aria-label": `${p.n}, ${p.rel}%`, style: "cursor:pointer" }, sv);
      const ping = s("circle", { cx: x, cy: y, r: 8, fill: "none", stroke: col, "stroke-width": 2, opacity: 0 }, g);
      const c = s("circle", { cx: x, cy: y, r: on ? 13 : 6 + p.rel / 16, fill: col, stroke: "#111", "stroke-width": on ? 2.5 : 1 }, g);
      if (on || k < 3) { const right = x >= cx; s("text", { x: x + (right ? 17 : -17), y: y + 4, "text-anchor": right ? "start" : "end", class: "nt-rl" + (on ? " on" : "") }, g, `${O().corto(p.n)} · ${p.rel}%`); }
      g.onclick = () => { st.focus = p.n; refresh(); document.getElementById("nt-an").scrollIntoView({ behavior: A.reduced ? "auto" : "smooth", block: "start" }); };
      g.onkeydown = e => { if (e.key === "Enter") g.onclick(); };
      dots.push({ p, ping, c, ang: ((Math.atan2(y - cy, x - cx) + Math.PI / 2) + Math.PI * 4) % (Math.PI * 2), t: 0, base: +c.getAttribute("r") });
    });
    const det = root.querySelector("#nt-det");
    det.innerHTML = `<li class="nt-det-h">Lo que detectó para ${rubro().n.toLowerCase()}</li>` + R.slice(0, 4).map((p, k) => `<li class="${f.n === p.n ? "on" : ""}"><button data-fo="${esc(p.n)}"><span class="nt-pos">${k + 1}</span><span><b>${O().COST[p.tipo].proy}</b><small>${p.n}</small></span><em>${p.rel}%</em></button></li>`).join("");
    det.querySelectorAll("[data-fo]").forEach(b => b.onclick = () => { st.focus = b.dataset.fo; refresh(); });
    let a = 0, prev = 0;
    stopRadar = A.loop(dt => {
      if (document.body.dataset.view !== "norte") return;
      prev = a; a = (a + dt * 1.1) % (Math.PI * 2);
      sweepG.setAttribute("transform", `rotate(${(a * 180 / Math.PI).toFixed(1)} ${cx} ${cy})`);
      dots.forEach(d => {
        const crossed = prev <= a ? d.ang > prev && d.ang <= a : d.ang > prev || d.ang <= a;
        if (crossed) d.t = 1;
        if (d.t > 0) { d.t = Math.max(0, d.t - dt * .9); d.ping.setAttribute("r", (d.base + (1 - d.t) * 22).toFixed(1)); d.ping.setAttribute("opacity", d.t.toFixed(2)); d.c.setAttribute("r", (d.base * (1 + d.t * .35)).toFixed(1)); }
      });
    });
  }

  /* ---------- Alertas (mail) ---------- */
  function inbox() {
    const R = ranking().slice(0, 3), r = rubro(), ul = root.querySelector("#nt-inbox"), f = focusP();
    const dias = ["hoy", "ayer", "hace 3 días"];
    ul.innerHTML = R.map((p, k) => `<li class="${k === 0 ? "new" : ""}${f.n === p.n ? " on" : ""}"><button data-m="${esc(p.n)}"><span class="nt-from">${A.tri("#111")} ATLAS Norte</span><b>${k === 0 ? "Nueva oportunidad para " + r.n.toLowerCase() : "Oportunidad " + p.rel + "% relevante"}</b><span>${O().COST[p.tipo].proy}</span><time>${dias[k]}</time></button></li>`).join("");
    ul.querySelectorAll("[data-m]").forEach(b => b.onclick = () => { st.focus = b.dataset.m; refresh(); mail(); });
    mail();
  }
  function mail() {
    const p = focusP(), c = O().COST[p.tipo], r = rubro();
    root.querySelector("#nt-mail").innerHTML = `<div class="mail">
      <div class="mail-h"><span><b>De:</b> ATLAS Norte</span><span><b>Para:</b> ${r.emp}</span><span><b>Asunto:</b> Oportunidad validada en Colegiales · ${p.rel}% de relevancia</span></div>
      <div class="mail-b"><p>Hola. Cruzando lo que piden quienes usan el Parque Ferroviario Colegiales con lo que permite la normativa, encontramos esto para ${r.n.toLowerCase()}:</p>
        <p class="mail-op">${c.proy}</p>
        <p>USD ${A.fmt(c.inv[0])}k – ${A.fmt(c.inv[1])}k · ${c.plazo} · ${O().VLAB[p.v[0]][0].toLowerCase()} por el sector público.</p>
        <button class="btn small" data-goan>Ver el análisis completo</button></div></div>`;
    root.querySelector("[data-goan]").onclick = () => document.getElementById("nt-an").scrollIntoView({ behavior: A.reduced ? "auto" : "smooth" });
  }

  /* ---------- Análisis: tasación, presupuesto, retorno, pasos, contactos ---------- */
  function analysis() {
    const p = focusP(), { c, mid, partes, tasa } = analisis(p), el = root.querySelector("#nt-an");
    el.innerHTML = `<div class="an-head"><div><p class="nt-plan"><i></i>Análisis · ${p.rel}% de relevancia</p><h2>${c.proy}</h2><p class="nt-sub">${p.n} · ${O().VLAB[p.v[0]][0]} por el sector público · ${p.aportes} aportes anónimos lo piden</p></div>
        <button class="btn" data-pdf>${A.tri("#fff")} Descargar dossier (PDF)</button></div>
      <div class="an-grid">
        <div class="an-c"><p class="lsub">Tasación</p><b class="an-big">${tasa.v}</b><p>${tasa.t}</p><small>${tasa.d}</small></div>
        <div class="an-c"><p class="lsub">Presupuesto</p><b class="an-big">USD ${A.fmt(c.inv[0])}k – ${A.fmt(c.inv[1])}k</b>
          <div class="an-stack">${partes.map(([n, k, col]) => `<i style="--w:${k * 100}%;--c:${col}" title="${n}: USD ${A.fmt(Math.round(mid * k))}k"></i>`).join("")}</div>
          <ul class="an-leg">${partes.map(([n, k, col]) => `<li><i style="--c:${col}"></i>${n}<b>USD ${A.fmt(Math.round(mid * k))}k</b></li>`).join("")}</ul></div>
        <div class="an-c an-ret"><p class="lsub">Retorno · probá escenarios</p>
          <label>Inversión <input type="range" id="an-inv" min="${c.inv[0]}" max="${c.inv[1]}" value="${Math.round(mid)}"><b id="an-invv"></b></label>
          <label>Demanda <input type="range" id="an-dem" min="50" max="150" value="100"><b id="an-demv"></b></label>
          <svg id="an-svg" viewBox="0 0 300 140"></svg><p class="an-out" id="an-out"></p></div>
      </div>
      <div class="an-grid an-3">
        <div class="an-c"><p class="lsub">Cómo hacerlo</p><ol class="an-steps">${PASOS.map(x => `<li>${x}</li>`).join("")}</ol></div>
        <div class="an-c"><p class="lsub">Con quién hablar</p><ul class="an-who">${CONTACTOS.map(([r2, d]) => `<li><b>${r2}</b><span>${d}</span></li>`).join("")}</ul></div>
        <div class="an-c"><p class="lsub">Riesgos y qué le devuelve al barrio</p><ul class="an-risk">${riesgos(p).map(x => `<li class="r">${x}</li>`).join("")}<li class="b">Responde a ${p.aportes} pedidos concretos y medibles en ATLAS.</li><li class="b">Seguimiento público de su impacto.</li></ul></div>
      </div>`;
    el.querySelector("[data-pdf]").onclick = () => pdf(p);
    const inv = el.querySelector("#an-inv"), dem = el.querySelector("#an-dem");
    const draw = () => {
      const I0 = +inv.value, dm = +dem.value / 100, yrs = c.ret * (I0 / mid) / dm, sv = el.querySelector("#an-svg"); A.clear(sv);
      el.querySelector("#an-invv").textContent = `USD ${A.fmt(I0)}k`; el.querySelector("#an-demv").textContent = `${dem.value}%`;
      const X = y => 20 + y / 8 * 270, Y = v => 110 - v / (I0 * 1.6) * 100;
      s("line", { x1: 20, x2: 290, y1: Y(0), y2: Y(0), stroke: "#111" }, sv);
      for (let y = 0; y <= 8; y += 2) s("text", { x: X(y), y: 132, "text-anchor": "middle", "font-size": 10, fill: "#77776f" }, sv, y ? y + " a" : "0");
      const pts = Array.from({ length: 41 }, (_, k) => { const y = k / 5; return [X(y), Y(-I0 + I0 / yrs * y)]; });
      s("path", { d: "M" + pts.map(q => q.map(v => v.toFixed(1)).join(" ")).join("L"), fill: "none", stroke: "#08b8f8", "stroke-width": 3 }, sv);
      if (yrs <= 8) { s("circle", { cx: X(yrs), cy: Y(0), r: 6, fill: "#f8e544", stroke: "#111", "stroke-width": 1.5 }, sv); s("text", { x: X(yrs), y: Y(0) - 12, "text-anchor": "middle", "font-size": 11, "font-weight": 600, fill: "#111" }, sv, "recupero"); }
      el.querySelector("#an-out").innerHTML = yrs <= 8 ? `Recuperás la inversión en <b>${yrs.toFixed(1).replace(".", ",")} años</b>.` : `Con esta demanda tarda más de 8 años: conviene ajustar el proyecto.`;
    };
    inv.oninput = dem.oninput = draw; draw();
  }
  const PASOS = ["Presentar la propuesta a la Junta Comunal 13 con este dossier.", "Validar el uso con el área de espacios verdes de la Ciudad.", "Firmar el convenio o la concesión que corresponda.", "Ejecutar la obra con seguimiento público en ATLAS.", "Operar y reportar el impacto: los aportes del barrio siguen midiendo."];
  const CONTACTOS = [["Junta Comunal 13", "Comisión de espacio público"], ["Gobierno de la Ciudad", "Área de espacios verdes"], ["Asociaciones vecinales", "Colegiales y alrededores"], ["Equipo ATLAS", "Validación y seguimiento"]];
  const riesgos = p => [p.tipo === "inmo" ? "Oposición vecinal a la altura o la densidad." : "Oposición vecinal si reduce superficie verde.", "Plazos de aprobación más largos de lo previsto.", p.v[0] === "cond" ? "Condiciones a cumplir antes de aprobar." : "Cambios de demanda: ATLAS te avisa si bajan los pedidos."];

  /* ---------- Chat libre ---------- */
  const SUGS = ["¿Qué oportunidad me conviene?", "¿Cuánto tengo que invertir?", "¿Cuánto vale el espacio?", "¿En cuánto recupero?", "¿Con quién hablo?", "¿Qué riesgos hay?", "Armame la presentación"];
  function chatInit() {
    const log = root.querySelector("#nt-log"); log.innerHTML = "";
    const p = focusP(), r = rubro();
    say(`Hola, ${r.emp}. Soy ATLAS Norte. Para ${r.n.toLowerCase()}, la oportunidad más relevante hoy es <b>${O().COST[p.tipo].proy}</b> (${p.rel}%). Preguntame lo que quieras.`, true);
    root.querySelector("#nt-sugs").innerHTML = SUGS.map(q => `<button class="chip" data-q="${q}">${q}</button>`).join("");
    root.querySelectorAll("[data-q]").forEach(b => b.onclick = () => ask(b.dataset.q));
  }
  function bubble(html, who) { const log = root.querySelector("#nt-log"); const d = h("div", { class: "nt-msg " + who }, log, who === "bot" ? `<span class="nt-av">${A.tri("#fff")}</span><div class="nt-b"></div>` : `<div class="nt-b">${html}</div>`); log.scrollTop = log.scrollHeight; return d; }
  function say(html, instant) {
    const d = bubble("", "bot"), b = d.querySelector(".nt-b"), log = root.querySelector("#nt-log");
    if (instant || A.reduced) { b.innerHTML = html; log.scrollTop = log.scrollHeight; return; }
    b.innerHTML = `<span class="nt-typing"><i></i><i></i><i></i></span>`;
    setTimeout(() => { b.innerHTML = html; b.classList.add("in"); log.scrollTop = log.scrollHeight; b.querySelectorAll("[data-pdf]").forEach(x => x.onclick = () => pdf(focusP())); b.querySelectorAll("[data-fo]").forEach(x => x.onclick = () => { st.focus = x.dataset.fo; refresh(); }); }, 650 + Math.min(900, html.length * 3));
  }
  function ask(q) {
    bubble(esc(q), "me");
    const t = q.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    // ¿cambia de tema?
    const TEM = [["gastro", "Gastronomía y servicios"], ["cafe", "Gastronomía y servicios"], ["bano", "Baños públicos y servicios básicos"], ["deport", "Infraestructura deportiva"], ["cancha", "Infraestructura deportiva"], ["cultur", "Actividades culturales y eventos"], ["evento", "Actividades culturales y eventos"], ["verde", "Mejora de espacios verdes y mobiliario"], ["sombra", "Mejora de espacios verdes y mobiliario"], ["vivienda", "Desarrollo inmobiliario"], ["inmobil", "Desarrollo inmobiliario"], ["accesib", "Accesibilidad y movilidad"], ["shopping", "Nuevos centros comerciales"], ["centro comercial", "Nuevos centros comerciales"]];
    const hit = TEM.find(([k]) => t.includes(k));
    if (hit && hit[1] === "Nuevos centros comerciales") return say(`Eso no se puede: dentro del predio no se permiten centros comerciales ni grandes superficies. Sin validación del sector público no armo propuestas. ¿Te muestro qué sí está validado?`);
    if (hit) { st.focus = hit[1]; refresh(); }
    const p = focusP(), { c, mid, partes, tasa } = analisis(p);
    let r;
    if (/conviene|recomend|mejor|que hay|oportunidad|opciones/.test(t) && !hit) {
      const R = ranking().slice(0, 3);
      r = `Estas son las tres más relevantes para vos:<ol class="nt-ol">${R.map(x => `<li><button class="linkbtn" data-fo="${esc(x.n)}">${O().COST[x.tipo].proy}</button> <b>${x.rel}%</b></li>`).join("")}</ol>La primera combina la mayor demanda de la gente con validación pública.`;
    } else if (/invert|cuesta|costo|presupuest|plata|dinero/.test(t)) {
      r = `Para <b>${c.proy}</b> la inversión va de <b>USD ${A.fmt(c.inv[0])}k a ${A.fmt(c.inv[1])}k</b>:<div class="an-stack sm">${partes.map(([n, k, col]) => `<i style="--w:${k * 100}%;--c:${col}"></i>`).join("")}</div><ul class="nt-ul">${partes.map(([n, k]) => `<li>${n}: USD ${A.fmt(Math.round(mid * k))}k</li>`).join("")}</ul>`;
    } else if (/vale|tasa|valor|m2|metro/.test(t)) {
      r = `${tasa.t}: <b>${tasa.v}</b>. Lo calculo así: ${tasa.d}.`;
    } else if (/recuper|retorno|gananc|rentab|cuando/.test(t)) {
      r = `Con la demanda actual recuperás la inversión en unos <b>${String(c.ret).replace(".", ",")} años</b>. Si los aportes siguen creciendo, baja. Podés probar escenarios en el análisis de arriba.`;
    } else if (/quien|contact|hablo|hablar|llamar/.test(t)) {
      r = `Te sugiero este orden:<ol class="nt-ol">${CONTACTOS.map(([a, b]) => `<li><b>${a}</b> · ${b}</li>`).join("")}</ol>`;
    } else if (/riesg|vecin|oposic|problema|peligro/.test(t)) {
      r = `Los riesgos principales:<ul class="nt-ul">${riesgos(p).map(x => `<li>${x}</li>`).join("")}</ul>Si aparecen reclamos nuevos, te aviso y actualizo el análisis.`;
    } else if (/paso|como empiezo|como hago|empez|arranc/.test(t)) {
      r = `Así lo haría:<ol class="nt-ol">${PASOS.map(x => `<li>${x}</li>`).join("")}</ol>`;
    } else if (/present|pdf|dossier|descarg|informe|armame/.test(t)) {
      r = `Listo. Armé el dossier de <b>${c.proy}</b> con tasación, presupuesto, pasos, contactos y riesgos.<br><button class="btn small" data-pdf>${A.tri("#fff")} Descargar PDF</button>`;
    } else if (/por que|porque/.test(t)) {
      r = `Porque coinciden las tres miradas: <b>${p.aportes} aportes</b> la piden, el sector público la marcó como <b>${O().VLAB[p.v[0]][0].toLowerCase()}</b> y tiene <b>${Math.round(p.pot * 100)}%</b> de potencial de desarrollo.`;
    } else if (/hola|buen|que tal/.test(t)) {
      r = `¡Hola! Puedo recomendarte oportunidades, tasarlas, presupuestarlas, estimar el retorno, decirte con quién hablar o armarte la presentación.`;
    } else if (hit) {
      r = `Cambié el foco a <b>${O().COST[p.tipo].proy}</b>: ${p.rel}% de relevancia para tu rubro, inversión de USD ${A.fmt(c.inv[0])}k a ${A.fmt(c.inv[1])}k. ¿Querés el presupuesto o la presentación?`;
    } else {
      r = `Sobre eso no tengo datos validados todavía. Puedo ayudarte con oportunidades, tasación, presupuesto, retorno, contactos, riesgos o la presentación en PDF.`;
    }
    say(r);
  }

  /* ---------- Dossier en PDF ---------- */
  function pdf(p) {
    const { c, mid, partes, tasa } = analisis(p), r = rubro(), P = A.PDF(), L = 50, Wd = 495;
    P.page();
    P.rect(0, 0, 595, 842, { fill: "#ffffff" });
    P.circle(470, 120, 62, { fill: "#c9b3ff" }); P.circle(520, 120, 62, { fill: "#8ff5c4" }); P.circle(495, 162, 62, { fill: "#8fdcfb" }); P.reuleaux(495, 138, 30);
    P.text(L, 70, "ATLAS NORTE", { size: 11, bold: true, color: "#555555" });
    P.text(L, 88, `Dossier para ${r.emp}`, { size: 11, color: "#555555" });
    let y = P.wrap(L, 260, c.proy, 380, { size: 30, bold: true, lh: 36 });
    y = P.wrap(L, y + 8, `${p.n} · Parque Ferroviario Colegiales · ${p.rel}% de relevancia para ${r.n.toLowerCase()}`, 420, { size: 12, color: "#444444" });
    P.rect(L, y + 18, 150, 26, { fill: "#f8e544" }); P.text(L + 12, y + 35, `${O().VLAB[p.v[0]][0]} por el sector público`, { size: 9.5, bold: true });
    // las tres miradas
    const yy = 520;
    [["Lo que se pide", `${p.aportes} aportes anónimos`, "#9b6cff"], ["Lo que se puede", O().VLAB[p.v[0]][0], "#00e887"], ["Lo que se sostiene", `${Math.round(p.pot * 100)}% de potencial`, "#08b8f8"]].forEach(([t, v, col], i) => {
      const x = L + i * 168; P.rect(x, yy, 158, 90, { fill: "#f4f4f1" }); P.rect(x, yy, 158, 5, { fill: col });
      P.text(x + 12, yy + 28, t, { size: 10, bold: true, color: "#555555" }); P.wrap(x + 12, yy + 52, v, 135, { size: 14, bold: true });
    });
    P.text(L, 800, "ATLAS · LAB VIII · Fuentes, Oro, Zita · Universidad Torcuato Di Tella", { size: 8, color: "#888888" });
    P.text(545, 800, "1", { size: 8, color: "#888888", align: "right" });
    // Página 2
    P.page();
    P.text(L, 60, "Tasación y presupuesto", { size: 20, bold: true });
    P.text(L, 92, tasa.t.toUpperCase(), { size: 8.5, bold: true, color: "#555555" });
    P.text(L, 122, tasa.v, { size: 26, bold: true }); P.wrap(L, 142, tasa.d, Wd, { size: 10, color: "#444444" });
    P.text(L, 186, "INVERSIÓN ESTIMADA", { size: 8.5, bold: true, color: "#555555" });
    P.text(L, 216, `USD ${A.fmt(c.inv[0])}k – ${A.fmt(c.inv[1])}k`, { size: 26, bold: true });
    let x0 = L; partes.forEach(([n, k, col]) => { P.rect(x0, 232, Wd * k, 16, { fill: col }); x0 += Wd * k; });
    let yb = 272; partes.forEach(([n, k, col]) => { P.rect(L, yb - 9, 10, 10, { fill: col }); P.text(L + 18, yb, n, { size: 10.5 }); P.text(L + Wd, yb, `USD ${A.fmt(Math.round(mid * k))}k`, { size: 10.5, bold: true, align: "right" }); P.line(L, yb + 7, L + Wd, yb + 7, { color: "#e6e6e2", lw: .6 }); yb += 22; });
    P.text(L, yb + 26, `Plazo de ejecución: ${c.plazo}`, { size: 11, bold: true }); P.text(L, yb + 44, `Recupero estimado: ${String(c.ret).replace(".", ",")} años con la demanda actual`, { size: 11, bold: true });
    P.text(L, yb + 90, "Por qué existe esta oportunidad", { size: 16, bold: true });
    let y2 = yb + 114;
    y2 = P.wrap(L, y2, `Ciudadanía: ${p.aportes} aportes y apoyos anónimos piden ${p.n.toLowerCase()}.`, Wd, { size: 11 });
    y2 = P.wrap(L, y2 + 4, `Sector público: ${p.v[1]}`, Wd, { size: 11 });
    y2 = P.wrap(L, y2 + 4, `Mercado: potencial de desarrollo del ${Math.round(p.pot * 100)}% y más de 80.000 vecinos en el área de influencia. El m² en pozo cotiza USD ${A.fmt(D.capas.censo.m2Pozo.valor)}.`, Wd, { size: 11 });
    P.text(L, 800, "ATLAS Norte · Dossier", { size: 8, color: "#888888" }); P.text(545, 800, "2", { size: 8, color: "#888888", align: "right" });
    // Página 3
    P.page();
    P.text(L, 60, "Cómo hacerlo", { size: 20, bold: true });
    let y3 = 92; PASOS.forEach((x, i) => { P.circle(L + 10, y3 - 4, 10, { fill: "#f8e544" }); P.text(L + 10, y3, String(i + 1), { size: 10, bold: true, align: "center" }); y3 = P.wrap(L + 30, y3, x, Wd - 30, { size: 11 }) + 10; });
    P.text(L, y3 + 20, "Con quién hablar", { size: 16, bold: true }); y3 += 46;
    CONTACTOS.forEach(([a, b]) => { P.text(L, y3, a, { size: 11, bold: true }); P.text(L + 180, y3, b, { size: 11, color: "#444444" }); y3 += 20; });
    P.text(L, y3 + 20, "Riesgos", { size: 16, bold: true }); y3 += 46;
    riesgos(p).forEach(x => { P.text(L, y3, "•", { size: 11 }); y3 = P.wrap(L + 14, y3, x, Wd - 14, { size: 11 }) + 4; });
    P.text(L, y3 + 20, "Qué le devuelve al barrio", { size: 16, bold: true }); y3 += 46;
    [`Responde a ${p.aportes} pedidos concretos y medibles en ATLAS.`, "Seguimiento público de su impacto: los aportes del barrio siguen midiendo."].forEach(x => { P.text(L, y3, "•", { size: 11 }); y3 = P.wrap(L + 14, y3, x, Wd - 14, { size: 11 }) + 4; });
    P.rect(L, 720, Wd, 54, { fill: "#f4f4f1" });
    P.wrap(L + 14, 742, "ATLAS Norte trabaja solo con oportunidades validadas por el sector público y con datos ciudadanos 100% anónimos. La oportunidad sigue siendo pública en ATLAS.", Wd - 28, { size: 9, color: "#444444" });
    P.text(L, 800, "ATLAS Norte · Dossier", { size: 8, color: "#888888" }); P.text(545, 800, "3", { size: 8, color: "#888888", align: "right" });
    P.save(`ATLAS-Norte-${c.proy.split(" ").slice(0, 3).join("-")}.pdf`);
  }

  function refresh(rechat) {
    root.querySelectorAll("[data-r]").forEach(b => b.classList.toggle("on", b.dataset.r === st.rubro));
    radar(); inbox(); analysis();
    if (rechat) chatInit();
  }

  function lock() {
    root.innerHTML = `<div class="nt-lock">
      <svg viewBox="0 0 200 180" aria-hidden="true"><circle cx="75" cy="70" r="52" fill="#9b6cff" opacity=".25"/><circle cx="125" cy="70" r="52" fill="#00e887" opacity=".25"/><circle cx="100" cy="112" r="52" fill="#08b8f8" opacity=".25"/><path d="${A.shape("reuleaux", 100, 88, 26)}" fill="#111"/></svg>
      <h1>ATLAS Norte</h1>
      <p>Es el servicio exclusivo para empresas del sector privado suscriptas. Las oportunidades siguen abiertas para todos en Explorar oportunidades.</p>
      <a class="btn" href="#oportunidades">Ver las oportunidades →</a></div>`;
    built = false;
  }

  A.norte = {
    show(sub) {
      if (!priv()) { lock(); return; }
      if (!built) { build(); }
      if (sub) { const n = decodeURIComponent(sub); const p = A.OPORT.puntos().find(x => x.n === n); if (p) { st.focus = n; const r = RUBROS.find(x => x.tipos.includes(p.tipo)); if (r) st.rubro = r.id; } }
      refresh(true); hero();
    },
    hide() { if (stopHero) { stopHero(); stopHero = null; } if (stopRadar) { stopRadar(); stopRadar = null; } }
  };
})(window.ATLAS);
