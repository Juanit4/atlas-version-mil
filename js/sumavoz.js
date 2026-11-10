/* =========================================================================
   ATLAS · SUMÁ TU VOZ (sección propia, al final de "Caminar el parque")
   La única parte para participar. Tres pasos grandes: qué querés hacer,
   contalo y marcá dónde. Todo aporte es 100% anónimo y mueve las
   oportunidades del parque en vivo.
   ========================================================================= */
(function (A) {
  const s = A.s, h = A.h;
  const root = document.getElementById("suma-voz");
  if (!root) return;
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const DESC = { reclamar: "Algo anda mal", pedir: "Algo que falta", proponer: "Una idea nueva", aconsejar: "Un consejo para otros", comunicar: "Un aviso para todos" };
  const SUG = {
    reclamar: ["Poca luz a la noche", "Basura en los canteros", "Perros sueltos en los juegos"],
    pedir: ["Baños públicos", "Más sombra", "Bebederos"],
    proponer: ["Feria los domingos", "Cine al aire libre", "Huerta comunitaria"],
    aconsejar: ["Venir temprano: hay menos gente", "Traer agua en verano", "Usar el acceso Olaguer"],
    comunicar: ["Se rompió una luminaria", "Hay un árbol caído", "Mañana hay feria"]
  };
  const st = { acc: A.ACCIONES[1], spot: null };
  let map = null, pinG = null, mineG = null;

  function build() {
    root.innerHTML = `
      <div class="sv-in">
        <header class="sv-head">
          <p class="sv-k">Tu turno</p>
          <h2>Sumá tu voz</h2>
          <p class="sv-lead">Es <b>anónimo</b>: no guardamos tu nombre ni la ubicación de tu teléfono. Lo que digas aparece en el plano y <b>mueve las oportunidades del parque en vivo</b>.</p>
        </header>
        <div class="sv-step"><span class="sv-n">1</span><h3>¿Qué querés hacer?</h3></div>
        <div class="sv-acc" role="radiogroup" aria-label="Qué querés hacer">${A.ACCIONES.map(a => `<button role="radio" data-a="${a.id}" style="--c:${a.color}">
          <svg viewBox="0 0 80 80" aria-hidden="true"><path d="${A.shape(a.forma, 40, 42, 28)}" fill="${a.color}" stroke="#111" stroke-width="2"/></svg><b>${a.nombre}</b><span>${DESC[a.id]}</span></button>`).join("")}</div>
        <div class="sv-two">
          <div>
            <div class="sv-step"><span class="sv-n">2</span><h3>Contalo</h3></div>
            <textarea class="sv-txt" id="sv-txt" rows="3" maxlength="140" placeholder="Escribí en pocas palabras…" aria-label="Tu aporte"></textarea>
            <div class="sv-sug" id="sv-sug"></div>
            <p class="sv-tema" id="sv-tema"></p>
          </div>
          <div>
            <div class="sv-step"><span class="sv-n">3</span><h3>¿Dónde?</h3><p class="sv-where" id="sv-where">Tocá el plano</p></div>
            <div class="sv-map"><svg id="sv-map" preserveAspectRatio="xMidYMid meet" aria-label="Plano del parque: tocá para marcar el lugar"></svg></div>
          </div>
        </div>
        <div class="sv-pubbar"><p id="sv-check"></p><button class="sv-pub" id="sv-pub" disabled>Publicar mi voz</button></div>
        <div class="sv-done" id="sv-done" hidden></div>
        <div class="sv-mine" id="sv-mine"></div>
      </div>`;
    root.querySelectorAll("[data-a]").forEach(b => b.onclick = () => { st.acc = A.accion(b.dataset.a); paint(); });
    const txt = root.querySelector("#sv-txt"); txt.oninput = paint;
    root.querySelector("#sv-pub").onclick = publicar;
    // Plano
    map = root.querySelector("#sv-map");
    A.drawParkBase(map, { labels: "min" });
    const VB = [70, 180, 1480, 280]; map.setAttribute("viewBox", VB.join(" "));
    mineG = s("g", {}, map); pinG = s("g", { style: "display:none" }, map);
    s("line", { x1: 0, y1: 0, x2: 0, y2: -22, stroke: "#111", "stroke-width": 2.5 }, pinG);
    s("path", { d: A.shape("circulo", 0, -34, 14), fill: "#f8e544", stroke: "#111", "stroke-width": 2.5, class: "sv-pinhead" }, pinG);
    s("circle", { r: 4, fill: "#111" }, pinG);
    map.addEventListener("click", ev => { const p = A.svgPoint(map, ev); st.spot = { x: p.x, y: p.y, zona: A.zonaCerca(p.x, p.y).nombre }; pinG.style.display = ""; pinG.setAttribute("transform", `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`); pinG.classList.remove("drop"); void pinG.getBoundingClientRect(); pinG.classList.add("drop"); paint(); });
    paint(); mine();
  }

  function paint() {
    root.querySelectorAll("[data-a]").forEach(b => { const on = b.dataset.a === st.acc.id; b.classList.toggle("on", on); b.setAttribute("aria-checked", on); });
    const txt = root.querySelector("#sv-txt"), v = txt.value.trim();
    root.querySelector("#sv-sug").innerHTML = `<span>Ideas:</span>` + SUG[st.acc.id].map(x => `<button class="chip" data-s="${esc(x)}">${x}</button>`).join("");
    root.querySelectorAll("[data-s]").forEach(b => b.onclick = () => { txt.value = b.dataset.s; paint(); txt.focus(); });
    root.querySelector("#sv-tema").innerHTML = v ? `Va a sumar a la oportunidad <b>${A.temaDe(v)}</b>` : `ATLAS ordena tu aporte por tema automáticamente.`;
    root.querySelector("#sv-where").innerHTML = st.spot ? `📍 <b>${st.spot.zona}</b>` : "Tocá el plano";
    const pin = pinG && pinG.querySelector(".sv-pinhead"); if (pin) pin.setAttribute("fill", st.acc.color);
    const ok = v && st.spot;
    root.querySelector("#sv-pub").disabled = !ok;
    root.querySelector("#sv-check").innerHTML = [[true, st.acc.nombre], [!!v, v ? "Texto listo" : "Falta contarlo"], [!!st.spot, st.spot ? st.spot.zona : "Falta el lugar"]].map(([o, t]) => `<span class="${o ? "ok" : ""}">${o ? "✓" : "○"} ${t}</span>`).join("");
    root.querySelector("#sv-pub").style.setProperty("--c", st.acc.color);
  }

  function publicar() {
    const txt = root.querySelector("#sv-txt"), v = txt.value.trim(); if (!v || !st.spot) return;
    const a = A.aportes.agregar({ accion: st.acc.id, texto: v, zona: st.spot.zona, x: Math.round(st.spot.x), y: Math.round(st.spot.y) });
    const pos = A.OPORT ? A.OPORT.puntos().findIndex(p => p.n === a.tema) + 1 : 0;
    const d = root.querySelector("#sv-done"); d.hidden = false;
    d.innerHTML = `<div class="sv-ok" style="--c:${st.acc.color}"><svg viewBox="0 0 80 80" aria-hidden="true"><path d="${A.shape(st.acc.forma, 40, 42, 28)}" fill="${st.acc.color}" stroke="#111" stroke-width="2"/></svg>
      <div><h3>¡Listo! Tu voz ya está en el parque.</h3><p>Tu ${st.acc.verbo} quedó en <b>${a.zona}</b> y suma a <b>«${a.tema}»</b>${pos ? `, que ahora está en el <b>puesto ${pos}</b> de las oportunidades` : ""}.</p>
      <div class="row-btns"><a class="btn" href="#oportunidades">Ver cómo se mueve →</a><button class="btn ghost" data-otra>Sumar otra</button></div></div></div>`;
    d.querySelector("[data-otra]").onclick = () => { d.hidden = true; txt.focus(); };
    txt.value = ""; st.spot = null; pinG.style.display = "none"; paint(); mine();
    d.scrollIntoView({ behavior: A.reduced ? "auto" : "smooth", block: "nearest" });
  }

  function mine() {
    const m = A.aportes.mios();
    A.clear(mineG);
    m.forEach(a => { const ac = A.accion(a.accion), g = s("g", { transform: `translate(${a.x} ${a.y})` }, mineG);
      s("line", { x1: 0, y1: 0, x2: 0, y2: -14, stroke: "#111", "stroke-width": 1.5 }, g); s("path", { d: A.shape(ac.forma, 0, -22, 9), fill: ac.color, stroke: "#111", "stroke-width": 1.5 }, g); s("title", {}, g, a.texto); });
    root.querySelector("#sv-mine").innerHTML = m.length ? `<p class="lsub">Tus aportes (${m.length})</p><ul>${m.slice(-4).reverse().map(a => { const ac = A.accion(a.accion); return `<li style="--c:${ac.color}">${A.icon(ac.forma, ac.color)}<span><b>${ac.nombre}</b> · ${a.zona}</span><p>${esc(a.texto)}</p></li>`; }).join("")}</ul>` : "";
  }

  build();
  A.aportes.on(a => { if (a && a.mio) mine(); });
})(window.ATLAS);
