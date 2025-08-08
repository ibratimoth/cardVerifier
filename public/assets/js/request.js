
window.addEventListener('pageshow', function (event) {
    if (event.persisted || (window.performance && window.performance.navigation.type === 2)) {
        // If coming from bfcache (Back/Forward cache), reload to enforce revalidation
        window.location.reload();
    }
});

$(document).ready(function () {
    $(".date-picker").flatpickr({
        dateFormat: "Y-m-d", // <-- Change this line!
        minDate: "today"
    });
});

$(document).ready(function () {
    $(".time-picker").flatpickr({
        enableTime: true,
        noCalendar: true,
        dateFormat: "H:i", // 24-hour format, e.g. 14:30
        time_24hr: true // Optional: enables 24-hour format
    });
});

$(document).ready(function () {
    const selectedDepartmentId = $('#selected-department-id').val();

    $.ajax({
        url: '/user/departments',
        method: 'GET',
        success: function (departments) {
            const data = departments.data // Debugging line to check loaded departments
            const $select = $('#DepartmentId');
            $select.empty(); // Clear current options
            $select.append('<option value="">---Select Department---</option>');

            data.forEach(function (dept) {
                const isSelected = dept.id == selectedDepartmentId ? 'selected' : '';
                $select.append(`<option value="${dept.id}" ${isSelected}>${dept.name}</option>`);
            });
        },
        error: function (xhr, status, error) {
            console.error('Failed to load departments:', error);
        }
    });
});

// $(document).ready(function () {
//     const selectedIdentityTypeId = $('#selected-identity-id').val();
//     console.log('selectedIdenityId:', selectedIdentityTypeId);

//     $.ajax({
//         url: '/user/identities',
//         method: 'GET',
//         success: function (identities) {
//             const data = identities.data // Debugging line to check loaded departments
//             const $select = $('#IdentityTypeId');
//             $select.empty(); // Clear current options
//             $select.append('<option value="">---Select Identity Type---</option>');

//             data.forEach(function (identity) {
//                 const isSelected = identity.id == selectedIdentityTypeId ? 'selected' : '';
//                 $select.append(`<option value="${identity.id}" name="${identity.identity_name}" ${isSelected}>${identity.identity_name}</option>`);
//             });

//             $select.trigger('change');
//         },
//         error: function (xhr, status, error) {
//             console.error('Failed to load identityType:', error);
//         }
//     });
// });

// $(document).ready(function () {
//     const selectedIdentityTypeId = $('#selected-identity-id1').val();
//     console.log('selectedIdenityId:', selectedIdentityTypeId);

//     $.ajax({
//         url: '/user/identities',
//         method: 'GET',
//         success: function (identities) {
//             const data = identities.data // Debugging line to check loaded departments
//             const $select = $('#IdentityTypeId1');
//             $select.empty(); // Clear current options
//             $select.append('<option value="">---Select Identity Type---</option>');

//             data.forEach(function (identity) {
//                 const isSelected = identity.id == selectedIdentityTypeId ? 'selected' : '';
//                 $select.append(`<option value="${identity.id}" name="${identity.identity_name}" ${isSelected}>${identity.identity_name}</option>`);
//             });

//             $select.trigger('change');
//         },
//         error: function (xhr, status, error) {
//             console.error('Failed to load identityType:', error);
//         }
//     });
// });

$(document).ready(function () {
    $('a[href="#next"]').off('click').on('click', async function (e) {
        e.preventDefault();

        const $submitBtn = $(this); // the actual submit <a>

        // Hide the original button
        $submitBtn.hide();
        const $loadingBtn = $('<button class="btn btn-secondary" disabled id="tempLoadingBtn">' +
            '<span class="spinner-border spinner-border-sm"></span> submitting...</button>');
        $submitBtn.after($loadingBtn);

        // First check if we have a reference_no and need to update
        const reference_no = localStorage.getItem('reference_no');
        if (reference_no) {
            await updateInitialRequest(reference_no, $submitBtn, $loadingBtn);
            return;
        }

        // Collect form values
        const organization = $('#organization').val();
        const visitType = $('#visit-type').val();
        const visitFrom = $('#visit-from').val();
        const visitTo = $('#visit-to').val();
        const purpose = $('#purpose').val();
        const DepartmentId = $('#DepartmentId').val();
        const durationType = $('#duration_type').val();
        const visitDate = $('#visit-date').val();
        const timeOut = $('#time_out').val();
        const timeIn = $('#time_in').val();

        // Validation
        if (!organization || !visitType || !purpose || !DepartmentId || !durationType || !timeOut || !timeIn) {
            showToast("Validation Error", "All fields are required.", "text-warning");
            $loadingBtn.remove();
            $submitBtn.show();
            return;
        }

        if (visitFrom && visitFrom > visitTo) {
            showToast("Validation Error", "Visit 'from' date cannot be later than 'to' date.", "text-warning");
            $loadingBtn.remove();
            $submitBtn.show();
            return;
        }

        if (timeIn > timeOut) {
            showToast("Validation Error", "Time in cannot be later than time out.", "text-warning");
            $loadingBtn.remove();
            $submitBtn.show();
            return;
        }

        // Collect selected zones
        const selectedZones = [];
        $('input[name="btnCheck"]:checked').each(function () {
            selectedZones.push($(this).val());
        });

        if (selectedZones.length === 0) {
            showToast("Validation Error", "Please select at least one zone", "text-warning");
            $loadingBtn.remove();
            $submitBtn.show();
            return;
        }

        // Prepare form data
        const formData = {
            organization,
            visitType,
            visitFrom,
            visitTo,
            purpose,
            DepartmentId,
            durationType,
            visitDate,
            timeOut,
            timeIn
        };

        try {
            // Save zones to session first
            await $.ajax({
                url: '/savezones',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ zoneIds: selectedZones })
            });

            const initialResponse = await $.ajax({
                type: 'POST',
                url: '/requests',
                contentType: 'application/json',
                data: JSON.stringify(formData)
            });

            console.log('Initial response:', initialResponse);

            // Step 2: Save to user initial request
            const userResponse = await $.ajax({
                type: 'POST',
                url: '/user/initialrequest',
                contentType: 'application/json',
                data: JSON.stringify(formData)
            });

            console.log('User response:', userResponse);
            console.log('User requestId:', userResponse.data.id);

            const requestId = userResponse.data.id;
            localStorage.setItem('reference_no', userResponse.data.reference_no);

            // Step 3: Assign zones
            const zonesResponse = await $.ajax({
                url: `/user/access-request/${requestId}/zones`,
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ zoneIds: selectedZones })
            });

            console.log('Zones response:', zonesResponse);

            if (zonesResponse.data.message === "Zones already assigned") {
                showToast("Notice", "Zones selected are already assigned!", "text-info");
            } else {
                showToast("Success", "Initial info and zones submitted successfully.", "text-success");
            }

            // Move to next step
            $('#wizard-02').steps('next');

        } catch (xhr) {
            let message = "Submission failed. Please try again.";
            if (xhr.responseJSON && xhr.responseJSON.message) {
                message = xhr.responseJSON.message;
            }
            showToast("Error", message, "text-danger");
        } finally {
            // Revert buttons
            $loadingBtn.remove();
            $submitBtn.show();
        }
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
};

