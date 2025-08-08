$(document).ready(function () {
    $('#requestorForm').on('submit', function (e) {
        e.preventDefault();

        var password = $('#password').val();
        const token = window.location.pathname.split('/').pop(); // Get token from URL

        if (!password) {
            showToast("Validation Error", "Please enter your new password.", "text-warning");
            return;
        }

        $('#submitBtn').hide();
        $('#loadingBtn').show();

        $.ajax({
            type: 'POST',
            url: `/auth/reset-password/${token}`, // Use the token in the URL
            contentType: 'application/json',
            data: JSON.stringify({ password }), // Convert to JSON string
            success: function (response) { // Debugging line to check response
                showToast("Success", "Your email has been submitted successfully.", "text-success");
                window.location.href = '/confirm-reset'; // Redirect to login page
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
                $('#submitBtn').show();
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
})