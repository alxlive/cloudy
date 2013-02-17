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
    var storage = chrome.storage.local;
    storage.get("signature", function(items){
        var signature = items.signature;
        if (typeof items.signature === "undefined") {
            storage.set({"signature": true});
            signature = true;
        }
        addData("cloudy_signature", signature);
    });
    chrome.storage.onChanged.addListener(
        function (changes, areaName){
            console.log("areaname is " + areaName)
            if (areaName === "local") {
                // Cloudy does not use "local" storage
                setData("cloudy_signature", changes.signature.newValue);
            } 
            console.log("old value: " + changes.signature.oldValue);
            console.log("new value: " + changes.signature.newValue);
        });
};