async function updateInitialRequest(reference_no, $submitBtn, $loadingBtn) {
    console.log('Updating initial request with reference_no:', reference_no);
    const organization = $('#organization').val();
    const visitType = $('#visit-type').val();
    const visitFrom = $('#visit-from').val();
    const visitTo = $('#visit-to').val();
    const purpose = $('#purpose').val();
    const DepartmentId = $('#DepartmentId').val();
    const durationType = $('#duration_type').val();
    const visitDate = $('#visit-date').val();
    const timeOut = $('#time_out').val();
    const timeIn = $('#time_in').val();

    // Validation
    if (!organization || !visitType || !purpose || !DepartmentId || !durationType || !timeOut || !timeIn) {
        showToast("Validation Error", "All fields are required.", "text-warning");
        $loadingBtn.remove();
        $submitBtn.show();
        return;
    }

    if (visitFrom && visitFrom > visitTo) {
        showToast("Validation Error", "Visit 'from' date cannot be later than 'to' date.", "text-warning");
        $loadingBtn.remove();
        $submitBtn.show();
        return;
    }

    if (timeIn > timeOut) {
        showToast("Validation Error", "Time in cannot be later than time out.", "text-warning");
        $loadingBtn.remove();
        $submitBtn.show();
        return;
    }

    // Collect selected zones
    const selectedZones = [];
    $('input[name="btnCheck"]:checked').each(function () {
        selectedZones.push($(this).val());
    });

    if (selectedZones.length === 0) {
        showToast("Validation Error", "Please select at least one zone", "text-warning");
        $loadingBtn.remove();
        $submitBtn.show();
        return;
    }

    // Prepare form data
    const formData = {
        organization,
        visitType,
        visitFrom,
        visitTo,
        purpose,
        DepartmentId,
        durationType,
        visitDate,
        timeOut,
        timeIn
    };

    try {
        await $.ajax({
            url: '/savezones',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ zoneIds: selectedZones })
        });

        const initialResponse = await $.ajax({
            type: 'POST',
            url: '/requests',
            contentType: 'application/json',
            data: JSON.stringify(formData)
        });

        const userResponse = await $.ajax({
            url: `/user/initialrequest/${reference_no}`,
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(formData)
        });

        const requestId = userResponse.data.id;
        localStorage.setItem('reference_no', userResponse.data.reference_no);

        const zonesResponse = await $.ajax({
            url: `/user/access-request/${requestId}/zones`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ zoneIds: selectedZones })
        });

        showToast("Success", "Initial info and zones submitted successfully.", "text-success");

        $('#wizard-02').steps('next');

    } catch (xhr) {
        let message = "Update failed. Please try again.";
        if (xhr.responseJSON && xhr.responseJSON.message) {
            message = xhr.responseJSON.message;
        }
        await Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: message,
        });
    } finally {
        // Revert buttons
        $loadingBtn.remove();
        $submitBtn.show();
    }
};

// $(document).ready(function () {
//     $('#visit-type').on('change', function () {
//         const isGroup = $(this).val() === 'group';
//         $('#add-visitor-btn').toggleClass('d-none', !isGroup);

//         if (!isGroup) {
//             $('#extra-visitors-wrapper').empty();
//         }
//     }).trigger('change');

//     $('#add-visitor-btn').on('click', function () {
//         const selectedIdentityTypeId = $('#selected-identityType-id').val();
//         $.ajax({
//             url: '/user/identities',
//             method: 'GET',
//             success: function (identities) {
//                 const data = identities.data // Debugging line to check loaded departments
//                 const $select = $('#modalIdentityTypeId');
//                 $select.empty(); // Clear current options
//                 $select.append('<option value="">---Select Identity Type---</option>');

//                 data.forEach(function (identity) {
//                     const isSelected = identity.id == selectedIdentityTypeId ? 'selected' : '';
//                     $select.append(`<option value="${identity.id}" name="${identity.identity_name}" ${isSelected}>${identity.identity_name}</option>`);
//                 });

//                 $('#addVisitorModal').modal('show');
//             },
//             error: function (xhr, status, error) {
//                 console.error('Failed to load identityType:', error);
//             }
//         });

//     });

//     $('#save-visitor-modal-btn').on('click', function () {
//         const firstName = $('#modal-visitor-firstname').val().trim();
//         const lastName = $('#modal-visitor-lastname').val().trim();
//         const email = $('#modal-visitor-email').val().trim();
//         const phone = $('#modal-visitor-phone').val().trim();
//         const identityTypeId = $('#modalIdentityTypeId').val().trim();
//         const identityNumber = $('#model-visitor-identiy').val().trim();
//         const fileInput = $('#modal-visitor-file')[0];
//         const file = fileInput?.files?.[0];

//         if (!firstName || !lastName || !phone || !identityTypeId || !identityNumber) {
//             alert("All fields requeired");
//             return;
//         }

//         const fileFieldName = 'visitor-file-' + Date.now();
//         const formData = new FormData();
//         formData.append(fileFieldName, file);

//         const visitorData = [{
//             name: firstName,
//             lastname: lastName,
//             email: email,
//             phone: phone,
//             fileField: fileFieldName,
//             IdentityTypeId: identityTypeId,
//             identityNumber: identityNumber
//         }];
//         formData.append('otherData', JSON.stringify(visitorData));

//         $.ajax({
//             type: 'POST',
//             url: '/save-participant',
//             data: formData,
//             processData: false,
//             contentType: false,
//             success: function (response) {
//                 const participant = response.participant;
//                 const collapseId = `accordion-item-${Date.now()}`;
//                 const totalItems = $('#accordion .accordion-item').length + $('#extra-visitors-wrapper .accordion-item').length;
//                 const visitorLabel = ordinal(totalItems + 1);

