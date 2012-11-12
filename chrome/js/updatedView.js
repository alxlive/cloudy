/* The view. This takes care of hooking into the Gmail page,
 * and sending appropriate events to the controller whenever
 * the user or Gmail does something we're interested in.
 *
 * There are two views: RegularView and UpdatedView. 
 * RegularView takes care of interposing on the old 
 * Gmail Compose, whereas UpdatedView is for the new 
 * Compose that came out in November 2012. 
 */

var UpdatedView = function () {
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

        // URL to Cloudy icons, on and off
        var cloudimgurl;
        var cloudimgoffurl;

        // URLs to status images -- success and error
        var dwnldcompleteimgurl;
        var errorimgurl;

        // in the new Compose, we can have many compose windows open. 
        // This is a map: ID -> compose window. The ID we use is the 
        // DOM id of the "attach" button of the message.
        var composeMessages = {};

/* PUBLIC METHODS */

        /* Registers a callback function. Used by objects to subscribe to 
         * events that this View is interposing on.
         */
        this.addObserver = function(fn) {
            view_callbacks.add(fn);
        }

        /* Callers use this function to pass a file to Gmail to be attached. 
         * With the new-style compose, we need to know which message the file
         * is being attached to, so we pass the messageID.
         */
        this.attachFiles = function (filesArray, messageId) {
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
                // Gmail removes the <input type="file"> element upon detecting 
                // that the user chose a file. If already removed because of 
                // another attachment, we insert the element back into the DOM, 
                // so that we don't get a nullPointer error when Gmail calls 
                // removeChild() on its parent.
                gmail_inputelem.style.display = "none";
                $(gmail_inputelem).prependTo($(document.body));
            }
            if ("fireEvent" in composeMessages[messageId].fakeElem)
                composeMessages[messageId].fakeElem.fireEvent("onchange");
            else {
                var evt = top.document.createEvent("HTMLEvents");
                evt.initEvent("change", false, true);
                composeMessages[messageId].fakeElem.dispatchEvent(evt);
            }
        }

        /* Add download view to show the user a file's download progress from 
         * the cloud. 
         */
        this.addDownloadView = function(dwnldViewId, filename, size,
                                        messageId) {
            var downloadview = $(downloaddivUpdatedViewhtml)
                .prependTo(composeMessages[messageId].injectionPoint);
            downloadview.attr("id", dwnldViewId);
            downloadview.parents().eq(1).css("display", "");
            downloadview.find(".cloudy_updatedview_download_filename").text(
                filename);
            downloadview.find(".cloudy_updatedview_download_size").html(
                "(" + Math.ceil(size/1024) + "K)");
            downloadview.find(".cloudy_updatedview_download_statusicon")
                .attr("src", 
                getData("downloadloading_path"));
        }

        /* Update the download view of a file to reflect new state of the 
         * download.
         */
        this.updateDownloadView = function(dwnldViewId, state, messageId) {
            if (state === "done") {
                setDownloadViewStatus(dwnldViewId, "Done!", 
                    dwnldcompleteimgurl, true);
            } else if (state === "processing") {
                setDownloadViewStatus(dwnldViewId, "Processing:");
            } else if (state === "maxSizeExceeded") {
                setDownloadViewStatus(dwnldViewId, 
                    "25MB limit exceeded:", errorimgurl, true);
            } else if (state === "error") { 
                setDownloadViewStatus(dwnldViewId, 
                    "Error:", errorimgurl, true);
            }
        }

