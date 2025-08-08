$(window).on('pageshow', function () {
    $('#emailAddress').val('');
    $('#password').val('');
});

$(document).ready(function () {
    $('#requestorForm').on('submit', function (e) {
        e.preventDefault();

        const emailAddress = $('#emailAddress').val();
        const password = $('#password').val();
        // Hide Register button and show loading

        if (!emailAddress || !password) {
            showToast("Validation Error", "All fields are required.", "text-warning");
            return;
        }

        $('#loginBtn').hide();
        $('#loadingBtn').show();
        // Serialize form data
        // Collect form values manually
        const formData = {
            emailAddress,
            password
        };
        localStorage.removeItem('reference_no');
        $.ajax({
            type: 'POST',
            url: '/user/login',
            contentType: 'application/json',
            data: JSON.stringify(formData), // Convert to JSON string
            success: function (response) {
                console.log('Login successful:',);
                // "Security"
                showToast("Success", "Logged in successfully", "text-success")
                $('#emailAddress').val('');
                $('#password').val('');
                if (response.data.user.role === 'Security') {
                    window.location.href = '/checkin';
                    return;
                }
                window.location.href = '/overview';
                return;
            },
            error: function (xhr) {
                let message = "Submission failed. Please try again.";
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    message = xhr.responseJSON.message;
                }
                showToast("Error", message, "text-danger");
                return;
            },
            complete: function () {
                // Revert buttons
                $('#loadingBtn').hide();
                $('#loginBtn').show();
            }
        });
    });

    function showToast(title, body, titleClass) {
        const toastHtml = `
                <div class="toast align-items-center text-bg-light border-0" role="alert" aria-live="assertive" aria-atomic="true" data-bs-delay="5000">
                    <div class="toast-header">
                        <strong class="me-auto ${titleClass}">${title}</strong>
                        <small class="text-muted">Now</small>
                        <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                    </div>
                    <div class="toast-body">${body}</div>
                </div>`;

        const $toast = $(toastHtml);
        $('.toast-container').append($toast);
        const toast = new bootstrap.Toast($toast[0]);
        toast.show();
    }
});