//                 const newAccordion = `
//                 <div class="accordion-item border rounded mb-2" data-participant-id="${participant.id}">
//                     <a href="#" class="accordion-head collapsed" data-bs-toggle="collapse" data-bs-target="#${collapseId}">
//                         <h6 class="title">${firstName} ${lastName}</h6>
//                         <span class="accordion-icon"></span>
//                     </a>
//                     <div id="${collapseId}" class="accordion-body collapse">
//                         <div class="accordion-inner">
//                             <div class="row gy-2 align-items-center visitor-extra mt-3 border p-3 rounded">
//                                 <div class="col-md-6">
//                                     <input type="text" name="visitor-name[]" value="${firstName}" class="form-control" placeholder="First Name" required>
//                                 </div>
//                                 <div class="col-md-6">
//                                     <input type="text" name="visitor-lastname[]" value="${lastName}" class="form-control" placeholder="Last Name" required>
//                                 </div>
//                                 <div class="col-md-6">
//                                     <input type="email" name="visitor-email[]" value="${email}" class="form-control" placeholder="Email (Optional)">
//                                 </div>
//                                 <div class="col-md-6">
//                                     <input type="tel" name="visitor-phone[]" value="${phone}" class="form-control" placeholder="Phone (Optional)">
//                                 </div>
//                                 <div class="col-md-6">
//                                                                                         <div class="form-group">
//                                                                                             <!-- <label class="form-label"
//                                                                                                 for="IdentityTypeId">idenity type</label> -->
//                                                                                             <div
//                                                                                                 class="form-control-wrap">
//                                                                                                 <div
//                                                                                                     class="form-control-select">
//                                                                                                     <select
//                                                                                                         class="form-control required"
//                                                                                                         data-msg="Required"
//                                                                                                         name="visitor-identityTypeId[]"
//                                                                                                         required>
//                                                                                                         <option
//                                                                                                             value="${identityTypeId}"/>
//                                                                                                     </select>
//                                                                                                 </div>
//                                                                                             </div>
//                                                                                         </div>
//                                                                                     </div>
//                                 <div class="col-md-6">
//                                     <input type="tel" name="visitor-identity[]" value="${identityNumber}" class="form-control" placeholder="Phone (Optional)">
//                                 </div>
//                                 <div class="col-md-12">
//                                     <div class="text-success small fw-bold">Document uploaded and saved.</div>
//                                     <small class="form-text text-muted">No need to re-upload. Already saved.</small>
//                                 </div>
//                                 <div class="col-12 d-flex justify-content-between align-items-center mt-2">
//                                     <button type="button" class="btn btn-sm btn-outline-danger btn-remove-visitor">
//                                         <em class="icon ni ni-trash"></em> Remove Visitor
//                                     </button>
//                                 </div>
//                                 <input type="hidden" name="participant-db-id[]" value="">
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             `;

//                 $('#extra-visitors-wrapper').append(newAccordion);

//                 // Close modal and clear inputs
//                 $('#addVisitorModal').modal('hide');
//                 $('#addVisitorModal input').val('');
//                 $('#modal-visitor-file').val('');

//                 showToast("Success", "Visitor saved to session", "text-success");
//             },
//             error: function () {
//                 showToast("Error", "Failed to save visitor", "text-danger");
//             }
//         });
//     });

//     // Remove entire accordion-item when "Remove Visitor" is clicked
//     // $('#extra-visitors-wrapper').on('click', '.btn-remove-visitor', function () {
//     //     $(this).closest('.accordion-item').remove();
//     // });
//     $('#extra-visitors-wrapper').on('click', '.btn-remove-visitor', function () {
//         const $accordion = $(this).closest('.accordion-item');
//         const participantId = $accordion.data('participant-id');

//         if (!participantId) {
//             $accordion.remove(); // fallback
//             return;
//         }

//         $.ajax({
//             url: '/remove-participant',
//             method: 'POST',
//             contentType: 'application/json',
//             data: JSON.stringify({ id: participantId }),
//             success: function () {
//                 $accordion.remove();
//                 showToast("Removed", "Visitor removed from session", "text-success");
//             },
//             error: function () {
//                 showToast("Error", "Failed to remove from session", "text-danger");
//             }
//         });
//     });

//     // Converts number to ordinal label (1 → First, 2 → Second, etc.)
//     function ordinal(n) {
//         const ordinals = [
//             "First", "Second", "Third", "Fourth", "Fifth",
//             "Sixth", "Seventh", "Eighth", "Ninth", "Tenth"
//         ];
//         return ordinals[n - 1] || `${n}th`;
//     }
// });

// $(document).ready(function () {
//     $('a[href="#finish"]').on('click', function (e) {
//         e.preventDefault();

//         const $submitBtn = $(this);

//         $submitBtn.hide();
//         const $loadingBtn = $('<button class="btn btn-secondary" disabled id="tempLoadingBtn">' +
//             '<span class="spinner-border spinner-border-sm"></span> submitting...</button>');

//         $submitBtn.after($loadingBtn);

//         console.log('submit button clicked');
//         const myname = $('#visitor-name-UNIQUE').val();
//         const myemail = $('#visitor-email-UNIQUE').val();
//         const myphone = $('#visitor-phone-UNIQUE').val();
//         const mylastname = $('#visitor-lastname-UNIQUE').val();
//         const orgFile = $('#visitor-id-doc-UNIQUE')[0].files[0];
//         const reference_no = localStorage.getItem('reference_no');

//         if (!myname || !myemail || !myphone || !mylastname || !orgFile || !reference_no) {
//             showToast("Validation Error", "All fields are required, including organization ID.", "text-warning");
//             $loadingBtn.remove();
//             $submitBtn.show();
//             return;
//         }

//         const formData = new FormData();
//         formData.append('organizationFile', orgFile);
//         formData.append('reference_no', reference_no);
//         formData.append('email', myemail);

//         const otherData = [];

//         if (!orgFile) {
//             showToast("Validation Error", "Organization ID attachment is required.", "text-warning");
//             $loadingBtn.remove();
//             $submitBtn.show();
//             return;
//         }

//         const orgFileField = `visitorFiles[0]`;
//         formData.append(orgFileField, orgFile);
//         otherData.push({
//             name: myname,
//             email: myemail,
//             lastname: mylastname,
//             phone: myphone,
//             fileField: orgFileField
//         });

//         let fileIndex = 1;
//         $('.visitor-extra').each(function () {
//             const name = $(this).find('input[name="visitor-name[]"]').val();
//             const email = $(this).find('input[name="visitor-email[]"]').val();
//             const lastname = $(this).find('input[name="visitor-lastname[]"]').val();
//             const phone = $(this).find('input[name="visitor-phone[]"]').val();
//             const fileInput = $(this).find('input[name="visitor-file[]"]')[0];
//             const file = fileInput?.files?.[0];

//             if (name && file) {
//                 const fileField = `visitorFiles[${fileIndex}]`;
//                 formData.append(fileField, file);
//                 otherData.push({
//                     name: name,
//                     email: email,
//                     lastname: lastname,
//                     phone: phone,
//                     fileField: fileField
//                 });
//                 fileIndex++;
//             }
//         });

//         formData.append('otherData', JSON.stringify(otherData));
//         console.log("Form Data:", formData); // Debugging line to check form data

//         for (const [key, value] of formData.entries()) {
//             if (value instanceof File) {
//                 console.log(`${key}: [File] name="${value.name}", type="${value.type}", size=${value.size} bytes`);
//             } else {
//                 console.log(`${key}:`, value);
//             }
//         }

//         $.ajax({
//             type: 'POST',
//             url: '/user/request',
//             data: formData,
//             processData: false,
//             contentType: false,
//             success: function (response) {
//                 const participant = response.data[0];
//                 const referenceNo = participant?.AccessRequest?.reference_no;

//                 console.log("refNo:", referenceNo);

//                 $('#wizard-02')[0].reset();
//                 $('#extra-visitors-wrapper').empty();
//                 $('#add-visitor-btn').addClass('d-none');
//                 localStorage.removeItem('reference_no');
//                 Swal.fire({
//                     icon: 'success',
//                     title: 'Success!',
//                     text: 'Request submitted successfully!',
//                     timer: 2000,
//                     showConfirmButton: false
//                 })
//                 // .then(() => {
//                 //     window.location.href = `/view/${referenceNo}`;
//                 // });
//                 $loadingBtn.remove();
//                 $submitBtn.show();
//             },
//             error: function (xhr) {
//                 let message = "Submission failed. Please try again.";
//                 if (xhr.responseJSON && xhr.responseJSON.message) {
//                     message = xhr.responseJSON.message;
//                 }
//                 showToast("Error", message, "text-danger");
//                 $loadingBtn.remove();
//                 $submitBtn.show();
//                 return;
//             },
//             complete: function () {
//                 // Revert buttons
//                 $('#loadingBtn').hide();
//                 $('#registerBtn').show();
//                 $loadingBtn.remove();
//                 $submitBtn.show();
//             }
//         });
//     });

//     function showToast(title, body, titleClass) {
//         const toastHtml = `
//                 <div class="toast align-items-center text-bg-light border-0" role="alert" aria-live="assertive" aria-atomic="true" data-bs-delay="5000">
//                     <div class="toast-header">
//                         <strong class="me-auto ${titleClass}">${title}</strong>
//                         <small class="text-muted">Now</small>
//                         <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
//                     </div>
//                     <div class="toast-body">${body}</div>
//                 </div>`;

