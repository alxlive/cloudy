// Save this script as `options.js`

var storage = chrome.storage.sync;
var signature_box = document.getElementById("cloudy_signature");

// Saves options to localStorage.
function save_options() {
    $("#save").addClass("disabled");
    var enabled_services = new Array();
    var list = document.getElementById("enabled_services").children;
    for (var i = 0; i < list.length; i++) {
        enabled_services.push(list[i].getAttribute("data-name"));
    }
    storage.set({ "signature": signature_box.checked, 
                   "services": enabled_services,
                   "multifile": $("input[name=optionsRadios]:checked").val() },
                function (){
                    var status = document.getElementById("status");
                    // Update status to let user know options were saved.
                    status.innerHTML = "Options Saved.";
                    $("#save").removeClass("disabled");
                    setTimeout(function() {
                        status.innerHTML = "";
                    }, 750);
                });
}

// Restores select box state to saved value from localStorage.
function restore_options() {
    signature_box.checked = true;
    storage.get("signature", function(items) {
        if (typeof items.signature === "undefined") {
            storage.set({ "signature": true });
        } else {
            signature_box.checked = items.signature;
        }
    });
    storage.get("services", function(items) {
        if (typeof items.services === "undefined") {
            // do nothing, wait until user saves for the first time
        } else {
            // TODO: preserve order of enabled services!
            var enabled_parent = document.getElementById("enabled_services");
            var disabled_parent = document.getElementById("disabled_services");
            var list = enabled_parent.children;
            for (var i = list.length-1; i >= 0; i--) {
                if (items.services.indexOf(list[i].getAttribute("data-name")) 
                        === -1){
                    var node = enabled_parent.removeChild(list[i]);
                    disabled_parent.appendChild(node);
                }
            }
        }
    });
    storage.get("multifile", function(items) {
        if (typeof items.multifile === "undefined") {
            storage.set({ "multifile": "multiple" });
        } else {
            $("input[name=optionsRadios][value=" + items.multifile + "]")
                .prop("checked", true);
        }
    });
}

document.addEventListener('DOMContentLoaded', restore_options);
$("#save").click(function(e) {
    e.preventDefault();
    $(this).addClass("disabled");
    save_options();
});
// document.querySelector('#save').addEventListener('click', save_options);
$(function() {
        $('.sortable').sortable();
        $('.connected').sortable({
            connectWith: '.connected'
        });
});
