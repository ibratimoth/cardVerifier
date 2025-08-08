window.addEventListener('pageshow', function (event) {
    if (event.persisted || (window.performance && window.performance.navigation.type === 2)) {
        // If coming from bfcache (Back/Forward cache), reload to enforce revalidation
        window.location.reload();
    }
});

$(document).ready(function () {
    $('#logout-link').on('click', function (e) {
        e.preventDefault();

        console.log('reached')
        $.ajax({
            type: 'POST',
            url: '/auth/logout',
            contentType: 'application/json',
            success: function (response) {
                showToast("Success", "Logged out in successfully", "text-success");
                window.location.href = '/login'
            },
            error: function (xhr) {
                let message = "Request failed. Please try again.";
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    message = xhr.responseJSON.message;
                }
                showToast("Error", message, "text-danger");
                return;
            },
        });
    })

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

function updateStatus(newStatus, referenceNo) {
    let reason = null;

    const proceedWithConfirmation = () => {
        Swal.fire({
            title: 'Are you sure?',
            text: "You are about to update status.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, Update!'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: `/user/status/${referenceNo}`,
                    method: 'PUT',
                    contentType: 'application/json',
                    data: JSON.stringify({ status: newStatus, reason }),
                    success: function (response) {
                        Swal.fire({
                            icon: 'success',
                            title: 'Success!',
                            text: 'Status updated successfully.',
                            timer: 2000,
                            showConfirmButton: false
                        })
                        return;
                    },
                    error: function (xhr) {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error!',
                            text: xhr.responseJSON?.message || 'Failed to update.',
                        });
                    }
                });
            }
        });
    };

    if (newStatus === 'rejected') {
        Swal.fire({
            title: 'Enter Reason',
            input: 'textarea',
            inputLabel: 'Reason for Rejection',
            inputPlaceholder: 'Type the reason here...',
            inputAttributes: {
                'aria-label': 'Reason for rejection'
            },
            showCancelButton: true,
            confirmButtonText: 'Continue',
            preConfirm: (inputValue) => {
                reason = inputValue.trim();
                return true;
            }
        }).then((result) => {
            if (result.isConfirmed) {
                proceedWithConfirmation();
            }
        });
    } else {
        proceedWithConfirmation();
    }
}

function handleStatusClick(newStatus, referenceNo) {
    let reason = null;

    const proceedWithConfirmation = () => {
        Swal.fire({
            title: 'Are you sure?',
            text: `You are about to mark this request as "${newStatus}".`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, Update!'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: `/user/status/${referenceNo}`,
                    method: 'PUT',
                    contentType: 'application/json',
                    data: JSON.stringify({ status: newStatus, reason }),
                    success: function (response) {
                        Swal.fire({
                            icon: 'success',
                            title: 'Success!',
                            text: 'Status updated successfully.',
                            timer: 2000,
                            showConfirmButton: false
                        }).then(() => {
                            window.location.href = '/Home'
                        })
                    },
                    error: function (xhr) {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error!',
                            text: xhr.responseJSON?.message || 'Failed to update.'
                        });
                    }
                });
            }
        });
    };

    if (newStatus === 'rejected') {
        Swal.fire({
            title: 'Enter Reason',
            input: 'textarea',
            inputLabel: 'Reason for Rejection',
            inputPlaceholder: 'Type the reason here...',
            inputAttributes: {
                'aria-label': 'Reason for rejection'
            },
            showCancelButton: true,
            confirmButtonText: 'Continue',
            preConfirm: (inputValue) => {
                reason = inputValue.trim();
                if (!reason) {
                    Swal.showValidationMessage('Reason is required for rejection');
                }
                return true;
            }
        }).then((result) => {
            if (result.isConfirmed && reason) {
                proceedWithConfirmation();
            }
        });
    } else {
        proceedWithConfirmation();
    }
}

// function generatePass(reference_no) {

//     $.ajax({
//         url: `/user/pass/${reference_no}`,
//         method: 'POST',
//         contentType: 'application/json',
//         success: function (response) {
//             console.log(response.data.message);
//             Swal.fire({
//                 icon: 'success',
//                 title: 'Success!',
//                 text: 'Pass generated successfully!',
//                 timer: 2000,
//                 showConfirmButton: false
//             }).then(() => {
//                 window.location.href = '/passes';
//             });
//         },
//         error: function (xhr) {
//             const msg = xhr.responseJSON?.message || "Failed to submit pass.";
//             showToast("Error", msg, "text-danger");
//         }
//     });
// }

async function viewAttachment(path) {
    console.log('filePath:', path);

    const ext = path.split('.').pop().toLowerCase();
    const container = document.getElementById('attachment-container');

    if (ext === 'pdf') {
        container.innerHTML = `
            <iframe src="${path}" width="100%" height="100%" style="border: none;"></iframe>
        `;
    } else if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) {
        container.innerHTML = `
            <img src="${path}" alt="Attachment" style="max-width: 100%; max-height: 100%;">
        `;
    } else {
        container.innerHTML = `<p>Unsupported file type: ${ext}</p>`;
    }

    $('#view').modal('show');
}