//         const $toast = $(toastHtml);
//         $('.toast-container').append($toast);
//         const toast = new bootstrap.Toast($toast[0]);
//         toast.show();
//     }
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
};

function hideProgressModal(callback = () => { }) {
    clearInterval(progressInterval);
    $('#progressModal').fadeOut(500, callback);
};

// $(document).ready(function () {
//     $('a[href="#finish"]').on('click', function (e) {
//         e.preventDefault();

//         const $submitBtn = $(this);
//         $submitBtn.hide();
//         const $loadingBtn = $('<button class="btn btn-secondary" disabled id="tempLoadingBtn">' +
//             '<span class="spinner-border spinner-border-sm"></span> submitting...</button>');
//         $submitBtn.after($loadingBtn);

//         const myname = $('#visitor-name-UNIQUE').val();
//         const myemail = $('#visitor-email-UNIQUE').val();
//         const myphone = $('#visitor-phone-UNIQUE').val();
//         const mylastname = $('#visitor-lastname-UNIQUE').val();
//         const orgFileInput = $('#visitor-id-doc-UNIQUE')[0];
//         const identiyTypeId = $('#IdentityTypeId').val();
//         const identity_number = $('#visitor-identiy-UNIQUE').val();
//         const orgFile = orgFileInput?.files?.[0];
//         const orgFilePath = $('#default-visitor-filePath').val(); // session prefilled
//         const reference_no = localStorage.getItem('reference_no');

//         if (!myname || !myphone || !mylastname || !reference_no || !identiyTypeId || !identity_number) {
//             showToast("Validation Error", "All fields are required, including ID Document.", "text-warning");
//             $loadingBtn.remove();
//             $submitBtn.show();
//             return;
//         }

//         const formData = new FormData();
//         formData.append('reference_no', reference_no);
//         formData.append('email', myemail);

//         const otherData = [];

//         if (orgFile) {
//             const fileField = `visitorFiles[0]`;
//             formData.append(fileField, orgFile);
//             otherData.push({
//                 name: myname,
//                 lastname: mylastname,
//                 email: myemail,
//                 phone: myphone,
//                 fileField,
//                 identiyTypeId,
//                 identity_number
//             });
//         } else {
//             otherData.push({
//                 name: myname,
//                 lastname: mylastname,
//                 email: myemail,
//                 phone: myphone,
//                 identiyTypeId,
//                 identity_number,
//                 // No fileField – will rely on session filePath
//             });
//         }

//         let fileIndex = 1;

//         $('.accordion-item').each(function () {
//             const $accordion = $(this);
//             const participantId = $accordion.data('participant-id');

//             if (participantId) {
//                 // Prefilled participant saved in session
//                 otherData.push({ id: participantId });
//             } else {
//                 const $block = $accordion.find('.visitor-extra');
//                 const name = $block.find('input[name="visitor-name[]"]').val();
//                 const lastname = $block.find('input[name="visitor-lastname[]"]').val();
//                 const email = $block.find('input[name="visitor-email[]"]').val();
//                 const phone = $block.find('input[name="visitor-phone[]"]').val();
//                 const fileInput = $block.find('input[name="visitor-file[]"]')[0];
//                 const file = fileInput?.files?.[0];

//                 if (name && file) {
//                     const fileField = `visitorFiles[${fileIndex}]`;
//                     formData.append(fileField, file);
//                     otherData.push({
//                         name,
//                         lastname,
//                         email,
//                         phone,
//                         fileField
//                     });
//                     fileIndex++;
//                 }
//             }
//         });

//         formData.append('otherData', JSON.stringify(otherData));

//         Swal.fire({
//             title: 'Are you sure?',
//             text: 'You are about to submit and approve this request.',
//             icon: 'warning',
//             showCancelButton: true,
//             confirmButtonText: 'Yes, Submit & Approve!',
//             cancelButtonText: 'Cancel'
//         }).then((result) => {
//             if (!result.isConfirmed) {
//                 $loadingBtn.remove();
//                 $submitBtn.show();
//                 return;
//             }

//             showProgressModal("Processing request...");

//             $.ajax({
//                 type: 'POST',
//                 url: '/user/request',
//                 data: formData,
//                 processData: false,
//                 contentType: false,
//                 success: function (response) {
//                     const participant = response.data[0];
//                     const reference_no = participant?.AccessRequest?.reference_no;
//                     //const requestId = participant?.AccessRequest?.id;
//                     localStorage.removeItem('reference_no');

//                     if (!reference_no) {
//                         hideProgressModal();
//                         throw new Error('Missing reference number or request ID in response');
//                     }
//                     $('#progressMessage').text("Updating status..."); // update message
//                     $.ajax({
//                         url: `/user/status/${reference_no}`,
//                         method: 'PUT',
//                         contentType: 'application/json',
//                         data: JSON.stringify({ status: 'approved' }),
//                         success: function () {
//                             $('#progressMessage').text("Generating pass..."); // update message
//                             $.ajax({
//                                 url: `/user/pass/${reference_no}`,
//                                 method: 'POST',
//                                 contentType: 'application/json',
//                                 success: function (response) {
//                                     if (response.success) {
//                                         $('#wizard-02')[0].reset();
//                                         $('#extra-visitors-wrapper').empty();
//                                         $('#add-visitor-btn').addClass('d-none');
//                                         hideProgressModal(() => {
//                                             Swal.fire({
//                                                 icon: 'success',
//                                                 title: 'Success!',
//                                                 text: 'Request submitted, approved, and pass generated successfully!',
//                                                 timer: 2500,
//                                                 showConfirmButton: false
//                                             }).then(() => {
//                                                 window.location.href = `/passes`;
//                                             });
//                                         });
//                                     } else {
//                                         hideProgressModal();
//                                     }
//                                 },
//                                 error: function (xhr) {
//                                     hideProgressModal();
//                                     showToast("Pass Generation Failed", xhr.responseJSON?.message || "Error generating pass.", "text-danger");
//                                 }
//                             });
//                         },
//                         error: function (xhr) {
//                             hideProgressModal();
//                             showToast("Approval Failed", xhr.responseJSON?.message || "Error approving request.", "text-danger");
//                         }
//                     });
//                 },
//                 error: function (xhr) {
//                     let message = "Submission failed. Please try again.";
//                     hideProgressModal();
//                     if (xhr.responseJSON && xhr.responseJSON.message) {
//                         message = xhr.responseJSON.message;
//                     }
//                     hideProgressModal();
//                     showToast("Error", message, "text-danger");
//                 },
//                 complete: function () {
//                     $loadingBtn.remove();
//                     $submitBtn.show();
//                 }
//             });
//         });
//     });

