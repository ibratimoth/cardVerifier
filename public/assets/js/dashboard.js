
window.addEventListener('pageshow', function (event) {
    if (event.persisted || (window.performance && window.performance.navigation.type === 2)) {
        // If coming from bfcache (Back/Forward cache), reload to enforce revalidation
        window.location.reload();
    }
});


window.requestTable = null; // global scope

$(document).ready(function () {
    if (!$.fn.DataTable.isDataTable('#requestsTable')) {
        window.requestTable = $('#requestsTable').DataTable({
            pageLength: 5,
            responsive: true,
            autoWidth: false,
        });
    } else {
        window.requestTable = $('#requestsTable').DataTable(); // safely reassign
    }
});

window.passTable = null; // global scope

$(document).ready(function () {
    if (!$.fn.DataTable.isDataTable('#passTable')) {
        window.passTable = $('#passTable').DataTable({
            pageLength: 10,
            responsive: true,
            autoWidth: false,
        });
    } else {
        window.passTable = $('#passTable').DataTable(); // safely reassign
    }
});

function deleteRequest(referenceNo) {
    Swal.fire({
        title: 'Are you sure?',
        text: "You are about to cancel this request.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, cancel it!'
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: `/user/request/${referenceNo}`,
                method: 'DELETE',
                success: function (response) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Cancelled!',
                        text: 'Your request has been successfully cancelled.',
                        timer: 2000,
                        showConfirmButton: false
                    }).then(() => {
                        window.location.href = '/Home';
                    });
                },
                error: function (xhr) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error!',
                        text: xhr.responseJSON?.message || 'Failed to cancel the request.',
                    });
                }
            });
        }
    });
}
function updateRequest(cardId) {
    Swal.fire({
        title: 'Are you sure?',
        text: "You are about to Update this card status",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#29317a',
        cancelButtonColor: '#29317a',
        confirmButtonText: 'Yes, update it!'
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: `/${cardId}`,
                method: 'PATCH',
                success: function (response) {

                    console.log(response)
                    Swal.fire({
                        icon: 'success',
                        title: 'Updated!',
                        text: response.message || 'Your card status has been successfully updated.',
                        showConfirmButton: true
                    }).then(() => {
                        window.location.reload();
                    });
                },
                error: function (xhr) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error!',
                        text: xhr.responseJSON?.message || 'Failed to verify.',
                        showConfirmButton: true,
                    });
                }
            });
        }
    });
}

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

$(document).ready(function () {
    const currentPath = window.location.pathname;
    console.log("Current Path:", currentPath);

    $(".nk-menu-link").each(function () {
        const linkPath = new URL(this.href).pathname;
        console.log("Link Path:", linkPath);
        if (linkPath === currentPath) {
            $(this).addClass("active");
        } else {
            $(this).removeClass("active");
        }
    });
});

