/* =========================================================================
   ATLAS · APORTES (la participación, en un solo lugar)
   Lo que la gente reclama, pide, propone, aconseja o comunica en
   "Caminar el parque" se guarda acá y alimenta "Explorar oportunidades".

   PRIVACIDAD: todo aporte es 100% anónimo. No se guarda nombre, cuenta,
   ubicación del dispositivo ni nada que identifique a una persona: solo
   qué se dijo, de qué tema y en qué zona del parque.
   (Esta versión guarda en el navegador. En la versión conectada, los
   aportes se envían a un servidor sin datos personales.)
   ========================================================================= */
(function (A) {
  const PD = A.D.parque, M = window.ATLAS_INFORME.matriz;

  /* Las cinco acciones de la ciudadanía */
  A.ACCIONES = [
    { id: "reclamar",  nombre: "Reclamar",  verbo: "reclamo",  forma: "triangulo", color: "#ff8a7a" },
    { id: "pedir",     nombre: "Pedir",     verbo: "pedido",   forma: "hexagono",  color: "#f8e544" },
    { id: "proponer",  nombre: "Proponer",  verbo: "propuesta", forma: "circulo",  color: "#00e887" },
    { id: "aconsejar", nombre: "Aconsejar", verbo: "consejo",  forma: "cuadrado",  color: "#08b8f8" },
    { id: "comunicar", nombre: "Comunicar", verbo: "aviso",    forma: "rombo",     color: "#9b6cff" }
  ];
  const ACC = id => A.ACCIONES.find(a => a.id === id) || A.ACCIONES[0];
  A.accion = ACC;

  /* Clasificador simple: cada aporte se asigna a una oportunidad de la matriz.
     (En la versión conectada lo hace un modelo de lenguaje; acá, palabras clave.) */
  const TEMAS = [
    [/baño|sanitari|bebeder|agua/, "Baños públicos y servicios básicos"],
    [/ilumin|luz|luces|oscur/, "Iluminación"],
    [/segur|robo|polic|vigil|miedo|asalt/, "Más seguridad"],
    [/sombra|árbol|arbol|verde|banco|mobiliar|pasto|planta|huerta|nativ/, "Mejora de espacios verdes y mobiliario"],
    [/gastro|comida|café|cafe|bar\b|feria|food|puesto/, "Gastronomía y servicios"],
    [/cultur|cine|concierto|música|musica|show|evento|taller|teatro|arte/, "Actividades culturales y eventos"],
    [/accesib|rampa|bici|movilid|silla de ruedas|cruce|vereda/, "Accesibilidad y movilidad"],
    [/cancha|deport|skate|bmx|correr|running|gimnasi|postas/, "Infraestructura deportiva"],
    [/cowork|wifi|trabaj|enchuf/, "Espacios de cowork"],
    [/estacion(a|á)|auto|cochera/, "Estacionamiento"],
    [/torre|edific|inmobil|departament|construcc/, "Desarrollo inmobiliario"],
    [/tecno|sensor|digital|innova/, "Polo tecnológico"],
    [/shopping|comercio|tienda|local/, "Nuevos centros comerciales"],
    [/administr|oficina pública|trámite|tramite/, "Equipamiento administrativo"]
  ];
  A.temaDe = (texto) => {
    const t = (texto || "").toLowerCase();
    const hit = TEMAS.find(([re]) => re.test(t));
    return hit ? hit[1] : "Mejora de espacios verdes y mobiliario";
  };
  A.TEMAS_LISTA = M.items.map(it => it[0]);

  /* Aportes de la comunidad (EJEMPLO, anónimos) para que el sistema no arranque vacío */
  const zonas = PD.zonas.filter(z => A.inPark ? true : true);
  const Z = id => PD.zonas.find(z => z.id === id);
  const SEMILLA = [
    ["pedir", "Baños públicos cerca de los juegos", "juegos"], ["reclamar", "Poca luz sobre el borde de las vías", "pergolas"],
    ["pedir", "Más sombra en la plaza Lacroze", "lacroze"], ["proponer", "Feria gastronómica los fines de semana", "feria"],
    ["aconsejar", "Árboles nativos en el sector Zabala", "huerta"], ["reclamar", "Perros sueltos en la zona de juegos", "juegos"],
    ["proponer", "Cine al aire libre en el galpón", "galpon"], ["pedir", "Bebederos en el skate", "skate"],
    ["comunicar", "Se rompió la iluminación de las pérgolas", "pergolas2"], ["reclamar", "Robos de celulares en el acceso Lacroze", "estacion"],
    ["proponer", "Talleres de huerta para chicos", "huerta"], ["pedir", "Rampas en el acceso Olaguer", "olaguer"],
    ["aconsejar", "Bancos con respaldo para personas mayores", "jjpaso"], ["proponer", "Recitales chicos en los vagones", "vagones"],
    ["pedir", "Bicicleteros en la estación", "estacion"], ["reclamar", "Ruido del tren a la noche", "vagones"],
    ["proponer", "Cowork al aire libre con wifi", "galpon"], ["pedir", "Canchas de básquet", "skate"],
    ["comunicar", "Hay un árbol caído en el sector Zabala", "huerta"], ["reclamar", "No a las torres sobre Moldes", "distrito"],
    ["pedir", "Más seguridad a la noche", "lacroze"], ["proponer", "Café en el galpón Mitre", "galpon"],
    ["aconsejar", "Iluminación cálida en los senderos", "pergolas"], ["pedir", "Baños accesibles en la plaza J. J. Paso", "jjpaso"]
  ];
  let sd = 3; const rnd = () => ((sd = (sd * 9301 + 49297) % 233280) / 233280);
  const comunidad = SEMILLA.map(([acc, texto, zid], i) => {
    const z = Z(zid);
    return { id: "c" + i, accion: acc, texto, tema: A.temaDe(texto), zona: z.nombre, x: z.x + (rnd() - .5) * 60, y: z.y + (rnd() - .5) * 26, comunidad: true, real: false };
  });

  /* Flujo "en vivo" para la demo: cada tanto llega un aporte anónimo nuevo */
  const POOL = ["Más bancos a la sombra", "Baños abiertos los domingos", "Luces en el sendero principal", "Una feria de diseño", "Juegos inclusivos",
    "Clases de yoga gratis", "Más tachos de reciclaje", "Que el galpón sea centro cultural", "Bebederos para perros", "Vigilancia en el acceso Lacroze",
    "Food trucks los sábados", "Bicisenda conectada", "Cancha de vóley", "Wifi público", "Riego de los canteros"];
  const listeners = new Set();
  const emit = (a) => listeners.forEach(fn => fn(a));

  A.aportes = {
    comunidad,
    mios() { return A.store.get("aportes", []); },
    todos() { return comunidad.concat(this.mios(), this.envivo); },
    envivo: [],
    agregar(a) {
      // Anónimo: se guarda solo el contenido, el tema y la zona
      const nuevo = { id: "m" + Date.now(), accion: a.accion, texto: a.texto, tema: a.tema || A.temaDe(a.texto), zona: a.zona, x: a.x, y: a.y, fecha: new Date().toISOString().slice(0, 10), mio: true };
      const mios = this.mios(); mios.push(nuevo); A.store.set("aportes", mios);
      emit(nuevo); return nuevo;
      // >>> Versión conectada: fetch("https://TU-API/aportes", { method: "POST", body: JSON.stringify(nuevo) })
    },
    // "Me sumo": +1 anónimo a un tema
    sumar(tema) { const p = A.store.get("apoyos", {}); p[tema] = (p[tema] || 0) + 1; A.store.set("apoyos", p); emit({ tema, apoyo: true }); },
    apoyos() { return A.store.get("apoyos", {}); },
    porTema() {
      const out = {}; A.TEMAS_LISTA.forEach(t => out[t] = 0);
      this.todos().forEach(a => out[a.tema] = (out[a.tema] || 0) + 1);
      const ap = this.apoyos(); Object.keys(ap).forEach(t => out[t] = (out[t] || 0) + ap[t]);
      return out;
    },
    on(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    // Simulación de la comunidad en vivo (solo mientras se mira Oportunidades)
    simular() {
      const texto = POOL[Math.floor(Math.random() * POOL.length)];
      const z = PD.zonas[Math.floor(Math.random() * PD.zonas.length)];
      const acc = A.ACCIONES[Math.floor(Math.random() * A.ACCIONES.length)].id;
      const a = { id: "v" + Date.now(), accion: acc, texto, tema: A.temaDe(texto), zona: z.nombre, x: z.x, y: z.y, envivo: true };
      this.envivo.push(a); if (this.envivo.length > 40) this.envivo.shift();
      emit(a); return a;
    }
  };
})(window.ATLAS);
