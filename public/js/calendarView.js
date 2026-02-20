import { getFullCalendar, createParticipant, createavailabilityBlock, deleteParticipant, updateavailabilityBlock, deleteavailabilityBlock } from "./api.js";

const params = new URLSearchParams(window.location.search);
const token = params.get("token");

if (!token) {
    alert("No calendar token provided");
    window.location.href = "/";
}

// helper: local participant id stored per calendar token
function getLocalParticipantId(){
    try{ const v = localStorage.getItem('participant:' + token); return v ? Number(v) : null;}catch(e){return null}
}

function setLocalParticipantId(id){
    try{ localStorage.setItem('participant:' + token, String(id)); }catch(e){}
}

// Open popup for editing existing block
function openEditBlockPopup(block){
    const editPopup = document.getElementById('editAvailabilityPopup');
    const availabilityId = document.getElementById('editAvailabilityId');
    const participantSelect = document.getElementById('editParticipantSelect');
    const startTimeInput = document.getElementById('editStartTime');
    const endTimeInput = document.getElementById('editEndTime');

    availabilityId.value = block.id || '';
    if (participantSelect) participantSelect.value = block.participant_id || '';
    
    if (startTimeInput && endTimeInput){
        startTimeInput.value = `${block.start_date}T${block.start_time}`;
        endTimeInput.value   = `${block.end_date}T${block.end_time}`;
    }
    
    editPopup.classList.add('active');
}

// Reset popup for creating
function openCreatePopup(){
    const addPopup = document.getElementById('availabilityPopup');
    const participantSelect = document.getElementById('participantSelect');
    const startTimeInput = document.getElementById('startTime');
    const endTimeInput = document.getElementById('endTime');

    if (participantSelect && participantSelect.options.length > 0) participantSelect.selectedIndex = 0;
    
    if (startTimeInput && calendarMinDate){
        startTimeInput.value = `${calendarMinDate}T09:00`;
    }
    if (endTimeInput && calendarMinDate){
        endTimeInput.value = `${calendarMinDate}T10:00`;
    }
    
    addPopup.classList.add('active');
}

// Handler for ADD popup save button
const addBtn = document.getElementById('addavailabilityBtn');
if (addBtn){
    addBtn.addEventListener('click', async () => {
        const addPopup = document.getElementById('availabilityPopup');
        const participantSelectEl = document.getElementById('participantSelect');
        const startTimeInput = document.getElementById('startTime');
        const endTimeInput = document.getElementById('endTime');

        const participantId = participantSelectEl && participantSelectEl.value
        ? Number(participantSelectEl.value)
        : null;

        if (startTimeInput && endTimeInput && startTimeInput.value && endTimeInput.value){
            const s = startTimeInput.value;
            const e = endTimeInput.value;

            if (s >= e) return alert('Start must be before end');

            // Helper: round time to nearest :00 or :30
            function roundToHalfHour(timeStr) {
                const [h, m] = timeStr.split(':').map(Number);
                const rounded = m < 15 ? 0 : (m < 45 ? 30 : 60);
                if (rounded === 60) {
                    return `${String((h + 1) % 24).padStart(2, '0')}:00`;
                }
                return `${String(h).padStart(2, '0')}:${String(rounded).padStart(2, '0')}`;
            }

            const start_date = s.split('T')[0];
            let start_time = s.split('T')[1];
            start_time = roundToHalfHour(start_time);

            const end_date = e.split('T')[0];
            let end_time = e.split('T')[1];
            end_time = roundToHalfHour(end_time);

            const requesterId = getLocalParticipantId();
            if (!requesterId) return alert('You must join the calendar before adding availability.');
            if (!participantId) return alert('Select a participant before saving.');

            try{
                await createavailabilityBlock({
                    participant_id: participantId,
                    start_date,
                    start_time,
                    end_date,
                    end_time,
                }, requesterId);

                addPopup.classList.remove('active');
                loadCalendar();

            } catch(err){
                alert('Failed to save availability: ' + err.message);
            }
        } else {
            alert('Please use the date/time inputs to set availability.');
        }
    });
}

