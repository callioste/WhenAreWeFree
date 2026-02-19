import { getFullCalendar, createParticipant, createavailabilityBlock, deleteParticipant, updateavailabilityBlock, deleteavailabilityBlock } from "./api.js";

const params = new URLSearchParams(window.location.search);
const token = params.get("token");

if (!token) {
    alert("No calendar token provided");
    window.location.href = "/";
}

// Open popup for editing existing block
function openEditBlockPopup(block){
    const availabilityId = document.getElementById('availabilityId');
    const participantSelect = document.getElementById('participantSelect');
    const statusRadios = document.getElementsByName('availabilityStatus');
    const startTimeInput = document.getElementById('startTime');
    const endTimeInput = document.getElementById('endTime');
    const title = document.getElementById('availabilityTitle');
    const deleteBtn = document.getElementById('deleteAvailabilityBtn');

    availabilityId.value = block.id || '';
    if (participantSelect) participantSelect.value = block.participant_id || '';
    for (const r of statusRadios) if (r.value === (block.status || 'available')) r.checked = true;
    // prefer datetime-local inputs if present
    if (startTimeInput && endTimeInput){
        // block.start_time is HH:MM, block.date is YYYY-MM-DD
        startTimeInput.value = `${block.date}T${block.start_time}`;
        endTimeInput.value = `${block.date}T${block.end_time}`;
    } else {
        // fallback to date+hour fields if any
        const startDate = document.getElementById('startDate');
        const endDate = document.getElementById('endDate');
        const startHourSel = document.getElementById('startHour');
        const endHourSel = document.getElementById('endHour');
        const date = block.date;
        if (startDate) startDate.value = date;
        if (endDate) endDate.value = date;
        if (startHourSel) startHourSel.value = String(Number(block.start_time.split(':')[0]));
        if (endHourSel) endHourSel.value = String(Number(block.end_time.split(':')[0]));
    }
    title.textContent = 'Edit availability block';
    deleteBtn.style.display = 'inline-block';
    availabilityPopup.classList.add('active');
}

// Reset popup for creating
function openCreatePopup(){
    const availabilityId = document.getElementById('availabilityId');
    const participantSelect = document.getElementById('participantSelect');
    const statusRadios = document.getElementsByName('availabilityStatus');
    const startInput = document.getElementById('startTime');
    const endInput = document.getElementById('endTime');
    const title = document.getElementById('availabilityTitle');
    const deleteBtn = document.getElementById('deleteAvailabilityBtn');

    availabilityId.value = '';
    if (participantSelect && participantSelect.options.length > 0) participantSelect.selectedIndex = 0;
    for (const r of statusRadios) r.checked = (r.value === 'available');
    const startTimeInput = document.getElementById('startTime');
    const endTimeInput = document.getElementById('endTime');
    if (startTimeInput && calendarMinDate){
        startTimeInput.value = `${calendarMinDate}T09:00`;
    }
    if (endTimeInput && calendarMinDate){
        endTimeInput.value = `${calendarMinDate}T10:00`;
    }
    title.textContent = 'Add availability block';
    deleteBtn.style.display = 'none';
    availabilityPopup.classList.add('active');
}

