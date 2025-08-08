

$(document).ready(function () {
    $('#update-role').select2({
        placeholder: "---select role---",
        allowClear: true
    });
});
$(document).ready(function () {
    $('#gender').select2({
        placeholder: "---select gender---",
        allowClear: true
    });
});
$(document).ready(function () {
    $('#update-gender').select2({
        placeholder: "---select gender---",
        allowClear: true
    });
});

$(document).ready(function () {
    $('#update-department').select2({
        placeholder: "---select Department---",
        allowClear: true
    });
});

window.addEventListener('pageshow', function (event) {
    if (event.persisted || (window.performance && window.performance.navigation.type === 2)) {
        // If coming from bfcache (Back/Forward cache), reload to enforce revalidation
        window.location.reload();
    }
});

$(document).ready(function () {
    if (!$.fn.DataTable.isDataTable('#requestsTable')) {
        $('#requestsTable').DataTable({
            pageLength: 5,
            responsive: true,
            autoWidth: false,
        });
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
    async function loadDepartments(selectedDepartmentId = null) {
        $.ajax({
            url: '/user/allDepartments',
            method: 'GET',
            success: function (response) {
                const departments = response.data;
                const $select = $('#department');
                $select.empty();
                $select.append('<option value="">---Select Department---</option>');

                departments.forEach(function (dept) {
                    const isSelected = dept.id === selectedDepartmentId ? 'selected' : '';
                    $select.append(`<option value="${dept.id}" ${isSelected}>${dept.name}</option>`);
                });

                // Re-init select2 after options are loaded
                $select.select2({
                    placeholder: "---Select Department---",
                    dropdownParent: $('#addUser')
                });
            },
            error: function (xhr, status, error) {
                console.error('Failed to load departments:', error);
            }
        });
    };

    async function loadRoles(selectedRoleId = null) {
        $.ajax({
            url: '/user/roles',
            method: 'GET',
            success: function (response) {
                const roles = response.data;
                const $select = $('#role');
                $select.empty();
                $select.append('<option value="">---Select role---</option>');

                roles.forEach(function (role) {
                    const isSelected = role.id === selectedRoleId ? 'selected' : '';
                    $select.append(`<option value="${role.id}" ${isSelected}>${role.roleName}</option>`);
                });

                // Re-init select2 after options are loaded
                $select.select2({
                    placeholder: "---Select Department---",
                    dropdownParent: $('#addUser')
                });

                $select.on('change', function () {
                    const selectedRoleId = $(this).val();
                    const selectedRole = roles.find(role => role.id == selectedRoleId);

                    if (selectedRole && selectedRole.roleName.toLowerCase() === 'security') {
                        $('#gateAssignedWrapper').show();
                    } else {
                        $('#gateAssignedWrapper').hide();
                        $('#gateAssigned').val(''); // optionally reset
                    }
                });
            },
            error: function (xhr, status, error) {
                console.error('Failed to load departments:', error);
            }
        });
    }

    $('#add-user-btn').on('click', async function () {
        await loadDepartments(); // load options just before modal opens
        await loadRoles();
        $('#addUser').modal('show'); // then show modal
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

$(document).ready(function () {
    $('#create-user').on('click', function (e) {
        e.preventDefault();

        const firstname = $('#first-name').val();
        const middlename = $('#middle-name').val();
        const lastname = $('#last-name').val();
        const email = $('#email').val();
        const phone = $('#phone').val();
        const signature = $('#signature').val();
        const password = $('#password').val();
        const gender = $('#gender').val();
        const designation = $('#designation').val();
        const depid = $('#department').val();
        const RoleId = $('#role').val();
        const gateAssigned = $('#gateAssigned').val();

        console.log({ firstname, middlename, lastname, email, password, gender, designation, depid, RoleId, phone, signature, gateAssigned });


        if (!firstname || !middlename || !lastname || !email || !password || !gender || !designation || !depid || !RoleId || !phone || !signature) {
            showToast("Validation Error", "All fields are required.", "text-warning");
            return;
        }

        const formData = {
            firstname,
            middlename,
            lastname,
            email,
            password,
            phone,
            signature,
            gender,
            designation,
            depid,
            RoleId,
            gateAssigned: gateAssigned || null // Optional field, can be null
        };

        console.log('formData:', formData)
        console.log('reached')
        $.ajax({
            type: 'POST',
            url: '/user/user',
            contentType: 'application/json',
            data: JSON.stringify(formData), // Convert to JSON string
            success: function (response) {
                //showToast("Success", "Created successfully", "text-success");
                $('#addUser').modal('hide'); // Hide the modal
                $('#first-name').val('');
                $('#middle-name').val('');
                $('#last-name').val('');
                $('#email').val('');
                $('#password').val('');
                $('#gender').val('');
                $('#designation').val('');
                $('#department').val('');
                $('#role').val('');
                $('#gateAssigned').val('');
                $('#phone').val('');
                Swal.fire({
                    icon: 'success',
                    title: 'Created!',
                    text: 'User has been successfully created.',
                    timer: 2000,
                    showConfirmButton: false
                }).then(() => {
                    window.location.reload();
                });
            },
            error: function (xhr) {
                let message = "Request failed. Please try again.";
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    message = xhr.responseJSON.message;
                }
                $('#first-name').val('');
                $('#middle-name').val('');
                $('#last-name').val('');
                $('#email').val('');
                $('#password').val('');
                $('#gender').val('');
                $('#designation').val('');
                $('#department').val('');
                $('#role').val('');
                showToast("Error", message, "text-danger");
                return;
            },
        });
    })
})

async function updateloadDepartments(selectedDepartmentId) {
    $.ajax({
        url: '/user/allDepartments',
        method: 'GET',
        success: function (response) {
            const departments = response.data;
            const $select = $('#update-department');
            $select.empty();
            $select.append('<option value="">---Select Department---</option>');

            departments.forEach(function (dept) {
                const isSelected = dept.id === selectedDepartmentId ? 'selected' : '';
                $select.append(`<option value="${dept.id}" ${isSelected}>${dept.name}</option>`);
            });

            // Re-init select2 after options are loaded
            $select.select2({
                placeholder: "---Select Department---",
                dropdownParent: $('#updateUser')
            });
        },
        error: function (xhr, status, error) {
            console.error('Failed to load departments:', error);
        }
    });
};

async function updateloadRoles(selectedRoleId) {
    $.ajax({
        url: '/user/roles',
        method: 'GET',
        success: function (response) {
            const roles = response.data;
            const $select = $('#update-role');
            $select.empty();
            $select.append('<option value="">---Select role---</option>');

            roles.forEach(function (role) {
                const isSelected = role.id === selectedRoleId ? 'selected' : '';
                $select.append(`<option value="${role.id}" ${isSelected}>${role.roleName}</option>`);
            });

            // Re-init select2 after options are loaded
            $select.select2({
                placeholder: "---Select Department---",
                dropdownParent: $('#updateUser')
            });
            if (selectedRoleId) {
                const selectedRole = roles.find(role => role.id == selectedRoleId);
                if (selectedRole && selectedRole.roleName.toLowerCase() === 'security') {
                    $('#update-gateAssignedWrapper').show();
                }
            }
        },
        error: function (xhr, status, error) {
            console.error('Failed to load departments:', error);
        }
    });
}

async function fetchAndShowUserDetails(id) {
    //e.preventDefault();

    console.log('reached')

    $.ajax({
        type: 'GET',
        url: `/user/user/${id}`, // Use the correct endpoint for updating
        contentType: 'application/json',
        success: async function (response) {
            await updateloadDepartments(response.data.depid);
            await updateloadRoles(response.data.RoleId);
            $('#updated-role-name').val(response.data.roleName);
            $('#update-first-name').val(response.data.firstname);
            $('#update-middle-name').val(response.data.middlename);
            $('#update-last-name').val(response.data.lastname);
            $('#update-email').val(response.data.email);
            $('#update-phone').val(response.data.phone);
            $('#update-signature').val(response.data.signature);
            //$('#update-password').val(response.data.password);
            $('#update-gender').val(response.data.gender).trigger('change');
            $('#update-designation').val(response.data.designation);
            $('#update-department').val(response.data.department);
            $('#update-role').val(response.data.role).trigger('change');;
            $('#update-gateAssigned').val(response.data.gateAssigned || '').trigger('change');
            $('#updateUser').modal('show');
            roleId = response.data.id;
            $('#update-user').off('click').on('click', function () {
                updateUser(roleId);
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

async function updateUser(id) {
    const firstname = $('#update-first-name').val();
    const middlename = $('#update-middle-name').val();
    const lastname = $('#update-last-name').val();
    const email = $('#update-email').val();
    const phone = $('#update-phone').val();
    const signature = $('#update-signature').val();
    const gender = $('#update-gender').val();
    const designation = $('#update-designation').val();
    const depid = $('#update-department').val();
    const RoleId = $('#update-role').val();
    const gateAssigned = $('#update-gateAssigned').val();


    if (!firstname || !middlename || !lastname || !email || !gender || !designation || !depid || !RoleId || !phone || !signature) {
        showToast("Validation Error", "All fields are required.", "text-warning");
        return;
    }

    const formData = {
        firstname,
        middlename,
        lastname,
        email,
        phone,
        signature,
        gender,
        designation,
        depid,
        RoleId,
        gateAssigned
    };

    console.log('formData:', formData)
    console.log('reached')
    $.ajax({
        type: 'PUT',
        url: `/user/user/${id}`,
        contentType: 'application/json',
        data: JSON.stringify(formData), // Convert to JSON string
        success: function (response) {
            //showToast("Success", "Created successfully", "text-success");
            $('#addUser').modal('hide'); // Hide the modal
            $('#first-name').val('');
            $('#middle-name').val('');
            $('#last-name').val('');
            $('#email').val('');
            $('#phone').val('');
            $('#signature').val('');
            $('#gender').val('');
            $('#designation').val('');
            $('#department').val('');
            $('#role').val('');
            Swal.fire({
                icon: 'success',
                title: 'Updated!',
                text: 'User has been successfully updated.',
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                window.location.reload();
            });
            // Redirect to the department page
        },
        error: function (xhr) {
            let message = "Request failed. Please try again.";
            if (xhr.responseJSON && xhr.responseJSON.message) {
                message = xhr.responseJSON.message;
            }
            $('#first-name').val('');
            $('#middle-name').val('');
            $('#last-name').val('');
            $('#email').val('');
            $('#phone').val('');
            $('#signature').val('');
            $('#gender').val('');
            $('#designation').val('');
            $('#department').val('');
            $('#role').val('');
            showToast("Error", message, "text-danger");
            return;
        },
    });
}

function deleteUser(id) {
    console.log("Deleting User with ID:", id);
    Swal.fire({
        title: 'Are you sure?',
        text: "You are about to delete this User.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, cancel it!'
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: `/user/user/${id}`,
                method: 'DELETE',
                success: function (response) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Cancelled!',
                        text: 'User has been deleted.',
                        timer: 2000,
                        showConfirmButton: false
                    }).then(() => {
                        window.location.href = '/user';
                    });
                },
                error: function (xhr) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error!',
                        text: xhr.responseJSON?.message || 'Failed to delete user.',
                    });
                }
            });
        }
    });
}