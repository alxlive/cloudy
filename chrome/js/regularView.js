/* The view. This takes care of hooking into the Gmail page,
 * and sending appropriate events to the controller whenever
 * the user or Gmail does something we're interested in.
 *
 * There are two views: RegularView and UpdatedView. 
 * RegularView takes care of interposing on the old 
 * Gmail Compose, whereas UpdatedView is for the new 
 * Compose that came out in November 2012. 
 */

var RegularView = function () {
    if (arguments.callee.singleton_instance) {
        // return existing instance
        return arguments.callee.singleton_instance;
    }

    // create singleton instance
    arguments.callee.singleton_instance = new (function () {

/* PROPERTIES */

        // reference to the view ("this")
        var cloudy_view;

        // enabled/disabled boolean
        var view_enabled;

        // Gmail's last-created <input type="file"> element
        var gmail_inputelem;
        // a temporary <input type="file"> element. Used when simulating local
        // attachments (when the users has turned Cloudy off)
        var tmpinputelem;

        // JQuery callbacks, through which the view talks to its observers
        var view_callbacks;

        // HTML strings to inject into the Gmail Compose view
        var downloaddivhtml;
        var customrowhtml;

        // URL to Cloudy icons, on and off
        var cloudimgurl;
        var cloudimgoffurl;

        // URLs to status images -- success and error
        var dwnldcompleteimgurl;
        var errorimgurl;

        // Candidate rows (<tr>) for injection in Gmail's Compose view. We 
        // inject the Cloudy icon depending on which row exists and is visible.
        var rows = [];
        var view_currentrow;

/* PUBLIC METHODS */

        /* Registers a callback function. Used by objects to subscribe to 
         * events that this View is interposing on.
         */
        this.addObserver = function(fn) {
            view_callbacks.add(fn);
        }

        this.attachFiles = function (filesArray) {
            // This should never happen. If we don't have a handle to the input 
            // element added by Gmail, we cannot signal to Gmail that files 
            // were added.
            if (!gmail_inputelem) {
                alert("General error in Cloudy extension. " + 
                    "Disabling and reverting to regular " +
                    "attachment mechanism.");
                view_enabled = false;
                return;
            } 
            gmail_inputelem.files = filesArray;
            if (!gmail_inputelem.parentNode) {
                gmail_inputelem.style.display = "none";
                $jQcl(gmail_inputelem).prependTo($jQcl(document.body));
            }
            if ("fireEvent" in gmail_inputelem)
                gmail_inputelem.fireEvent("onchange");
            else {
                var evt = top.document.createEvent("HTMLEvents");
                evt.initEvent("change", false, true);
                gmail_inputelem.dispatchEvent(evt);
            }
        }

        /* Add download view to show the user a file's download progress from 
         * the cloud. 
         */
        this.addDownloadView = function(dwnldViewId, filename, size) {
            var progdiv = $jQcl(downloaddivhtml).appendTo("#filepicker_downloads");
            progdiv.attr("id", dwnldViewId);
            $jQcl("#filepicker_customrow").css("display", "table-row");
            var sizestr = isNaN(size) ? "" : "" + Math.ceil(size/1024) + "K";
            progdiv.find("span").filter("#filename").html(filename + "  " + 
                sizestr);
            progdiv.find("#download_status_img").attr("src", 
                getData("downloadloading_path"));
        }

        /* Update the download view of a file to reflect new state of the 
         * download.
         */
        this.updateDownloadView = function(dwnldViewId, state) {
            if (state === "done") {
                setDownloadViewStatus(dwnldViewId, "Done.", 
                    dwnldcompleteimgurl, true);
            } else if (state === "processing") {
                setDownloadViewStatus(dwnldViewId, "Processing");
            } else if (state === "maxSizeExceeded") {
                setDownloadViewStatus(dwnldViewId, 
                    "25MB attachment size limit exceeded.", errorimgurl, true);
            } else if (state === "error") { 
                setDownloadViewStatus(dwnldViewId, 
                    "Error, please try again.", errorimgurl, true);
            }
        }

/* PRIVATE METHODS */

        /* Retrieve data passed by content script.
         */
        var getBootstrapData = function(id) {
            return document.getElementById(id + "_gmailr_data")
                .getAttribute('data-val');
        }

        /* Called every second by a timer. Checks if the user is in Compose 
         * mode in Gmail. This is done by checking if the page contains a 
         * textarea named "to". If so, add our custom row which displays 
         * progress information to the user for each file upload.
         */
        var checkCompose = function() {
            if (document.getElementsByName("to").length) {
                if ($jQcl("span.cloudy_icon_container")[0] === undefined) {
                    var subjectrow = $jQcl($jQcl("div[role=main]").find("input")
                        .filter("[name=subject]").parents("tr")[0]);
                    rows[0] = subjectrow.prev();
                    rows[1] = subjectrow.next();
                    rows[2] = subjectrow.next().next();
                    var customrow;
                    customrow = $jQcl(customrowhtml).insertBefore(rows[2]);
                    customrow.children().eq(0).addClass(
                        rows[1].children().eq(0).attr("class"));

                    for (var i=0; i < rows.length; i++) {
                        updateCloudyIcon(rows[i], true);
                        if (i !== 0)
                            rows[i].find("img.cloudy_icon").addClass(
                                "cloudy_invisible");
                    }
                    view_currentrow = rows[0];
                }
                for (var i=rows.length-1; i >=0; i--) {
                    if (rows[i].is(":visible")) {
                        if (view_currentrow !== rows[i]) {
                            swapRows(rows[i]);
                        } 
                        break;
                    }
                }
            } else if (rows.length) {
                rows = [];
                view_currentrow = null;
            }
        }

        /* Swap the row currently displaying the Cloudy icon for the given row.
         * Make the current row's icon invisible, and the second row's icon
         * visible.
         */
        var swapRows = function(row) {
            $jQcl(view_currentrow).find("img.cloudy_icon").addClass(
                "cloudy_invisible");
            row.find("img.cloudy_icon").removeClass("cloudy_invisible");
            view_currentrow = row;
        }

        /* Toggle enabled/disabled state of the view (i.e. of the application)
         * Update GUI to reflect this change.
         */ 
        var toggleEnabled = function() {
            view_enabled = !view_enabled;
            for (var i=0; i<rows.length; i++) {
                updateCloudyIcon(rows[i], false);
            }
        }

        /* Given a row, adds the Cloudy icon to the first element of that row.
         */
        var updateCloudyIcon = function(row, create) {
            var currentIconUrl = view_enabled? 
                cloudimgurl: cloudimgoffurl;
            var firstchild = row.children().eq(0);
            var img = firstchild.find("img.cloudy_icon");

            if (!img.length) {
                if (create) {
                    firstchild.html('<span ' + 
                        'class="cloudy_icon_container">' + 
                        '<img class="cloudy_icon" ' +
                        'width="33" height="20" src="' + currentIconUrl + 
                        '" />' + '</span>');
                    img = firstchild.find("img.cloudy_icon");
                }
            } else {
                img.attr("src", currentIconUrl);
            }
            
            if (create && img.length) {
                firstchild.find("img.cloudy_icon").click(
                    function(){
                        toggleEnabled();
                    });
             }
        }

        /* In case of an error, even if we have already interposed on Gmail's 
         * original attachment mechanisms, we need to bring up a local file 
         * selection dialog. This function creates a temporary <input> element
         * and sets our custom element's .files field to the <input> element's
         * .files array.
         */
        var simulateLocalAttachment = function() {
            if (!tmpinputelem) {
                tmpinputelem = $jQcl('<input type="file" class="cloudy_invisible">')
                    .appendTo("#tmpparent");
                tmpinputelem.change(function() {
                    cloudy_view.attachFiles(this.files);
                    $jQcl(this).remove();
                    tmpinputelem = null;
                });
            }
            $jQcl(tmpinputelem).trigger('click');
        }

        var setDownloadViewStatus = function(dwnldViewId, text, imgurl,                                                      clear) {
            var progdiv = $jQcl(document.getElementById(dwnldViewId));
            progdiv.find("#downloading_msg").text(text);
            if (imgurl)
                progdiv.find("#download_status_img").attr("src", imgurl);
            if (clear) 
                setTimeout(function(){
                    progdiv.remove();
                }, 10000);
        }

        /* Initialize an element of type <input> (which we have in fact turned 
         * into a <div>). Define behavior on click() -- open a FilePicker 
         * dialog and, once the user chooses a file, notify Controller, 
         * which will take care of creating a handler to start downloading 
         * the file.
         */
        var initInputElement = function(elem) {
            $jQcl(elem).click(function (e) {
                if (view_enabled && Gmailr.filepickerLoaded){
                    e.preventDefault();
                    // check if user has removed some services
                    var services_enabled = getBootstrapData("cloudy_services");
                    var options = {};
                    if (services_enabled !== "undefined") {
                        options.services = window.JSON.parse(services_enabled);
                    }
                    var multifile = getBootstrapData("cloudy_multifile");
                    var pickfunc = multifile === "multiple"? 
                        filepicker.pickMultiple : filepicker.pick;
                    pickfunc(options, function(fpfiles) {
                        if (Object.prototype.toString.call(fpfiles) !==
                            '[object Array]') {
                            view_callbacks.fire("attach", fpfiles);
                        } else {
                            for (var i = 0; i < fpfiles.length; i++) {
                                view_callbacks.fire("attach", fpfiles[i]);
                            }
                        }

                        // add signature to email (if option enabled)
                        var signature_enabled = 
                            getBootstrapData("cloudy_signature");
                        if (signature_enabled === "true") {
                            // find "editable" iframe
                            var email_iframe = $jQcl("iframe.editable");
                            var email_iframe_body = 
                                $jQcl(email_iframe[0].contentWindow.document.body);
                            if (email_iframe_body.attr("data-addedSignature") ||
                                    email_iframe_body
                                    .find("a:contains('Cloudy for Gmail')")
                                    .length > 0) {
                                return;
                            }

                            var link = $jQcl("<div />").addClass(
                                "cloudy_share_link").html("<p>Sent with " + 
                                "<a href='https://chrome.google.com/webstore/detail/cloudy-for-gmail/fcfnjfpcmnoabmbhponbioedjceaddaa?utm_source=gmail&utm_medium=email&utm_campaign=gmail_signature' " + 
                                "target='_blank' >Cloudy for Gmail" +
                                "</a></p>");

                            $jQcl("<br />").appendTo(email_iframe_body);
                            $jQcl("<br />").appendTo(email_iframe_body);
                            link.appendTo(email_iframe_body);
                            email_iframe_body.attr("data-addedSignature", true);
                        }
                    });
                } else {
                    simulateLocalAttachment();
                }
            });
            gmail_inputelem = elem;
        }

        /* Gmail uses a container div to create <input type="file"> elements.
         * Override the div's removeChild method to return an element
         * which we control. 
         * Set that element to be a 'div' instead of 'input', as we later
         * need to set elem.files = [blob], which is not allowed
         * on input elements for security reasons. 
         */
        var initContainerDiv = function(container) {
            container.orig_removeChild = container.removeChild;
            container.removeChild = function(child) {
                child = this.orig_removeChild(child);
                var currentElem = document.activeElement;
                if (child.tagName && child.tagName.toLowerCase() === "input" &&
                        child.type && child.type.toLowerCase() === "file") {
                    var parentdiv = top.document.createElement("div");
                    parentdiv.appendChild(child);
                    childhtml = parentdiv.innerHTML;
                    parentdiv.orig_removeChild(child);
                    childhtml = childhtml.replace("input", "div");
                    parentdiv.innerHTML = childhtml;

                    child = parentdiv.orig_removeChild(parentdiv.firstChild);
                    initInputElement(child);
                }
                return child;
            }
        }

        /* Override the default createElement method to be able to intercept
         * creation of div elements, which might be used by Gmail to create 
         * a <input> element. 
         * Currently, Gmail creates a parent div, then sets its innerHTML
         * to <input type="file" id=...>, and finally calls removeChild()
         * on that div to return the new <input> element. 
         */
        var interposeCreateElem = function() {
            top.document.gmail_createElement = top.document.createElement;
            top.document.createElement = function(htmlstr) {
                var currentElem = document.activeElement;
                var result;
                if (currentElem.innerText.length < 30 && 
                        currentElem.innerText.indexOf("Attach") === 0 && 
                        htmlstr.indexOf("input") !== -1) {
                    htmlstr.replace("input", "div");
                    result = top.document.gmail_createElement(htmlstr);
                    cloudy_view._initInputElement(result); 
                } else if (htmlstr.indexOf("div") !== -1) {
                    result = top.document.gmail_createElement(htmlstr);
                    initContainerDiv(result);
                } else {
                    result = top.document.gmail_createElement(htmlstr);
                }
                return result;
            }
        }

        var init = function() {
            // get templates from DOM
            var templates = Templates();
            customrowhtml = templates.customRow;
            downloaddivhtml = templates.downloadDiv;

            // get URL to cloud icon -- to add next to "attach a file" link
            cloudimgurl = getData("cloudiconon_path");
            cloudimgoffurl = getData("cloudiconoff_path");
            errorimgurl = getData("erroricon_path");
            dwnldcompleteimgurl = getData("downloadcomplete_path");

            // erase data divs passed in DOM
            $jQcl("#filepicker_customrow_template").remove();
            $jQcl("#filepicker_customprogress_template").remove();
             
            // add tmpparent div, used to add elements temporarily to the DOM
            var tmpParentHtml = 
                $jQcl("<div id='tmpparent' style='display: none;'></div>");
            tmpParentHtml.prependTo($jQcl(document.body));

            // initialize callbacks object, so the Controller can bind callbacks 
            // to the View.
            view_callbacks = $jQcl.Callbacks();

            // Check for "Compose" mode every second.
            setInterval(function() {checkCompose()}, 500);

            // interpose on key document functions to catch when the user is
            // attaching a file
            interposeCreateElem();

            // set View as enabled. Marking this as false effectively disables 
            // the entire extension, as it will no longer receive any inputs.
            view_enabled = true;

            // set the reference to the view
            cloudy_view = this;
        }

        init.call(this);
        return this;
    })();

    return arguments.callee.singleton_instance;
}
