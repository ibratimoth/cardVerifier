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

function fetchAndShowRoleDetailss(id) {
    //e.preventDefault();

    console.log('reached')

    $.ajax({
        type: 'GET',
        url: `/user/role/${id}`, // Use the correct endpoint for updating
        contentType: 'application/json',
        success: function (response) {
            console.log('response:', response.data.roleName);
            $('#updated-role-name').val(response.data.roleName);
            $('#updateRole').modal('show');
            roleId = response.data.id;
            $('#update-role').off('click').on('click', function () {
                updateRole(roleId);
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

function loadAllPermissionsWithAssignment(roleId) {
    console.log('list of permissions for role ID:', roleId);
    $.ajax({
        type: 'GET',
        url: '/user/permissions',
        contentType: 'application/json',
        success: function (response) {
            const permissions = response.data;
            const container = $('#updated-permissions-container');
            container.empty();

            // Group permissions
            const grouped = permissions.reduce((acc, p) => {
                if (!acc[p.group]) acc[p.group] = [];
                acc[p.group].push(p);
                return acc;
            }, {});

            for (const group in grouped) {
                const html = `
                <div class="col-md-6 mb-4">
                    <div class="card card-bordered h-100">
                        <div class="card-inner">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <div class="custom-control custom-checkbox">
                                    <input type="checkbox" class="custom-control-input group-checkbox" id="group-${group}" data-group="${group}">
                                    <label class="custom-control-label fw-bold text-capitalize" for="group-${group}">${group}</label>
                                </div>
                            </div>
                            <hr class="my-2">
                            <div class="row permissions-list" id="permissions-for-${group}">
                                ${grouped[group].map(p => `
                                <div class="col-sm-6 mb-2">
                                    <div class="custom-control custom-checkbox">
                                        <input type="checkbox" class="custom-control-input permission-checkbox" id="perm-${p.id}" value="${p.id}" data-group="${group}">
                                        <label class="custom-control-label" for="perm-${p.id}">${p.permission_label}</label>
                                    </div>
                                </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>`;
                container.append(html);
            }

            // Handle group checkbox toggle
            $('.group-checkbox').on('change', function () {
                const group = $(this).data('group');
                $(`.permission-checkbox[data-group="${group}"]`).prop('checked', $(this).prop('checked'));
            });

            // Fetch and pre-check assigned permissions
            $.ajax({
                type: 'GET',
                url: `/user/role/${roleId}/permissions`,
                contentType: 'application/json',
                success: function (res) {
                    const assigned = res.data.map(item => item.permissionId);

                    assigned.forEach(id => {
                        const selector = `[id='perm-${id}']`; // safer selector
                        const checkbox = $(selector);
                        if (checkbox.length) {
                            checkbox.prop('checked', true);
                        } else {
                            console.warn(`Checkbox not found for ID: perm-${id}`);
                        }
                    });
                }
                ,
                error: function () {
                    showToast("Error", "Failed to fetch assigned permissions.", "text-danger");
                }
            });
        },
        error: function () {
            showToast("Error", "Failed to load permissions.", "text-danger");
        }
    });
}

function fetchAndShowRoleDetails(id) {
    console.log('Opening update modal for role ID:', id);

    // Step 1: Fetch role details
    $.ajax({
        type: 'GET',
        url: `/user/role/${id}`,
        contentType: 'application/json',
        success: function (response) {
            const role = response.data;
            $('#updated-role-name').val(role.roleName);
            $('#updateRole').modal('show');

            // Step 2: Load all permissions and preselect assigned
            loadAllPermissionsWithAssignment(role.id);

            // Step 3: Set update button handler
            $('#update-role').off('click').on('click', function () {
                updateRole(role.id);
            });
        },
        error: function (xhr) {
            const msg = xhr.responseJSON?.message || "Failed to fetch role details.";
            showToast("Error", msg, "text-danger");
        }
    });
}

async function updateRole(id) {
    const roleName = $('#updated-role-name').val().trim();
    // 2. Collect checked permissions
    const selectedPermissions = [];
    $('.permission-checkbox:checked').each(function () {
        selectedPermissions.push($(this).val());
    });
    console.log('selectedPermissions:', selectedPermissions);

    if (!roleName || !id) {
        showToast("Validation Error", "All fields are required.", "text-warning");
        return;
    }

    if (selectedPermissions.length === 0) {
        showToast("Validation Error", "Please select at least one permission.", "text-warning");
        return;
    }

    try {
        // 1. Update role name
        await $.ajax({
            type: 'PUT',
            url: `/user/role/${id}`,
            contentType: 'application/json',
            data: JSON.stringify({ roleName })
        });

        // 3. Update assigned permissions
        await $.ajax({
            type: 'POST',
            url: `/user/role/${id}/permissions`,
            contentType: 'application/json',
            data: JSON.stringify({ permissionIds: selectedPermissions })
        });

        // 4. Success feedback
        $('#updateRole').modal('hide');
        Swal.fire({
            icon: 'success',
            title: 'Updated!',
            text: 'Role and permissions updated successfully.',
            timer: 2000,
            showConfirmButton: false
        }).then(() => {
            window.location.reload();
        });

    } catch (xhr) {
        const message = xhr.responseJSON?.message || "Update failed. Please try again.";
        showToast("Error", message, "text-danger");
    }
}

function fetchAndShowPermissionDetails(permissionId) {
    //e.preventDefault();

    console.log('reached')

    $.ajax({
        type: 'GET',
        url: `/user/permission/${permissionId}`, // Use the correct endpoint for updating
        contentType: 'application/json',
        success: function (response) {
            console.log('response:', response.data.permissionName);
            $('#updated-permission-name').val(response.data.permissionName);
            $('#updatePermission').modal('show');
            id = response.data.id;
            $('#update-permission').off('click').on('click', function () {
                updatePermission(id);
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

function showAddModell() {

    console.log('reached')

    $.ajax({
        type: 'GET',
        url: '/user/permissions', // Use the correct endpoint for updating
        contentType: 'application/json',
        success: function (response) {
            console.log('response:', response.data);
            // response.data.forEach(p => {
            //     console.log(p.permissionName);
            // });
            // $('#updated-role-name').val(response.data.roleName);
            $('#addRole').modal('show');
            // roleId = response.data.id;
            $('#update-role').off('click').on('click', function () {
                updateRole(roleId);
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

function showAddModel() {
    console.log('reached');

    $.ajax({
        type: 'GET',
        url: '/user/permissions',
        contentType: 'application/json',
        success: function (response) {
            console.log('response:', response.data);
            const permissions = response.data;
            const permissionsContainer = $('#permissions-container');
            permissionsContainer.empty();

            const groupedPermissions = permissions.reduce((acc, permission) => {
                const groupName = permission.group;
                if (!acc[groupName]) {
                    acc[groupName] = [];
                }
                acc[groupName].push(permission);
                return acc;
            }, {});

            for (const group in groupedPermissions) {
                const groupPermissions = groupedPermissions[group];
                const cardHtml = `
  <div class="col-md-6 mb-4">
    <div class="card card-bordered h-100">
      <div class="card-inner">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <div class="custom-control custom-checkbox">
            <input type="checkbox" class="custom-control-input group-checkbox" id="group-${group}" data-group="${group}">
            <label class="custom-control-label text-capitalize fw-bold" for="group-${group}">
              ${group}
            </label>
          </div>
        </div>
        <hr class="my-2">
        <div class="row permissions-list" id="permissions-for-${group}">
          ${groupPermissions.map(p => `
            <div class="col-sm-6 mb-2">
              <div class="custom-control custom-checkbox">
                <input type="checkbox" class="custom-control-input permission-checkbox" id="permission-${p.id}" value="${p.id}" data-group="${group}">
                <label class="custom-control-label" for="permission-${p.id}">${p.permission_label}</label>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  </div>
`;

                permissionsContainer.append(cardHtml);
            }

            $('.group-checkbox').on('change', function () {
                const group = $(this).data('group');
                $(`.permission-checkbox[data-group="${group}"]`).prop('checked', $(this).prop('checked'));
            });

            $('#addRole').modal('show');
            $('#create-role').off('click').on('click', function () {
                const roleName = $('#role-name').val().trim();

                if (!roleName) {
                    showToast("Validation Error", "Role name is required.", "text-warning");
                    return;
                }

                const selectedPermissionIds = [];
                $('.permission-checkbox:checked').each(function () {
                    selectedPermissionIds.push($(this).val());
                });

                if (selectedPermissionIds.length === 0) {
                    showToast("Validation Error", "Please select at least one permission.", "text-warning");
                    return;
                }

                // Step 1: Create the role
                $.ajax({
                    type: 'POST',
                    url: '/user/role',
                    contentType: 'application/json',
                    data: JSON.stringify({ roleName }),
                    success: function (response) {
                        const createdRoleId = response.data?.id || response.roleId || response.id;

                        if (!createdRoleId) {
                            showToast("Error", "Failed to retrieve role ID after creation.", "text-danger");
                            return;
                        }

                        // Step 2: Assign permissions to the newly created role
                        $.ajax({
                            type: 'POST',
                            url: `/user/role/${createdRoleId}/permissions`,
                            contentType: 'application/json',
                            data: JSON.stringify({ permissionIds: selectedPermissionIds }),
                            success: function () {
                                $('#addRole').modal('hide');
                                $('#role-name').val('');
                                Swal.fire({
                                    icon: 'success',
                                    title: 'Success!',
                                    text: 'Role and permissions assigned successfully!',
                                    timer: 2000,
                                    showConfirmButton: false
                                }).then(() => {
                                    window.location.reload();
                                });
                            },
                            error: function (xhr) {
                                let message = "Failed to assign permissions.";
                                if (xhr.responseJSON?.message) {
                                    message = xhr.responseJSON.message;
                                }
                                showToast("Error", message, "text-danger");
                            }
                        });
                    },
                    error: function (xhr) {
                        let message = "Role creation failed.";
                        if (xhr.responseJSON?.message) {
                            message = xhr.responseJSON.message;
                        }
                        showToast("Error", message, "text-danger");
                    }
                });
            });

        },
        error: function (xhr) {
            let message = "Request failed. Please try again.";
            if (xhr.responseJSON && xhr.responseJSON.message) {
                message = xhr.responseJSON.message;
            }
            // Assuming showToast is a function that displays a toast message
            // showToast("Error", message, "text-danger");
            return;
        },
    });
}

// Auto check/uncheck group checkbox when children are toggled
$(document).on('change', '.permission-checkbox', function () {
    const group = $(this).data('group');
    const all = $(`.permission-checkbox[data-group="${group}"]`).length;
    const checked = $(`.permission-checkbox[data-group="${group}"]:checked`).length;
    $(`#group-${group}`).prop('checked', all === checked);
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

// async function updateRole(id) {
//     console.log("Updating role with ID:", id);
//     const roleName = $('#updated-role-name').val();

//     if (!roleName || !id) {
//         showToast("Validation Error", "All fields are required.", "text-warning");
//         return;
//     }

//     try {
//         const response = await $.ajax({
//             type: 'PUT',
//             url: `/user/role/${id}`, // Use the correct endpoint for updating
//             contentType: 'application/json',
//             data: JSON.stringify({ roleName }), // Convert to JSON string
//         });

//         $('#updateRole').modal('hide'); // Hide the modal
//         $('#updated-role-name').val(''); // Clear the input field
//         Swal.fire({
//             icon: 'success',
//             title: 'Success!',
//             text: 'Role updated successfully!',
//             timer: 2000,
//             showConfirmButton: false
//         }).then(() => {
//             window.location.href = '/role'; // Redirect to the department page
//         });

//     } catch (xhr) {
//         let message = "Request failed. Please try again.";
//         if (xhr.responseJSON && xhr.responseJSON.message) {
//             message = xhr.responseJSON.message;
//         }
//         showToast("Error", message, "text-danger");
//     }
// }

async function updatePermission(permissionId) {
    console.log("Updating permission with ID:", id);
    const permissionName = $('#updated-permission-name').val();

    if (!permissionName || !permissionId) {
        showToast("Validation Error", "All fields are required.", "text-warning");
        return;
    }

    try {
        const response = await $.ajax({
            type: 'PUT',
            url: `/user/permission/${permissionId}`, // Use the correct endpoint for updating
            contentType: 'application/json',
            data: JSON.stringify({ permissionName }), // Convert to JSON string
        });

        $('#updatePermission').modal('hide'); // Hide the modal
        $('#updated-permission-name').val(''); // Clear the input field
        Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: 'Permission updated successfully!',
            timer: 2000,
            showConfirmButton: false
        }).then(() => {
            window.location.reload();
        });

    } catch (xhr) {
        let message = "Request failed. Please try again.";
        if (xhr.responseJSON && xhr.responseJSON.message) {
            message = xhr.responseJSON.message;
        }
        showToast("Error", message, "text-danger");
    }
}

function deleteRole(id) {
    console.log("Deleting role with ID:", id);
    Swal.fire({
        title: 'Are you sure?',
        text: "You are about to delete this Role.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, cancel it!'
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: `/user/role/${id}`,
                method: 'DELETE',
                success: function (response) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Cancelled!',
                        text: 'Role has been deleted.',
                        timer: 2000,
                        showConfirmButton: false
                    }).then(() => {
                        window.location.href = '/role';
                    });
                },
                error: function (xhr) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error!',
                        text: xhr.responseJSON?.message || 'Failed to delete role.',
                    });
                }
            });
        }
    });
}

