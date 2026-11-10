/* =========================================================================
   ATLAS · CAPAS DE INFORMACIÓN
   Cada capa = un capítulo del scroll + un "visual toy" propio.

   Estructura de una capa:
   {
     id, nombre, forma, color,
     titulo, texto, how,           // textos de la tarjeta
     build(toy, L),                // arma los controles dentro de la tarjeta (una vez)
     enter(L),                     // se activa: dibuja sobre el plano
     exit(L)                       // se desactiva (opcional)
   }
   L = utilidades de la capa activa: L.fx, L.under, L.overlay, L.on(...)
   ========================================================================= */
(function (A) {
  const s = A.s, h = A.h, CP = A.D.capas, C = A.C;
  const P = () => A.park;
  const hh = (n) => String(n).padStart(2, "0") + ":00";

  /* Arrastre genérico de un "dial" circular → valor 0..1 */
  function dialDrag(svgEl, cx, cy, onAngle) {
    const handle = (ev) => {
      const p = A.svgPoint(svgEl, ev);
      let a = Math.atan2(p.y - cy, p.x - cx) + Math.PI / 2;
      if (a < 0) a += Math.PI * 2;
      onAngle(a / (Math.PI * 2));
    };
    svgEl.addEventListener("pointerdown", ev => { svgEl.setPointerCapture(ev.pointerId); handle(ev); });
    svgEl.addEventListener("pointermove", ev => { if (svgEl.hasPointerCapture(ev.pointerId)) handle(ev); });
  }

  const layers = [];

  /* =====================================================================
     0 · EL PARQUE (presentación)
     ===================================================================== */
  layers.push({
    id: "parque", nombre: "Parque Ferroviario Colegiales", forma: "reuleaux", color: "#111",
    titulo: "Parque Ferroviario Colegiales",
    texto: A.D.parque.lectura,
    how: "Cada punto negro es una persona en el parque ahora (simulación en vivo). Las figuras de color son los sensores: pasá el cursor por ellas.",
    sensores: ["camara", "sonido", "movimiento"],
    build(toy) {
      const g = h("div", { class: "stats" }, toy);
      A.D.parque.datos.slice(0, 4).forEach(d => h("div", { class: "stat" }, g, `<b>${d.valor}</b><span>${d.label}</span><small>${d.fuente}</small>`));
      h("ul", { class: "sens-legend" }, toy, [["triangulo", A.C.acento, "Cámaras"], ["circulo", A.C.ciudadanos, "Sonido"], ["cuadrado", A.C.privado, "Movimiento"]]
        .map(([f, c, t]) => `<li>${A.icon(f, c)}${t}</li>`).join(""));
      h("p", { class: "small muted" }, toy, "Bajá para recorrer las capas, o elegí una con los íconos.");
    },
    enter(L) {
      const Z = Object.fromEntries(A.D.parque.zonas.map(z => [z.id, z]));
      L.sign(Z.lacroze.x, Z.lacroze.y - 30, "Etapa 1 · inaugurada 27/07/2024", A.C.acento, { dir: "n", len: 24 });
      L.sign(Z.jjpaso.x, Z.jjpaso.y - 24, "+250 árboles plantados", A.C.publico, { dir: "n", len: 24 });
    }
  });

  /* =====================================================================
     1 · SEGURIDAD — "la linterna"
     ===================================================================== */
  let segHour = new Date().getHours();
  layers.push({
    id: "seguridad", nombre: "Horarios de seguridad", forma: "triangulo", color: "#f8e544",
    titulo: "¿Cuándo se siente seguro?",
    texto: "La seguridad cambia con la hora: luz, cámaras, patrullas y cantidad de gente.",
    how: "Girá el reloj para cambiar la hora. Mové el cursor sobre el plano: es tu linterna.",
    sensores: ["camara"],
    view: [390, 178, 820, 224],
    build(toy, L) {
      const d = CP.seguridad;
      const sv = s("svg", { viewBox: "0 0 240 240", class: "dial" }, toy);
      const cx = 120, cy = 120;
      d.porHora.forEach((v, i) => {
        const a0 = (i / 24) * Math.PI * 2 - Math.PI / 2, a1 = ((i + 1) / 24) * Math.PI * 2 - Math.PI / 2 - .03;
        const r0 = 62, r1 = 62 + v * .42;
        const pt = (r, a) => `${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)}`;
        s("path", { d: `M${pt(r0, a0)}L${pt(r1, a0)}A${r1} ${r1} 0 0 1 ${pt(r1, a1)}L${pt(r0, a1)}A${r0} ${r0} 0 0 0 ${pt(r0, a0)}Z`, fill: `hsl(${v * 1.1},80%,58%)`, opacity: .85 }, sv);
      });
      [0, 6, 12, 18].forEach(n => {
        const a = (n / 24) * Math.PI * 2 - Math.PI / 2;
        s("text", { x: cx + 48 * Math.cos(a), y: cy + 48 * Math.sin(a) + 4, "text-anchor": "middle", "font-size": 10, fill: "#77776f", "font-family": "Inter Tight" }, sv, hh(n));
      });
      const hand = s("line", { x1: cx, y1: cy, stroke: "#111", "stroke-width": 2 }, sv);
      const knob = s("circle", { r: 9, fill: "#111", stroke: "#111", "stroke-width": 2 }, sv);
      const center = s("text", { x: cx, y: cy + 6, "text-anchor": "middle", "font-size": 18, fill: "#111", "font-family": "Inter Tight", "font-weight": 600 }, sv);
      const out = h("div", { class: "readout" }, toy);
      const meter = h("div", { class: "meter", style: "--c:#f8e544" }, toy, "<i></i>");
      h("p", { class: "src" }, toy, "Fuentes: La Nación, 27/07/2024 · índice de ejemplo");
      this.setHour = (hr) => {
        segHour = (Math.round(hr) + 24) % 24;
        const a = (segHour / 24) * Math.PI * 2 - Math.PI / 2;
        hand.setAttribute("x2", cx + 100 * Math.cos(a)); hand.setAttribute("y2", cy + 100 * Math.sin(a));
        knob.setAttribute("cx", cx + 108 * Math.cos(a)); knob.setAttribute("cy", cy + 108 * Math.sin(a));
        center.textContent = hh(segHour);
        const v = d.porHora[segHour];
        const fr = d.franjas.find(f => segHour >= f.desde && segHour < f.hasta);
        out.innerHTML = `Índice de seguridad percibida ${A.tag(false)}<br><b>${v}/100</b> · ${fr.label} · ${fr.camaras} cámaras · ${fr.patrullas} patrulla${fr.patrullas > 1 ? "s" : ""}`;
        meter.firstChild.style.width = v + "%";
        if (this.active) this.paint();
      };
      dialDrag(sv, cx, cy, t => { L.activate(this.id); this.setHour(t * 24); });
      this.setHour(segHour);
    },
    paint() {
      const v = CP.seguridad.porHora[segHour], dark = A.clamp(1 - v / 100) * .95;
      this.darkRect && this.darkRect.setAttribute("opacity", dark);
      this.leds && this.leds.setAttribute("opacity", A.clamp(dark * 1.4));
      const fr = CP.seguridad.franjas.find(f => segHour >= f.desde && segHour < f.hasta);
      this.patrols && this.patrols.forEach((p, i) => p.el.style.display = i < fr.patrullas ? "" : "none");
      P().crowd.set(CP.transito.semana[segHour]);
    },
    enter(L) {
      this.active = true;
      const fx = L.fx;
      const defs = s("defs", {}, fx);
      const grad = s("radialGradient", { id: "torch" }, defs);
      s("stop", { offset: "0", "stop-color": "#000" }, grad);
      s("stop", { offset: ".6", "stop-color": "#000" }, grad);
      s("stop", { offset: "1", "stop-color": "#fff" }, grad);
      const mask = s("mask", { id: "torch-mask", maskUnits: "userSpaceOnUse", x: -100, y: -100, width: 1800, height: 900 }, defs);
      s("rect", { x: -100, y: -100, width: 1800, height: 900, fill: "#fff" }, mask);
      const hole = s("circle", { cx: 700, cy: 290, r: 150, fill: "url(#torch)" }, mask);
      // LEDs a lo largo del sendero
      this.leds = s("g", {}, L.under);
      for (let t = 0; t <= 1; t += .035) {
        const g = A.parkGeom.mainPath; const i = Math.min(g.length - 2, Math.floor(t * (g.length - 1))); const k = t * (g.length - 1) - i;
        const x = A.lerp(g[i][0], g[i + 1][0], k), y = A.lerp(g[i][1], g[i + 1][1], k) - 14;
        s("circle", { cx: x, cy: y, r: 16, fill: "#f8e544", opacity: .12 }, this.leds);
        s("circle", { cx: x, cy: y, r: 2.5, fill: "#f8e544" }, this.leds);
      }
      this.darkRect = s("rect", { x: -100, y: -100, width: 1800, height: 900, fill: "#020208", mask: "url(#torch-mask)", style: "pointer-events:none" }, fx);
      s("circle", { cx: 0, cy: 0, r: 150, fill: "none", stroke: "#f8e544", "stroke-opacity": .35, "stroke-dasharray": "3 6", class: "torch-ring", style: "pointer-events:none" }, fx);
      // Patrullas
      this.patrols = [0, 1, 2].map(i => ({ t: i * .33, el: s("path", { d: A.shape("cuadrado", 0, 0, 7), fill: "#08b8f8", stroke: "#111", "stroke-width": 1.5 }, fx) }));
      L.loop(dt => this.patrols.forEach((p, i) => {
        p.t = (p.t + dt * .02 * (i % 2 ? -1 : 1) + 1) % 1;
        const g = A.parkGeom.mainPath; const j = Math.min(g.length - 2, Math.floor(p.t * (g.length - 1))); const k = p.t * (g.length - 1) - j;
        p.el.setAttribute("transform", `translate(${A.lerp(g[j][0], g[j + 1][0], k)} ${A.lerp(g[j][1], g[j + 1][1], k) + 18})`);
      }));
      // Conos de cámara más visibles
      P().sensorsG.querySelectorAll(".cone").forEach(c => c.setAttribute("fill-opacity", .22));
      const ring = fx.querySelector(".torch-ring");
      const move = ev => { const p = A.svgPoint(P().svg, ev); hole.setAttribute("cx", p.x); hole.setAttribute("cy", p.y); ring.setAttribute("cx", p.x); ring.setAttribute("cy", p.y); };
      L.on(P().stage, "pointermove", move);
      ring.setAttribute("cx", 700); ring.setAttribute("cy", 290);
      // Señalética: lo que dicen las fuentes, sobre el plano
      L.sign(300, 322, "Iluminación 100% LED", "#f8e544", { dir: "n", len: 40, sub: "real" });
      L.sign(1100, 255, "Plan Parques Seguros", "#f8e544", { dir: "n", len: 52, sub: "real" });
      L.sign(760, 360, "Zona más oscura", "#f8e544", { dir: "s", len: 34, sub: "borde de vías Palpa–Aguilar" });
      this.paint();
    },
    exit() {
      this.active = false;
      P().sensorsG.querySelectorAll(".cone").forEach(c => c.setAttribute("fill-opacity", .07));
    }
  });

  /* =====================================================================
     2 · TRÁNSITO — "el sol"
     ===================================================================== */
  layers.push({
    id: "transito", nombre: "Horarios más transitados", forma: "circulo", color: "#08b8f8",
    titulo: "¿Cuándo se llena?",
    texto: "Los sensores de movimiento cuentan cuántas personas hay en cada momento. Los picos cuentan la rutina del barrio.",
    how: "Arrastrá el sol por el cielo para mover la hora. Tocá una barra para saltar a esa hora.",
    sensores: ["movimiento"],
    view: [210, 130, 1100, 300],
    build(toy, L) {
      const self = this;
      this.mode = A.park.isWeekend() ? "finde" : "semana";
      this.hour = new Date().getHours();
      const chips = h("div", { class: "chips", style: "--c:#08b8f8" }, toy);
      ["semana", "finde"].forEach(m => {
        const b = h("button", { class: "chip" + (m === this.mode ? " on" : "") }, chips, m === "semana" ? "Lunes a viernes" : "Fin de semana");
        b.onclick = () => { L.activate(self.id); self.mode = m; chips.querySelectorAll(".chip").forEach(c => c.classList.toggle("on", c === b)); self.update(); };
      });
      const sv = s("svg", { viewBox: "0 0 300 130", class: "dial" }, toy);
      s("path", { d: "M20 120 A130 105 0 0 1 280 120", fill: "none", stroke: "#cfcfca", "stroke-dasharray": "2 5" }, sv);
      s("line", { x1: 10, y1: 120, x2: 290, y2: 120, stroke: "#cfcfca" }, sv);
      this.sun = s("g", {}, sv);
      s("circle", { r: 20, fill: "#08b8f8", opacity: .2 }, this.sun);
      this.sunCore = s("circle", { r: 11, fill: "#f8e544" }, this.sun);
      this.sunTxt = s("text", { x: 150, y: 112, "text-anchor": "middle", fill: "#111", "font-size": 22, "font-family": "Inter Tight", "font-weight": 600 }, sv);
      const drag = ev => {
        const p = A.svgPoint(sv, ev);
        const t = A.clamp((p.x - 20) / 260);
        L.activate(self.id); self.hour = Math.round(t * 23); self.update();
      };
      sv.addEventListener("pointerdown", ev => { sv.setPointerCapture(ev.pointerId); drag(ev); });
      sv.addEventListener("pointermove", ev => { if (sv.hasPointerCapture(ev.pointerId)) drag(ev); });
      this.bars = h("div", { class: "bars", style: "--c:#08b8f8" }, toy);
      for (let i = 0; i < 24; i++) {
        const b = h("i", { title: hh(i) }, this.bars);
        b.onclick = () => { L.activate(self.id); self.hour = i; self.update(); };
      }
      h("div", { class: "bars-axis" }, toy, "<span>00</span><span>06</span><span>12</span><span>18</span><span>23</span>");
      this.out = h("div", { class: "readout" }, toy);
      h("p", { class: "small muted" }, toy, `Conteos ${A.tag(false)} · reemplazar con datos de sensores de movimiento o wifi público.`);
      this.update();
    },
    update() {
      const arr = CP.transito[this.mode], v = arr[this.hour], max = Math.max(...arr);
      const t = this.hour / 23, a = Math.PI * (1 - t);
      this.sun.setAttribute("transform", `translate(${150 + 130 * Math.cos(a)} ${120 - 105 * Math.sin(a)})`);
      this.sunCore.setAttribute("fill", this.hour >= 7 && this.hour <= 19 ? "#f8e544" : "#c4b5f5");
      this.sunTxt.textContent = hh(this.hour);
      [...this.bars.children].forEach((b, i) => { b.style.height = (arr[i] / max * 100) + "%"; b.classList.toggle("on", i === this.hour); });
      const peak = arr.indexOf(max);
      this.out.innerHTML = `<b>${v}</b> personas en el parque · pico ${hh(peak)} (${max})`;
      if (this.active) {
        P().crowd.set(v); this.paintHeat(v / max);
        const t = this.signNow && this.signNow.querySelector("tspan");
        if (t) { this.signNow.remove(); this.signNow = A.layerManager.sign(1180, 330, `${hh(this.hour)} · ${v} personas`, "#08b8f8", { dir: "s", len: 0 }); }
      }
    },
    paintHeat(k) {
      if (!this.heat) return;
      this.heat.forEach((e, i) => e.setAttribute("opacity", (.08 + k * .35) * (i % 2 ? .7 : 1)));
    },
    enter(L) {
      this.active = true;
      this.heat = A.D.parque.zonas.filter(z => A.inPark(z.x, z.y)).map(z => s("ellipse", { cx: z.x, cy: z.y, rx: 70, ry: 30, fill: "#08b8f8", filter: "url(#glow)" }, L.under));
      this.signNow = L.sign(1180, 330, "", "#08b8f8", { dir: "s", len: 0 });
      this.update();
    },
    exit() { this.active = false; }
  });

  /* =====================================================================
     3 · PERSONAS — "el clasificador"
     ===================================================================== */
  const PAL = ["#9b6cff", "#08b8f8", "#00e887", "#f8e544", "#ff8a3d"];
  layers.push({
    id: "personas", nombre: "Quiénes están", forma: "hexagono", color: "#9b6cff",
    titulo: "¿Quiénes usan el parque?",
    texto: "Rango etario, género, si van con mascota o acompañadas. Cada figura es el 1% de las personas.",
    how: "Elegí cómo agrupar: las 100 figuras se reordenan y el plano se colorea igual.",
    sensores: [],
    view: [250, 163, 900, 244],
    build(toy, L) {
      const self = this;
      this.dim = "edad";
      const dims = { edad: "Edad", genero: "Género", mascota: "Mascotas", compania: "Compañía" };
      const chips = h("div", { class: "chips", style: "--c:#9b6cff" }, toy);
      Object.entries(dims).forEach(([k, lab]) => {
        const b = h("button", { class: "chip" + (k === this.dim ? " on" : "") }, chips, lab);
        b.onclick = () => { L.activate(self.id); self.dim = k; chips.querySelectorAll(".chip").forEach(c => c.classList.toggle("on", c === b)); self.sort(); };
      });
      this.sv = s("svg", { viewBox: "0 0 320 210" }, toy);
      this.dots = [];
      const shapes = ["circulo", "triangulo", "cuadrado", "hexagono", "rombo"];
      for (let i = 0; i < 100; i++) {
        const e = s("path", { d: A.shape(shapes[i % 5], 0, 0, 4.2), style: "transition:transform .9s cubic-bezier(.2,1.3,.4,1), fill .6s" }, this.sv);
        e.style.transitionDelay = (i * 6) + "ms";
        this.dots.push(e);
      }
      this.lbls = s("g", { "font-family": "Inter Tight", "font-size": 9.5, fill: "#77776f", "text-anchor": "middle" }, this.sv);
      h("p", { class: "small muted" }, toy, `Distribuciones ${A.tag(false)} · reemplazar con conteos por cámara (sin identificar personas) y encuestas.`);
      this.sort();
    },
    sort() {
      const dist = CP.personas[this.dim], keys = Object.keys(dist), n = keys.length;
      A.clear(this.lbls);
      let idx = 0;
      keys.forEach((k, gi) => {
        const cx = 320 / (n + 1) * (gi + 1), cy = 82, cnt = Math.round(dist[k]);
        for (let j = 0; j < cnt && idx < 100; j++, idx++) {
          const ang = j * 2.4, rad = 5.6 * Math.sqrt(j);
          this.dots[idx].style.transform = `translate(${cx + rad * Math.cos(ang)}px, ${cy + rad * Math.sin(ang)}px)`;
          this.dots[idx].setAttribute("fill", PAL[gi]);
        }
        const words = k.split(" ");
        s("text", { x: cx, y: 172, fill: PAL[gi], "font-size": 18, "font-family": "Inter Tight", "font-weight": 600 }, this.lbls, dist[k] + "%");
        s("text", { x: cx, y: 188 }, this.lbls, words.slice(0, 2).join(" "));
        if (words.length > 2) s("text", { x: cx, y: 200 }, this.lbls, words.slice(2).join(" "));
      });
      for (; idx < 100; idx++) this.dots[idx].style.transform = "translate(160px, 82px)";
      if (this.active) this.colorMap();
    },
    colorMap() {
      const keys = Object.keys(CP.personas[this.dim]);
      const prop = { edad: "edad", genero: "genero", mascota: "mascota" }[this.dim];
      P().crowd.colorFn = (p, isDog) => {
        if (!prop) return PAL[(p.x | 0) % 4];
        if (prop === "mascota") return p.mascota ? PAL[0] : (isDog ? PAL[0] : "#cfcfca");
        return PAL[keys.indexOf(p[prop])] || "#111";
      };
    },
    enter() { this.active = true; this.colorMap(); },
    exit() { this.active = false; }
  });

  /* =====================================================================
     4 · RUIDO — "el micrófono"
     ===================================================================== */
  layers.push({
    id: "ruido", nombre: "Lugares más ruidosos", forma: "pentagono", color: "#ff5a4e",
    titulo: "¿Dónde hace ruido?",
    texto: "Los sensores de sonido miden decibeles. Cuanto más grande la onda, más fuerte el sonido.",
    how: "Pasá el cursor por el plano: medís los dB en ese punto. Prendé el micrófono y sumá tu propio ruido.",
    sensores: ["sonido"],
    view: [20, 170, 1000, 290],
    build(toy, L) {
      const self = this;
      const fu = [...CP.ruido.fuentes].sort((a, b) => b.db - a.db);
      h("p", { class: "readout" }, toy, `Lo más fuerte: <b>${fu[0].db} dB</b> · ${fu[0].nombre}. Lo más calmo: ${fu[fu.length - 1].db} dB · ${fu[fu.length - 1].nombre.replace(" (calmo)", "")}.`);
      this.micBtn = h("button", { class: "btn mic" }, toy, `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg><span>Sumá tu ruido</span>`);
      this.micOut = h("div", { class: "readout" }, toy, "");
      this.micBtn.onclick = () => { L.activate(self.id); self.toggleMic(); };
      h("p", { class: "small muted" }, toy, `Niveles ${A.tag(false)} · el micrófono funciona con Live Server (localhost) o https. No se graba nada.`);
    },
    async toggleMic() {
      if (this.stream) { this.stopMic(); return; }
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const src = ctx.createMediaStreamSource(this.stream);
        this.an = ctx.createAnalyser(); this.an.fftSize = 1024; src.connect(this.an);
        this.audioCtx = ctx; this.buf = new Float32Array(this.an.fftSize);
        this.micBtn.querySelector("span").textContent = "Apagar micrófono"; this.micBtn.classList.add("on");
      } catch (e) {
        this.micOut.innerHTML = "No pude acceder al micrófono. Abrí el sitio con Live Server y aceptá el permiso.";
      }
    },
    stopMic() {
      if (this.stream) this.stream.getTracks().forEach(t => t.stop());
      if (this.audioCtx) this.audioCtx.close();
      this.stream = null; this.an = null;
      this.micBtn.querySelector("span").textContent = "Sumá tu ruido"; this.micBtn.classList.remove("on");
      this.micOut.textContent = "";
    },
    enter(L) {
      this.active = true;
      const fx = L.fx;
      CP.ruido.fuentes.forEach((f, i) => {
        const rings = Math.max(1, Math.round((f.db - 40) / 10));
        for (let k = 0; k < rings; k++) {
          const c = s("circle", { cx: f.x, cy: f.y, r: 4, stroke: "#ff5a4e", "stroke-width": 1.5, class: "ripple" }, L.under);
          c.style.animationDelay = (k * 2.6 / rings + i * .3) + "s";
          c.style.animationDuration = (2.6 * 82 / f.db) + "s";
        }
        L.sign(f.x, f.y, `${f.db} dB`, "#ff5a4e", { dir: i % 2 ? "s" : "n", len: 26, sub: f.nombre.replace(" (FFCC Mitre)", "").replace(" (calmo)", " · calmo") });
      });
      // Medidor que sigue al cursor
      const probe = s("g", { style: "pointer-events:none", opacity: 0 }, fx);
      const pc = s("circle", { r: 34, fill: "#fff", stroke: "#ff5a4e", "stroke-width": 2 }, probe);
      const pt = s("text", { "text-anchor": "middle", y: 7, fill: "#111", "font-size": 20, "font-family": "Inter Tight", "font-weight": 600 }, probe);
      s("text", { "text-anchor": "middle", y: 22, fill: "#77776f", "font-size": 9, "font-family": "Inter Tight" }, probe, "dB");
      this.you = { x: 760, y: 290 };
      L.on(P().stage, "pointermove", ev => {
        const p = A.svgPoint(P().svg, ev);
        const db = P().noiseAt(p.x, p.y);
        probe.setAttribute("opacity", 1);
        probe.setAttribute("transform", `translate(${p.x} ${p.y - 50})`);
        pt.textContent = Math.round(db);
        pc.setAttribute("r", 24 + (db - 40) * .6);
      });
      L.on(P().stage, "click", ev => { const p = A.svgPoint(P().svg, ev); this.you = { x: p.x, y: p.y }; });
      // Tu ruido
      let acc = 0;
      L.loop(dt => {
        if (!this.an) return;
        this.an.getFloatTimeDomainData(this.buf);
        let sum = 0; for (let i = 0; i < this.buf.length; i++) sum += this.buf[i] * this.buf[i];
        const db = A.clamp(20 * Math.log10(Math.sqrt(sum / this.buf.length) + 1e-6) + 100, 30, 110);
        this.micOut.innerHTML = `Tu ruido: <b>${Math.round(db)}</b> dB · clic en el plano para ubicarte`;
        acc += dt;
        if (acc > .25 && db > 45) {
          acc = 0;
          const r = s("circle", { cx: this.you.x, cy: this.you.y, r: 4, fill: "none", stroke: "#f8e544", "stroke-width": 1 + (db - 45) / 10 }, fx);
          const t0 = performance.now(), max = (db - 40) * 3;
          const stop = L.loop(() => {
            const k = (performance.now() - t0) / 1600;
            r.setAttribute("r", 4 + k * max); r.setAttribute("opacity", 1 - k);
            if (k >= 1) { r.remove(); stop(); }
          });
        }
      });
    },
    exit() { this.active = false; this.stopMic(); }
  });

  /* =====================================================================
     5 · PROYECTOS — "la obra"
     ===================================================================== */
  const ACT = { publico: ["Sector público", "#00e887"], privado: ["Sector privado", "#08b8f8"], ciudadanos: ["Ciudadanos", "#9b6cff"] };
  layers.push({
    id: "proyectos", nombre: "Proyectos en desarrollo", forma: "cuadrado", color: "#00e887",
    titulo: "¿Qué se está construyendo?",
    texto: "Obras en curso y propuestas sobre el parque y sus bordes, según quién las impulsa.",
    how: "Pasá el cursor por los lotes: se levantan según su avance. Tocá uno para ver el detalle.",
    sensores: [],
    view: [90, 130, 1160, 340],
    build(toy, L) {
      const self = this;
      this.filter = null;
      const chips = h("div", { class: "chips" }, toy);
      Object.entries(ACT).forEach(([k, [lab, col]]) => {
        const b = h("button", { class: "chip", style: `--c:${col}` }, chips, `<span class="hl" style="--c:${col}">■</span> ${lab}`);
        b.onclick = () => { L.activate(self.id); self.filter = self.filter === k ? null : k; chips.querySelectorAll(".chip").forEach(c => c.classList.toggle("on", c === b && self.filter)); self.applyFilter(); };
      });
      this.detail = h("div", { class: "detail" }, toy, "Tocá un lote del plano para ver quién lo impulsa y cuánto avanzó.");
      h("p", { class: "src" }, toy, `${CP.proyectos.length} proyectos · ${CP.proyectos.filter(p => p.real).length} con fuente verificada`);
    },
    show(p) {
      this.detail.innerHTML = `<b>${p.nombre}</b> ${A.tag(p.real)}<br><span class="hl" style="--c:${ACT[p.actor][1]}">${ACT[p.actor][0]}</span> · ${p.estado} · ${p.progreso}% · ${p.dato}<br>${p.desc}${A.src(p)}`;
      if (this.items) this.items.forEach(it => it.g.classList.toggle("sel", it.p === p));
      if (this.items) this.items.forEach(it => this.grow(it, it.p === p));
    },
    grow(it, on) {
      const hgt = on ? 20 + it.p.progreso * 1.2 : 0;
      it.tower.style.transform = `scaleY(${hgt / 140})`;
      it.label.classList.toggle("on", on);
    },
    applyFilter() { this.items && this.items.forEach(it => it.g.style.opacity = !this.filter || it.p.actor === this.filter ? 1 : .12); },
    enter(L) {
      this.active = true;
      this.items = CP.proyectos.map(p => {
        const col = ACT[p.actor][1];
        const g = s("g", { style: "cursor:pointer" }, L.fx);
        s("rect", { x: p.x, y: p.y, width: p.w, height: p.h, fill: col, "fill-opacity": .12, stroke: col, "stroke-width": 1.5, "stroke-dasharray": p.estado === "Propuesta" ? "5 4" : "none", transform: `rotate(-3 ${p.x} ${p.y})` }, g);
        // Torre: bloques apilados que crecen desde la base del lote
        const tower = s("g", { style: `transform-box:fill-box;transform-origin:bottom;transform:scaleY(0);transition:transform .7s cubic-bezier(.2,1.4,.4,1)` }, g);
        const bw = Math.min(p.w, 60);
        for (let k = 0; k < 7; k++) s("rect", { x: p.x + p.w / 2 - bw / 2, y: p.y + p.h / 2 - 20 * (k + 1), width: bw, height: 18, fill: col, "fill-opacity": .25 + k * .08, stroke: col }, tower);
        const label = A.sign(g, p.x + p.w / 2, p.y, `${p.progreso}%`, col, { dir: "n", len: 10, sub: p.nombre, cls: "hover-only" });
        g.setAttribute("data-nopan", "");
        const it = { p, g, tower, label };
        g.addEventListener("pointerenter", () => this.grow(it, true));
        g.addEventListener("pointerleave", () => { if (!g.classList.contains("sel")) this.grow(it, false); });
        g.addEventListener("click", () => this.show(p));
        return it;
      });
      this.applyFilter();
    },
    exit() { this.active = false; this.items = null; }
  });

  /* =====================================================================
     6 · EVENTOS — "la línea de tiempo"
     ===================================================================== */
  const EVT = { feria: ["Ferias", "cuadrado", "#e07ab5"], concierto: ["Conciertos", "circulo", "#f8e544"], encuentro: ["Encuentros", "triangulo", "#00e887"], manifestacion: ["Manifestaciones", "rombo", "#ff5a4e"] };
  const day = (s) => new Date(s + "T12:00:00").getTime() / 864e5;
  layers.push({
    id: "eventos", nombre: "Eventos", forma: "rombo", color: "#e07ab5",
    titulo: "¿Qué pasó y qué va a pasar?",
    texto: "El parque también es un calendario.",
    how: "Arrastrá el cursor por la línea de tiempo: a la izquierda de HOY, lo que pasó; a la derecha, lo que viene.",
    sensores: [],
    build(toy, L) {
      const self = this, ev = CP.eventos;
      this.d0 = day(ev[0].fecha) - 40; this.d1 = day(ev[ev.length - 1].fecha) + 40;
      this.today = Math.floor(Date.now() / 864e5); this.cur = this.today;
      this.types = new Set(Object.keys(EVT));
      const chips = h("div", { class: "chips" }, toy);
      Object.entries(EVT).forEach(([k, [lab, f, col]]) => {
        const b = h("button", { class: "chip on", style: `--c:${col}` }, chips, A.icon(f, col) + lab);
        b.onclick = () => { L.activate(self.id); self.types.has(k) ? self.types.delete(k) : self.types.add(k); b.classList.toggle("on"); self.drawLine(); self.update(); };
      });
      // Línea de tiempo explícita: pasado | HOY | futuro, con años y un cursor que se arrastra
      this.sv = s("svg", { viewBox: "0 0 340 100", class: "tline", tabindex: 0, role: "slider", "aria-label": "Línea de tiempo" }, toy);
      const X = d => 14 + (d - this.d0) / (this.d1 - this.d0) * 312;
      this.X = X;
      const drag = ev => { const p = A.svgPoint(this.sv, ev); this.cur = Math.round(this.d0 + A.clamp((p.x - 14) / 312) * (this.d1 - this.d0)); L.activate(self.id); this.update(); };
      this.sv.addEventListener("pointerdown", ev => { this.sv.setPointerCapture(ev.pointerId); drag(ev); });
      this.sv.addEventListener("pointermove", ev => { if (this.sv.hasPointerCapture(ev.pointerId)) drag(ev); });
      this.sv.addEventListener("keydown", ev => { if (ev.key === "ArrowLeft" || ev.key === "ArrowRight") { ev.preventDefault(); this.cur += ev.key === "ArrowLeft" ? -20 : 20; this.cur = A.clamp(this.cur, this.d0, this.d1); L.activate(self.id); this.update(); } });
      this.drawLine();
      this.out = h("div", { class: "readout" }, toy);
      this.update();
    },
    drawLine() {
      const sv = this.sv, X = this.X; A.clear(sv);
      const tx = X(this.today);
      s("rect", { x: tx, y: 30, width: 326 - tx, height: 40, fill: "#e07ab5", opacity: .1 }, sv);
      s("text", { x: 14, y: 9, class: "tl-k" }, sv, "← QUÉ PASÓ");
      s("text", { x: 326, y: 9, "text-anchor": "end", class: "tl-k" }, sv, "QUÉ VA A PASAR →");
      s("line", { x1: 14, y1: 50, x2: 326, y2: 50, stroke: "#111", "stroke-width": 1.2 }, sv);
      for (let y = 2024; y <= 2027; y++) {
        const d = day(`${y}-01-01`); if (d < this.d0 || d > this.d1) continue;
        s("line", { x1: X(d), y1: 46, x2: X(d), y2: 54, stroke: "#111" }, sv);
        s("text", { x: X(d), y: 84, "text-anchor": "middle", class: "tl-y" }, sv, y);
      }
      s("line", { x1: tx, y1: 30, x2: tx, y2: 70, stroke: "#111", "stroke-dasharray": "2 3" }, sv);
      s("text", { x: tx, y: 96, "text-anchor": "middle", class: "tl-k" }, sv, "HOY");
      CP.eventos.forEach(e => {
        if (!this.types.has(e.tipo)) return;
        const past = day(e.fecha) < this.today, col = EVT[e.tipo][2];
        s("path", { d: A.shape(EVT[e.tipo][1], X(day(e.fecha)), 50, 5), fill: past ? col : "#fff", stroke: past ? "#111" : col, "stroke-width": 1.4 }, sv);
      });
      this.cursor = s("g", {}, sv);
      s("rect", { x: -1, y: 30, width: 2, height: 40, fill: "#111" }, this.cursor);
      s("circle", { cx: 0, cy: 50, r: 7, fill: "#111", stroke: "#fff", "stroke-width": 2 }, this.cursor);
      this.curLbl = s("text", { x: 0, y: 26, "text-anchor": "middle", class: "tl-c" }, this.cursor);
    },
    update() {
      const cur = this.cur, date = new Date(cur * 864e5), W = 120;
      this.cursor.setAttribute("transform", `translate(${this.X(cur).toFixed(1)} 0)`);
      this.curLbl.textContent = date.toLocaleDateString("es-AR", { month: "short", year: "numeric" });
      this.curLbl.setAttribute("text-anchor", this.X(cur) < 50 ? "start" : this.X(cur) > 290 ? "end" : "middle");
      const near = CP.eventos.filter(e => this.types.has(e.tipo) && Math.abs(day(e.fecha) - cur) <= W).sort((a, b) => day(a.fecha) - day(b.fecha));
      this.out.innerHTML = near.length
        ? near.slice(0, 3).map(e => `<span class="ev-row"><i style="background:${EVT[e.tipo][2]}"></i><b>${e.fecha.split("-").reverse().join("/")}</b> ${e.titulo} <em>${day(e.fecha) < this.today ? "pasó" : "va a pasar"}</em></span>`).join("")
        : `<span class="muted">Nada en estas fechas. Mové el cursor.</span>`;
      if (this.items) this.items.forEach(it => {
        const dd = Math.abs(day(it.e.fecha) - cur), k = this.types.has(it.e.tipo) ? A.clamp(1 - dd / (W * 1.4)) : 0;
        it.g.setAttribute("transform", `translate(${it.e.x} ${it.e.y}) scale(${k.toFixed(3)})`);
        it.shape.setAttribute("fill-opacity", day(it.e.fecha) < this.today ? .9 : .25);
        it.txt.classList.toggle("on", dd <= W && this.types.has(it.e.tipo));
      });
    },
    enter(L) {
      this.active = true;
      this.items = CP.eventos.map(e => {
        const g = s("g", {}, L.fx), col = EVT[e.tipo][2];
        s("circle", { r: 30, fill: col, opacity: .16, class: "pulse" }, g);
        const shape = s("path", { d: A.shape(EVT[e.tipo][1], 0, 0, 14), fill: col, stroke: "#111", "stroke-width": 1.2, "vector-effect": "non-scaling-stroke" }, g);
        const short = e.titulo.length > 34 ? e.titulo.slice(0, 32).trim() + "…" : e.titulo;
        const txt = A.sign(L.fx, e.x, e.y - 16, short, col, { dir: "n", len: 18, sub: e.fecha.slice(0, 4), cls: "hover-only" });
        return { e, g, shape, txt };
      });
      this.update();
    },
    exit() { this.active = false; this.items = null; }
  });

  /* =====================================================================
     7 · NOTICIAS — un hilo de noticias sobre el plano
     ===================================================================== */
  const NT = { seguridad: ["Seguridad", "#ff5a4e"], innovacion: ["Innovación", "#00e887"], urbanismo: ["Urbanismo", "#08b8f8"] };
  const fechaN = n => { const m = /(\d+)\/(\d+)\/(\d+)/.exec(n.fecha); return m ? +new Date(+m[3], +m[2] - 1, +m[1]) : 9e15; };
  const NEWS = [...CP.noticias].sort((a, b) => fechaN(a) - fechaN(b));
  layers.push({
    id: "noticias", nombre: "Noticias", forma: "cuadrado", color: "#111",
    titulo: "¿Qué se dijo del parque?",
    texto: "Cada noticia está atada al lugar del que habla.",
    how: "El hilo une las noticias en orden. Tocá una para ir hasta ese lugar.",
    sensores: [],
    build(toy, L) {
      const self = this;
      this.list = h("ol", { class: "news" }, toy);
      NEWS.forEach((n, i) => {
        const li = h("li", { style: `--c:${NT[n.tipo][1]}` }, this.list,
          `<button><span class="nw-m">${n.medio} · ${n.fecha === "ejemplo" ? "ejemplo" : n.fecha}</span><span class="nw-t">${n.titulo}</span></button>${n.url ? `<a href="${n.url}" target="_blank" rel="noopener">Leer ↗</a>` : ""}`);
        li.querySelector("button").onclick = () => { L.activate(self.id); self.manual = true; self.go(i); };
      });
      h("p", { class: "src" }, toy, `${NEWS.filter(n => n.real).length} notas con fuente · el resto ${A.tag(false)}`);
    },
    go(i) {
      this.i = i; const n = NEWS[i]; if (!this.fxG) return;
      this.list.querySelectorAll("li").forEach((li, k) => li.classList.toggle("on", k === i));
      A.clear(this.callG);
      const col = NT[n.tipo][1];
      s("circle", { cx: n.x, cy: n.y, r: 26, fill: col, opacity: .18, class: "pulse" }, this.callG);
      const t = n.titulo.length > 64 ? n.titulo.slice(0, 62).trim() + "…" : n.titulo;
      A.sign(this.callG, n.x, n.y, t, col, { dir: n.y > 280 ? "s" : "n", len: 54, forma: "cuadrado", cls: "callout" });
      if (!A.sm) P().cam.focus(A.clamp(n.x, 420, 1180), 290, 860, 900);
      else P().cam.focus(n.x, n.y, 560, 900);
    },
    enter(L) {
      this.active = true; this.manual = false;
      this.fxG = s("g", {}, L.fx);
      // Hilo: une las noticias en orden de fecha
      s("path", { d: "M" + NEWS.map(n => `${n.x} ${n.y}`).join("L"), fill: "none", stroke: "#111", "stroke-width": 1.4, "stroke-dasharray": "2 6", "stroke-linecap": "round", "vector-effect": "non-scaling-stroke", opacity: .6 }, this.fxG);
      NEWS.forEach((n, i) => {
        const g = s("g", { transform: `translate(${n.x} ${n.y})`, "data-nopan": "", style: "cursor:pointer" }, this.fxG);
        const k = s("g", { class: "k" }, g);
        s("rect", { x: -9, y: -9, width: 18, height: 18, rx: 3, fill: NT[n.tipo][1], stroke: "#111", "stroke-width": 1.4 }, k);
        s("text", { x: 0, y: 4, "text-anchor": "middle", class: "nw-n" }, k, i + 1);
        g.addEventListener("click", ev => { ev.stopPropagation(); this.manual = true; this.go(i); });
      });
      this.callG = s("g", {}, L.fx);
      this.go(0);
      // Si nadie toca nada, el hilo avanza solo
      let acc = 0;
      L.loop(dt => { if (this.manual) return; acc += dt; if (acc > 5) { acc = 0; this.go((this.i + 1) % NEWS.length); } });
    },
    exit() { this.active = false; this.fxG = null; }
  });

  /* =====================================================================
     8 · QUÉ DICE LA GENTE · Y VOS — cierre: toda la participación acá
     Lo que se publica alimenta "Explorar oportunidades".
     ===================================================================== */
  const VT = { queja: ["Quejas", "#ff8a7a"], recomendacion: ["Recomendaciones", "#00e887"], pedido: ["Pedidos", "#f8e544"] };
  layers.push({
    id: "voces", nombre: "Qué dice la gente", forma: "circulo", color: "#c4b5f5",
    titulo: "¿Qué dice la gente?",
    texto: "Lo que más se repite en el barrio. Tocá una pelota para sumarte.",
    how: "Cada «me sumo» es anónimo y empuja esa oportunidad hacia arriba.",
    sensores: [],
    build(toy, L) {
      this.cloud = h("div", { class: "vballs" }, toy);
      this.renderCloud();
      h("a", { class: "sv-cta", href: "#recorrido/suma-voz" }, toy, `<span>¿Y vos?</span><b>Sumá tu voz</b><i>↓</i>`);
    },
    words() {
      const plus = A.store.get("voces+", {});
      return CP.voces.palabras.map(w => ({ ...w, n: w.n + (plus[w.t] || 0), mio: plus[w.t] || 0 })).sort((a, b) => b.n - a.n).slice(0, 9);
    },
    renderCloud(hit) {
      const W = this.words(), max = W[0].n;
      this.cloud.innerHTML = W.map((w, i) => `<button class="vball${w.mio ? " mio" : ""}${hit === w.t ? " hit" : ""}" style="--c:${VT[w.tipo][1]};--s:${(54 + w.n / max * 64).toFixed(0)}px;--d:${(i * .37).toFixed(2)}s" data-w="${w.t}" aria-label="${w.t}: ${w.n}. Me sumo"><span>${w.t}</span><b>${w.n}</b></button>`).join("")
        + `<p class="vball-k">${Object.entries(VT).map(([k, v]) => `<span><i style="--c:${v[1]}"></i>${v[0]}</span>`).join("")}</p>`;
      this.cloud.querySelectorAll("[data-w]").forEach(b => b.onclick = () => {
        const plus = A.store.get("voces+", {}); plus[b.dataset.w] = (plus[b.dataset.w] || 0) + 1; A.store.set("voces+", plus);
        A.aportes.sumar(A.temaDe(b.dataset.w)); A.layerManager.activate(this.id); this.renderCloud(b.dataset.w);
      });
    },
    drawPins() {
      A.clear(this.pinsG); A.clear(this.zoneG);
      const all = A.aportes.todos().filter(a => !a.envivo);
      all.forEach(a => {
        const ac = A.accion(a.accion);
        const g = s("g", { transform: `translate(${a.x.toFixed(1)} ${a.y.toFixed(1)})`, class: "vpin" + (a.mio ? " mio" : "") }, this.pinsG);
        const k = s("g", { class: "k" }, g);
        s("line", { x1: 0, y1: 0, x2: 0, y2: -12, stroke: "#111", "stroke-width": 1.2 }, k);
        s("path", { d: A.shape(ac.forma, 0, -18, a.mio ? 8 : 6), fill: ac.color, stroke: "#111", "stroke-width": a.mio ? 1.6 : 1 }, k);
        s("title", {}, g, `${ac.nombre} · ${a.zona}: ${a.texto}`);
      });
      // Señalética: lo más pedido en cada zona
      const byZ = {};
      all.forEach(a => { (byZ[a.zona] = byZ[a.zona] || []).push(a); });
      Object.entries(byZ).sort((a, b) => b[1].length - a[1].length).slice(0, 4).forEach(([zn, arr], i) => {
        const z = A.D.parque.zonas.find(x => x.nombre === zn); if (!z) return;
        const tc = {}; arr.forEach(a => tc[a.tema] = (tc[a.tema] || 0) + 1);
        const top = Object.entries(tc).sort((a, b) => b[1] - a[1])[0][0];
        A.sign(this.zoneG, z.x, z.y - 30, `«${top.split(" y ")[0]}»`, "#c4b5f5", { dir: i % 2 ? "s" : "n", len: 30, sub: `${arr.length} voces · ${z.corto}` });
      });
    },
    enter(L) {
      this.active = true;
      this.zoneG = s("g", {}, L.fx);
      this.pinsG = s("g", {}, L.fx);
      this.drawPins();
      this.off = A.aportes.on(() => { if (this.active) this.drawPins(); });
    },
    exit() { this.active = false; this.off && this.off(); }
  });

  /* =====================================================================
     9 · RESTRICCIONES — "intentá construir"
     ===================================================================== */
  layers.push({
    id: "restricciones", nombre: "Restricciones", forma: "triangulo", color: "#ff8a3d",
    titulo: "¿Qué se puede hacer acá?",
    texto: "Normas patrimoniales, arquitectónicas y ambientales. Lo que el plano no muestra, pero define el territorio.",
    how: "Elegí dónde y qué querés construir, y subí los pisos. El parque te responde.",
    sensores: [],
    view: [90, 140, 1000, 360],
    build(toy, L) {
      const self = this, R = CP.restricciones;
      this.lugar = R.lugares[0]; this.uso = R.usos[0]; this.pisos = 4;
      const c1 = h("div", { class: "chips", style: "--c:#ff8a3d" }, toy);
      R.lugares.forEach((l, i) => { const b = h("button", { class: "chip" + (i ? "" : " on") }, c1, l.nombre); b.onclick = () => { L.activate(self.id); self.lugar = l; c1.querySelectorAll(".chip").forEach(c => c.classList.toggle("on", c === b)); self.update(); }; });
      const c2 = h("div", { class: "chips", style: "--c:#ff8a3d" }, toy);
      R.usos.forEach((u, i) => { const b = h("button", { class: "chip" + (i ? "" : " on") }, c2, u.nombre); b.onclick = () => { L.activate(self.id); self.uso = u; c2.querySelectorAll(".chip").forEach(c => c.classList.toggle("on", c === b)); self.update(); }; });
      this.sv = s("svg", { viewBox: "0 0 320 170" }, toy);
      s("line", { x1: 0, y1: 150, x2: 320, y2: 150, stroke: "#77776f" }, this.sv);
      [[10, 7], [52, 9], [210, 8], [252, 10], [292, 6]].forEach(([x, p]) => s("rect", { x, y: 150 - p * 11, width: 36, height: p * 11, fill: "none", stroke: "#cfcfca", "stroke-dasharray": "2 3" }, this.sv));
      this.limit = s("line", { x1: 0, x2: 320, stroke: "#ff8a3d", "stroke-dasharray": "6 4" }, this.sv);
      this.limitT = s("text", { x: 316, "text-anchor": "end", fill: "#ff8a3d", "font-size": 9, "font-family": "Inter Tight" }, this.sv);
      this.bld = s("rect", { x: 112, width: 86, rx: 2, style: "transition:all .3s" }, this.sv);
      this.bldT = s("text", { x: 155, "text-anchor": "middle", "font-size": 12, "font-family": "Inter Tight", "font-weight": 600, fill: "#111" }, this.sv);
      this.range = h("input", { type: "range", min: 0, max: 25, value: this.pisos, "aria-label": "Pisos", style: "accent-color:#ff8a3d" }, toy);
      this.range.oninput = () => { L.activate(self.id); self.pisos = +this.range.value; self.update(); };
      this.msg = h("div", { class: "detail" }, toy);
      const det = h("details", { class: "normas" }, toy, `<summary>Las ${R.reglas.length} normas y sus fuentes</summary>`);
      const ul = h("ul", { class: "list" }, det);
      R.reglas.forEach(r => h("li", {}, ul, `<span class="sw" style="background:#ff8a3d"></span><div>${r.t} ${A.tag(r.real)}${A.src(r)}</div>`));
      h("p", { class: "small muted" }, toy, "Límites de pisos del simulador: ejemplo. Verificar con el Código Urbanístico de CABA.");
      this.update();
    },
    verdict() {
      const l = this.lugar, u = this.uso, p = this.pisos;
      if (l.patrimonio) return [false, "No se puede: la estación es patrimonio ferroviario. Se conserva, no se demuele ni se construye encima."];
      if (l.maxPisos === 0) return [false, "No se puede: es espacio verde público. El 52% del predio tiene que ser superficie verde."];
      if (u.id === "shopping") return [false, "No se puede: en el entorno del parque no se permiten centros comerciales ni grandes superficies."];
      if (p === 0) return [null, "Subí el slider para levantar tu edificio."];
      if (p > l.maxPisos) return [false, `Demasiado alto: lo nuevo no puede superar la altura de los edificios del barrio (máx. ${l.maxPisos} pisos en el simulador).`];
      return [true, `Permitido (simulación): ${u.nombre.toLowerCase()} de ${p} piso${p > 1 ? "s" : ""}. Recordá: 22% del predio es para construcción privada.`];
    },
    update() {
      const [ok, txt] = this.verdict(), p = this.pisos, max = this.lugar.maxPisos;
      const col = ok === true ? "#00e887" : ok === false ? "#ff5a4e" : "#cfcfca";
      const hgt = Math.min(140, p * 5.5);
      this.bld.setAttribute("y", 150 - hgt); this.bld.setAttribute("height", Math.max(1, hgt)); this.bld.setAttribute("fill", col);
      this.bldT.setAttribute("y", 150 - hgt / 2 + 4); this.bldT.textContent = p ? p + " p" : "";
      const ly = 150 - max * 5.5;
      this.limit.setAttribute("y1", ly); this.limit.setAttribute("y2", ly); this.limitT.setAttribute("y", ly - 4);
      this.limitT.textContent = max ? `altura máx. ${max} pisos` : "no edificable";
      this.msg.innerHTML = `<b class="hl" style="--c:${col}">${ok === true ? "✓ Se puede" : ok === false ? "✕ No se puede" : "…"}</b><br>${txt}`;
      if (this.ghost) {
        const pos = { moldes: [770, 200], parque: [660, 290], estacion: [215, 440] }[this.lugar.id];
        this.ghost.setAttribute("transform", `translate(${pos[0]} ${pos[1]})`);
        this.ghostR.setAttribute("y", -Math.max(4, p * 9)); this.ghostR.setAttribute("height", Math.max(4, p * 9)); this.ghostR.setAttribute("fill", col);
      }
    },
    enter(L) {
      this.active = true;
      const fx = L.under;
      const defs = s("defs", {}, fx);
      [["hatch-g", "#00e887"], ["hatch-r", "#ff5a4e"]].forEach(([id, col]) => {
        const pt = s("pattern", { id, width: 10, height: 10, patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" }, defs);
        s("line", { x1: 0, y1: 0, x2: 0, y2: 10, stroke: col, "stroke-width": 2 }, pt);
      });
      s("path", { d: "M" + A.parkGeom.park.map(q => q.join(" ")).join("L") + "Z", fill: "url(#hatch-g)", opacity: .35 }, fx);
      s("rect", { x: 150, y: A.parkGeom.railY(205) + 28, width: 130, height: 28, fill: "url(#hatch-r)", stroke: "#ff5a4e", transform: `rotate(-4 215 ${A.parkGeom.railY(215) + 42})` }, L.under);
      s("rect", { x: 700, y: 180, width: 150, height: 40, fill: "none", stroke: "#ff8a3d", "stroke-width": 2, "stroke-dasharray": "6 4", "vector-effect": "non-scaling-stroke", transform: "rotate(-3 775 200)" }, L.fx);
      L.sign(560, 300, "No edificable", "#00e887", { dir: "s", len: 30, sub: "52% verde" });
      L.sign(215, A.parkGeom.railY(215) + 42, "Patrimonio", "#ff5a4e", { dir: "s", len: 34, sub: "Estación" });
      L.sign(775, 182, "Lote privado", "#ff8a3d", { dir: "n", len: 22, sub: "22% del predio" });
      this.ghost = s("g", {}, L.fx);
      this.ghostR = s("rect", { x: -30, width: 60, "fill-opacity": .6, stroke: "#111", "stroke-width": 1, style: "transition:all .3s" }, this.ghost);
      this.update();
    },
    exit() { this.active = false; this.ghost = null; }
  });

  /* =====================================================================
     10 · CENSO — "tu presupuesto"
     ===================================================================== */
  layers.push({
    id: "censo", nombre: "Censo y valor del suelo", forma: "hexagono", color: "#7cc4f2",
    titulo: "¿Quién vive y cuánto vale?",
    texto: "Población, edades y valor del metro cuadrado alrededor del parque.",
    how: "Mové tu presupuesto: cada cuadradito es 1 m² que podrías comprar en Colegiales.",
    sensores: [],
    build(toy, L) {
      const self = this, c = CP.censo;
      this.range = h("input", { type: "range", min: 50000, max: 400000, step: 5000, value: 150000, "aria-label": "Presupuesto en dólares", style: "accent-color:#7cc4f2" }, toy);
      this.out = h("div", { class: "readout" }, toy);
      this.grid = s("svg", { viewBox: "0 0 320 120" }, toy);
      this.range.oninput = () => { L.activate(self.id); self.update(); };
      h("p", { class: "kicker", style: "margin-top:14px" }, toy, "Pirámide de edades · Comuna 13 " + A.tag(false));
      const py = s("svg", { viewBox: "0 0 320 160" }, toy);
      const ptip = s("text", { x: 160, y: 156, "text-anchor": "middle", fill: "#77776f", "font-size": 10, "font-family": "Inter Tight" }, py, "pasá el cursor por las barras");
      c.piramide.forEach((r, i) => {
        const y = 4 + i * 16;
        const bm = s("rect", { x: 160 - r.m * 14, y, width: r.m * 14, height: 13, fill: "#9b6cff", opacity: .8, style: "cursor:pointer" }, py);
        const bv = s("rect", { x: 160, y, width: r.v * 14, height: 13, fill: "#08b8f8", opacity: .8, style: "cursor:pointer" }, py);
        s("text", { x: 160, y: y + 10, "text-anchor": "middle", fill: "#111", "font-size": 8.5, "font-family": "Inter Tight", style: "pointer-events:none" }, py, r.g);
        bm.onmouseenter = () => ptip.textContent = `Mujeres ${r.g}: ${r.m}%`;
        bv.onmouseenter = () => ptip.textContent = `Varones ${r.g}: ${r.v}%`;
      });
      this.update();
    },
    update() {
      const c = CP.censo, usd = +this.range.value, mu = usd / c.m2Usado.valor, mp = usd / c.m2Pozo.valor;
      const amb = mu < 35 ? "un monoambiente" : mu < 55 ? "un 2 ambientes" : mu < 80 ? "un 3 ambientes" : "un 4 ambientes o más";
      this.out.innerHTML = `Con <b>USD ${A.fmt(usd)}</b> comprás ~<b>${Math.floor(mu)} m²</b> usados o ~${Math.floor(mp)} m² en pozo: ${amb}.`;
      A.clear(this.grid);
      const cols = 30, sz = 9.6;
      for (let i = 0; i < 150; i++) {
        const x = (i % cols) * (sz + .6), y = Math.floor(i / cols) * (sz + .6);
        const fill = i < Math.floor(mp) ? "#7cc4f2" : i < Math.floor(mu) ? "#9fdcf8" : "#ecece8";
        s("rect", { x, y, width: sz, height: sz, rx: 1.5, fill }, this.grid);
      }
      s("text", { x: 0, y: 116, fill: "#77776f", "font-size": 9, "font-family": "Inter Tight" }, this.grid, "■ pozo   ■ usado (extra)   □ fuera de alcance");
    },
    enter(L) {
      this.active = true;
      const G = A.parkGeom, c = CP.censo;
      // Bandas de valor a los dos lados del parque (sin dibujar manzanas)
      s("path", { d: `M-40 ${G.moldesY(-40) - 14}L1680 ${G.moldesY(1680) - 14}L1680 ${G.moldesY(1680) - 80}L-40 ${G.moldesY(-40) - 80}Z`, fill: "#7cc4f2", opacity: .28 }, L.under);
      s("path", { d: `M-40 ${G.cramerY(-40) + 14}L1680 ${G.cramerY(1680) + 14}L1680 ${G.cramerY(1680) + 80}L-40 ${G.cramerY(-40) + 80}Z`, fill: "#7cc4f2", opacity: .18 }, L.under);
      L.sign(560, G.moldesY(560) - 46, `USD ${A.fmt(c.m2Pozo.valor)}/m²`, "#7cc4f2", { dir: "e", len: 0, sub: "en pozo · lado Moldes" });
      L.sign(560, G.cramerY(560) + 46, `USD ${A.fmt(c.m2Usado.valor)}/m²`, "#7cc4f2", { dir: "e", len: 0, sub: "usado · lado Crámer" });
      L.sign(1120, 250, `${A.fmt(c.poblacionComuna.valor)} habitantes`, "#9b6cff", { dir: "n", len: 40, sub: "Comuna 13 · Censo 2010" });
    },
    exit() { this.active = false; }
  });

  // Restricciones y Censo pasaron a "Consultar la evidencia": el recorrido termina en "Qué dice la gente"
  A.layers = layers.filter(l => !["restricciones", "censo"].includes(l.id));
})(window.ATLAS);
