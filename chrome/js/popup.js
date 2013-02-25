// Save this script as `options.js`

//$(document).ready(function() {
window.onload = function () {
    var storage = chrome.storage.sync;
    var signature_box = document.getElementById("cloudy_signature");

    // Saves options to localStorage.
    function save_options() {
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
                       "multifile": $("input[name=optionsRadios]:checked").val()
                    },
                    function (){
                        var status = $("#status");
                        if (chrome.runtime.lastError) {
                            // Update status to show error.
                            status.html("<strong>An error occurred while " +
                                "saving.</strong> Please try again.");
                            status.addClass("alert-error");
                            status.show();
                        } else {
                            // Update status to let user know settings saved.
                            status.html("Your changes were saved successfully.");
                            status.addClass("alert-success");
                            status.show().delay(1000).fadeOut(800, function() {
                                $(this).removeClass("alert-success");
                            });
                        }

                        $("#save").removeClass("disabled");
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
                var enabled_parent = 
                    document.getElementById("enabled_services");
                $(enabled_parent).empty();
                for (var i = 0; i < items.services.enabled.length; i++) {
                    var li = $("<li />").attr("data-name", 
                        items.services.enabled[i].keyword).html(
                        items.services.enabled[i].name);
                    li.appendTo(enabled_parent);
                }

                var disabled_parent = 
                    document.getElementById("disabled_services");
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

    // document.addEventListener('DOMContentLoaded', restore_options)
    restore_options();

    // Initialize sortable
    $('.sortable').sortable();
    $('.connected').sortable({
        connectWith: '.connected'
    });

    $("#save").click(function(e) {
        e.preventDefault();
        if ($(this).hasClass("disabled")) {
            return;
        }
        $(this).addClass("disabled");
        $("#status").stop().hide().removeClass("alert-error");
        save_options();
    });

    // Click listener for author blog link
    $("#author").click(function(e){
        e.preventDefault();
        chrome.tabs.create({url: $(this).attr('href')});
    });
    

    // Load Pinterest "Pin it" button
    // It gives errors because the base of the page uses the 
    // chrome-extensions:// protocol and not http[s]://. 
    // The hack below fixes that by using the <base> tag, 
    // but I am disabling it for now as I can't convince myself
    // that this is a fully safe idea, in terms of the other content 
    // on the page.
    //
    // Original comment:
    // Doing it onload because I am reassigning the base of the page,
    // so some elements relying on being fetched through 
    // chrome-extension:// might not load if we do this too early.
    //window.onload = function () {
        // Social buttons
        // Load Tweet button
        (!function(d,s,id) {
            var js,fjs=d.getElementsByTagName(s)[0];
            if(!d.getElementById(id)) {
                js=d.createElement(s);
                js.id=id; 
                js.async = true;
                js.src="https://platform.twitter.com/widgets.js";
                fjs.parentNode.insertBefore(js,fjs);
            }
        } (document,"script","twitter-wjs"));

        // Load Google +1 button
        (function(d, s, id) {
            var po = d.createElement(s); 
            if (d.getElementById(id)) return;
            po.type = 'text/javascript'; 
            po.async = true;
            po.src = 'https://apis.google.com/js/plusone.js';
            var s = d.getElementsByTagName('script')[0]; 
            s.parentNode.insertBefore(po, s);
        })(document, 'script', 'googleplus-jssdk');


        var thebody = document.getElementsByTagName('body')[0];
        var base = document.createElement("base");
        base.href = "https://www.milouchev.com";
        thebody.appendChild(base);
    
        (function(d, s, id) {
            var js, fjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(id)) return;
            js = d.createElement(s); 
            js.id = id;
            js.src = "https://assets.pinterest.com/js/pinit.js";
            js.async = true;
            fjs.parentNode.insertBefore(js, fjs);
        } (document, 'script', 'pinterest-jssdk'));
    //}
//});
};