// Handler for EDIT popup update button
const updateBtn = document.getElementById('updateAvailabilityBtn');
if (updateBtn){
    updateBtn.addEventListener('click', async () => {
        const editPopup = document.getElementById('editAvailabilityPopup');
        const availabilityIdEl = document.getElementById('editAvailabilityId');
        const participantSelectEl = document.getElementById('editParticipantSelect');
        const startTimeInput = document.getElementById('editStartTime');
        const endTimeInput = document.getElementById('editEndTime');

        const availabilityId = availabilityIdEl ? availabilityIdEl.value : '';
        const participantId = participantSelectEl && participantSelectEl.value
        ? Number(participantSelectEl.value)
        : null;

        if (startTimeInput && endTimeInput && startTimeInput.value && endTimeInput.value){
            const s = startTimeInput.value;
            const e = endTimeInput.value;

            if (s >= e) return alert('Start must be before end');

            // Helper: round time to nearest :00 or :30
            function roundToHalfHour(timeStr) {
                const [h, m] = timeStr.split(':').map(Number);
                const rounded = m < 15 ? 0 : (m < 45 ? 30 : 60);
                if (rounded === 60) {
                    return `${String((h + 1) % 24).padStart(2, '0')}:00`;
                }
                return `${String(h).padStart(2, '0')}:${String(rounded).padStart(2, '0')}`;
            }

            const start_date = s.split('T')[0];
            let start_time = s.split('T')[1];
            start_time = roundToHalfHour(start_time);

            const end_date = e.split('T')[0];
            let end_time = e.split('T')[1];
            end_time = roundToHalfHour(end_time);

            const requesterId = getLocalParticipantId();
            if (!requesterId) return alert('You must join the calendar before editing availability.');
            if (!participantId) return alert('Select a participant before saving.');

            try{
                await updateavailabilityBlock(
                    availabilityId,
                    start_date,
                    start_time,
                    end_date,
                    end_time,
                    requesterId
                );

                editPopup.classList.remove('active');
                loadCalendar();

            } catch(err){
                alert('Failed to update availability: ' + err.message);
            }
        } else {
            alert('Please use the date/time inputs to set availability.');
        }
    });
}

// Handler for EDIT popup delete button
const delBtn = document.getElementById('deleteAvailabilityBtn');
if (delBtn){
    delBtn.addEventListener('click', async () => {
        const editPopup = document.getElementById('editAvailabilityPopup');
        const availabilityId = document.getElementById('editAvailabilityId').value;
        if (!availabilityId) return;
        if (!confirm('Delete this availability block?')) return;
        try{
            const requesterId = getLocalParticipantId();
            if (!requesterId) return alert('You must join the calendar before deleting availability.');
            await deleteavailabilityBlock(availabilityId, requesterId);
            editPopup.classList.remove('active');
            loadCalendar();
        }catch(err){
            alert('Failed to delete availability: ' + err.message);
        }
    });
}



