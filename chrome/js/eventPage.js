var addService = function (serviceName, serviceKeyword) {
    var storage = chrome.storage.sync;
    storage.get("services", function(items) {
        if (typeof items.services === "undefined") {
            // no preferences saved, do nothing
        } else if (typeof items.services.updates === "undefined" ||
                items.services.updates[serviceName] !== "supported"){
            console.log("Adding service " + serviceName);
            var insertIndex = 2;
            if (items.services.enabled.length < 2) {
                insertIndex = 0;
            }
            // insert SkyDrive as the third enabled service
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
        if (details.previousVersion <= "0.6.0.0") {
            // version 0.6.0.0 adds SkyDrive support
            addService("SkyDrive", "SKYDRIVE");
        }
    }
}

chrome.runtime.onInstalled.addListener(onInit);
