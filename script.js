/***************************
 * CONFIG EMAILJS
 ***************************/
const EMAILJS_PUBLIC_KEY = "cdiDJc8D7sHW03DtO";
const EMAILJS_SERVICE_ID = "cdJDp8D7sHW03DtO";
const EMAILJS_TEMPLATE_ID = "template_o4q3p79";

// Inicializar EmailJS (UMA VEZ)
(function () {
  if (window.emailjs) emailjs.init(EMAILJS_PUBLIC_KEY);
})();

/***************************
 * MAPA (Braga + Guimarães)
 * - Até 15 km: 0€
 * - Depois: 0,25€/km
 ***************************/
function haversineKm(a, b) {
  const R = 6371; // km
  const toRad = (v) => (v * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(h));
}

function eur(v) {
  return `${v.toFixed(2).replace(".", ",")}€`;
}

function initServiceMap() {
  const mapEl = document.getElementById("serviceMap");
  if (!mapEl) return; // se ainda não tens o HTML do mapa, não faz nada

  // Se Leaflet não estiver carregado, mostra aviso no próprio bloco
  if (!window.L) {
    mapEl.innerHTML =
      "<div style='padding:16px;color:#fff;font-weight:700'>⚠️ Falta carregar o Leaflet no index.html (CSS + JS).</div>";
    return;
  }

  // Outputs (painel)
  const elZone = document.getElementById("feeZone");
  const elDistance = document.getElementById("feeDistance");
  const elExtraKm = document.getElementById("feeExtraKm");
  const elTotal = document.getElementById("feeTotal");
  const elNote = document.getElementById("feeNote");

  // Regras
  const FREE_KM = 15;
  const PRICE_PER_KM = 0.25;

  // Centros (aprox.)
  const HUBS = [
    { name: "Guimarães", lat: 41.444, lng: -8.296 }, // centro aprox
    { name: "Braga", lat: 41.545, lng: -8.426 },    // centro aprox
  ];

  // Mapa
  const map = L.map("serviceMap", {
    zoomControl: true,
    scrollWheelZoom: false,
  }).setView([41.50, -8.36], 11);

  // Tiles (OSM)
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap",
  }).addTo(map);

  // Estilo das zonas (tipo a imagem)
  const zoneFreeStyle = {
    color: "#1cc88a",
    weight: 3,
    opacity: 1,
    fillColor: "#1cc88a",
    fillOpacity: 0.22,
  };

  const zonePaidStyle = {
    color: "#ff4d4d",
    weight: 3,
    opacity: 1,
    fillColor: "#ff4d4d",
    fillOpacity: 0.18,
    dashArray: "6 8",
  };

  // Zonas: círculo grátis (15 km) à volta de cada hub
  const freeCircles = HUBS.map((h) =>
    L.circle([h.lat, h.lng], { radius: FREE_KM * 1000, ...zoneFreeStyle }).addTo(map)
  );

  // Zona “paga” maior só para efeito visual (não é limite real)
  const paidCircles = HUBS.map((h) =>
    L.circle([h.lat, h.lng], { radius: 45 * 1000, ...zonePaidStyle }).addTo(map)
  );

  // Marcadores
  HUBS.forEach((h) => {
    L.marker([h.lat, h.lng])
      .addTo(map)
      .bindPopup(`<b>Wash&Clean</b><br>${h.name}`);
  });

  // Marker do clique do cliente
  let customerMarker = null;

  function updatePanel(bestHubName, distKm) {
    const extraKm = Math.max(0, distKm - FREE_KM);
    const total = extraKm * PRICE_PER_KM;

    if (elZone) elZone.textContent = bestHubName;
    if (elDistance) elDistance.textContent = `${distKm.toFixed(1).replace(".", ",")} km`;
    if (elExtraKm) elExtraKm.textContent = `${extraKm.toFixed(1).replace(".", ",")} km`;
    if (elTotal) elTotal.textContent = total <= 0 ? "0,00€" : eur(total);

    if (elNote) {
      elNote.textContent =
        total <= 0
          ? `✅ Sem taxa (até ${FREE_KM} km).`
          : `ℹ️ ${FREE_KM} km incluídos. Restante a ${PRICE_PER_KM.toFixed(2).replace(".", ",")}€/km.`;
    }
  }

  // Clique no mapa => calcula com base no HUB mais próximo
  map.on("click", (e) => {
    const p = { lat: e.latlng.lat, lng: e.latlng.lng };

    // mais próximo entre Braga/Guimarães
    let best = null;
    for (const hub of HUBS) {
      const d = haversineKm({ lat: hub.lat, lng: hub.lng }, p);
      if (!best || d < best.distKm) best = { hub, distKm: d };
    }

    if (!best) return;

    if (customerMarker) customerMarker.remove();
    customerMarker = L.circleMarker([p.lat, p.lng], {
      radius: 8,
      color: "#ffffff",
      weight: 2,
      fillColor: "#0a74da",
      fillOpacity: 1,
    })
      .addTo(map)
      .bindPopup(
        `<b>Local selecionado</b><br>Zona: ${best.hub.name}<br>Distância: ${best.distKm.toFixed(1).replace(".", ",")} km`
      )
      .openPopup();

    updatePanel(best.hub.name, best.distKm);
  });

  // Inicial: mostra “pronto para clicar”
  if (elNote) {
    elNote.textContent = `Clique no mapa para calcular a taxa de deslocação (até ${FREE_KM} km grátis; depois ${PRICE_PER_KM.toFixed(2).replace(".", ",")}€/km).`;
  }
}

/***************************
 * FORMULÁRIO DE MARCAÇÃO
 ***************************/
window.addEventListener("DOMContentLoaded", function () {
  // Inicializar mapa (se existir no HTML)
  initServiceMap();

  const form = document.getElementById("bookingForm");
  const resultDiv = document.getElementById("bookingResult");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const name = document.getElementById("clienteNome").value.trim();
    const email = document.getElementById("clienteEmail").value.trim();
    const servico = document.getElementById("clienteServico").value;
    const local = document.getElementById("clienteLocal").value;
    const dataStr = document.getElementById("clienteData").value;
    const horaStr = document.getElementById("clienteHora").value;
    const msg = document.getElementById("clienteMensagem").value.trim();

    if (!name || !email || !dataStr || !horaStr) {
      resultDiv.textContent = "Preencha todos os campos obrigatórios.";
      return;
    }

    // Validar data/hora
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

    // Dados enviados para o EmailJS
    const templateParams = {
      name: name,
      email: email,
      servico: servico,
      local: local,
      data: dataStr,
      hora: horaStr,
      message: msg || "Sem mensagem adicional",
    };

    resultDiv.textContent = "A enviar marcação...";

    // Se EmailJS não carregou, avisa
    if (!window.emailjs) {
      resultDiv.textContent =
        "⚠️ Marcação registada, mas o EmailJS não carregou (verifica o script no index.html).";
      form.reset();
      return;
    }

    emailjs
      .send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
      .then(() => {
        resultDiv.textContent = "✅ Marcação efetuada com sucesso! Email enviado.";
        form.reset();
      })
      .catch((error) => {
        console.error("EmailJS erro:", error);
        resultDiv.textContent =
          "⚠️ Marcação registada, mas ocorreu um erro ao enviar o email.";
      });
  });
});

