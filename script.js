/***************************
 * CONFIG EMAILJS
 ***************************/
const EMAILJS_PUBLIC_KEY = "cdiDJc8D7sHW03DtO";
const EMAILJS_SERVICE_ID = "cdJDp8D7sHW03DtO";

// ✅ DONO (vai para o teu email)
const EMAILJS_TEMPLATE_OWNER = "template_o4q3p79";

// ✅ CLIENTE (vai para {{email}})
const EMAILJS_TEMPLATE_CLIENT = "template_tjvfmk9";

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

  const money = (n) => {
    const v = Number(n) || 0;
    return `${v.toFixed(2).replace(".", ",")}€`;
  };

  const parseEuroFromText = (text) => {
    const t = String(text || "");
    const m = t.match(/(\d+(?:[.,]\d{1,2})?)/);
    if (!m) return 0;
    return Number(m[1].replace(",", ".")) || 0;
  };

  // Preços dos serviços (para calcular total)
  const SERVICE_PRICES = {
    "Lavagem Interior Simples": 15,
    "Lavagem Interior Completa": 25,
    "Lavagem Exterior Simples": 15,
    "Lavagem Exterior Completa": 25,
    "Interior + Exterior Simples": 30,
    "Interior + Exterior Completa": 50,
  };

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
  const selectService = document.getElementById("clienteServico");

  // Painel (spans)
  const feeZone = document.getElementElt("feeZone");
  const feeDistance = document.getElementById("feeDistance");
  const feeExtraKm = document.getElementById("feeExtraKm");
  const feeTotal = document.getElementById("feeTotal");
  const feeNote = document.getElementById("feeNote");

  // Resumo no formulário (se existir no HTML)
  const sumService = document.getElementById("sumService");
  const sumExtras = document.getElementById("sumExtras");
  const sumTravel = document.getElementById("sumTravel");
  const sumTotal = document.getElementById("sumTotal");

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
  const hidTotal = ensureHidden("clienteTotal", "total");

  // ---------- Cálculo do total ----------
  const getExtras = () =>
    Array.from(document.querySelectorAll('input[name="extras"]:checked')).map((x) => x.value);

  const calcExtrasPrice = (extrasList) =>
    extrasList.reduce((acc, item) => acc + parseEuroFromText(item), 0);

  const getTravelFee = () => Number(hidFee.value || 0) || 0;

  const calcTotalsAndRender = () => {
    const serviceName = selectService ? selectService.value : "";
    const servicePrice = SERVICE_PRICES[serviceName] ?? 0;

    const extrasList = getExtras();
    const extrasPrice = calcExtrasPrice(extrasList);

    const travelFee = getTravelFee();
    const total = servicePrice + extrasPrice + travelFee;

    // Atualiza resumo no formulário (se existir)
    if (sumService) sumService.textContent = money(servicePrice);
    if (sumExtras) sumExtras.textContent = extrasPrice > 0 ? money(extrasPrice) : "0,00€";
    if (sumTravel) sumTravel.textContent = travelFee > 0 ? money(travelFee) : "Grátis";
    if (sumTotal) sumTotal.textContent = money(total);

    // Guardar total para email
    hidTotal.value = total.toFixed(2);

    return { serviceName, servicePrice, extrasList, extrasPrice, travelFee, total };
  };

  // Atualiza resumo quando mudam inputs
  if (selectService) selectService.addEventListener("change", calcTotalsAndRender);
  document.querySelectorAll('input[name="extras"]').forEach((cb) => {
    cb.addEventListener("change", calcTotalsAndRender);
  });

  // ---------- Iniciar mapa ----------
  let map, clickMarker;

  if (mapEl && window.L) {
    map = L.map("serviceMap", { scrollWheelZoom: false });
    map.setView([41.51, -8.36], 11);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    BASES.forEach((b) => {
      L.marker([b.lat, b.lng]).addTo(map).bindPopup(`<b>${b.name}</b> (base)`);

      L.circle([b.lat, b.lng], {
        radius: FREE_KM * 1000,
        color: "#1cc88a",
        weight: 2,
        fillColor: "#1cc88a",
        fillOpacity: 0.12,
      }).addTo(map);
    });

    map.on("click", (e) => {
      const { lat, lng } = e.latlng;

      if (clickMarker) clickMarker.remove();
      clickMarker = L.marker([lat, lng]).addTo(map);

      let best = null;
      BASES.forEach((b) => {
        const dMeters = map.distance([lat, lng], [b.lat, b.lng]);
        if (!best || dMeters < best.dMeters) best = { ...b, dMeters };
      });

      const distKm = best.dMeters / 1000;
      const extraKm = Math.max(0, distKm - FREE_KM);
      const fee = extraKm * RATE;

      if (feeZone) feeZone.textContent = best.name;
      if (feeDistance) feeDistance.textContent = `${round1(distKm)} km`;
      if (feeExtraKm) feeExtraKm.textContent = `${round1(extraKm)} km`;
      if (feeTotal) feeTotal.textContent = fee === 0 ? "Grátis" : money(fee);

      if (feeNote) {
        feeNote.textContent =
          fee === 0
            ? `Dentro de ${FREE_KM} km da base (${best.name}).`
            : `Depois de ${FREE_KM} km: ${RATE.toFixed(2).replace(".", ",")}€/km (base mais próxima: ${best.name}).`;
      }

      const mapsUrl = `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`;

      if (inputZona) inputZona.value = best.name;

      if (inputMorada) {
        inputMorada.value = `Local selecionado no mapa: ${lat.toFixed(6)}, ${lng.toFixed(6)} | ${mapsUrl}`;
      }

      hidMaps.value = mapsUrl;
      hidDist.value = round1(distKm).toString();
      hidFee.value = fee === 0 ? "0.00" : fee.toFixed(2);

      mapEl.dataset.selected = "1";

      // ✅ atualizar total quando muda deslocação
      calcTotalsAndRender();
    });

    setTimeout(() => map.invalidateSize(), 200);
    window.addEventListener("resize", () => map.invalidateSize());
  }

  // Inicializa o resumo ao abrir
  calcTotalsAndRender();

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
    const extrasList = getExtras();

    if (!name || !email || !phone || !morada || !date || !time) {
      resultDiv.textContent = "Preencha todos os campos obrigatórios.";
      return;
    }

    // Validar horário
    const [year, month, day] = date.split("-").map(Number);
    const [hh, mm] = time.split(":").map(Number);
    const selected = new Date(year, month - 1, day, hh, mm);
    const weekday = selected.getDay();
    const totalMin = hh * 60 + mm;

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

    // ✅ valores finais
    const { servicePrice, extrasPrice, travelFee, total } = calcTotalsAndRender();

    // Mensagem final
    const extrasText = extrasList.length ? `Extras: ${extrasList.join(", ")}` : "Extras: nenhum";
    const userMsg = msg ? `Notas: ${msg}` : "Notas: sem notas";
    const finalMessage = `${extrasText}\n${userMsg}`;

    const extrasTextClean = extrasList.length ? extrasList.join(", ") : "Nenhum";

    // ✅ PARAMS (usa os mesmos placeholders nos dois templates)
    const templateParams = {
      name,
      email,
      phone,
      service,
      local,
      morada,

      mapa_url: hidMaps.value || "",
      dist_km: hidDist.value || "",
      taxa: travelFee.toFixed(2),

      extras: extrasTextClean,

      service_price: servicePrice.toFixed(2),
      extras_price: extrasPrice.toFixed(2),
      travel_fee: travelFee.toFixed(2),
      total: total.toFixed(2),

      date,
      time,
      message: finalMessage,
    };

    resultDiv.textContent = "A enviar marcação...";

    // 1) Email para TI (DONO)
    emailjs
      .send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_OWNER, templateParams)
      .then(() => {
        // 2) Email de confirmação para o CLIENTE
        return emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_CLIENT, templateParams);
      })
      .then(() => {
        resultDiv.textContent = "✅ Marcação efetuada com sucesso! Emails enviados.";
        form.reset();

        // reset painel mapa
        if (feeZone) feeZone.textContent = "—";
        if (feeDistance) feeDistance.textContent = "—";
        if (feeExtraKm) feeExtraKm.textContent = "—";
        if (feeTotal) feeTotal.textContent = "—";
        if (feeNote) feeNote.textContent = "—";
        if (clickMarker) clickMarker.remove();
        if (mapEl) delete mapEl.dataset.selected;

        hidMaps.value = "";
        hidDist.value = "";
        hidFee.value = "0.00";
        hidTotal.value = "";

        calcTotalsAndRender();
      })
      .catch((error) => {
        console.error("EmailJS erro:", error);
        resultDiv.textContent = "⚠️ Marcação registada, mas ocorreu um erro ao enviar o email.";
      });
  });
});

// ✅ helper (evita erro se não existir)
function document.getElementByIdSafe(id){ return document.getElementById(id); }