$(document).ready(function () {
    // Initialize the Bootstrap modal instance
    const myModal = new bootstrap.Modal(document.getElementById('requestDetailsModal'));

    /**
     * Populates and displays the request details modal.
     * @param {object} requestData - The data object for a single request.
     */
    window.showRequestDetails = function (requestData) {
        console.log('requestData:', requestData)
        // Populate main details
        $('#detail_reference_no').text(requestData.reference_no || '');
        $('#detail_email').text(requestData.email || '');
        $('#detail_organization').text(requestData.organization || '');
        $('#detail_purpose').text(requestData.purpose || '');

        // Format dates
        $('#detail_visitFrom').text(requestData.visitFrom ? new Date(requestData.visitFrom).toLocaleDateString() : '');
        $('#detail_visitTo').text(requestData.visitTo ? new Date(requestData.visitTo).toLocaleDateString() : '');

        // Handle Department name (assuming it might be a nested object or null)
        $('#detail_department').text(requestData.Department?.name || '');

        // Format status (capitalize first letter)
        $('#detail_status').text(requestData.status ? (requestData.status.charAt(0).toUpperCase() + requestData.status.slice(1)) : '');

        // Populate Visitors list
        const $otherMembersList = $('#detail_otherMembers');
        $otherMembersList.empty(); // Clear previous entries

        if (requestData.otherMembers && requestData.otherMembers.length > 0) {
            $.each(requestData.otherMembers, function (index, member) {
                const $listItem = $('<li></li>').addClass('d-flex align-items-center mb-1'); // Flex for icon/text alignment
                const $memberName = $('<span></span>').text(member.name);

                if (member.filePath) {
                    const fileExtension = member.filePath.split('.').pop().toLowerCase();
                    let iconClass = 'bi-file-earmark'; // Default document icon

                    // Assign specific icons based on file type
                    if (fileExtension === 'pdf') {
                        iconClass = 'bi-file-earmark-pdf';
                    } else if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
                        iconClass = 'bi-file-earmark-image';
                    }
                    // Add more conditions for other file types if needed

                    const $icon = $('<i></i>').addClass(`bi ${iconClass} me-2 text-primary`); // Add Bootstrap icon
                    const $link = $('<a></a>')
                        .attr('href', member.filePath)
                        .attr('target', '_blank') // Open in new tab
                        .addClass('text-primary text-decoration-underline')
                        .append($memberName); // Put the name inside the link

                    $listItem.append($icon).append($link);

                } else {
                    $listItem.append($memberName); // Just the name if no file path
                }

                $otherMembersList.append($listItem);
            });
        } else {
            $otherMembersList.append($('<li>N/A</li>')); // Display N/A if no visitors
        }

        // Uncheck all zone checkboxes initially (since provided data doesn't specify them)
        $('#requestDetailsModal input[type="checkbox"]').prop('checked', false);

        // Display the modal using Bootstrap's show method
        myModal.show();
    };

    // This function is less commonly used directly for the Bootstrap close button,
    // as data-bs-dismiss="modal" handles it. But useful if you want to close via JS.
    window.closeModal = function () {
        myModal.hide();
    };

    /**
     * Fetches request details from the backend and then displays them in the modal.
     * This assumes your Express backend route is GET /api/requests/:reference_no
     * @param {string} referenceNo - The reference number of the request to fetch.
     */
    window.fetchAndShowDetails = function (referenceNo) {
        $.ajax({
            url: `/user/request/${referenceNo}`, // <--- IMPORTANT: Adjust this URL to your actual API endpoint if different
            method: 'GET', // Method is GET as per our discussion for fetching by URL parameter
            success: function (response) {
                // Assuming your controller sends a JSON object like { success: true, data: {...} }
                if (response.success && response.data) {
                    showRequestDetails(response.data); // Pass the 'data' part of your response
                } else {
                    console.error('Failed to fetch request details:', response.message);
                    // Use a custom message box instead of alert() in production apps
                    alert('Could not fetch request details: ' + (response.message || 'Unknown error.'));
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.error('Error fetching request details:', textStatus, errorThrown, jqXHR.responseText);
                // Use a custom message box instead of alert() in production apps
                alert('An error occurred while fetching details. Please try again.');
            }
        });
    };


}); // End of document.ready

$(document).ready(function () {
    $('#create-department').on('click', function (e) {
        e.preventDefault();

        console.log('reached')
        const name = $('#department-name').val();
        $.ajax({
            type: 'POST',
            url: '/user/department',
            contentType: 'application/json',
            data: JSON.stringify({ name }), // Convert to JSON string
            success: function (response) {
                showToast("Success", "Created successfully", "text-success");
                $('#addLead').modal('hide'); // Hide the modal
                $('#department-name').val(''); // Clear the input field
                Swal.fire({
                    icon: 'success',
                    title: 'Created!',
                    text: 'Department has been successfully created.',
                    timer: 2000,
                    showConfirmButton: false
                }).then(() => {
                    window.location.href = '/department';
                });

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

function deleteDepartment(id) {
    console.log("Deleting department with ID:", id);
    Swal.fire({
        title: 'Are you sure?',
        text: "You are about to delete this Department.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: `/user/department/${id}`,
                method: 'DELETE',
                success: function (response) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Cancelled!',
                        text: 'Department has been deleted.',
                        timer: 2000,
                        showConfirmButton: false
                    }).then(() => {
                        window.location.href = '/department';
                    });
                },
                error: function (xhr) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error!',
                        text: xhr.responseJSON?.message || 'Failed to delete Request.',
                    });
                }
            });
        }
    });
}

