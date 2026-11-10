/* =========================================================================
   ATLAS · PDF mínimo (sin librerías, funciona sin internet)
   Texto en Helvetica, rectángulos, líneas, círculos y el triángulo ATLAS.
   Coordenadas en puntos, con origen arriba a la izquierda (A4: 595 × 842).
   ========================================================================= */
(function (A) {
  const W = 595, H = 842;
  // Anchos aproximados de Helvetica (por 1000) para cortar líneas
  const NARROW = "fijlrtI.,:;'|!()[] ", WIDE = "mwMWOQGDCH%@";
  const cw = (ch, bold) => (NARROW.includes(ch) ? 280 : WIDE.includes(ch) ? 830 : /[A-ZÁÉÍÓÚÑ0-9]/.test(ch) ? 640 : 520) * (bold ? 1.06 : 1);
  const textW = (t, size, bold) => [...t].reduce((a, c) => a + cw(c, bold), 0) / 1000 * size;
  // WinAnsi: los acentos del castellano están en Latin-1; algunos signos se reemplazan
  const MAP = { "²": "2", "–": "\x96", "—": "\x97", "“": "\x93", "”": "\x94", "‘": "\x91", "’": "\x92", "•": "\x95", "…": "\x85", "€": "\x80" };
  const enc = t => [...String(t)].map(c => MAP[c] || (c.charCodeAt(0) < 256 ? c : c === "→" ? "->" : c === "✓" ? "v" : c === "✕" ? "x" : "?")).join("")
    .replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  const rgb = hex => { const n = parseInt(hex.replace("#", ""), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255].map(v => v.toFixed(3)).join(" "); };

  A.PDF = function () {
    const pages = []; let c = null;
    const api = {
      W, H,
      page() { c = []; pages.push(c); return api; },
      text(x, y, t, o = {}) { const sz = o.size || 11; let xx = x; if (o.align === "center") xx = x - textW(t, sz, o.bold) / 2; if (o.align === "right") xx = x - textW(t, sz, o.bold);
        c.push(`BT /${o.bold ? "F2" : "F1"} ${sz} Tf ${rgb(o.color || "#111111")} rg ${xx.toFixed(1)} ${(H - y).toFixed(1)} Td (${enc(t)}) Tj ET`); return api; },
      wrap(x, y, t, maxW, o = {}) { const sz = o.size || 11, lh = o.lh || sz * 1.4; let line = "", yy = y;
        String(t).split(/\s+/).forEach(w => { const test = line ? line + " " + w : w; if (textW(test, sz, o.bold) > maxW && line) { api.text(x, yy, line, o); yy += lh; line = w; } else line = test; });
        if (line) { api.text(x, yy, line, o); yy += lh; } return yy; },
      rect(x, y, w, h, o = {}) { const op = o.fill && o.stroke ? "B" : o.fill ? "f" : "S";
        c.push(`${o.fill ? rgb(o.fill) + " rg " : ""}${o.stroke ? rgb(o.stroke) + " RG " + (o.lw || 1) + " w " : ""}${x.toFixed(1)} ${(H - y - h).toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)} re ${op}`); return api; },
      line(x1, y1, x2, y2, o = {}) { c.push(`${rgb(o.color || "#111111")} RG ${o.lw || 1} w ${o.dash ? `[${o.dash}] 0 d ` : ""}${x1} ${H - y1} m ${x2} ${H - y2} l S [] 0 d`); return api; },
      circle(cx, cy, r, o = {}) { const k = .5523 * r, y = H - cy, op = o.fill && o.stroke ? "B" : o.fill ? "f" : "S";
        c.push(`${o.fill ? rgb(o.fill) + " rg " : ""}${o.stroke ? rgb(o.stroke) + " RG " + (o.lw || 1) + " w " : ""}${cx + r} ${y} m ${cx + r} ${y + k} ${cx + k} ${y + r} ${cx} ${y + r} c ${cx - k} ${y + r} ${cx - r} ${y + k} ${cx - r} ${y} c ${cx - r} ${y - k} ${cx - k} ${y - r} ${cx} ${y - r} c ${cx + k} ${y - r} ${cx + r} ${y - k} ${cx + r} ${y} c ${op}`); return api; },
      // Triángulo de Reuleaux (el símbolo de ATLAS)
      reuleaux(cx, cy, r, fill = "#111111") {
        const P = [0, 1, 2].map(i => { const a = -Math.PI / 2 + i * 2 * Math.PI / 3; return [cx + r * Math.cos(a), H - (cy + r * Math.sin(a))]; });
        const s = Math.hypot(P[0][0] - P[1][0], P[0][1] - P[1][1]), kk = 4 / 3 * Math.tan(Math.PI / 12) * s;
        let d = `${rgb(fill)} rg ${P[0][0].toFixed(1)} ${P[0][1].toFixed(1)} m `;
        for (let i = 0; i < 3; i++) {
          const a = P[i], b = P[(i + 1) % 3], o = P[(i + 2) % 3];
          const ta = [-(a[1] - o[1]), a[0] - o[0]], tb = [-(b[1] - o[1]), b[0] - o[0]], la = Math.hypot(...ta), lb = Math.hypot(...tb);
          const sg = ((b[0] - a[0]) * ta[0] + (b[1] - a[1]) * ta[1]) > 0 ? 1 : -1;
          d += `${(a[0] + sg * ta[0] / la * kk).toFixed(1)} ${(a[1] + sg * ta[1] / la * kk).toFixed(1)} ${(b[0] - sg * tb[0] / lb * kk).toFixed(1)} ${(b[1] - sg * tb[1] / lb * kk).toFixed(1)} ${b[0].toFixed(1)} ${b[1].toFixed(1)} c `;
        }
        c.push(d + "f"); return api;
      },
      blob() {
        const objs = [], add = s => { objs.push(s); return objs.length; };
        const f1 = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
        const f2 = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
        const pagesId = objs.length + 1 + pages.length * 2; const kids = [];
        pages.forEach(pg => { const st = pg.join("\n"); const cid = add(`<< /Length ${st.length} >>\nstream\n${st}\nendstream`);
          kids.push(add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R >> >> /Contents ${cid} 0 R >>`)); });
        add(`<< /Type /Pages /Kids [${kids.map(k => k + " 0 R").join(" ")}] /Count ${kids.length} >>`);
        const cat = add(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);
        let out = "%PDF-1.4\n%\xe2\xe3\xcf\xd3\n"; const off = [];
        objs.forEach((o, i) => { off.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
        const x = out.length;
        out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${off.map(o => String(o).padStart(10, "0") + " 00000 n \n").join("")}trailer\n<< /Size ${objs.length + 1} /Root ${cat} 0 R >>\nstartxref\n${x}\n%%EOF`;
        const bytes = new Uint8Array(out.length); for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 255;
        return new Blob([bytes], { type: "application/pdf" });
      },
      save(name) { const url = URL.createObjectURL(api.blob()); const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 800); }
    };
    return api;
  };
})(window.ATLAS);
