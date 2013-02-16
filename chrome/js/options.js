// Save this script as `options.js`

// Saves options to localStorage.
function save_options() {
    var signature_box = document.getElementById("cloudy_signature");
    localStorage["signature"] = signature_box.checked;

    // Update status to let user know options were saved.
    var status = document.getElementById("status");
    status.innerHTML = "Options Saved.";
    setTimeout(function() {
                status.innerHTML = "";
            }, 750);
}

// Restores select box state to saved value from localStorage.
function restore_options() {
    var first_time = localStorage["initialized"];
    if (!first_time) {
        localStorage["initialized"] = "true";
        localStorage["signature"] = "true";
    } else {
        var signature_enabled = localStorage["signature"];
        var signature_box = document.getElementById("cloudy_signature");
        if (signature_enabled === "false") {
            signature_box.checked = false;
        }
    }
}
document.addEventListener('DOMContentLoaded', restore_options);
document.querySelector('#save').addEventListener('click', save_options);