var departmentId;
function fetchAndShowDepartmentDetails(id) {
    console.log("Deleting department with ID:", id);
    //e.preventDefault();

    console.log('reached')

    $.ajax({
        type: 'GET',
        url: `/user/department/${id}`, // Use the correct endpoint for updating
        contentType: 'application/json',
        success: function (response) {
            $('#updateDepartment').modal('show');
            $('#updated-department-name').val(response.data.name);
            departmentId = response.data.id;
            $('#update-department').off('click').on('click', function () {
                updateDepartment(departmentId);
            });

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
}

function fetchAndShowZoneDetails(id) {
    //e.preventDefault();

    console.log('reached')

    $.ajax({
        type: 'GET',
        url: `/user/zone/${id}`, // Use the correct endpoint for updating
        contentType: 'application/json',
        success: function (response) {
            $('#updateZone').modal('show');
            $('#updated-zone-name').val(response.data.name);
            zoneId = response.data.id;
            $('#update-zone').off('click').on('click', function () {
                updateZone(zoneId);
            });

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
}

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


async function updateDepartment(id) {
    console.log("Updating department with ID:", id);
    const name = $('#updated-department-name').val();
    console.log('Department ID:', id);
    console.log('Department Name:', name);

    try {
        const response = await $.ajax({
            type: 'PUT',
            url: `/user/department/${id}`, // Use the correct endpoint for updating
            contentType: 'application/json',
            data: JSON.stringify({ name }), // Convert to JSON string
        });

        $('#updateDepartment').modal('hide'); // Hide the modal
        $('#updated-department-name').val(''); // Clear the input field
        Swal.fire({
            icon: 'success',
            title: 'Updated!',
            text: 'Department updated successfully',
            timer: 2000,
            showConfirmButton: false
        }).then(() => {
            window.location.href = '/department';
        });
        // Redirect to the department page

    } catch (xhr) {
        let message = "Request failed. Please try again.";
        if (xhr.responseJSON && xhr.responseJSON.message) {
            message = xhr.responseJSON.message;
        }
        showToast("Error", message, "text-danger");
    }
}

// Institution crud
$(document).ready(function () {
    $('#create-institution').on('click', function (e) {
        e.preventDefault();

        console.log('reached')
        const name = $('#institution-name').val();
        $.ajax({
            type: 'POST',
            url: '/user/institution',
            contentType: 'application/json',
            data: JSON.stringify({ name }), // Convert to JSON string
            success: function (response) {
                showToast("Success", "Created successfully", "text-success");
                $('#addLead').modal('hide'); // Hide the modal
                $('#institution-name').val(''); // Clear the input field
                Swal.fire({
                    icon: 'success',
                    title: 'Created!',
                    text: 'Institution has been successfully created.',
                    timer: 2000,
                    showConfirmButton: false
                }).then(() => {
                    window.location.href = '/institution';
                });

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

function deleteInstitution(id) {
    console.log("Deleting institution with ID:", id);
    Swal.fire({
        title: 'Are you sure?',
        text: "You are about to delete this Institution.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: `/user/institution/${id}`,
                method: 'DELETE',
                success: function (response) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Cancelled!',
                        text: 'Institution has been deleted.',
                        timer: 2000,
                        showConfirmButton: false
                    }).then(() => {
                        window.location.href = '/institution';
                    });
                },
                error: function (xhr) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error!',
                        text: xhr.responseJSON?.message || 'Failed to delete Request.',
                    });
                }
            });
        }
    });
}

var institutionId;
function fetchAndShowInstitutionDetails(id) {
    console.log("Deleting institution with ID:", id);
    //e.preventDefault();

    console.log('reached')

    $.ajax({
        type: 'GET',
        url: `/user/institution/${id}`, // Use the correct endpoint for updating
        contentType: 'application/json',
        success: function (response) {
            $('#updateInstitution').modal('show');
            $('#updated-institution-name').val(response.data.name);
            institutionId = response.data.id;
            $('#update-institution').off('click').on('click', function () {
                updateInstitution(institutionId);
            });

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
}



async function updateInstitution(id) {
    console.log("Updating institution with ID:", id);
    const name = $('#updated-institution-name').val();
    console.log('Institution ID:', id);
    console.log('Institution Name:', name);

    try {
        const response = await $.ajax({
            type: 'PUT',
            url: `/user/institution/${id}`, // Use the correct endpoint for updating
            contentType: 'application/json',
            data: JSON.stringify({ name }), // Convert to JSON string
        });

        $('#updateInstitution').modal('hide'); // Hide the modal
        $('#updated-institution-name').val(''); // Clear the input field
        Swal.fire({
            icon: 'success',
            title: 'Updated!',
            text: 'Institution updated successfully',
            timer: 2000,
            showConfirmButton: false
        }).then(() => {
            window.location.href = '/institution';
        });
        // Redirect to the institution page

    } catch (xhr) {
        let message = "Request failed. Please try again.";
        if (xhr.responseJSON && xhr.responseJSON.message) {
            message = xhr.responseJSON.message;
        }
        showToast("Error", message, "text-danger");
    }
}

async function updateZone(id) {
    console.log("Updating Zone with ID:", id);
    const name = $('#updated-zone-name').val();

    try {
        const response = await $.ajax({
            type: 'PUT',
            url: `/user/zone/${id}`, // Use the correct endpoint for updating
            contentType: 'application/json',
            data: JSON.stringify({ name }), // Convert to JSON string
        });

        $('#updateZone').modal('hide'); // Hide the modal
        $('#updated-zone-name').val(''); // Clear the input field
        Swal.fire({
            icon: 'success',
            title: 'Updated!',
            text: 'Zone updated successfully',
            timer: 2000,
            showConfirmButton: false
        }).then(() => {
            window.location.href = '/zone';
        });
    } catch (xhr) {
        let message = "Request failed. Please try again.";
        if (xhr.responseJSON && xhr.responseJSON.message) {
            message = xhr.responseJSON.message;
        }
        showToast("Error", message, "text-danger");
    }
}

function deleteZone(id) {
    console.log("Deleting zone with ID:", id);
    Swal.fire({
        title: 'Are you sure?',
        text: "You are about to delete this Zone.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, cancel it!'
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: `/user/zone/${id}`,
                method: 'DELETE',
                success: function (response) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Cancelled!',
                        text: 'Zone has been deleted.',
                        timer: 2000,
                        showConfirmButton: false
                    }).then(() => {
                        window.location.href = '/zone';
                    });
                },
                error: function (xhr) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error!',
                        text: xhr.responseJSON?.message || 'Failed to delete zone.',
                    });
                }
            });
        }
    });
}