//     function showToast(title, body, titleClass) {
//         const toastHtml = `
//                 <div class="toast align-items-center text-bg-light border-0" role="alert" aria-live="assertive" aria-atomic="true" data-bs-delay="5000">
//                     <div class="toast-header">
//                         <strong class="me-auto ${titleClass}">${title}</strong>
//                         <small class="text-muted">Now</small>
//                         <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
//                     </div>
//                     <div class="toast-body">${body}</div>
//                 </div>`;

//         const $toast = $(toastHtml);
//         $('.toast-container').append($toast);
//         const toast = new bootstrap.Toast($toast[0]);
//         toast.show();
//     }
// });


$(document).ready(function () {
    $('a[href="#finish"]').on('click', function (e) {
        e.preventDefault();

        const $submitBtn = $(this).hide();
        const $loadingBtn = $('<button class="btn btn-secondary" disabled id="tempLoadingBtn">' +
            '<span class="spinner-border spinner-border-sm"></span> submitting...</button>');
        $submitBtn.after($loadingBtn);

        const reference_no = localStorage.getItem('reference_no');
        // if (!reference_no) {
        //     return handleValidationError("Missing reference number", $submitBtn, $loadingBtn);
        // }

        const addMethod = $('input[name="add-method"]:checked').val();
        const formData = new FormData();
        formData.append('reference_no', reference_no);

        if (addMethod === 'manual') {
            if (!processManualEntries(formData)) {
                $loadingBtn.remove();
                $submitBtn.show();
                return;
            }
            showConfirmationDialog(formData, $submitBtn, $loadingBtn);

        } else if (addMethod === 'excel') {
            const excelFile = $('#excel-upload-input')[0].files[0];
            console.log("Excel File:", excelFile); // Debugging line to check uploaded file

            if (!excelFile) {
                return handleValidationError("Please upload an Excel file.", $submitBtn, $loadingBtn);
            }

            const reader = new FileReader();
            reader.onload = function (e) {
                const jsonData = parseExcelData(e.target.result);
                const validation = validateExcelData(jsonData);

                if (validation.hasError) {
                    return handleValidationError(validation.message, $submitBtn, $loadingBtn);
                }

                formData.append('excelFile', excelFile);
                showConfirmationDialog(formData, $submitBtn, $loadingBtn);
            };
            reader.readAsArrayBuffer(excelFile);

        } else {
            return handleValidationError("Please select a method to add visitors.", $submitBtn, $loadingBtn);
        }
    });

    function processManualEntries(formData) {
        const otherData = [];
        let fileIndex = 0;
        let hasError = false;

        $('.accordion-item').each(function () {
            const $accordion = $(this);
            const participantId = $accordion.data('participant-id');

            if (participantId) {
                otherData.push({ id: participantId });
            } else {
                const $block = $accordion.find('.visitor-extra');
                const name = $block.find('input[name="visitor-name[]"]').val()?.trim();
                const lastname = $block.find('input[name="visitor-lastname[]"]').val()?.trim();
                const email = $block.find('input[name="visitor-email[]"]').val()?.trim();
                const phone = $block.find('input[name="visitor-phone[]"]').val()?.trim();
                const identityTypeId = $block.find('select[name="visitor-identityTypeId[]"]').val()?.trim();
                const identityNumber = $block.find('input[name="visitor-identityNumber[]"]').val()?.trim();
                const file = $block.find('input[name="visitor-file[]"]')[0]?.files[0];

                if (!name || !lastname || !phone || !identityTypeId || !identityNumber) {
                    hasError = true;
                    return false;
                }

                const fileField = `visitorFiles[${fileIndex}]`;
                if (file) {
                    formData.append(fileField, file);
                }

                otherData.push({
                    name, lastname, email, phone, identityTypeId, identityNumber,
                    fileField: file ? fileField : null
                });

                fileIndex++;
            }
        });

        if (hasError) {
            showToast("Validation Error", "All required visitor fields must be filled.", "text-warning");
            return false;
        }

        formData.append('otherData', JSON.stringify(otherData));
        return true;
    }

    function parseExcelData(buffer) {
        const data = new Uint8Array(buffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        return XLSX.utils.sheet_to_json(worksheet);
    }

    function validateExcelData(jsonData) {
        const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'identityType', 'identityNumber'];
        // const allowedIdentityTypes = ['nin', 'voters id', 'driver licences'];
        let hasError = false;
        let errorMessages = [];

        jsonData.forEach((row, index) => {
            requiredFields.forEach(field => {
                if (!row[field] || String(row[field]).trim() === '') {
                    hasError = true;
                    errorMessages.push(`Row ${index + 2}: Missing field \"${field}\"`);
                }
            });

            // const identityType = String(row.identityType || '').toLowerCase().trim();
            // if (!allowedIdentityTypes.includes(identityType)) {
            //     hasError = true;
            //     errorMessages.push(`Row ${index + 2}: Invalid identityType \"${row.identityType}\"`);
            // }
        });

        return {
            hasError,
            message: errorMessages.join('<br>')
        };
    }

    function showConfirmationDialog(formData, $submitBtn, $loadingBtn) {
        Swal.fire({
            title: 'Are you sure?',
            text: 'You are about to submit and approve this request.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, Submit & Approve!',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (!result.isConfirmed) {
                $loadingBtn.remove();
                $submitBtn.show();
                return;
            }
            showProgressModal("Processing request...");
            submitRequest(formData, $submitBtn, $loadingBtn);
        });
    }

    function submitRequest(formData, $submitBtn, $loadingBtn) {
        $.ajax({
            type: 'POST',
            url: '/user/request',
            data: formData,
            processData: false,
            contentType: false,
            success: function (response) {
                const referenceNo = response.data?.[0]?.AccessRequest?.reference_no;
                if (!referenceNo) {
                    hideProgressModal();
                    showToast("Error", "Missing reference number in response", "text-danger");
                    return;
                }

                $('#progressMessage').text("Updating status...");
                $.ajax({
                    url: `/user/status/${referenceNo}`,
                    method: 'PUT',
                    contentType: 'application/json',
                    data: JSON.stringify({ status: 'approved' }),
                    success: function () {
                        $('#progressMessage').text("Generating pass...");
                        $.ajax({
                            url: `/user/pass/${referenceNo}`,
                            method: 'POST',
                            contentType: 'application/json',
                            success: function (res) {
                                if (res.success) {
                                    $('#wizard-02')[0].reset();
                                    $('#extra-visitors-wrapper').empty();
                                    $('#add-visitor-btn').addClass('d-none');
                                    localStorage.removeItem('reference_no');

                                    hideProgressModal(() => {
                                        Swal.fire({
                                            icon: 'success',
                                            title: 'Success!',
                                            text: 'Request submitted, approved, and pass generated successfully!',
                                            timer: 2500,
                                            showConfirmButton: false
                                        }).then(() => {
                                            window.location.href = `/passes`;
                                        });
                                    });
                                } else {
                                    hideProgressModal();
                                    showToast("Pass Error", res.message || "Failed to generate pass", "text-danger");
                                }
                            },
                            error: function (xhr) {
                                hideProgressModal();
                                showToast("Pass Generation Failed", xhr.responseJSON?.message || "Error generating pass.", "text-danger");
                            }
                        });
                    },
                    error: function (xhr) {
                        hideProgressModal();
                        showToast("Approval Failed", xhr.responseJSON?.message || "Error approving request.", "text-danger");
                    }
                });
            },
            error: function (xhr) {
                hideProgressModal();
                const message = xhr.responseJSON?.message || "Submission failed. Please try again.";
                showToast("Error", message, "text-danger");
            },
            complete: function () {
                $loadingBtn.remove();
                $submitBtn.show();
            }
        });
    }

    function handleValidationError(message, $submitBtn, $loadingBtn) {
        showToast("Validation Error", message, "text-warning");
        $loadingBtn.remove();
        $submitBtn.show();
        return false;
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
        new bootstrap.Toast($toast[0]).show();
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
                localStorage.removeItem('reference_no');
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
});

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
    $('#duration_type').on('change', function () {
        const value = $(this).val();

        if (value === 'one_day') {
            $('#visit_d').show();
            $('#visit_f, #visit_t').hide();
            $('#visit-from, #visit-to').val('');
        } else if (value === 'more') {
            $('#visit_f, #visit_t').show();
            $('#visit_d').hide();
            $('#visit-date').val('');
        } else {
            $('#visit_d, #visit_f, #visit_t').hide();
            $('#visit-date, #visit-from, #visit-to').val('');
        }
    });

    $('#duration_type').trigger('change');
});

