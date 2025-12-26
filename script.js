/***************************
 * CONFIG EMAILJS
 ***************************/
const EMAILJS_PUBLIC_KEY = "cdiDJc8D7sHW03DtO";
const EMAILJS_SERVICE_ID = "cdJDp8D7sHW03DtO";
const EMAILJS_TEMPLATE_ID = "template_o4q3p79";

(function () {
  emailjs.init(EMAILJS_PUBLIC_KEY);
})();

window.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("bookingForm");
  const resultDiv = document.getElementById("bookingResult");
  if (!form) return;

  function getSelectedExtras() {
    const checked = [...document.querySelectorAll('input[name="extras"]:checked')];
    return checked.map((c) => c.value);
  }

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
    const extras = getSelectedExtras();

    if (!name || !email || !telefone || !morada || !dataStr || !horaStr) {
      resultDiv.textContent = "Preenche todos os campos obrigatórios (incluindo telefone e morada).";
      return;
    }

    // Validar data/hora (mantive a tua lógica)
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
      resultDiv.textContent = "Horário inválido. Escolhe um horário permitido.";
      return;
    }

    // Evitar marcações duplicadas
    const bookingKey = `${dataStr}T${horaStr}`;
    const bookingsKey = "washandclean_bookings";
    const bookings = JSON.parse(localStorage.getItem(bookingsKey) || "[]");

    if (bookings.includes(bookingKey)) {
      resultDiv.textContent = "Esse horário já está reservado. Escolhe outro.";
      return;
    }

    bookings.push(bookingKey);
    localStorage.setItem(bookingsKey, JSON.stringify(bookings));

    // Texto dos extras para o email
    const extrasText = extras.length ? extras.join(", ") : "Nenhum";

    // Dados enviados para o EmailJS
    const templateParams = {
      name: name,
      email: email,
      telefone: telefone,
      morada: morada,       // ✅ local exato
      local: local,
      servico: servico,
      data: dataStr,
      hora: horaStr,
      extras: extrasText,   // ✅ extras separados
      message: msg || "Sem mensagem adicional",
    };

    resultDiv.textContent = "A enviar marcação...";

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
