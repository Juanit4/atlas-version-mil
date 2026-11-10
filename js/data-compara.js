/* =========================================================================
   ATLAS · DATOS PARA COMPARAR PARQUES
   Ferroviario Colegiales y Centenario salen de las lecturas de ATLAS.
   El resto son EJEMPLOS con la misma estructura: se reemplazan cuando
   cada parque se relee con sensores, conteos y encuestas (anónimos).
   ========================================================================= */
(function (A) {
  const D = A.D;

  /* Curvas tipo de personas por hora (0–1), para generar los ejemplos */
  const CURVA = {
    barrial: { semana: [.05,.02,.01,.01,.01,.04,.14,.34,.5,.42,.36,.4,.55,.6,.48,.44,.54,.75,1,.94,.7,.44,.22,.1], finde: [.09,.05,.02,.01,.01,.02,.06,.14,.3,.48,.68,.82,.95,1,.94,.9,.95,1,.92,.74,.52,.34,.2,.12] },
    grande:  { semana: [.04,.02,.01,.01,.01,.03,.12,.3,.42,.38,.36,.42,.56,.58,.5,.48,.6,.82,1,.86,.6,.36,.18,.08], finde: [.06,.03,.02,.01,.01,.02,.05,.14,.32,.55,.78,.94,1,1,.96,.94,.96,.9,.76,.56,.38,.24,.14,.08] }
  };
  const gen = (tipo, pico) => ({ semana: CURVA[tipo].semana.map(v => Math.round(v * pico[0])), finde: CURVA[tipo].finde.map(v => Math.round(v * pico[1])) });

  /* Equipamiento que se puede buscar */
  const EQUIP = {
    skate:      { nombre: "Skate / BMX",        forma: "triangulo", perfil: "tarde" },
    juegos:     { nombre: "Juegos infantiles",  forma: "circulo",   perfil: "chicos" },
    canil:      { nombre: "Canil",              forma: "cuadrado",  perfil: "punta" },
    bicisenda:  { nombre: "Bicisenda",          forma: "rombo",     perfil: "punta" },
    postas:     { nombre: "Postas aeróbicas",   forma: "hexagono",  perfil: "manana" },
    canchas:    { nombre: "Canchas",            forma: "cuadrado",  perfil: "tarde" },
    banos:      { nombre: "Baños públicos",     forma: "circulo",   perfil: "general" },
    gastro:     { nombre: "Gastronomía",        forma: "hexagono",  perfil: "comida" },
    feria:      { nombre: "Feria",              forma: "rombo",     perfil: "finde" },
    anfiteatro: { nombre: "Anfiteatro / escenario", forma: "reuleaux", perfil: "noche" },
    huerta:     { nombre: "Huerta",             forma: "hexagono",  perfil: "manana" },
    lago:       { nombre: "Lago / agua",        forma: "circulo",   perfil: "general" }
  };
  // Peso por hora de cada perfil de uso (multiplica la curva del parque)
  const PERFIL = {
    tarde:   h => h >= 15 && h <= 21 ? 1.5 : h >= 10 && h < 15 ? .8 : .3,
    chicos:  h => (h >= 10 && h <= 12) || (h >= 16 && h <= 19) ? 1.6 : h >= 8 && h <= 20 ? .7 : .05,
    punta:   h => (h >= 7 && h <= 9) || (h >= 18 && h <= 21) ? 1.6 : .6,
    manana:  h => h >= 7 && h <= 10 ? 1.8 : h >= 17 && h <= 20 ? 1 : .4,
    general: () => 1,
    comida:  h => (h >= 12 && h <= 14) || (h >= 19 && h <= 22) ? 1.7 : .6,
    finde:   h => h >= 11 && h <= 19 ? 1.3 : .2,
    noche:   h => h >= 18 && h <= 23 ? 1.8 : .4
  };

  const ACTIV = ["Caminar o correr", "Deporte", "Juegos con chicos", "Pasear la mascota", "Picnic y descanso", "Cultura y eventos", "Comer algo", "Trabajar o estudiar"];

  const P = (o) => Object.assign({ real: false }, o);
  A.PARQUES = [
    P({ id: "colegiales", nombre: "Parque Ferroviario Colegiales", corto: "Ferroviario", barrio: "Colegiales", comuna: 13, ha: 1.42, forma: "reuleaux", estado: "En curso", color: "#9b6cff", fuente: "ATLAS",
      transito: D.capas.transito, personas: D.capas.personas, voces: D.capas.voces.palabras.map(w => ({ t: w.t, tipo: w.tipo, n: w.n })),
      equip: ["skate", "juegos", "postas", "gastro", "feria", "huerta"],
      hacen: [30, 14, 16, 12, 12, 6, 6, 4], prefieren: [22, 12, 14, 10, 12, 16, 9, 5] }),
    P({ id: "centenario", nombre: D.centenario.nombre, corto: "Centenario", barrio: "Caballito", comuna: 6, ha: 10, forma: "circulo", estado: "Lectura completada", color: "#00e887", fuente: "ATLAS",
      transito: D.centenario.transito, personas: D.centenario.personas, voces: D.centenario.voces,
      equip: ["juegos", "canil", "bicisenda", "postas", "banos", "feria", "anfiteatro", "lago", "gastro"],
      hacen: [32, 10, 18, 14, 14, 6, 4, 2], prefieren: [26, 10, 14, 12, 12, 14, 8, 4] }),
    P({ id: "losandes", nombre: "Parque Los Andes", corto: "Los Andes", barrio: "Chacarita", comuna: 15, ha: 6, forma: "cuadrado", estado: "Ejemplo", color: "#08b8f8",
      transito: gen("barrial", [120, 220]), personas: { edad: { "Niñez 0–12": 20, "Jóvenes 13–29": 30, "Adultos 30–59": 35, "Mayores 60+": 15 }, genero: { "Mujeres": 50, "Varones": 47, "No binario / otro": 3 }, mascota: { "Con mascota": 28, "Sin mascota": 72 }, compania: { "Solas": 30, "En pareja": 22, "En familia": 30, "En grupo": 18 } },
      voces: [{ t: "más sombra", tipo: "pedido", n: 18 }, { t: "baños públicos", tipo: "pedido", n: 16 }, { t: "perros sueltos", tipo: "queja", n: 14 }, { t: "feria de los sábados", tipo: "recomendacion", n: 12 }, { t: "más seguridad", tipo: "queja", n: 11 }, { t: "canchas de básquet", tipo: "pedido", n: 9 }],
      equip: ["juegos", "canil", "canchas", "postas", "feria"],
      hacen: [28, 16, 18, 16, 12, 2, 4, 4], prefieren: [22, 16, 14, 14, 12, 12, 6, 4] }),
    P({ id: "chacabuco", nombre: "Parque Chacabuco", corto: "Chacabuco", barrio: "Parque Chacabuco", comuna: 7, ha: 18, forma: "cuadrado", estado: "Ejemplo", color: "#f8e544",
      transito: gen("grande", [260, 420]), personas: { edad: { "Niñez 0–12": 24, "Jóvenes 13–29": 30, "Adultos 30–59": 30, "Mayores 60+": 16 }, genero: { "Mujeres": 49, "Varones": 48, "No binario / otro": 3 }, mascota: { "Con mascota": 24, "Sin mascota": 76 }, compania: { "Solas": 24, "En pareja": 18, "En familia": 38, "En grupo": 20 } },
      voces: [{ t: "más seguridad", tipo: "queja", n: 22 }, { t: "iluminación", tipo: "pedido", n: 19 }, { t: "pileta abierta", tipo: "pedido", n: 15 }, { t: "skate", tipo: "recomendacion", n: 13 }, { t: "baños públicos", tipo: "pedido", n: 12 }, { t: "basura", tipo: "queja", n: 10 }],
      equip: ["skate", "juegos", "canchas", "bicisenda", "postas", "banos", "anfiteatro"],
      hacen: [24, 24, 18, 10, 12, 4, 4, 4], prefieren: [20, 22, 14, 10, 12, 12, 6, 4] }),
    P({ id: "saavedra", nombre: "Parque Saavedra", corto: "Saavedra", barrio: "Saavedra", comuna: 12, ha: 10, forma: "rombo", estado: "Ejemplo", color: "#ff8a7a",
      transito: gen("barrial", [140, 300]), personas: { edad: { "Niñez 0–12": 26, "Jóvenes 13–29": 22, "Adultos 30–59": 34, "Mayores 60+": 18 }, genero: { "Mujeres": 53, "Varones": 44, "No binario / otro": 3 }, mascota: { "Con mascota": 32, "Sin mascota": 68 }, compania: { "Solas": 22, "En pareja": 20, "En familia": 42, "En grupo": 16 } },
      voces: [{ t: "más bancos", tipo: "pedido", n: 17 }, { t: "feria de los domingos", tipo: "recomendacion", n: 15 }, { t: "baños públicos", tipo: "pedido", n: 14 }, { t: "perros sueltos", tipo: "queja", n: 11 }, { t: "más sombra", tipo: "pedido", n: 10 }, { t: "juegos inclusivos", tipo: "pedido", n: 8 }],
      equip: ["juegos", "canil", "feria", "postas", "gastro", "lago"],
      hacen: [26, 10, 22, 16, 14, 4, 6, 2], prefieren: [22, 10, 16, 14, 14, 12, 8, 4] }),
    P({ id: "lezama", nombre: "Parque Lezama", corto: "Lezama", barrio: "San Telmo", comuna: 1, ha: 8, forma: "triangulo", estado: "Ejemplo", color: "#c4b5f5",
      transito: gen("barrial", [130, 280]), personas: { edad: { "Niñez 0–12": 16, "Jóvenes 13–29": 32, "Adultos 30–59": 34, "Mayores 60+": 18 }, genero: { "Mujeres": 50, "Varones": 47, "No binario / otro": 3 }, mascota: { "Con mascota": 20, "Sin mascota": 80 }, compania: { "Solas": 32, "En pareja": 24, "En familia": 24, "En grupo": 20 } },
      voces: [{ t: "feria de artesanos", tipo: "recomendacion", n: 20 }, { t: "más seguridad", tipo: "queja", n: 18 }, { t: "iluminación", tipo: "pedido", n: 15 }, { t: "shows en el anfiteatro", tipo: "recomendacion", n: 12 }, { t: "baños públicos", tipo: "pedido", n: 11 }, { t: "limpieza", tipo: "queja", n: 9 }],
      equip: ["juegos", "feria", "anfiteatro", "postas", "gastro"],
      hacen: [30, 6, 12, 10, 18, 12, 8, 4], prefieren: [24, 6, 10, 8, 16, 20, 12, 4] }),
    P({ id: "sarmiento", nombre: "Parque Sarmiento", corto: "Sarmiento", barrio: "Saavedra", comuna: 12, ha: 40, forma: "hexagono", estado: "Ejemplo", color: "#7cc4f2",
      transito: gen("grande", [320, 640]), personas: { edad: { "Niñez 0–12": 22, "Jóvenes 13–29": 34, "Adultos 30–59": 32, "Mayores 60+": 12 }, genero: { "Mujeres": 46, "Varones": 51, "No binario / otro": 3 }, mascota: { "Con mascota": 18, "Sin mascota": 82 }, compania: { "Solas": 20, "En pareja": 16, "En familia": 34, "En grupo": 30 } },
      voces: [{ t: "transporte para llegar", tipo: "pedido", n: 19 }, { t: "canchas en mejor estado", tipo: "pedido", n: 17 }, { t: "skate", tipo: "recomendacion", n: 14 }, { t: "más sombra", tipo: "pedido", n: 12 }, { t: "baños públicos", tipo: "pedido", n: 10 }, { t: "ruido de la autopista", tipo: "queja", n: 8 }],
      equip: ["skate", "canchas", "bicisenda", "postas", "banos", "gastro", "juegos"],
      hacen: [22, 34, 12, 6, 12, 4, 6, 4], prefieren: [20, 30, 10, 6, 12, 10, 8, 4] })
  ];
  A.PARQUES.forEach(p => { p.m2 = Math.round(p.ha * 10000); });

  /* Agenda general (noviembre y diciembre de 2026) · EJEMPLO salvo aviso */
  const TIPOS_EV = { feria: ["Feria", "#f8e544"], musica: ["Música", "#9b6cff"], deporte: ["Deporte", "#08b8f8"], taller: ["Taller", "#00e887"], encuentro: ["Encuentro vecinal", "#ff8a7a"], cine: ["Cine", "#c4b5f5"] };
  const EV = [
    ["2026-11-08", "colegiales", "feria", "Feria gastronómica de otoño", "11 a 20 h"],
    ["2026-11-08", "centenario", "feria", "Feria de libros usados", "10 a 19 h"],
    ["2026-11-10", "losandes", "deporte", "Clase abierta de funcional", "8 h"],
    ["2026-11-12", "chacabuco", "taller", "Taller de reparación de bicis", "17 h"],
    ["2026-11-14", "colegiales", "encuentro", "Recorrido participativo ATLAS", "10 h"],
    ["2026-11-14", "saavedra", "feria", "Feria de productores", "10 a 18 h"],
    ["2026-11-15", "lezama", "musica", "Tango en el anfiteatro", "18 h"],
    ["2026-11-15", "sarmiento", "deporte", "Torneo barrial de fútbol", "9 h"],
    ["2026-11-18", "centenario", "taller", "Observación de aves en el lago", "8 h"],
    ["2026-11-21", "colegiales", "cine", "Cine en el Galpón Mitre", "20 h"],
    ["2026-11-21", "chacabuco", "deporte", "Encuentro de skate", "16 h"],
    ["2026-11-22", "losandes", "feria", "Feria de diseño", "11 a 19 h"],
    ["2026-11-25", "lezama", "encuentro", "Asamblea por la iluminación", "19 h"],
    ["2026-11-28", "centenario", "musica", "Concierto en el anfiteatro", "19 h"],
    ["2026-11-29", "colegiales", "taller", "Taller de huerta urbana", "10 h"],
    ["2026-11-29", "saavedra", "cine", "Cine para chicos", "18 h"],
    ["2026-12-03", "sarmiento", "taller", "Escuela abierta de atletismo", "18 h"],
    ["2026-12-05", "colegiales", "musica", "Concierto de fin de año", "19 h"],
    ["2026-12-06", "chacabuco", "feria", "Feria navideña", "10 a 20 h"],
    ["2026-12-06", "lezama", "feria", "Feria de artesanos", "11 a 19 h"],
    ["2026-12-10", "losandes", "encuentro", "Reunión de vecinos por el canil", "19 h"],
    ["2026-12-12", "centenario", "cine", "Cine bajo las estrellas", "21 h"],
    ["2026-12-13", "saavedra", "musica", "Banda municipal", "18 h"],
    ["2026-12-13", "colegiales", "deporte", "Exhibición de BMX", "17 h"],
    ["2026-12-19", "sarmiento", "feria", "Feria de fin de año", "10 a 20 h"],
    ["2026-12-20", "colegiales", "feria", "Feria de pulgas y vinilos", "11 a 19 h"]
  ];
  A.COMPARA = {
    EQUIP, PERFIL, ACTIV, TIPOS_EV,
    eventos: EV.map(([fecha, parque, tipo, titulo, hora]) => ({ fecha, parque, tipo, titulo, hora, real: false })),
    // Personas usando un equipamiento a cada hora (estimación)
    usoEquip(p, eq, modo) {
      const f = PERFIL[EQUIP[eq].perfil], share = .12;
      return p.transito[modo].map((v, h) => Math.round(v * share * f(h)));
    }
  };
})(window.ATLAS);