// $(document).ready(function () {
//     $('#IdentityTypeId').on('change', function () {
//         console.log('IdentityTypeId changed');
//         const value = $(this).val();
//         if (value) {
//             $('#visitor-identiy-input').show();
//         } else {
//             $('#visitor-identiy-input').hide();
//         }

//     });

//     setTimeout(() => {
//         $('#IdentityTypeId').trigger('change');
//     }, 50);

// });

// $(document).ready(function () {
//     $('#IdentityTypeId1').on('change', function () {
//         console.log('IdentityTypeId1 changed');
//         const value = $(this).val();
//         if (value) {
//             $('#visitor-identiy-input1').show();
//         } else {
//             $('#visitor-identiy-input1').hide();
//         }

//     });

//     setTimeout(() => {
//         $('#IdentityTypeId1').trigger('change');
//     }, 50);

// });

// $(document).ready(function () {
//     $('#modalIdentityTypeId').on('change', function () {
//         console.log('modalIdentityTypeId changed');
//         const value = $(this).val();
//         if (value) {
//             $('#modal-visitor-identiy-input').show();
//         } else {
//             $('#modal-visitor-identiy-input').hide();
//         }

//     });

//     $('#modalIdentityTypeId').trigger('change');
// });

// $(document).ready(function () {
//     $(document).on('click', '.btn-save-visitor', function () {
//         console.log('reached')
//         const $visitor = $(this).closest('.visitor-extra');
//         const formData = new FormData();

//         const firstName = $visitor.find('input[name="visitor-nam[]"]').val();
//         const lastName = $visitor.find('input[name="visitor-lastnam[]"]').val();
//         const email = $visitor.find('input[name="visitor-emai[]"]').val();
//         const phone = $visitor.find('input[name="visitor-phon[]"]').val();
//         const fileInput = $visitor.find('input[name="visitor-fil[]"]')[0];
//         const IdentityTypeId = $visitor.find('select[name="IdentityTypeId[]"]').val();
//         const identityNumber = $visitor.find('input[name="visitor-identit[]"]').val();

//         // if (fileInput.files.length === 0) {
//         //     showToast("Validation Error", "Please upload an ID document.", "text-warning");
//         //     return;
//         // }

//         // Create a unique field name for file (required for multer to match it later)
//         const fileFieldName = 'visitor-file-' + Date.now();

//         // Send this metadata as JSON
//         const visitorData = [{
//             name: firstName,
//             lastname: lastName,
//             email: email,
//             phone: phone,
//             fileField: fileFieldName,
//             IdentityTypeId: IdentityTypeId,
//             identityNumber: identityNumber
//         }];
//         formData.append('otherData', JSON.stringify(visitorData));
//         console.log('visitorData:', visitorData);
//         formData.append('isDefault', 'true'); // <== NEW LINE

//         // Append the file with the unique field name
//         formData.append(fileFieldName, fileInput.files[0]);

//         // Also include reference_no or session-based info if needed
//         formData.append('reference_no', $('#reference_no').val()); // optional

//         $.ajax({
//             type: 'POST',
//             url: '/save-participant',
//             data: formData,
//             processData: false,
//             contentType: false,
//             success: function () {
//                 showToast("Success", "Visitor saved to session", "text-success");
//             },
//             error: function () {
//                 showToast("Error", "Failed to save visitor", "text-danger");
//             }
//         });
//     });

//     $(document).on('click', '.btn-save-visitor1', function () {
//         console.log('reached')
//         const $visitor = $(this).closest('.visitor-extra');
//         const formData = new FormData();

//         const firstName = $visitor.find('input[name="visitor-name[]"]').val();
//         const lastName = $visitor.find('input[name="visitor-lastname[]"]').val();
//         const email = $visitor.find('input[name="visitor-email[]"]').val();
//         const phone = $visitor.find('input[name="visitor-phone[]"]').val();
//         const fileInput = $visitor.find('input[name="visitor-file[]"]')[0];
//         const IdentityTypeId = $visitor.find('input[name="IdentityTypeId[]"]')[0];
//         const identityNumber = $visitor.find('input[name="visitor-identit[]"]')[0];

//         // if (fileInput.files.length === 0) {
//         //     showToast("Validation Error", "Please upload an ID document.", "text-warning");
//         //     return;
//         // }

//         // Create a unique field name for file (required for multer to match it later)
//         const fileFieldName = 'visitor-file-' + Date.now();

