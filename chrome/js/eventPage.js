var storage = chrome.storage.sync; 

var addService = function (serviceName, serviceKeyword) {
    storage.get("services", function(items) {
        if (typeof items.services === "undefined") {
            // no preferences saved, do nothing
            console.log("No preferences saved, " + serviceName + 
                " is automatically added in default popup html.");
        } else if (typeof items.services.updates === "undefined" ||
                items.services.updates[serviceName] !== "supported"){
            console.log("Adding service " + serviceName);
            // insert as third service by default (don't mess with people's
            // top 2).
            var insertIndex = 2;
            if (items.services.enabled.length < 2) {
                insertIndex = 0;
            }
            items.services.enabled.splice(insertIndex, 0, {
                keyword: serviceKeyword,
                name: serviceName
            });
            items.services.updates = items.services.updates || {};
            items.services.updates[serviceName] = "supported";
            
            storage.set({"services": items.services});
        }
    });
}

var onInit = function (details) {
    console.log("ON_INIT");
    if (details.reason === "update") {
        console.log("Cloudy was updated");
        if (details.previousVersion < "0.6.0.5") {
            console.log("Version 0.6.0.5 disables Cloudy due to Gmail changes");
            var notification = {
                done: false,
                template: "templates/gmail-incompatibility.html"
            };
            storage.set({"notification": notification});
        }
    }
    else if (details.reason === "install") {
        console.log("Version 0.6.0.5 disables Cloudy due to Gmail changes");
        var notification = {
            done: false,
            template: "templates/gmail-incompatibility.html"
        };
        storage.set({"notification": notification});
    }
}

chrome.runtime.onInstalled.addListener(onInit);
