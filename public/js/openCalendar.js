function openCalendar() {
    const codeInput = document.querySelector('.inputRow .textInput');
    const code = codeInput.value.trim();

    if (!code) {
        alert('Please enter a calendar code');
        return;
    }

    window.location.href = `/calendar.html?token=${encodeURIComponent(code)}`;

}