/***************************
 * CONFIG EMAILJS
 ***************************/
const EMAILJS_PUBLIC_KEY = "cdiDJc8D7sHW03DtO";
const EMAILJS_SERVICE_ID = "cdJDp8D7sHW03DtO";
const EMAILJS_TEMPLATE_ID = "template_o4q3p79";

// Inicializar EmailJS (UMA VEZ)
(function () {
  emailjs.init(EMAILJS_PUBLIC_KEY);
})();

/***************************
 * SLIDER ANTES & DEPOIS
 ***************************/
window.addEventListener("DOMContentLoaded", function () {
  const range = document.getElementById("sliderRange");
  const after = document.querySelector(".after");

  if (range && after) {
    const updateClip = () => {
      const val = range.value;
      after.style.clipPath = `inset(0 0 0 ${100 - val}%)`;
    };
    range.addEventListener("input", updateClip);
    updateClip();
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

    emailjs
      .send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
      .then(() => {
        resultDiv.textContent =
          "✅ Marcação efetuada com sucesso! Email enviado.";
        form.reset();
      })
      .catch((error) => {
        console.error("EmailJS erro:", error);
        resultDiv.textContent =
          "⚠️ Marcação registada, mas ocorreu um erro ao enviar o email.";
      });
  });
});