function deletePermission(id) {
    console.log("Deleting permission with ID:", id);
    Swal.fire({
        title: 'Are you sure?',
        text: "You are about to delete this Permission.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: `/user/permission/${id}`,
                method: 'DELETE',
                success: function (response) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Cancelled!',
                        text: 'Permission has been deleted.',
                        timer: 2000,
                        showConfirmButton: false
                    }).then(() => {
                        window.location.reload(); // Reload the page to reflect changes
                    });
                },
                error: function (xhr) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error!',
                        text: xhr.responseJSON?.message || 'Failed to delete permission.',
                    });
                }
            });
        }
    });
}

// $(document).ready(function () {
//     $('#create-role').on('click', function (e) {
//         e.preventDefault();

//         console.log('reached')
//         const roleName = $('#role-name').val();

//         if (!roleName) {
//             showToast("Validation Error", "All fields are required.", "text-warning");
//             return;
//         }

//         $.ajax({
//             type: 'POST',
//             url: '/user/role',
//             contentType: 'application/json',
//             data: JSON.stringify({ roleName }), 
//             success: function (response) {
//                 $('#addRole').modal('hide'); 
//                 $('#role-name').val(''); 
//                 Swal.fire({
//                     icon: 'success',
//                     title: 'Success!',
//                     text: 'Role generated successfully!',
//                     timer: 2000,
//                     showConfirmButton: false
//                 }).then(() => {
//                     window.location.reload(); 
//                 });

