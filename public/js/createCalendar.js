import { createCalendar } from "./api.js";

const form = document.getElementById('calendarForm');
const startInput = document.getElementById("start_date");
const endInput = document.getElementById("end_date");
const startHourSelect = document.getElementById('start_hour');
const endHourSelect = document.getElementById('end_hour');

// date logic validation
if (startInput && endInput) {
  const today = new Date().toISOString().split("T")[0];

  startInput.min = today;
  endInput.min = today;

  startInput.addEventListener("change", () => {
    endInput.min = startInput.value;

    if (endInput.value && endInput.value < startInput.value) {
      endInput.value = "";
    }
  });
}

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fd = new FormData(form);
    const data = {
      name: fd.get('name'),
      description: fd.get('description'),
      start_date: fd.get('start_date'),
      end_date: fd.get('end_date')
    };

    // optional meeting hours (hour selects) -> save hour as integer
    const sh = fd.get('start_hour');
    const eh = fd.get('end_hour');
    if (sh) data.start_hour = Number(sh);
    if (eh) data.end_hour = Number(eh);

    if (new Date(data.end_date) < new Date(data.start_date)) {
      alert("End date cannot be before start date.");
      return;
    }

    try {
      const res = await createCalendar(data);
      window.location.href = `calendar.html?token=${res.token}`;
    } catch (err) {
      alert('Create failed: ' + (err.message || err));
    }
  });
}

// populate hour selects (0..23) for full-hour meeting bounds
function populateHourSelectsCreate(){
  if (!startHourSelect || !endHourSelect) return;
  startHourSelect.innerHTML = '';
  endHourSelect.innerHTML = '';
  for (let h=0; h<24; h++){
    const o1 = document.createElement('option'); o1.value = String(h); o1.textContent = String(h).padStart(2,'0')+':00';
    const o2 = document.createElement('option'); o2.value = String(h); o2.textContent = String(h).padStart(2,'0')+':00';
    startHourSelect.appendChild(o1);
    endHourSelect.appendChild(o2);
  }
  startHourSelect.value = '9';
  endHourSelect.value = '17';
  // ensure end > start
  startHourSelect.addEventListener('change', ()=>{
    if (Number(startHourSelect.value) >= Number(endHourSelect.value)) {
      endHourSelect.value = String(Math.min(Number(startHourSelect.value)+1,23));
    }
  });
}

populateHourSelectsCreate();