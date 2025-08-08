$(function () {
    console.log('timeout starts')
    const IDLE_TIMEOUT = 20 * 60 * 1000; // 30 minutes total idle time
    const WARNING_TIME = 30 * 1000; // 30 seconds warning countdown
    let idleTimer, countdownTimer;
    let countdownSeconds = 30; // seconds for countdown

    //
    function resetTimer() {
        clearTimeout(idleTimer);
        clearInterval(countdownTimer);
        countdownSeconds = 30;
        idleTimer = setTimeout(showWarning, IDLE_TIMEOUT - WARNING_TIME);
    }

    function showWarning() {
        // Show SweetAlert with countdown
        Swal.fire({
            title: 'Session Expiring Soon',
            html: `<p>You will be logged out in <strong id="countdown">${countdownSeconds}</strong> seconds.<br>Do you want to stay logged in?</p>`,
            icon: 'warning',
            allowOutsideClick: false,
            allowEscapeKey: false,
            showCancelButton: true,
            confirmButtonText: 'Stay Logged In',
            cancelButtonText: 'Logout Now',
            didOpen: () => {
                const countdownElement = Swal.getHtmlContainer().querySelector('#countdown');

                countdownTimer = setInterval(() => {
                    countdownSeconds--;
                    countdownElement.textContent = countdownSeconds;

                    if (countdownSeconds <= 0) {
                        clearInterval(countdownTimer);
                        Swal.close();
                        logoutUser();
                    }
                }, 1000);
            }
        }).then((result) => {
            clearInterval(countdownTimer);
            if (result.isConfirmed) {
                // User chose to stay logged in
                resetTimer();
            } else {
                // User chose to logout immediately
                logoutUser();
            }
        });
    }

    function logoutUser() {
        $.post('/auth/logout', () => {
            window.location.href = '/login'; // or homepage
        });
    }

    // Reset timer on user activity
    $(document).on('mousemove keydown click scroll touchstart', resetTimer);

    // Start timer on page load
    resetTimer();
});