// populate participant select after loading calendar
function populateParticipantSelect(participants){
    const addSel = document.getElementById('participantSelect');
    const editSel = document.getElementById('editParticipantSelect');
    
    [addSel, editSel].forEach(sel => {
        if (!sel) return;
        sel.innerHTML = '';
        participants.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = p.name;
            sel.appendChild(opt);
        });
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
                const params = new URLSearchParams(window.location.search);
                const isCreator = params.get('created');

                const body = { calendar_token: token, name };
                if (isCreator) body.set_as_owner = true;

                const resp = await createParticipant(body);
                if (resp && resp.id) setLocalParticipantId(resp.id);

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

// Close button for edit popup
const editAvailabilityPopup = document.getElementById("editAvailabilityPopup");
if (editAvailabilityPopup) {
    const closeEditAvailabilityBtn = editAvailabilityPopup.querySelector(".closeEditAvailabilityBtn");
    if (closeEditAvailabilityBtn) {
        closeEditAvailabilityBtn.addEventListener("click", () => {
            editAvailabilityPopup.classList.remove("active");
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

        const localId = getLocalParticipantId();
        const ownerId = data.calendar ? data.calendar.owner_participant_id : null;
        document.getElementById("ParticipantsList").innerHTML =
            (data.participants || [])
                .map(p => {
                    const showDelete = localId && ownerId && Number(localId) === Number(ownerId);
                    return `
                    <li class="participant-item">
                        <span class="color-box" style="background:${p.color || '#ccc'}"></span>
                        <span class="participant-name">${p.name}</span>
                        ${showDelete ? `<button class="delete-btn" data-participant-id="${p.id}">✕</button>` : ''}
                    </li>
                `
                })
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

            // Set bounds for edit popup inputs
            const editStartInput = document.getElementById("editStartTime");
            const editEndInput = document.getElementById("editEndTime");

            if (editStartInput){
                editStartInput.min = toDateTimeLocal(calendarMinDate, String(startHour).padStart(2,'0')+":00");
                editStartInput.max = toDateTimeLocal(calendarMaxDate, String(endHour).padStart(2,'0')+":00");
            }

            if (editEndInput){
                editEndInput.min = toDateTimeLocal(calendarMinDate, String(startHour).padStart(2,'0')+":01");
                editEndInput.max = toDateTimeLocal(calendarMaxDate, String(endHour).padStart(2,'0')+":59");
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
            // populate participant select used by availability popup
            populateParticipantSelect(data.participants || []);
            const localId = getLocalParticipantId();
            const participantSelectEl = document.getElementById('participantSelect');
            const editParticipantSelectEl = document.getElementById('editParticipantSelect');
            if (participantSelectEl && localId) {
                participantSelectEl.value = String(localId);
            }
            if (editParticipantSelectEl && localId) {
                editParticipantSelectEl.value = String(localId);
            }

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
    const requesterId = getLocalParticipantId();
    if (!requesterId) return alert('Only calendar owner can delete participants.');
    try{
        await deleteParticipant(participantId, requesterId);
        loadCalendar();
    }catch(err){
        alert('Failed to delete participant: ' + err.message);
    }
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

    if (!startStr || !endStr) return;

    const HOUR_HEIGHT = 40;
    const HOURS = Math.max(1, (endHour - startHour));

    const start = parseYMD(startStr);
    const end = parseYMD(endStr);
    const grid = document.getElementById('calendarGrid');
    if (!grid) return;

    grid.innerHTML = '';

    const weekdays = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

    // iterate month-by-month and create a separate grid for each month intersecting the range
    let cur = new Date(start);
    while (cur <= end){
        const year = cur.getFullYear();
        const month = cur.getMonth();

        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 0);

        // segment of this month that belongs to requested range
        const segStart = (cur > monthStart) ? new Date(cur) : new Date(monthStart);
        const segEnd = (end < monthEnd) ? new Date(end) : new Date(monthEnd);

        // container for this month
        const monthContainer = document.createElement('div');
        monthContainer.className = 'calendar-month-container';

        // Month label
        const monthLabel = document.createElement('div');
        monthLabel.className = 'calendar-month-label';
        monthLabel.textContent = segStart.toLocaleString(undefined, { month: 'long', year: 'numeric' });
        monthContainer.appendChild(monthLabel);

        // Weekday header (repeat per month)
        const headerRow = document.createElement('div');
        headerRow.className = 'calendar-header';
        weekdays.forEach(d => {
            const el = document.createElement('div');
            el.className = 'calendar-weekday';
            el.textContent = d;
            headerRow.appendChild(el);
        });
        monthContainer.appendChild(headerRow);

        // body for days
        const body = document.createElement('div');
        body.className = 'calendar-body';
        monthContainer.appendChild(body);

        // compute empties so the first visible day sits under correct weekday
        const startDayIndex = (segStart.getDay() + 6) % 7;
        for (let i = 0; i < startDayIndex; i++){
            const empty = document.createElement('div');
            empty.className = 'calendar-day empty';
            body.appendChild(empty);
        }

        // generate visible days for this month segment
        for (let d = new Date(segStart); d <= segEnd; d.setDate(d.getDate() + 1)){
            const dayCol = document.createElement('div');
            dayCol.className = 'calendar-day';

            // day header
            const header = document.createElement('div');
            header.className = 'day-header';
            header.textContent = d.getDate();

            // hours container
            const hours = document.createElement('div');
            hours.className = 'hours';
            hours.style.height = (HOURS * HOUR_HEIGHT + HOURS) + 'px';

            for (let i = 0; i < HOURS; i++){
                const hour = startHour + i;

                const hourRow = document.createElement('div');
                hourRow.className = 'hour-row';
                hourRow.style.height = HOUR_HEIGHT + 'px';

                const label = document.createElement('div');
                label.className = 'hour-label';
                label.textContent = hour.toString().padStart(2,'0') + ':00';

                hourRow.appendChild(label);
                hours.appendChild(hourRow);
            }
            dayCol.appendChild(header);
            dayCol.appendChild(hours);

            // render availability blocks for this date
            const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
            // helper maps
            const participantsById = {};
            (participants || []).forEach(p => { participantsById[String(p.id)] = p; });

            // Render vertical participant bars (columns) inside the day column so many participants fit side-by-side
            const dateStart = new Date(`${dateStr}T${String(startHour).padStart(2,'0')}:00`);
                const dateEnd   = new Date(`${dateStr}T${String(endHour).padStart(2,'0')}:00`);

                const dateBlocks = (blocks || []).map(b => {

                    const blockStart = new Date(`${b.start_date || b.date}T${b.start_time}`);
                    const blockEnd   = new Date(`${b.end_date   || b.date}T${b.end_time}`);

                    // jeśli blok w ogóle nie przecina się z tym dniem kalendarza
                    if (blockEnd <= dateStart || blockStart >= dateEnd) return null;

                    // przycinamy do granic dnia kalendarza (NIE 00:00-23:59)
                    const effectiveStart = new Date(Math.max(blockStart, dateStart));
                    const effectiveEnd   = new Date(Math.min(blockEnd, dateEnd));

                    const startMinutes =
                        effectiveStart.getHours() * 60 + effectiveStart.getMinutes();

                    const endMinutes =
                        effectiveEnd.getHours() * 60 + effectiveEnd.getMinutes();

                    return Object.assign({}, b, {
                        startMinutes,
                        endMinutes
                    });

                }).filter(Boolean);

            const participantOrder = (participants || []).map(p => String(p.id));
            const maxParticipants = Math.max(1, participantOrder.length);

            // determine per-participant column widths (allow variable thickness: some wider, some narrower)
            // strategy: allocate base percent and add a small deterministic variation for visual variety
            const basePercent = 100 / Math.max(6, maxParticipants);
            // compute raw widths with a small deterministic variation, enforce a pixel-friendly minimum
            const rawWidths = participantOrder.map((pid, idx) => {
                const variation = ((idx * 37) % 11) - 5; // range -5..+5
                const w = Math.max(4, basePercent + variation * 0.6);
                return w;
            });

            // normalize widths so they sum to 100% (prevents overlaps)
            const sumRaw = rawWidths.reduce((a,b) => a + b, 0) || 1;
            const widths = rawWidths.map(w => (w / sumRaw) * 100);

            // compute left offsets cumulatively from normalized widths
            const leftOffsets = [];
            let acc = 0;
            widths.forEach((w, i) => { leftOffsets[i] = acc; acc += w; });

            // render vertical bars for each block
            dateBlocks.forEach(b => {
                const pid = String(b.participant_id);
                const pIdx = participantOrder.indexOf(pid);
                if (pIdx === -1) return;
                const p = participantsById[pid];

                const calendarStartMinutes = startHour * 60;
                const topPx = ((b.startMinutes - calendarStartMinutes) / 60) * HOUR_HEIGHT;
                const heightPx = ((b.endMinutes - b.startMinutes) / 60) * HOUR_HEIGHT;

                const colLeftPercent = leftOffsets[pIdx] || 0;
                const colWidthPercent = widths[pIdx] || basePercent;

                const bar = document.createElement('div');
                bar.className = 'availability-bar';
                bar.style.top = Math.max(0, topPx) + 'px';
                bar.style.height = Math.max(8, heightPx) + 'px';
                bar.style.left = `${colLeftPercent}%`;
                bar.style.width = `${colWidthPercent}%`;
                bar.style.background = (p && p.color) ? p.color : '#6c63ff';
                bar.dataset.blockId = b.id;
                bar.dataset.participantId = b.participant_id;
                bar.addEventListener('click', (ev)=>{ ev.stopPropagation(); openEditBlockPopup(b); });
                hours.appendChild(bar);
            });

            // Compute fully-available intervals (everyone available) and render opaque green overlay
            if (participantOrder.length > 0){
                function mergeIntervals(intervals){
                    if (!intervals.length) return [];
                    intervals.sort((a,b)=>a[0]-b[0]);
                    const res = [intervals[0].slice()];
                    for (let i=1;i<intervals.length;i++){
                        const [s,e] = intervals[i];
                        const last = res[res.length-1];
                        if (s <= last[1]) last[1] = Math.max(last[1], e); else res.push([s,e]);
                    }
                    return res;
                }

                const perParticipantAvail = {};
                participantOrder.forEach(pid => {
                    const ints = dateBlocks.filter(b=>String(b.participant_id)===pid).map(b=>[b.startMinutes, b.endMinutes]);
                    perParticipantAvail[pid] = mergeIntervals(ints);
                });

                // intersect intervals across participants
                let common = null;
                for (const pid of participantOrder){
                    const ints = perParticipantAvail[pid];
                    if (common === null) { common = ints.slice(); continue; }
                    const next = [];
                    for (const a of common) for (const b of ints){
                        const s = Math.max(a[0], b[0]);
                        const e = Math.min(a[1], b[1]);
                        if (s < e) next.push([s,e]);
                    }
                    common = mergeIntervals(next);
                }

                if (common && common.length){
                    common.forEach(iv => {
                        const s = iv[0]; const e = iv[1];
                        const calendarStartMinutes = startHour * 60;
                        const topPx = ((s - calendarStartMinutes) / 60) * HOUR_HEIGHT;
                        const heightPx = ((e - s) / 60) * HOUR_HEIGHT;
                        const overlay = document.createElement('div');
                        overlay.className = 'availability-block all-available';
                        overlay.style.top = Math.max(0, topPx) + 'px';
                        overlay.style.height = Math.max(8, heightPx) + 'px';
                        overlay.style.left = '0';
                        overlay.style.width = '100%';
                        overlay.style.zIndex = '20';
                        hours.appendChild(overlay);
                    });
                }
            }
            body.appendChild(dayCol);
        }

        grid.appendChild(monthContainer);

        // advance to next day after this segment
        cur = new Date(segEnd);
        cur.setDate(cur.getDate() + 1);
    }
}