$(document).ready(function () {
    $('#create-zone').on('click', function (e) {
        e.preventDefault();

        console.log('reached')
        const name = $('#zone-name').val();
        $.ajax({
            type: 'POST',
            url: '/user/zone',
            contentType: 'application/json',
            data: JSON.stringify({ name }), // Convert to JSON string
            success: function (response) {
                showToast("Success", "Created successfully", "text-success");
                $('#addZone').modal('hide'); // Hide the modal
                $('#zone-name').val(''); // Clear the input field
                Swal.fire({
                    icon: 'success',
                    title: 'Created!',
                    text: 'Zone has been successfully created.',
                    timer: 2000,
                    showConfirmButton: false
                }).then(() => {
                    window.location.href = '/zone';
                });
                // Redirect to the department page
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

document.addEventListener("DOMContentLoaded", () => {
    const counters = document.querySelectorAll('.count');
    counters.forEach(counter => {
        const target = +counter.getAttribute('data-target');
        let count = 100; // starting point

        const updateCount = () => {
            const decrement = Math.ceil((count - target) / 20); // adjust speed

            if (count > target) {
                count -= decrement;
                counter.innerText = count;
                setTimeout(updateCount, 20); // smaller = faster
            } else {
                counter.innerText = target;
            }
        };

        updateCount();
    });
});


$(document).ready(function () {
    function updateTimeline(currentStage) {
        const stages = ['gate1', 'gate2', 'complete'];

        stages.forEach(stage => {
            $(`#step-${stage}`).removeClass('active');
            $(`#arrow-${stage}`).hide();
        });

        if (stages.includes(currentStage)) {
            $(`#step-${currentStage}`).addClass('active');
            $(`#arrow-${currentStage}`).show();
        }
    }

    const currentStage = $('#pass-timeline').data('stage'); // e.g., 'gate1'
    updateTimeline(currentStage);
});

$(document).on('click', '.approve-btn', function () {
    const gate = $(this).data('gate');
    const passId = $(this).data('id');
    const url = gate == 1
        ? `/user/pass/${passId}/approve-gate1`
        : `/user/pass/${passId}/approve-gate2`;
    Swal.fire({
        title: 'Are you sure?',
        text: "You are about to approve pass.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#219d95',
        confirmButtonText: 'Yes, approve it!'
    }).then((result) => {
        if (result.isConfirmed) {
    $.ajax({
        url: url,
        method: 'PATCH',
        success: function (res) {
            // alert(res.message);
            Swal.fire({
                icon: 'success',
                title: 'Approved!',
                text: `Pass has been approved at Gate ${gate}.`,
                timer: 2000,
                showConfirmButton: false
            });
            location.reload(); 
        },
        error: function (xhr) {
            alert('Error: ' + (xhr.responseJSON?.error || 'Something went wrong.'));
        }
    });
     }
    });
});