//         // Send this metadata as JSON
//         const visitorData = [{
//             name: firstName,
//             lastname: lastName,
//             email: email,
//             phone: phone,
//             fileField: fileFieldName,
//             IdentityTypeId,
//             identityNumber
//         }];
//         formData.append('otherData', JSON.stringify(visitorData));

//         // Append the file with the unique field name
//         formData.append(fileFieldName, fileInput.files[0]);

//         // Also include reference_no or session-based info if needed
//         formData.append('reference_no', $('#reference_no').val()); // optional

//         $.ajax({
//             type: 'POST',
//             url: '/save-participant',
//             data: formData,
//             processData: false,
//             contentType: false,
//             success: function () {
//                 showToast("Success", "Visitor saved to session", "text-success");
//             },
//             error: function () {
//                 showToast("Error", "Failed to save visitor", "text-danger");
//             }
//         });
//     });
// });

let identityTypes = [
    { id: 'NIN', identity_name: 'National ID' },
    { id: 'Voter-ID', identity_name: 'Voter ID' },
    { id: 'Driver-licence', identity_name: 'Driver Licence' },
    { id: 'Employee-Id', identity_name: 'Employee Id' },
];

// function fetchIdentityTypes() {
//     return $.get('/user/identities').then(res => {
//         identityTypes = res.data;
//     });
// }

function populateIdentitySelect($select, selectedId = '') {
    $select.empty().append('<option value="">---Select Identity Type---</option>');
    identityTypes.forEach(identity => {
        const selected = identity.id === selectedId ? 'selected' : '';
        $select.append(`<option value="${identity.id}" ${selected}>${identity.identity_name}</option>`);
    });
}

function renderVisitorForm(visitor = {}) {
    const template = $('#visitor-form-template').html();
    const uid = Date.now();
    const html = template
        .replaceAll('{{uid}}', uid)
        .replaceAll('{{id}}', visitor.id || '')
        .replaceAll('{{firstName}}', visitor.firstName || '')
        .replaceAll('{{lastName}}', visitor.lastName || '')
        .replaceAll('{{email}}', visitor.email || '')
        .replaceAll('{{phone}}', visitor.phoneNumber || '')
        .replaceAll('{{identityNumber}}', visitor.identityNumber || '')

    const $form = $(html);
    populateIdentitySelect($form.find('.identity-select'), visitor.identityTypeId);

    if (visitor.identityTypeId) {
        $form.find('.identity-number-wrapper').show();
    }

    $('#extra-visitors-wrapper').append($form);
};

$(document).ready(async function () {
    // await fetchIdentityTypes();

    if (typeof extraVisitors !== 'undefined') {
        extraVisitors.forEach(renderVisitorForm);
    }

    $('#add-visitor-btn').on('click', function () {
        console.log('Add Visitor button clicked');

        // $.ajax({
        //     url: '/user/identities',
        //     method: 'GET',
        //     success: function (identities) {
        //         const data = identities.data;
        //         const $select = $('#modalIdentityTypeId');
        //         $select.empty();
        //         $select.append('<option value="">---Select Identity Type---</option>');

        //         data.forEach(function (identity) {
        //             $select.append(`<option value="${identity.id}">${identity.identity_name}</option>`);
        //         });

        //         // Show modal after select is populated
        //         $('#addVisitorModal').modal('show');
        //     },
        //     error: function (xhr, status, error) {
        //         console.error('Failed to load identityType:', error);
        //         alert("Failed to load identity types");
        //     }
        // });

        $('#addVisitorModal').modal('show');
    });

    $(document).on('change', '#modalIdentityTypeId', function () {
        const selectedId = $(this).val();
        if (selectedId) {
            $('#modal-visitor-identiy-input').show();
        } else {
            $('#modal-visitor-identiy-input').hide();
        }
    });

    $('#save-visitor-modal-btn').on('click', function () {
        const data = {
            firstName: $('#modal-visitor-firstname').val().trim(),
            lastName: $('#modal-visitor-lastname').val().trim(),
            email: $('#modal-visitor-email').val().trim(),
            phone: $('#modal-visitor-phone').val().trim(),
            identityTypeId: $('#modalIdentityTypeId').val().trim(),
            identityNumber: $('#model-visitor-identiy').val().trim(),
        };

        if (!data.firstName || !data.lastName || !data.phone || !data.identityTypeId || !data.identityNumber) {
            showToast("Validation Error", "All fields are required", "text-warning");
            return;
        }

        const file = $('#modal-visitor-file')[0]?.files[0];
        const fileFieldName = 'visitor-file-' + Date.now();
        const formData = new FormData();
        formData.append(fileFieldName, file);
        formData.append('otherData', JSON.stringify([{ ...data, fileField: fileFieldName }]));

        $.ajax({
            url: '/save-participant',
            type: 'POST',
            data: formData,
            contentType: false,
            processData: false,
            success: function (res) {
                renderVisitorForm(res.participant);
                $('#addVisitorModal').modal('hide');
                $('#addVisitorModal input').val('');
            },
            error: function () {
                alert('Failed to save visitor');
            }
        });
    });

    $('#accordion').on('click', '.btn-remove-visitor', function () {
        const $accordionItem = $(this).closest('.accordion-item');
        const id = $accordionItem.data('participant-id');
        //if (!id) return $accordionItem.remove();

        $.ajax({
            url: '/remove-participant',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ id }),
            success: function () {
                //$accordionItem.remove();
                $accordionItem.find('input[name="visitor-name[]"]').val('')
                $accordionItem.find('input[name="visitor-lastname[]"]').val('')
                $accordionItem.find('input[name="visitor-email[]"]').val('')
                $accordionItem.find('input[name="visitor-phone[]"]').val('')
                $accordionItem.find('select[name="visitor-identityTypeId[]"]').val('')
                $accordionItem.find('input[name="visitor-identityNumber[]"]').val('')
            },
            error: function () {
                alert('Failed to remove visitor');
            }
        });
    });
    $('#extra-visitors-wrapper').on('click', '.btn-remove-visitor', function () {
        const $accordion = $(this).closest('.accordion-item');
        const id = $accordion.data('participant-id');
        if (!id) return $accordion.remove();

        $.ajax({
            url: '/remove-participant',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ id }),
            success: function () {
                $accordion.remove();
            },
            error: function () {
                alert('Failed to remove visitor');
            }
        });
    });

    $('#extra-visitors-wrapper').on('click', '.btn-save-visitor', function () {
        const $accordionItem = $(this).closest('.accordion-item');

        const data = {
            id: $accordionItem.data('participant-id') || null,
            firstName: $accordionItem.find('input[name="visitor-name[]"]').val().trim(),
            lastName: $accordionItem.find('input[name="visitor-lastname[]"]').val().trim(),
            email: $accordionItem.find('input[name="visitor-email[]"]').val().trim(),
            phone: $accordionItem.find('input[name="visitor-phone[]"]').val().trim(),
            identityTypeId: $accordionItem.find('select[name="visitor-identityTypeId[]"]').val(),
            identityNumber: $accordionItem.find('input[name="visitor-identityNumber[]"]').val().trim(),
        };

        if (!data.firstName || !data.lastName || !data.phone || !data.identityTypeId || !data.identityNumber) {
            showToast("Validation Error", "All fields are required", "text-warning");
            return;
        }

        const fileInput = $accordionItem.find('input[type="file"]')[0];
        const file = fileInput?.files[0];
        const fileFieldName = 'visitor-file-' + Date.now();
        const formData = new FormData();

        if (file) {
            formData.append(fileFieldName, file);
        }
        formData.append('otherData', JSON.stringify([{ ...data, fileField: file ? fileFieldName : null }]));

        $.ajax({
            url: '/save-participant',
            type: 'POST',
            data: formData,
            contentType: false,
            processData: false,
            success: function (res) {
                showToast("Success", "Visitor updated successfully", "text-success");

                // Optionally update hidden ID and replace contents
                if (res.participant?.id) {
                    $accordionItem.attr('data-participant-id', res.participant.id);
                }
            },
            error: function () {
                alert('Failed to update visitor');
            }
        });
    });

    $('#accordion').on('click', '.btn-save-visitor', function () {
        const $accordionItem = $(this).closest('.accordion-item');

        const data = {
            id: $accordionItem.data('participant-id') || null,
            firstName: $accordionItem.find('input[name="visitor-name[]"]').val().trim(),
            lastName: $accordionItem.find('input[name="visitor-lastname[]"]').val().trim(),
            email: $accordionItem.find('input[name="visitor-email[]"]').val().trim(),
            phone: $accordionItem.find('input[name="visitor-phone[]"]').val().trim(),
            identityTypeId: $accordionItem.find('select[name="visitor-identityTypeId[]"]').val(),
            identityNumber: $accordionItem.find('input[name="visitor-identityNumber[]"]').val().trim(),
        };

        if (!data.firstName || !data.lastName || !data.phone || !data.identityTypeId || !data.identityNumber) {
            showToast("Validation Error", "All fields are required", "text-warning");
            return;
        }

        const fileInput = $accordionItem.find('input[type="file"]')[0];
        const file = fileInput?.files[0];
        const fileFieldName = 'visitor-file-' + Date.now();
        const formData = new FormData();

        if (file) {
            formData.append(fileFieldName, file);
        }
        formData.append('otherData', JSON.stringify([{ ...data, fileField: file ? fileFieldName : null }]));

        $.ajax({
            url: '/save-participant',
            type: 'POST',
            data: formData,
            contentType: false,
            processData: false,
            success: function (res) {
                showToast("Success", "Visitor updated successfully", "text-success");

                // Optionally update hidden ID and replace contents
                if (res.participant?.id) {
                    $accordionItem.attr('data-participant-id', res.participant.id);
                }
            },
            error: function () {
                alert('Failed to update visitor');
            }
        });
    });

});

