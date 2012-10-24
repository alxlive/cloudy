/**
  This is the bootstrapping code that sets up the scripts to be used in the 
  Gmailr example Chrome plugin. It does the following:
  
  1) Sets up data DOM elements that allow strings to be shared to injected scripts.
  2) Injects the scripts necessary to load the Gmailr API into the Gmail script environment.
*/

// Only run this script in the top-most frame (there are multiple frames in Gmail)
if(top.document == document) {
    
    // Adds a data DOM element that simply holds a string in an attribute, to be read
    // by the injected scripts.
    var addData = function(id, val) {
        var body = document.getElementsByTagName("body")[0];
        var div = document.createElement('div');
        div.setAttribute('data-val', val);
        div.id = id + "_gmailr_data";
        div.setAttribute('style', "display:none");
        body.appendChild(div);
    };
    
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

    var addDomElem = function(path, id) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange=function()
        {
                if (xhr.readyState==4 && xhr.status==200)
                {
                    var p = document.createElement("div");
                    /*p.innerHTML = xhr.responseText;
                    var elem = p.removeChild(p.firstChild);*/
                    p.dataset.html = xhr.responseText;
                    p.id = id;
                    p.style.display = "none";
                    p.className += " gpicker_invisible";
                    document.body.insertBefore(p, document.body.children[0]);
                }
        }
        xhr.open("GET", path, true);
        xhr.send();
    }
    
    // Pass data to inserted scripts via DOM elements
    addData("css_path",        chrome.extension.getURL("css/main.css"));
    addData("jquery_path",     "//ajax.googleapis.com/ajax/libs/jquery/1.8.2/jquery.min.js");
    addData("jquery_bbq_path", chrome.extension.getURL("js/lib/jquery.ba-bbq.js"));
    addData("gmailr_path",     chrome.extension.getURL("js/lib/gmailr.js"));
    addData("main_path",       chrome.extension.getURL("js/main.js"));
    addData("model_path",      chrome.extension.getURL("js/model.js"));
    addData("view_path",       chrome.extension.getURL("js/view.js"));
    addData("utils_path",      chrome.extension.getURL("js/utils.js"));
    addData("constants_path",  chrome.extension.getURL("js/constants.js"));
    addData("controller_path", chrome.extension.getURL("js/controller.js"));
    addData("cloudicon_path",  chrome.extension.getURL("images/cloudIcon.png"));
    addData("erroricon_path",  chrome.extension.getURL("images/error.png"));
    addData("downloadloading_path",chrome.extension.getURL("images/loading-ring.gif"));
    addData("downloadcomplete_path", chrome.extension.getURL("images/checkmark.png"));
    addData("resourcesjs_path",      chrome.extension.getURL("js/resources.js"));
    //addDomElem(chrome.extension.getURL("templates/downloaddiv.html"),
    //           "filepicker_customprogress_template");
    //addDomElem(chrome.extension.getURL("templates/customrow.html"),
    //           "filepicker_customrow_template");
    //addDomElem(chrome.extension.getURL("js/decode-worker.js"),
    //           "filepicker_worker_script");
     
    // Load the initialization scripts
    loadScript(chrome.extension.getURL("js/lib/lab.js"), function() {
        loadScript(chrome.extension.getURL("js/lib/init.js"));
    });
};