// $(document).ready(function () {
//     $('#zones-btn').on('click', function (e) {
//         e.preventDefault();
//         const requestId = $('#requestId').val();

//         const selectedZones = [];
//         $('input[name="btnCheck"]:checked').each(function () {
//             selectedZones.push($(this).val());
//         });

//         if (!requestId) {
//             showToast("Validation Error", "No request Id provided", "text-warning");
//             return;
//         }

//         if (selectedZones.length === 0) {
//             showToast("Validation Error", "Please select at least one zone", "text-warning");
//             return;
//         }

//         $.ajax({
//             url: `/user/access-request/${requestId}/zones`,
//             method: 'POST',
//             contentType: 'application/json',
//             data: JSON.stringify({ zoneIds: selectedZones }),
//             success: function (response) {
//                 console.log(response.data.message);
//                 if (response.data.message === "Zones already assigned") {
//                     Swal.fire({
//                         icon: 'info',
//                         title: 'Notice',
//                         text: 'Zones selected are already assigned!',
//                         timer: 2000,
//                         showConfirmButton: false
//                     });
//                     return;
//                 }
//                 Swal.fire({
//                     icon: 'success',
//                     title: 'Success!',
//                     text: 'Zones submitted successfully!',
//                     timer: 2000,
//                     showConfirmButton: false
//                 });
//                 // window.location.reload();
//                 return;
//             },
//             error: function (xhr) {
//                 const msg = xhr.responseJSON?.message || "Failed to submit zones.";
//                 showToast("Error", msg, "text-danger");
//             }
//         });
//     });
// });

let progressInterval;

function showProgressModal(message = 'Processing request...') {
    $('#progressMessage').text(message);
    $('#progressBar').css({ width: '1%' }).attr('aria-valuenow', 1).text('1%');

    $('#progressModal')
        .css('display', 'flex')
        .hide()
        .fadeIn(200);

    let progress = 1;
    progressInterval = setInterval(() => {
        if (progress >= 100) {
            clearInterval(progressInterval);
            return;
        }
        progress += Math.floor(Math.random() * 5) + 1; // simulate random progress
        if (progress > 100) progress = 100;

        $('#progressBar')
            .css('width', `${progress}%`)
            .attr('aria-valuenow', progress)
            .text(`${progress}%`);
    }, 100);
}

function hideProgressModal() {
    clearInterval(progressInterval);
    $('#progressModal').fadeOut(300);
}


function handleApprove(referenceNo, requestId) {
    const selectedZones = [];
    $('input[name="btnCheck"]:checked').each(function () {
        selectedZones.push($(this).val());
    });

    if (!requestId || !referenceNo) {
        showToast("Validation Error", "Missing request ID or reference number", "text-warning");
        return;
    }

    if (selectedZones.length === 0) {
        showToast("Validation Error", "Please select at least one zone", "text-warning");
        return;
    }
    
    Swal.fire({
        title: 'Are you sure?',
        text: 'You are about to approve this request and assign zones.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, Approve!',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (!result.isConfirmed) return;
        showProgressModal("Processing request...");
        // 1. Submit selected zones
        $.ajax({
            url: `/user/access-request/${requestId}/zones`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ zoneIds: selectedZones }),
            success: function (zoneRes) {
                // 2. Update status to approved
                $.ajax({
                    url: `/user/status/${referenceNo}`,
                    method: 'PUT',
                    contentType: 'application/json',
                    data: JSON.stringify({ status: 'approved' }),
                    success: function () {
                        // 3. Generate pass
                        $.ajax({
                            url: `/user/pass/${referenceNo}`,
                            method: 'POST',
                            contentType: 'application/json',
                            success: function () {
                                hideProgressModal();
                                Swal.fire({
                                    icon: 'success',
                                    title: 'Success!',
                                    text: 'Request approved, zones assigned, and pass generated.',
                                    timer: 2500,
                                    showConfirmButton: false
                                }).then(() => {
                                    window.location.href = '/passes';
                                });
                            },
                            error: function (xhr) {
                                hideProgressModal();
                                showToast("Pass Generation Failed", xhr.responseJSON?.message || "Error generating pass.", "text-danger");
                            }
                        });
                    },
                    error: function (xhr) {
                        hideProgressModal();
                        showToast("Status Update Failed", xhr.responseJSON?.message || "Error updating status.", "text-danger");
                    }
                });
            },
            error: function (xhr) {
                const msg = xhr.responseJSON?.message || "Failed to submit zones.";
                hideProgressModal();
                showToast("Zone Assignment Failed", msg, "text-danger");
            }
        });
    });
}

$(document).ready(function () {
    $('#goToStaffSection').on('click', function () {
      $('.nav-tabs a[href="#tabItem6"]').tab('show');
    });

    $('#backToRequestDetails').on('click', function () {
      $('.nav-tabs a[href="#tabItem5"]').tab('show');
    });

    $('#goToAttachments').on('click', function () {
      $('.nav-tabs a[href="#tabItem8"]').tab('show');
    });

    $('#backToStaffSection').on('click', function () {
      $('.nav-tabs a[href="#tabItem6"]').tab('show');
    });
  });