$(document).ready(function () {
    $('#visit-type').on('change', function () {
        const visitType = $(this).val();
        console.log("Visit Type changed to:", visitType);

        const isGroup = visitType === 'group';
        $('#add-visitor-btn').toggleClass('d-none', !isGroup);
        $('.question-section').toggleClass('d-none', !isGroup);


        if (!isGroup) {
            $('#extra-visitors-wrapper').empty();
            $('.question-section').toggleClass('d-none', true);
        }
    }).trigger('change');

    // Populate all identity selects
    // $.get('/user/identities', function (response) {
    //     const identities = response.data;

    //     $('.identity-select').each(function () {
    //         const $select = $(this);
    //         const selectedId = $select.data('selected-id');

    //         $select.empty().append('<option value="">--- Select Identity Type ---</option>');
    //         identities.forEach(identity => {
    //             const selected = identity.id === selectedId ? 'selected' : '';
    //             $select.append(`<option value="${identity.id}" ${selected}>${identity.identity_name}</option>`);
    //         });

    //         $select.trigger('change');
    //     });
    // });

    // Show/hide ID input when identity is selected
    $(document).on('change', '.identity-select', function () {
        const $wrapper = $(this).closest('.row');
        const $identityInput = $wrapper.find('.identity-number-wrapper');
        $identityInput.toggle(!!$(this).val());
    });
});

// $('#excel-upload-input').on('change', function () {
//     const file = this.files[0];
//     if (!file) return;

//     const formData = new FormData();
//     formData.append('visitorExcel', file);

//     $.ajax({
//         url: '/upload-visitors',
//         method: 'POST',
//         data: formData,
//         contentType: false,
//         processData: false,
//         success: function (res) {
//             if (res.success) {
//                 res.visitors.forEach(visitor => {
//                     renderVisitorForm(visitor); // Reuse your rendering function
//                 });
//                 showToast('Success', 'Visitors imported successfully', 'text-success');
//             } else {
//                 showToast('Error', res.message, 'text-danger');
//             }
//         },
//         error: function () {
//             showToast('Error', 'Failed to upload Excel file', 'text-danger');
//         }
//     });
// });

$(document).ready(function () {
    $('#excel-upload-input').on('change', function (e) {
        const file = e.target.files[0];
        if (!file) return console.warn('No file selected');

        console.log('Selected file:', file);
        $('.download-template').addClass('d-none');
        const reader = new FileReader();

        reader.onload = function (e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];

                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                console.log('Excel parsed data:', jsonData);

                if (!jsonData.length || jsonData[0].length === 0) {
                    $('#excel-preview-wrapper').addClass('d-none');
                    alert('Excel file is empty or missing headers.');
                    return;
                }

                // Build table
                let tableHtml = '<thead><tr>';
                jsonData[0].forEach(header => {
                    tableHtml += `<th>${header}</th>`;
                });
                tableHtml += '</tr></thead><tbody>';

                jsonData.slice(1).forEach(row => {
                    tableHtml += '<tr>';
                    row.forEach(cell => {
                        tableHtml += `<td>${cell ?? ''}</td>`;
                    });
                    tableHtml += '</tr>';
                });
                tableHtml += '</tbody>';

                $('#excel-preview-table').html(tableHtml);
                $('#excel-preview-wrapper').removeClass('d-none');

            } catch (err) {
                console.error('Excel parsing error:', err);
                alert('Error reading Excel file. Please ensure it is a valid .xlsx or .xls file.');
            }
        };

        reader.readAsArrayBuffer(file);
    });
});

$(document).ready(function () {
    $('input[name="add-method"]').on('change', function () {
        const method = $(this).val();

        if (method === 'manual') {
            $('#manual-add-section').removeClass('d-none');
            $('#excel-upload-section').addClass('d-none');
            $('#excel-preview-wrapper').addClass('d-none');
            $('.download-template').removeClass('d-none');
            $('#excel-preview-table').empty();
            $('#excel-upload-input').val('');
            $('#accordion').show();
            $('#extra-visitors-wrapper').show();
        } else {
            $('#manual-add-section').addClass('d-none');
            $('#excel-upload-section').removeClass('d-none');
            $('#accordion').hide();
            $('#extra-visitors-wrapper').hide();
        }
    });

    // Trigger initial state
    $('input[name="add-method"]:checked').trigger('change');
});