//             },
//             error: function (xhr) {
//                 let message = "Request failed. Please try again.";
//                 if (xhr.responseJSON && xhr.responseJSON.message) {
//                     message = xhr.responseJSON.message;
//                 }
//                 showToast("Error", message, "text-danger");
//                 return;
//             },
//         });
//     })
// })

$(document).ready(function () {
    $('#create-permission').on('click', function (e) {
        e.preventDefault();

        console.log('reached')
        const permissionName = $('#permission-name').val();

        if (!permissionName) {
            showToast("Validation Error", "All fields are required.", "text-warning");
            return;
        }

        $.ajax({
            type: 'POST',
            url: '/user/permission',
            contentType: 'application/json',
            data: JSON.stringify({ permissionName }), // Convert to JSON string
            success: function (response) {
                //showToast("Success", "Created successfully", "text-success");
                $('#addPermission').modal('hide'); // Hide the modal
                $('#permission-name').val(''); // Clear the input field
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'Permission generated successfully!',
                    timer: 2000,
                    showConfirmButton: false
                }).then(() => {
                    window.location.reload(); // Reload the page to reflect changes
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
})

// Function to assign permissions to a role
function assignPermissionsToRole() {
    const roleId = $('#roleSelector').val();
    //const permissionIds = $('#permissionSelector').val();

    const selectedPermissions = [];
    $('input[name="btnCheck"]:checked').each(function () {
        selectedPermissions.push($(this).val());
    });

    if (selectedPermissions.length === 0) {
        showToast("Validation Error", "Please select at least one Permission", "text-warning");
        return;
    }

    if (!roleId) {
        showToast("Validation Error", "Role is required.", "text-warning");
        return;
    }

    $('#assignPermissionsBtn').hide();
    $('#loadingBtn').show();
    $.ajax({
        type: 'POST',
        url: `/user/role/${roleId}/permissions`,
        contentType: 'application/json',
        data: JSON.stringify({ permissionIds: selectedPermissions }), // Convert to JSON string
        success: function (response) {
            showToast("Success", "Permissions assigned successfully", "text-success");
            $('#assignPermissionsBtn').show();
            $('#loadingBtn').hide();
            window.location.reload(); // Reload the page to reflect changes
        },
        error: function (xhr) {
            let message = "Request failed. Please try again.";
            if (xhr.responseJSON && xhr.responseJSON.message) {
                message = xhr.responseJSON.message;
            }
            showToast("Error", message, "text-danger");
            $('#assignPermissionsBtn').show();
            $('#loadingBtn').hide();
            return;
        },
    });
}

function loadPermissionsForRole() {
    const roleId = $('#roleSelector').val();

    $.ajax({
        url: `/user/role/${roleId}/permissions`, // your route
        method: 'GET',
        success: function (response) {
            if (response.success && response.data) {
                const assignedPermissions = response.data.map(item => item.permissionId);

                // Uncheck all permission checkboxes first
                $('input[type="checkbox"][id^="perm-"]').prop('checked', false);

                // Check only those assigned to this role
                assignedPermissions.forEach(id => {
                    $(`#perm-${id}`).prop('checked', true);
                });
            } else {
                alert('Could not load assigned permissions.');
            }
        },
        error: function () {
            alert('Error while fetching role permissions.');
        }
    });
}

