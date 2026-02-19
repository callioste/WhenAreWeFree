const BASE_URL = "http://localhost:3000";

// Calendar API
export async function getFullCalendar(token){
    const res = await fetch(`${BASE_URL}/calendars/${token}/full`);
    if (!res.ok){
        throw new Error(await res.text() || 'Calendar not found');
    }
    return await res.json();
}

export async function createCalendar(data){
    const res = await fetch(`${BASE_URL}/calendars`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    if (!res.ok){
        throw new Error(await res.text() || 'Failed to create calendar');
    }
    return await res.json();
}

export async function updateCalendar(token, name, description, startDate, endDate){
    const res = await fetch(`${BASE_URL}/calendars/${token}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, description, start_date: startDate, end_date: endDate })
    });

    if (!res.ok){
        throw new Error(await res.text() || 'Failed to update calendar');
    }
    return await res.json();
}

export async function deleteCalendar(token){
    const res = await fetch(`${BASE_URL}/calendars/${token}`, {
        method: 'DELETE'
    });
    
    if (!res.ok){
        throw new Error(await res.text() || 'Failed to delete calendar');
    }
    return await res.json();
}

// Participant API
export async function createParticipant(data){
    const res = await fetch(`${BASE_URL}/participants`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
    if (!res.ok){
        throw new Error(await res.text() || 'Failed to create participant');
    }
    return await res.json();
}

export async function deleteParticipant(id, token){
    let url = `${BASE_URL}/participants/${id}`;
    if (token) {
        url += `?token=${encodeURIComponent(token)}`;
    }

    const res = await fetch(url, {
        method: 'DELETE'
    });

    if(!res.ok){
        throw new Error(await res.text() || 'Failed to delete participant');
    }

    return true; 
}

// availabilityBlocks API (note endpoint uses dash to match server)
export async function createavailabilityBlock(data){
    const res = await fetch(`${BASE_URL}/availability-blocks`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }); 
    if (!res.ok){
        throw new Error(await res.text() || 'Failed to create availability block');
    }
    return await res.json();
}

export async function deleteavailabilityBlock(id){
    const res = await fetch(`${BASE_URL}/availability-blocks/${id}`, {
        method: 'DELETE'
    });

    if (!res.ok){
        throw new Error(await res.text() || 'Failed to delete availability block');
    }
    return await res.json();
}

export async function updateavailabilityBlock(id, date, startTime, endTime, status){
    const res = await fetch(`${BASE_URL}/availability-blocks/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ date, start_time: startTime, end_time: endTime, status })
    });

    if (!res.ok){
        throw new Error(await res.text() || 'Failed to update availability block');
    }
    return await res.json();
}



