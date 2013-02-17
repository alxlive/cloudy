// Save this script as `options.js`

var storage = chrome.storage.sync;
var signature_box = document.getElementById("cloudy_signature");

// Saves options to localStorage.
function save_options() {
    storage.set({ "signature": signature_box.checked }, function (){
        var status = document.getElementById("status");
        // Update status to let user know options were saved.
        status.innerHTML = "Options Saved.";
        setTimeout(function() {
            status.innerHTML = "";
            }, 750);
        });

}

// Restores select box state to saved value from localStorage.
function restore_options() {
    storage.get("signature", function(items) {
        if (typeof items.signature === "undefined") {
            storage.set({ "signature": true }, function (){
                var status = document.getElementById("status");
                // Update status to let user know options were saved.
                status.innerHTML = "Options Saved.";
                setTimeout(function() {
                    status.innerHTML = "";
                    }, 750);
            });
        } else {
            signature_box.checked = items.signature;
        }
    })
}
document.addEventListener('DOMContentLoaded', restore_options);
document.querySelector('#save').addEventListener('click', save_options);