// wire popup save/delete actions
const saveBtn = document.getElementById('addavailabilityBtn');
if (saveBtn){
    saveBtn.addEventListener('click', async () => {
        const availabilityId = document.getElementById('availabilityId').value;
        const participantId = document.getElementById('participantSelect').value;
        const status = document.querySelector('input[name="availabilityStatus"]:checked').value;
        const startDateVal = document.getElementById('startDate').value;
        const endDateVal = document.getElementById('endDate').value;
        // prefer datetime-local inputs if present
        const startTimeInput = document.getElementById('startTime');
        const endTimeInput = document.getElementById('endTime');
        let date, start_time, end_time;
        if (startTimeInput && endTimeInput && startTimeInput.value && endTimeInput.value){
            // datetime-local value format: YYYY-MM-DDTHH:MM
            const s = startTimeInput.value; // e.g. 2026-02-19T09:30
            const e = endTimeInput.value;
            date = s.split('T')[0];
            start_time = s.split('T')[1];
            end_time = e.split('T')[1];
            // basic validation
            if (s >= e) return alert('Start must be before end');
        } else {
            // fallback to hour-only fields
            const startHourVal = document.getElementById('startHour') ? document.getElementById('startHour').value : null;
            const endHourVal = document.getElementById('endHour') ? document.getElementById('endHour').value : null;
            if (startHourVal === null || endHourVal === null || !startDateVal) return alert('Missing fields');
            const startHourNum = parseInt(String(startHourVal).trim(), 10);
            const endHourNum = parseInt(String(endHourVal).trim(), 10);
            if (isNaN(startHourNum) || isNaN(endHourNum)) return alert('Please enter valid hour numbers');
            if (startHourNum < calendarStartHour || startHourNum > calendarEndHour || endHourNum < calendarStartHour || endHourNum > calendarEndHour) return alert(`Hours must be between ${calendarStartHour} and ${calendarEndHour}`);
            if (startHourNum >= endHourNum) return alert('Start hour must be before end hour');
            date = startDateVal;
            start_time = `${String(startHourNum).padStart(2,'0')}:00`;
            end_time = `${String(endHourNum).padStart(2,'0')}:00`;
        }

        try{
            if (availabilityId){
                await updateavailabilityBlock(availabilityId, date, start_time, end_time, status);
            } else {
                await createavailabilityBlock({ participant_id: participantId, date, start_time, end_time, status });
            }
            availabilityPopup.classList.remove('active');
            loadCalendar();
        }catch(err){
            alert('Failed to save availability: ' + err.message);
        }
    });
}

const delBtn = document.getElementById('deleteAvailabilityBtn');
if (delBtn){
    delBtn.addEventListener('click', async () => {
        const availabilityId = document.getElementById('availabilityId').value;
        if (!availabilityId) return;
        if (!confirm('Delete this availability block?')) return;
        try{
            await deleteavailabilityBlock(availabilityId);
            availabilityPopup.classList.remove('active');
            loadCalendar();
        }catch(err){
            alert('Failed to delete availability: ' + err.message);
        }
    });
}



// populate participant select after loading calendar
function populateParticipantSelect(participants){
    const sel = document.getElementById('participantSelect');
    if (!sel) return;
    sel.innerHTML = '';
    participants.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.name;
        sel.appendChild(opt);
    });
}

function populateHourSelects(startHour, endHour){
    const s = document.getElementById('startHour');
    const e = document.getElementById('endHour');
    console.debug('populateHourSelects called', { startHour, endHour, startEl: !!s, endEl: !!e });
    if (!s || !e) return;
    // ensure numeric
    startHour = Number(startHour) || 0;
    endHour = Number(endHour) || 23;
    // if inverted, swap
    if (startHour > endHour){
        const tmp = startHour; startHour = endHour; endHour = tmp;
    }
    // If elements are selects, populate options; if inputs, set min/max/step and defaults
    if (s.tagName === 'SELECT' && e.tagName === 'SELECT'){
        s.innerHTML = '';
        e.innerHTML = '';
        for (let h = startHour; h <= endHour; h++){
            const opt1 = document.createElement('option'); opt1.value = String(h); opt1.textContent = String(h).padStart(2,'0')+':00';
            const opt2 = document.createElement('option'); opt2.value = String(h); opt2.textContent = String(h).padStart(2,'0')+':00';
            s.appendChild(opt1);
            e.appendChild(opt2);
        }
        console.debug('populateHourSelects populated options', { startCount: s.children.length, endCount: e.children.length });
        // sensible defaults
        s.value = String(startHour);
        e.value = String(Math.min(startHour+1, endHour));
    } else {
        // assume numeric input
        try {
            s.type = 'number'; e.type = 'number';
        } catch (err) {}
        s.min = String(startHour); s.max = String(endHour); s.step = '1';
        e.min = String(startHour); e.max = String(endHour); e.step = '1';
        // set sensible defaults and clamp
        if (!s.value) s.value = String(startHour);
        if (!e.value) e.value = String(Math.min(startHour+1, endHour));
        if (Number(s.value) < startHour) s.value = String(startHour);
        if (Number(s.value) > endHour) s.value = String(endHour);
        if (Number(e.value) < startHour) e.value = String(startHour);
        if (Number(e.value) > endHour) e.value = String(endHour);
    }
}

/* =========================
   JOIN POPUP
========================= */

const joinPopup = document.getElementById("popup");
const joinBtn = document.getElementById("joinBtn");

