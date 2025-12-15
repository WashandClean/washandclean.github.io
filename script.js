// Slider functionality for antes & depois
window.addEventListener('DOMContentLoaded', function () {
  const range = document.getElementById('sliderRange');
  const after = document.querySelector('.after');
  if (range && after) {
    const updateClip = () => {
      const val = range.value;
      after.style.clipPath = `inset(0 0 0 ${100 - val}% )`;
    };
    range.addEventListener('input', updateClip);
    updateClip();
  }

  // Booking form handling
  const form = document.getElementById('bookingForm');
  const resultDiv = document.getElementById('bookingResult');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      // Gather fields
      const name = document.getElementById('clienteNome').value.trim();
      const email = document.getElementById('clienteEmail').value.trim();
      const servico = document.getElementById('clienteServico').value;
      const local = document.getElementById('clienteLocal').value;
      const dataStr = document.getElementById('clienteData').value;
      const horaStr = document.getElementById('clienteHora').value;
      const msg = document.getElementById('clienteMensagem').value.trim();

      // Validate date/hora
      if (!dataStr || !horaStr) {
        resultDiv.textContent = 'Selecione data e hora válidas.';
        return;
      }
      // Parse date and time
      const [year, month, day] = dataStr.split('-').map(Number);
      const [h, m] = horaStr.split(':').map(Number);
      const selected = new Date(year, month - 1, day, h, m);
      const weekday = selected.getDay();
      const totalMin = h * 60 + m;

      // Determine allowed schedule
      let startMin, endMin;
      if (weekday >= 1 && weekday <= 5) {
        startMin = 17 * 60 + 30;
        endMin = 21 * 60 + 30;
      } else {
        startMin = 10 * 60;
        endMin = 19 * 60;
      }
      if (totalMin < startMin || totalMin > endMin) {
        resultDiv.textContent = 'Horário inválido. Escolha um horário permitido.';
        return;
      }
      // Booking key
      const bookingKey = `${dataStr}T${horaStr}`;
      const bookingsKey = 'washandclean_bookings';
      const bookings = JSON.parse(localStorage.getItem(bookingsKey) || '[]');
      if (bookings.includes(bookingKey)) {
        // Suggest next available slot
        let nextMin = totalMin + 30;
        let suggestion = null;
        while (nextMin <= endMin) {
          const hh = String(Math.floor(nextMin / 60)).padStart(2, '0');
          const mm = String(nextMin % 60).padStart(2, '0');
          const candidate = `${dataStr}T${hh}:${mm}`;
          if (!bookings.includes(candidate)) {
            suggestion = `${hh}:${mm}`;
            break;
          }
          nextMin += 30;
        }
        if (suggestion) {
          resultDiv.textContent = `Esse horário já está reservado. Sugerimos ${suggestion}.`;
        } else {
          resultDiv.textContent = 'Todos os horários desse dia estão reservados. Escolha outra data.';
        }
        return;
      }
      // Save booking
      bookings.push(bookingKey);
      localStorage.setItem(bookingsKey, JSON.stringify(bookings));

      // EmailJS placeholders (to configure)
      const EMAILJS_PUBLIC_KEY = '';
      const EMAILJS_SERVICE_ID = '';
      const EMAILJS_TEMPLATE_ID = '';
      const templateParams = {
        nome: name,
        email: email,
        servico: servico,
        local: local,
        data: dataStr,
        hora: horaStr,
        mensagem: msg,
      };
      if (EMAILJS_PUBLIC_KEY && EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID) {
        // eslint-disable-next-line no-undef
        emailjs.init(EMAILJS_PUBLIC_KEY);
        // eslint-disable-next-line no-undef
        emailjs
          .send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
          .then(() => {
            resultDiv.textContent = 'Marcação efetuada com sucesso! Confirmação enviada por email.';
          })
          .catch(() => {
            resultDiv.textContent = 'Marcação registada mas ocorreu um erro ao enviar o email.';
          });
      } else {
        resultDiv.textContent = 'Marcação efetuada com sucesso! Em breve entraremos em contacto.';
      }
      form.reset();
    });
  }
});
