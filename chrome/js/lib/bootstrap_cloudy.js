/**
  This is the bootstrapping code that sets up the scripts to be used in the 
  Gmailr example Chrome plugin. It does the following:
  
  1) Sets up data DOM elements that allow strings to be shared to injected 
     scripts.
  2) Injects the scripts necessary to load the Gmailr API into the Gmail script
     environment.
*/

// Only run this script in the top-most frame (there are multiple frames in 
// Gmail)
if(top.document == document) {

    // Adds a data DOM element that simply holds a string in an attribute, to 
    // be read by the injected scripts.
    var addData = function(id, val) {
        var body = document.getElementsByTagName("body")[0];
        var div = document.createElement('div');
        div.setAttribute('data-val', val);
        div.id = id + "_gmailr_data";
        div.setAttribute('style', "display:none");
        body.appendChild(div);
    };
    var setData = function(id, val) {
        var div = document.getElementById(id + "_gmailr_data");
        div.setAttribute('data-val', val);
        div.setAttribute('style', "display:none");
    }

    // Loads a script
    var loadScript = function(path, onloadhandler) {
        var headID = document.getElementsByTagName("head")[0];
        var newScript = document.createElement('script');
        newScript.type = 'text/javascript';
        newScript.src = path;
        if (onloadhandler) {
            newScript.onload = onloadhandler;
        }
        headID.appendChild(newScript);
    };
    var getEnabledFPServices = function(services) {
        var enabled = new Array();
        if (typeof services !== "undefined") {
            for (var i = 0; i < services.enabled.length; i++) {
                enabled.push(services.enabled[i].keyword);
            }
        }
        return enabled.length ? enabled : undefined;
    }

    var restorePersistentState = function() {
        // Load data from persistent storage
        var storage = chrome.storage.sync;
        storage.get("signature", function(items){
            var signature = items.signature;
            if (typeof items.signature === "undefined") {
                storage.set({"signature": true});
                signature = true;
            }
            addData("cloudy_signature", signature);
        });
        storage.get("services", function(items){
            addData("cloudy_services", JSON.stringify(getEnabledFPServices(
                items.services)));
        });
        storage.get("multifile", function(items) {
            var multifile = items.multifile;
            if (typeof items.multifile === "undefined") {
                storage.set({"multifile": "multiple"});
                multifile = "multiple";
            }
            addData("cloudy_multifile", multifile);
        });
        chrome.storage.onChanged.addListener(
            function (changes, areaName){
                console.log("areaname is " + areaName)
                if (areaName === "sync") {
                    // Cloudy does not use "local" storage
                    for (var key in changes) {
                        if (key === "signature") {
                            console.log("change in cloudy_signature");
                            setData("cloudy_signature", 
                                changes.signature.newValue);
                        } else if (key === "multifile") {
                            console.log("change in cloudy_multifile");
                            setData("cloudy_multifile", 
                                changes.multifile.newValue);
                        } else if (key === "services") {
                            console.log("change in cloudy_services");
                            setData("cloudy_services", JSON.stringify(
                                getEnabledFPServices(
                                    changes.services.newValue)));
                        }
                    }
                } 
            });
    }

    var injectNotifications = function() {
        var currentNotification = undefined;
        var storage = chrome.storage.sync;
        storage.get("notification", function(items) {
            var notification = items.notification;
            if (typeof items.notification !== "undefined" && 
                    !notification.done) {
                // inject notification bubble
                var bubble_injected = false;
                currentNotification = items.notification.template;
                var xhr = new XMLHttpRequest();
                xhr.onreadystatechange = function() {
                    if (xhr.readyState==4 && xhr.status==200 && 
                            !bubble_injected) {
                        console.log("adding notification bubble");
                        var container = document.createElement("div");
                        container.innerHTML = xhr.responseText;
                        document.body.appendChild(container);
                        var icon = 
                            document.getElementById("cloudy_bubble_icon");
                        if (icon) {
                            icon.src = chrome.extension.getURL(
                                "images/small_logo.png");
                        }
                        bubble_injected = true;
                    }
                };
                xhr.open("GET", 
                    chrome.extension.getURL(notification.template),
                    true);
                xhr.send();
            }
        });

        var cloudy_events = document.getElementById("cloudy_events");
        if (cloudy_events) {
            cloudy_events.addEventListener("cloudy_notificationDisplayed", 
                    function(e) {
                var from = e.target;
                console.log("Cloudy UI event");
                if (from && typeof currentNotification !== "undefined") {
                    var notification = {};
                    notification.template = currentNotification;
                    notification.done = true;
                    console.log("setting notification as done");
                    storage.set({"notification": notification});
                }
            });
        }
    }

    // Pass data to inserted scripts via DOM elements
    addData("css_path",        chrome.extension.getURL("css/main.css"));
    addData("jquery_path",     
        "//ajax.googleapis.com/ajax/libs/jquery/1.8.2/jquery.min.js");
    addData("jquery_bbq_path", 
        chrome.extension.getURL("js/lib/jquery.ba-bbq.js"));
    addData("gmailr_path",     chrome.extension.getURL("js/lib/gmailr.js"));
    addData("main_path",       chrome.extension.getURL("js/main.js"));
    addData("model_path",      chrome.extension.getURL("js/model.js"));
    addData("viewmanager_path",       
        chrome.extension.getURL("js/viewManager.js"));
    addData("regularview_path",       
        chrome.extension.getURL("js/regularView.js"));
    addData("updatedview_path",       
        chrome.extension.getURL("js/updatedView.js"));
    addData("utils_path",      chrome.extension.getURL("js/utils.js"));
    addData("constants_path",  chrome.extension.getURL("js/constants.js"));
    addData("controller_path", chrome.extension.getURL("js/controller.js"));
    addData("cloudiconon_path",  
        chrome.extension.getURL("images/cloudIconOn.png"));
    addData("cloudicon_newcompose_thick_path", 
        chrome.extension.getURL("images/cloudyicon_thick_cropped_dark.png"));
    addData("cloudiconoff_path", 
        chrome.extension.getURL("images/cloudIconOff.png"));
    addData("erroricon_path",
        chrome.extension.getURL("images/error.png"));
    addData("downloadloading_path",
        chrome.extension.getURL("images/loading-ring.gif"));
    addData("downloadcomplete_path", 
        chrome.extension.getURL("images/checkmark.png"));
    addData("resourcesjs_path",      
        chrome.extension.getURL("js/resources.js"));
     
    // Load the initialization scripts
    loadScript(chrome.extension.getURL("js/lib/lab.js"), function() {
        loadScript(chrome.extension.getURL("js/lib/init.js"));
    });

    var cloudy_events = document.createElement("div");
    cloudy_events.id = "cloudy_events";
    document.body.appendChild(cloudy_events);

    restorePersistentState();

    injectNotifications();
};