if (joinBtn && joinPopup) {
    joinBtn.addEventListener("click", () => {
        joinPopup.classList.add("active");
    });

    const closeJoinBtn = joinPopup.querySelector(".closeBtn");
    if (closeJoinBtn) {
        closeJoinBtn.addEventListener("click", () => {
            joinPopup.classList.remove("active");
        });
    }

    const submitBtn = document.getElementById("submitBtn");

    if (submitBtn) {
        submitBtn.addEventListener("click", async () => {
            const nameInput = document.getElementById("textInput");
            const name = nameInput.value.trim();

            if (!name) return;

            try {
                await createParticipant({
                    calendar_token: token,
                    name
                });

                joinPopup.classList.remove("active");
                nameInput.value = "";
                loadCalendar();

            } catch (err) {
                alert("Failed to join calendar: " + err.message);
            }
        });
    }
}

/* =========================
   AVAILABILITY POPUP
========================= */

const availabilityPopup = document.getElementById("availabilityPopup");
const editBtn = document.getElementById("editBtn");

// calendar date bounds (will be set when loading calendar)
let calendarMinDate = null;
let calendarMaxDate = null;
// meeting hour bounds (will be set when loading calendar)
let calendarStartHour = 0;
let calendarEndHour = 23;

function toDateTimeLocal(dateStr, timeStr = "00:00"){
    // dateStr expected as YYYY-MM-DD, timeStr as HH:MM
    return `${dateStr}T${timeStr}`;
}

if (editBtn && availabilityPopup) {
    editBtn.addEventListener("click", () => {
        const startInput = document.getElementById("startTime");
        const endInput = document.getElementById("endTime");

        // ensure inputs exist and bounds are set; if not yet loaded, loadCalendar should set them
        if (calendarMinDate && startInput && endInput){
            // set sensible defaults inside bounds
            if (!startInput.value) startInput.value = toDateTimeLocal(calendarMinDate, "09:00");
            if (!endInput.value) endInput.value = toDateTimeLocal(calendarMinDate, "10:00");

            if (startInput.value < startInput.min) startInput.value = startInput.min;
            if (startInput.value > startInput.max) startInput.value = startInput.max;
            if (endInput.value < endInput.min) endInput.value = endInput.min;
            if (endInput.value > endInput.max) endInput.value = endInput.max;
        }

        availabilityPopup.classList.add("active");
    });

    const closeAvailabilityBtn =
        availabilityPopup.querySelector(".closeAvailabilityBtn");

    if (closeAvailabilityBtn) {
        closeAvailabilityBtn.addEventListener("click", () => {
            availabilityPopup.classList.remove("active");
        });
    }
}

/* =========================
   LOAD CALENDAR
========================= */

loadCalendar();

async function loadCalendar() {
    try {
        const data = await getFullCalendar(token);

        document.getElementById("calendarName").textContent =
            data.calendar.name;

        document.getElementById("calendarDescription").textContent =
            data.calendar.description;

        document.getElementById("calendarCode").textContent =
            "Code: " + data.calendar.token;

        document.getElementById("ParticipantsList").innerHTML =
            (data.participants || [])
                .map(p => `
                    <li class="participant-item">
                        <span class="color-box" style="background:${p.color || '#ccc'}"></span>
                        <span class="participant-name">${p.name}</span>
                        <button class="delete-btn" data-participant-id="${p.id}">✕</button>
                    </li>
                `)
                .join("");

        // set availability popup date bounds from calendar
        if (data.calendar && data.calendar.start_date && data.calendar.end_date){
            calendarMinDate = data.calendar.start_date; // YYYY-MM-DD
            calendarMaxDate = data.calendar.end_date;

            const startInput = document.getElementById("startTime");
            const endInput = document.getElementById("endTime");

            // determine meeting hours from calendar (fallback to 0-23)
            const startHour = (typeof data.calendar.start_hour !== 'undefined') ? Number(data.calendar.start_hour) : 0;
            const endHour = (typeof data.calendar.end_hour !== 'undefined') ? Number(data.calendar.end_hour) : 23;
            // expose to other handlers
            calendarStartHour = startHour;
            calendarEndHour = endHour;

            if (startInput){
                startInput.min = toDateTimeLocal(calendarMinDate, String(startHour).padStart(2,'0')+":00");
                startInput.max = toDateTimeLocal(calendarMaxDate, String(endHour).padStart(2,'0')+":00");
                // clamp value or set sensible default
                if (!startInput.value) startInput.value = toDateTimeLocal(calendarMinDate, String(Math.min(9, endHour)).padStart(2,'0')+":00");
                if (startInput.value < startInput.min) startInput.value = startInput.min;
                if (startInput.value > startInput.max) startInput.value = startInput.max;
            }

            if (endInput){
                endInput.min = toDateTimeLocal(calendarMinDate, String(startHour).padStart(2,'0')+":01");
                endInput.max = toDateTimeLocal(calendarMaxDate, String(endHour).padStart(2,'0')+":59");
                if (!endInput.value) endInput.value = toDateTimeLocal(calendarMinDate, String(Math.min(10, endHour)).padStart(2,'0')+":00");
                if (endInput.value < endInput.min) endInput.value = endInput.min;
                if (endInput.value > endInput.max) endInput.value = endInput.max;
            }
                // populate hour selects
                populateHourSelects(startHour, endHour);
                // set date input bounds and defaults
                const startDateInput = document.getElementById('startDate');
                const endDateInput = document.getElementById('endDate');
                if (startDateInput){
                    startDateInput.min = calendarMinDate;
                    startDateInput.max = calendarMaxDate;
                    if (!startDateInput.value) startDateInput.value = calendarMinDate;
                }
                if (endDateInput){
                    endDateInput.min = calendarMinDate;
                    endDateInput.max = calendarMaxDate;
                    if (!endDateInput.value) endDateInput.value = calendarMinDate;
                }
            // render calendar grid for the date range, include participants and availability
            renderCalendarGrid(calendarMinDate, calendarMaxDate, data.participants || [], data.availabilityBlocks || [], startHour, endHour);
        }

    } catch (err) {
        alert("Failed to load calendar: " + err.message);
    }
}

