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
  const hidMaps = ensureHidden("clienteMapaUrl", "mapa_url");
  const hidDist = ensureHidden("clienteDistKm", "dist_km");
  const hidFee = ensureHidden("clienteTaxa", "taxa");

  // ---------- Iniciar mapa ----------
  let map, clickMarker;

  if (mapEl && window.L) {
    map = L.map("serviceMap", { scrollWheelZoom: false });

    // Centrar no Minho (entre Braga e Guimarães)
    map.setView([41.51, -8.36], 11);

    // Tiles (OpenStreetMap)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Markers das bases + círculo grátis 15km em cada base
    BASES.forEach((b) => {
      L.marker([b.lat, b.lng])
        .addTo(map)
        .bindPopup(`<b>${b.name}</b> (base)`);

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

      // Google Maps link
      const mapsUrl = `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`;

      // Atualiza "Zona"
      if (inputZona) inputZona.value = best.name;

      // Preenche morada automaticamente (podes editar manualmente depois)
      if (inputMorada) {
        inputMorada.value = `Local selecionado no mapa: ${lat.toFixed(6)}, ${lng.toFixed(6)} | ${mapsUrl}`;
      }

      // Hidden (para email)
      hidMaps.value = mapsUrl;
      hidDist.value = round1(distKm).toString();
      hidFee.value = fee === 0 ? "0.00" : fee.toFixed(2);

      mapEl.dataset.selected = "1";
    });

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
    const phone = document.getElementById("clienteTelefone").value.trim();
    const morada = document.getElementById("clienteMorada").value.trim();

    const service = document.getElementById("clienteServico").value;
    const local = document.getElementById("clienteLocal").value;

    const date = document.getElementById("clienteData").value;
    const time = document.getElementById("clienteHora").value;

    const msg = document.getElementById("clienteMensagem").value.trim();

    // Extras (checkboxes)
    const extras = Array.from(document.querySelectorAll('input[name="extras"]:checked'))
      .map((x) => x.value);

    if (!name || !email || !phone || !morada || !date || !time) {
      resultDiv.textContent = "Preencha todos os campos obrigatórios.";
      return;
    }

    // Validar horário
    const [year, month, day] = date.split("-").map(Number);
    const [h, m] = time.split(":").map(Number);
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

    // Evitar duplicados
    const bookingKey = `${date}T${time}`;
    const bookingsKey = "washandclean_bookings";
    const bookings = JSON.parse(localStorage.getItem(bookingsKey) || "[]");

    if (bookings.includes(bookingKey)) {
      resultDiv.textContent = "Esse horário já está reservado. Escolha outro.";
      return;
    }

    bookings.push(bookingKey);
    localStorage.setItem(bookingsKey, JSON.stringify(bookings));

    // Monta mensagem final
    const extrasText = extras.length ? `Extras: ${extras.join(", ")}` : "Extras: nenhum";
    const userMsg = msg ? `Notas: ${msg}` : "Notas: sem notas";
    const finalMessage = `${extrasText}\n${userMsg}`;

    // ✅ TemplateParams ALINHADOS COM EMAILJS
    const templateParams = {
      name,
      email,
      phone,
      service,
      local,
      morada,

      // extras no email
      extras: extras.join(", ") || "Nenhum",

      // mapa + distância + taxa
      mapa_url: hidMaps.value || "",
      dist_km: hidDist.value || "",
      taxa: hidFee.value || "",

      date,
      time,
      message: finalMessage,
    };

    resultDiv.textContent = "A enviar marcação...";

    emailjs
      .send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
      .then(() => {
        resultDiv.textContent = "✅ Marcação efetuada com sucesso! Email enviado.";
        form.reset();

        // reset painel
        if (feeZone) feeZone.textContent = "—";
        if (feeDistance) feeDistance.textContent = "—";
        if (feeExtraKm) feeExtraKm.textContent = "—";
        if (feeTotal) feeTotal.textContent = "—";
        if (feeNote) feeNote.textContent = "—";
        if (clickMarker) clickMarker.remove();
        if (mapEl) delete mapEl.dataset.selected;

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

