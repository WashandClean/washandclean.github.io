/***************************
 * CONFIG EMAILJS
 ***************************/
const EMAILJS_PUBLIC_KEY = "cdiDJc8D7sHW03DtO";
const EMAILJS_SERVICE_ID = "cdJDp8D7sHW03DtO";
const EMAILJS_TEMPLATE_ID = "template_o4q3p79";

// Inicializar EmailJS (uma vez)
(function () {
  if (window.emailjs) emailjs.init(EMAILJS_PUBLIC_KEY);
})();

/***************************
 * MAPA + TAXA (Braga/Guimarães)
 ***************************/
window.addEventListener("DOMContentLoaded", function () {
  // ---------- Helpers ----------
  const round1 = (n) => Math.round(n * 10) / 10;
  const eur = (n) => `${n.toFixed(2).replace(".", ",")}€`;

  // Bases (centros aproximados)
  const BASES = [
    { name: "Guimarães", lat: 41.4449, lng: -8.2962 },
    { name: "Braga", lat: 41.5454, lng: -8.4265 },
  ];

  const FREE_KM = 15;
  const RATE = 0.25; // €/km depois de 15km

  const mapEl = document.getElementById("serviceMap");

  // Campos do formulário
  const inputZona = document.getElementById("clienteLocal");
  const inputMorada = document.getElementById("clienteMorada");

  // Painel (spans)
  const feeZone = document.getElementById("feeZone");
  const feeDistance = document.getElementById("feeDistance");
  const feeExtraKm = document.getElementById("feeExtraKm");
  const feeTotal = document.getElementById("feeTotal");
  const feeNote = document.getElementById("feeNote");

  // Hidden inputs (criar se não existirem)
  function ensureHidden(id, name) {
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement("input");
      el.type = "hidden";
      el.id = id;
      el.name = name;
      const form = document.getElementById("bookingForm");
      if (form) form.appendChild(el);
    }
    return el;
  }
  const hidLat = ensureHidden("clienteLat", "lat");
  const hidLng = ensureHidden("clienteLng", "lng");
  const hidMaps = ensureHidden("clienteMapaUrl", "mapa_url");
  const hidDist = ensureHidden("clienteDistKm", "dist_km");
  const hidFee = ensureHidden("clienteTaxa", "taxa");

  // ---------- Iniciar mapa ----------
  let map, clickMarker, baseMarkers = [];

  if (mapEl && window.L) {
    map = L.map("serviceMap", {
      scrollWheelZoom: false,
    });

    // Centrar no Minho (entre Braga e Guimarães)
    map.setView([41.51, -8.36], 11);

    // Tiles (OpenStreetMap)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Markers das bases + círculo grátis 15km em cada base
    BASES.forEach((b) => {
      const m = L.marker([b.lat, b.lng]).addTo(map).bindPopup(`<b>${b.name}</b> (base)`);
      baseMarkers.push(m);

      L.circle([b.lat, b.lng], {
        radius: FREE_KM * 1000,
        color: "#1cc88a",
        weight: 2,
        fillColor: "#1cc88a",
        fillOpacity: 0.12,
      }).addTo(map);
    });

    // Clique para escolher local
    map.on("click", (e) => {
      const { lat, lng } = e.latlng;

      // marker do cliente
      if (clickMarker) clickMarker.remove();
      clickMarker = L.marker([lat, lng]).addTo(map);

      // distância à base mais próxima
      let best = null;
      BASES.forEach((b) => {
        const dMeters = map.distance([lat, lng], [b.lat, b.lng]);
        if (!best || dMeters < best.dMeters) best = { ...b, dMeters };
      });

      const distKm = best.dMeters / 1000;
      const extraKm = Math.max(0, distKm - FREE_KM);
      const fee = extraKm * RATE;

      // Painel
      if (feeZone) feeZone.textContent = best.name;
      if (feeDistance) feeDistance.textContent = `${round1(distKm)} km`;
      if (feeExtraKm) feeExtraKm.textContent = `${round1(extraKm)} km`;
      if (feeTotal) feeTotal.textContent = fee === 0 ? "Grátis" : eur(fee);

      if (feeNote) {
        feeNote.textContent =
          fee === 0
            ? `Dentro de ${FREE_KM} km da base (${best.name}).`
            : `Depois de ${FREE_KM} km: ${RATE.toFixed(2).replace(".", ",")}€/km (base mais próxima: ${best.name}).`;
      }

      // Form: zona + morada (coords + link)
      const mapsUrl = `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
      if (inputZona) inputZona.value = best.name;

      if (inputMorada) {
        inputMorada.value = `Local selecionado no mapa: ${lat.toFixed(6)}, ${lng.toFixed(6)} | ${mapsUrl}`;
      }

      // Hidden: coords + url + valores
      hidLat.value = lat.toFixed(6);
      hidLng.value = lng.toFixed(6);
      hidMaps.value = mapsUrl;
      hidDist.value = round1(distKm).toString();
      hidFee.value = fee === 0 ? "0" : fee.toFixed(2);

      // Guarda para usar no submit
      mapEl.dataset.selected = "1";
    });

    // (opcional) quando o mapa aparece depois de scroll/resize
    setTimeout(() => map.invalidateSize(), 200);
    window.addEventListener("resize", () => map.invalidateSize());
  }

  /***************************
   * FORMULÁRIO DE MARCAÇÃO
   ***************************/
  const form = document.getElementById("bookingForm");
  const resultDiv = document.getElementById("bookingResult");

  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const name = document.getElementById("clienteNome").value.trim();
    const email = document.getElementById("clienteEmail").value.trim();
    const telefone = document.getElementById("clienteTelefone").value.trim();
    const morada = document.getElementById("clienteMorada").value.trim();

    const servico = document.getElementById("clienteServico").value;
    const local = document.getElementById("clienteLocal").value;

    const dataStr = document.getElementById("clienteData").value;
    const horaStr = document.getElementById("clienteHora").value;

    const msg = document.getElementById("clienteMensagem").value.trim();

    // Extras (checkboxes)
    const extras = Array.from(document.querySelectorAll('input[name="extras"]:checked'))
      .map((x) => x.value);

    if (!name || !email || !telefone || !morada || !dataStr || !horaStr) {
      resultDiv.textContent = "Preencha todos os campos obrigatórios.";
      return;
    }

    // (recomendado) exigir clique no mapa: descomenta se quiseres obrigar
    // if (!mapEl?.dataset.selected) {
    //   resultDiv.textContent = "Selecione o local no mapa para calcular a deslocação.";
    //   return;
    // }

    // Validar data/hora (o teu horário)
    const [year, month, day] = dataStr.split("-").map(Number);
    const [h, m] = horaStr.split(":").map(Number);
    const selected = new Date(year, month - 1, day, h, m);
    const weekday = selected.getDay();
    const totalMin = h * 60 + m;

    let startMin, endMin;
    if (weekday >= 1 && weekday <= 5) {
      startMin = 17 * 60 + 30;
      endMin = 21 * 60 + 30;
    } else {
      startMin = 10 * 60;
      endMin = 19 * 60;
    }

    if (totalMin < startMin || totalMin > endMin) {
      resultDiv.textContent = "Horário inválido. Escolha um horário permitido.";
      return;
    }

    // Evitar marcações duplicadas
    const bookingKey = `${dataStr}T${horaStr}`;
    const bookingsKey = "washandclean_bookings";
    const bookings = JSON.parse(localStorage.getItem(bookingsKey) || "[]");

    if (bookings.includes(bookingKey)) {
      resultDiv.textContent = "Esse horário já está reservado. Escolha outro.";
      return;
    }

    bookings.push(bookingKey);
    localStorage.setItem(bookingsKey, JSON.stringify(bookings));

    // Mensagem final (extras + notas)
    const extrasText = extras.length ? `Extras: ${extras.join(", ")}` : "Extras: nenhum";
    const userMsg = msg ? `Notas: ${msg}` : "Notas: sem notas";

    const finalMessage = `${extrasText}\n${userMsg}`;

    // Dados enviados para o EmailJS
    const templateParams = {
      name,
      email,
      telefone,
      servico,
      local,
      morada,
      mapa_url: hidMaps.value || "",
      dist_km: hidDist.value || "",
      taxa: hidFee.value || "",
      data: dataStr,
      hora: horaStr,
      message: finalMessage,
    };

    resultDiv.textContent = "A enviar marcação...";

    emailjs
      .send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
      .then(() => {
        resultDiv.textContent = "✅ Marcação efetuada com sucesso! Email enviado.";
        form.reset();

        // reset painel / dados mapa
        if (feeZone) feeZone.textContent = "—";
        if (feeDistance) feeDistance.textContent = "—";
        if (feeExtraKm) feeExtraKm.textContent = "—";
        if (feeTotal) feeTotal.textContent = "—";
        if (feeNote) feeNote.textContent = "—";
        if (clickMarker) clickMarker.remove();
        if (mapEl) delete mapEl.dataset.selected;

        hidLat.value = "";
        hidLng.value = "";
        hidMaps.value = "";
        hidDist.value = "";
        hidFee.value = "";
      })
      .catch((error) => {
        console.error("EmailJS erro:", error);
        resultDiv.textContent = "⚠️ Marcação registada, mas ocorreu um erro ao enviar o email.";
      });
  });
});
