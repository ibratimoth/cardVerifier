$(document).ready(function () {
    $('#requestorForm').on('submit', function (e) {
        e.preventDefault();


        const firstname = $('#firstname').val();
        const middlename = $('#middlename').val()
        const lastname = $('#lastname').val();
        const emailAddress = $('#emailAddress').val();
        const phoneNumber = $('#phoneNumber').val();
        const password = $('#password').val();
        // Hide Register button and show loading

        if (!firstname || !middlename || !lastname || !emailAddress || !phoneNumber || !password) {
            showToast("Validation Error", "All fields are required.", "text-warning");
            return;
        }


        $('#registerBtn').hide();
        $('#loadingBtn').show();
        // Serialize form data
        // Collect form values manually
        const formData = {
            firstname,
            middlename,
            lastname,
            emailAddress,
            phoneNumber,
            password
        };

        console.log("Form Data:", formData); // Debugging line to check form data

        $.ajax({
            type: 'POST',
            url: '/auth/register',
            contentType: 'application/json',
            data: JSON.stringify(formData), // Convert to JSON string
            success: function (response) {
                console.log("Response:", response); // Debugging line to check response
                showToast("Success", "Your information has been submitted successfully.", "text-success");
                window.location.href = '/confirmation'; // Redirect to login page
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
                $('#registerBtn').show();
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