/* =========================
   Delete Participant
========================= */
const participantsListEl = document.getElementById("ParticipantsList");

if (participantsListEl) {
  participantsListEl.addEventListener("click", async (e) => {
    const btn = e.target.closest(".delete-btn");
    if (!btn) return;

    const participantId = btn.dataset.participantId;
    if (!participantId) return;

    const ok = confirm("Delete this participant?");
    if (!ok) return;
        await deleteParticipant(participantId, token);
        loadCalendar();
  });
}

/* =========================
   Copy Calendar Code
========================= */
const copyCodeBtn = document.getElementById("copyBtn");
if (copyCodeBtn) {
    copyCodeBtn.addEventListener("click", () => {
        navigator.clipboard.writeText(token).then(() => {
            alert("Calendar code copied to clipboard!");
        }).catch(err => {
            alert("Failed to copy code: " + err.message);
        });
    });
}

// --- Calendar grid rendering ---
function parseYMD(s){
    const [y,m,d] = s.split('-').map(Number);
    return new Date(y, m-1, d);
}

function formatDateLabel(date){
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function renderCalendarGrid(startStr, endStr, participants = [], blocks = [], startHour = 0, endHour = 23){

    const HOUR_HEIGHT = 40;
    const HOURS = Math.max(1, (endHour - startHour + 1));
    
    if (!startStr || !endStr) return;

    const start = parseYMD(startStr);
    const end = parseYMD(endStr);
    const grid = document.getElementById('calendarGrid');
    if (!grid) return;

    grid.innerHTML = '';

    // wrapper: left hours rail + right main calendar (header + body)
    const gridWrapper = document.createElement('div');
    gridWrapper.className = 'calendar-grid-wrapper';

    // hours rail (left column)
    const hoursRail = document.createElement('div');
    hoursRail.className = 'hours-rail';

    hoursRail.style.height = (HOURS * HOUR_HEIGHT) + 'px';

    for (let i = 0; i < HOURS; i++){
        const hour = startHour + i;

        const label = document.createElement('div');
        label.className = 'hour-rail-label';
        label.style.height = HOUR_HEIGHT + 'px';
        label.textContent = hour.toString().padStart(2,'0') + ':00';

        hoursRail.appendChild(label);
    }

    // main calendar area (right side)
    const mainArea = document.createElement('div');
    mainArea.className = 'calendar-main';

    const monthLabel = document.createElement('div');
    monthLabel.className = 'calendar-month-label';
    monthLabel.textContent = start.toLocaleString(undefined, { month: 'long', year: 'numeric' });
    mainArea.appendChild(monthLabel);

    const headerRow = document.createElement('div');
    headerRow.className = 'calendar-header';
    const weekdays = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    weekdays.forEach(d => {
        const el = document.createElement('div');
        el.className = 'calendar-weekday';
        el.textContent = d;
        headerRow.appendChild(el);
    });
    mainArea.appendChild(headerRow);

    const body = document.createElement('div');
    body.className = 'calendar-body';
    mainArea.appendChild(body);

    gridWrapper.appendChild(hoursRail);
    gridWrapper.appendChild(mainArea);
    grid.appendChild(gridWrapper);

    // 0=Sun → zamieniamy na 6, 1=Mon → 0
    const startDayIndex = (start.getDay() + 6) % 7;

    // puste pola przed start_date
    for (let i = 0; i < startDayIndex; i++){
        const empty = document.createElement('div');
        empty.className = 'calendar-day empty';
        body.appendChild(empty);
    }

    const HOUR_HEIGHT = 40;
    const HOURS = Math.max(1, (endHour - startHour + 1));

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)){

        const dayCol = document.createElement('div');
        dayCol.className = 'calendar-day';

        const header = document.createElement('div');
        header.className = 'day-header';
        header.textContent = d.getDate();

        const hours = document.createElement('div');
        hours.className = 'hours';
        hours.style.height = (HOURS * HOUR_HEIGHT) + 'px';

        for (let i = 0; i < HOURS; i++){
            const hourRow = document.createElement('div');
            hourRow.className = 'hour-row';
            hours.appendChild(hourRow);
        }

        dayCol.appendChild(header);
        dayCol.appendChild(hours);
        body.appendChild(dayCol);
    }
}

    dates.forEach((d, idx) => {
        const dayStr = d.toISOString().slice(0,10);

        // determine if this date is within the calendar's configured start/end
        const inRange = (d >= start && d <= end);

        const dayCol = document.createElement('div');
        dayCol.className = 'calendar-day';

        const header = document.createElement('div');
        header.className = 'day-header';
        header.textContent = inRange ? formatDateLabel(d) : '';

        const body = document.createElement('div');
        body.className = 'day-body';
        if (!inRange) dayCol.classList.add('outside-range');

        const hours = document.createElement('div');
        hours.className = 'hours';
        hours.style.height = (HOURS * HOUR_HEIGHT) + 'px';

        for (let i = 0; i < HOURS; i++){
            const hour = startHour + i;
            const hr = document.createElement('div');
            hr.className = 'hour-row';
            // show label on top-left of each hour
            const lbl = document.createElement('div');
            lbl.className = 'hour-label';
            lbl.textContent = (hour).toString().padStart(2,'0') + ':00';
            hr.appendChild(lbl);
            hours.appendChild(hr);
        }

        // place availability blocks for this date (only if inRange)
        if (inRange){
            const dayBlocks = blocksByDate[dayStr] || [];
            dayBlocks.forEach(b => {
            const p = participantsMap[b.participant_id];
            const color = (p && p.color) ? p.color : '#333';
            const status = b.status || 'available';

            const [sh, sm] = (b.start_time || '00:00').split(':').map(Number);
            const [eh, em] = (b.end_time || '00:00').split(':').map(Number);
            const startMin = sh * 60 + sm;
            const endMin = eh * 60 + em;

            // clip to visible meeting hours range
            const visibleStart = Math.max(startMin, startHour * 60);
            const visibleEnd = Math.min(endMin, (endHour + 1) * 60);
            if (visibleEnd <= visibleStart) return; // nothing to show in visible range

            const top = ((visibleStart - startHour*60) / 60) * HOUR_HEIGHT;
            const height = Math.max(6, ((visibleEnd - visibleStart) / 60) * HOUR_HEIGHT);

            const blockEl = document.createElement('div');
            blockEl.className = 'availability-block';
            blockEl.style.top = top + 'px';
            blockEl.style.height = height + 'px';
            blockEl.style.background = color;
            blockEl.style.opacity = (status === 'maybe') ? '0.5' : '1';
            blockEl.textContent = (p && p.name) ? p.name : 'Participant';
            if (b.id) blockEl.dataset.blockId = b.id;

            // click to edit
            blockEl.addEventListener('click', (ev) => {
                ev.stopPropagation();
                openEditBlockPopup(b);
            });

                    hours.appendChild(blockEl);
            });
        }

        body.appendChild(hours);

        dayCol.appendChild(header);
        dayCol.appendChild(body);

        inner.appendChild(dayCol);
    });

    grid.appendChild(inner);




