// Save this script as `options.js`

var storage = chrome.storage.sync;
var signature_box = document.getElementById("cloudy_signature");

// Saves options to localStorage.
function save_options() {
    $("#save").addClass("disabled");
    var services = {};
    services.enabled = new Array();
    var list = document.getElementById("enabled_services").children;
    for (var i = 0; i < list.length; i++) {
        var elem = {};
        elem.name = list[i].innerHTML;
        elem.keyword = list[i].getAttribute("data-name");
        services.enabled.push(elem);
    }
    services.disabled = new Array();
    var list = document.getElementById("disabled_services").children;
    for (var i = 0; i < list.length; i++) {
        var elem = {};
        elem.name = list[i].innerHTML;
        elem.keyword = list[i].getAttribute("data-name");
        services.disabled.push(elem);
    }

    storage.set({ "signature": signature_box.checked, 
                   "services": services,
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
            var enabled_parent = document.getElementById("enabled_services");
            $(enabled_parent).empty();
            for (var i = 0; i < items.services.enabled.length; i++) {
                var li = $("<li />").attr("data-name", 
                    items.services.enabled[i].keyword).html(
                    items.services.enabled[i].name);
                li.appendTo(enabled_parent);
            }

            var disabled_parent = document.getElementById("disabled_services");
            $(disabled_parent).empty();
            for (var i = 0; i < items.services.disabled.length; i++) {
                var li = $("<li />").attr("data-name", 
                    items.services.disabled[i].keyword).html(
                    items.services.disabled[i].name);
                li.appendTo(disabled_parent);
            }
            $('.sortable').sortable();
            $('.connected').sortable({
                connectWith: '.connected'
            });
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
$(document).ready(function(){
    $("#author").click(function(e){
        e.preventDefault();
        chrome.tabs.create({url: $(this).attr('href')});
    });
});