/* PRIVATE METHODS */

        /* Called every second by a timer. Checks if the user has a new-style 
         * Compose window open in Gmail. This is done by checking the page 
         * for textareas named "subject". For each uninitialized such textarea,
         * we have to remember the new compose message in our composeMessages
         * dictionary, and override the default attachment icon with Cloudy's
         * icon.
         */
        var checkCompose = function() {
            var tofields = $(document.getElementsByName('subject'));
            var foundUninitialized = false;
            for (var i = 0; i < tofields.length; i++) {
                if (!tofields.eq(i).data("cloudy_initialized")) {
                    foundUninitialized = true;
                    break;
                }
            }
            if (foundUninitialized) {
                console.log("setting Cloudy icons");
                var attachmentIcons = 
                    $("[command=Files]").children().children()
                     .children();
                attachmentIcons.each(function () {
                    if (!$(this).data("cloudy_initialized")) {
                        $(this).css("background-image", "url(" + 
                            getData("cloudicon_newcompose_thick_path") + 
                            ")");
                        $(this).addClass("cloudy_icon_updatedview");
                        composeMessages[this.id] = {};
                        // This <span> is the element above which we'll inject
                        // notification areas in the Compose window we're 
                        // currently initializing.
                        composeMessages[this.id]["injectionPoint"] = 
                            $(this).parents("tbody").find("span")
                                .filter(":contains('Attach')").parents().eq(0);
                        $(this).data("cloudy_initialized", true);
                    }
                });
                tofields.data("cloudy_initialized", true);
            }
        }

        /* Toggle enabled/disabled state of the view (i.e. of the application)
         * Update GUI to reflect this change. 
         * Note: with the new-style Compose, there is no easy way to disable 
         * Cloudy. The only way it will happen is if Cloudy encounters an error
         * and disables itself.
         */ 
        var toggleEnabled = function() {
            view_enabled = !view_enabled;
            /*TODO for (var i=0; i<rows.length; i++) {
                updateCloudyIcon(rows[i], false);
            }*/
        }

        /* In case of an error, even if we have already interposed on Gmail's 
         * original attachment mechanisms, we need to bring up a local file 
         * selection dialog. This function creates a temporary <input> element
         * and sets our custom element's .files field to the <input> element's
         * .files array.
         */
        var simulateLocalAttachment = function(messageId) {
            if (tmpinputelem)
                $(tmpinputelem).remove();
            tmpinputelem = $('<input type="file" class="cloudy_invisible">')
                .appendTo("#tmpparent");
            tmpinputelem.change(function() {
                cloudy_view.attachFiles(this.files, messageId);
                $(this).remove();
                tmpinputelem = null;
            });
            $(tmpinputelem).trigger('click');
        }

        /* Helper method used by updateDownloadView to set the status of a 
         * downloading file's notification area.  
         */
        var setDownloadViewStatus = function(dwnldViewId, text, imgurl,
                                             clear) {
            var progdiv = $(document.getElementById(dwnldViewId));
            progdiv.find(".cloudy_updatedview_download_msg").text(text);
            if (imgurl)
                progdiv.find(".cloudy_updatedview_download_statusicon")
                    .attr("src", imgurl);
            if (clear)
                setTimeout(function(){
                    progdiv.remove();
                }, 7500);
        }

        /* Initialize an element of type <input> (which we have in fact turned 
         * into a <div>). 
         */
        var initInputElement = function(elem) {
            /* Define behavior on click() -- open a FilePicker 
             * dialog and, once the user chooses a file, notify Controller (by
             * firing an attach event), which will take care of creating a 
             * handler to start downloading the file.
             */
            $(elem).click(function (e) {
                var currentEmail = $(document.activeElement).children()
                    .children().children().eq(0)[0];
                if (view_enabled && Gmailr.filepickerLoaded){
                    e.preventDefault();
                    filepicker.pick(function(FPFile) {
                        view_callbacks.fire("attach", FPFile, 
                            currentEmail.id);
                    });
                } else {
                    simulateLocalAttachment();
                }
            });
            /* Override the default addEventListener method. This is 
             * necessary to fix a Gmail bug where the <input> element
             * gets two listeners associated to it. Once a file is chosen,
             * both get triggered. The first one attaches the file (usually
             * to the wrong email) and deletes the <input> element. The 
             * second one proceeds to also attempt to delete the <input>
             * element by calling removeChild() on its parent, but since it
             * no longer has a parent, this results in a nullpointer. 
             * 
             * Overriding the event listener lets us add a fake element
             * for each email, and attach the listener to that element.
             * When the time comes to trigger one of the listeners,
             * we fire an event on the corresponding fake element -- 
             * thus only one listener gets triggered, and we're guaranteed
             * the file will get attached to the correct email. 
             */
            elem.oldAddEventListener = elem.addEventListener;
            elem.addEventListener = function(type, listener, useCapture) {
                var currentEmail = $(document.activeElement).children()
                    .children().children().eq(0)[0];
                var fakeElem = document.createElement("div");
                fakeElem.addEventListener(type, listener, useCapture);
                composeMessages[currentEmail.id]["fakeElem"] = 
                    fakeElem;
            }
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
                if (htmlstr.indexOf("div") !== -1) {
                    result = top.document.gmail_createElement(htmlstr);
                    initContainerDiv(result);
                } else if (currentElem.innerText.length < 30 && 
                        currentElem.command === "Files" && 
                        htmlstr.indexOf("input") !== -1) {
                    htmlstr.replace("input", "div");
                    result = top.document.gmail_createElement(htmlstr);
                    cloudy_view._initInputElement(result); 
                } else {
                    result = top.document.gmail_createElement(htmlstr);
                }
                return result;
            }
        }

        var init = function() {
            // get templates from DOM
            var templates = Templates();

            // get URL to cloud icon -- to add next to "attach a file" link
            cloudimgurl = getData("cloudiconon_path");
            cloudimgoffurl = getData("cloudiconoff_path");
            errorimgurl = getData("erroricon_path");
            dwnldcompleteimgurl = getData("downloadcomplete_path");
            downloaddivUpdatedViewhtml = templates.updatedViewDownload;

            // erase data divs passed in DOM
            $("#filepicker_customrow_template").remove();
            $("#filepicker_customprogress_template").remove();
             
            // add tmpparent div, used to add elements temporarily to the DOM
            var tmpParentHtml = 
                $("<div id='tmpparent' style='display: none;'></div>");
            tmpParentHtml.prependTo($(document.body));

            // initialize callbacks object, so the Controller can bind callbacks 
            // to the View.
            view_callbacks = $.Callbacks();

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
