/* The view. This takes care of hooking into the Gmail page,
 * and sending appropriate events to the controller whenever
 * the user or Gmail does something we're interested in.
 */
var View = function () {
    this._init();
}

/* Called every second by a timer. Checks if the user is in Compose mode in 
 * Gmail. This is done by checking if the page contains a textarea named "to".
 * If so, add our custom row which displays progress information to the user
 * for each file upload.
 */
View.prototype.checkCompose = function() {
    if ($("textarea").filter("[name=to]").length) {
        if ($("span.cloudy_icon_container")[0] === undefined) {
            var cloudy_view = this;
            var attachLinks = $("div[role=main]").find("span")
                .filter("[role=link]")
                .filter(":contains('Attach a file')");
            if (! attachLinks.length) {
                attachLinks = $("div[role=main]").find("span")
                .filter("[role=link]")
                .filter(":contains('Attach another file')");
            }
            if (attachLinks.length === 1) {
                this.lowerrow = $(attachLinks[0]).parents('tr')[0];
                this.upperrow = $(this.lowerrow).prev()[0];
            } else {
                this.upperrow = $(attachLinks[0]).parents('tr')[0];
                this.lowerrow = $(attachLinks[1]).parents('tr')[0];
            }
            this.upperrowPrevHTML = $(this.upperrow).children().eq(0)
                .html();
            if ($(this.upperrow).next().find("input[name=subject]").length) {
                this.middlerow = $($(this.upperrow).next()).next();
                this._updateCloudyIcon(this.middlerow, true);
                $(this.middlerow).find("img.cloudy_icon").addClass(
                    "cloudy_invisible");
            }

            if (this.middlerow) {
                var customrow = $(this.customrowhtml).insertBefore(
                    this.middlerow);
            } else {
                var customrow = $(this.customrowhtml).insertBefore(
                    this.upperrow);
            }
            customrow.children().eq(0).addClass(
                this.upperrow.firstChild.className);
            this._updateCloudyIcon(this.upperrow, true);
            this._updateCloudyIcon(this.lowerrow, true);
            $(this.lowerrow).find("img.cloudy_icon").addClass(
                "cloudy_invisible");
            this.currentrow = this.upperrow;
        }
        if ($(this.lowerrow).is(":visible")) {
            if (this.currentrow !== this.lowerrow) {
                this._swapRows(this.currentrow, this.lowerrow);
            } 
        } else if (this.middlerow && $(this.middlerow).is(":visible")) {
            if (this.currentrow !== this.middlerow) {
                this._swapRows(this.currentrow, this.middlerow);
            }
        }  else if ($(this.upperrow).is(":visible")) {
            if (this.currentrow !== this.upperrow) {
                this._swapRows(this.currentrow, this.upperrow);
            }
        }
    }
}

/* There are two rows on which the Cloudy icon can appear. Swap the rows
 * by making the first argument's icon invisible, and the second row's icon
 * visible.
 */
View.prototype._swapRows = function(row1, row2) {
    $(row1).find("img.cloudy_icon").addClass("cloudy_invisible");
    $(row2).find("img.cloudy_icon").removeClass("cloudy_invisible");
    this.currentrow = row2;
}

/* Toggle enabled/disabled state of the view (i.e. of the application)
 * Update GUI to reflect this change.
 */ 
View.prototype._toggleEnabled = function() {
    this.enabled = !this.enabled;
    this._updateCloudyIcon(this.lowerrow, false);
    this._updateCloudyIcon(this.upperrow, false);
    if (this.middlerow) {
        this._updateCloudyIcon(this.middlerow, false);
    }
}

/* Given a row, adds the Cloudy icon to the first element of that row.
 */
View.prototype._updateCloudyIcon = function(row, create) {
    var cloudy_view = this; 
    var currentIconUrl = this.enabled? this.cloudimgurl: this.cloudimgoffurl;
    var firstchild = $(row).children().eq(0);
    var img = firstchild.find("img.cloudy_icon");

    if (!img.length) {
        if (create) {
            firstchild.html('<span ' + 
                'class="cloudy_icon_container"><img class="cloudy_icon" ' +
                'width="33" height="20" src="' + currentIconUrl + '" />' + 
                '</span>' + this.upperrowPrevHTML);
            img = firstchild.find("img.cloudy_icon");
        }
    } else {
        img.attr("src", currentIconUrl);
    }
    
    if (create && img.length) {
        firstchild.find("img.cloudy_icon").click(
            function(){
                cloudy_view._toggleEnabled();
            });
     }
}

/* Registers a callback function. Used by objects to subscribe to 
 * events that this View is interposing on.
 */
View.prototype.addObserver = function(fn) {
    this.callbacks.add(fn);
}

View.prototype.attachFiles = function (filesArray) {
    // This should never happen. If we don't have a handle to the input element
    // added by Gmail, we cannot signal to Gmail that files were added.
    if (!this.gmail_inputelem) {
        alert("General error in Cloudy extension. Disabling and reverting " +
            "to regular attachment mechanism.");
        this.enabled = false;
        return;
    } 
    this.gmail_inputelem.files = filesArray;
    if (!this.gmail_inputelem.parentNode) {
        this.gmail_inputelem.style.display = "none";
        $(this.gmail_inputelem).prependTo($(document.body));
    }
    if ("fireEvent" in this.gmail_inputelem)
        this.gmail_inputelem.fireEvent("onchange");
    else {
        var evt = top.document.createEvent("HTMLEvents");
        evt.initEvent("change", false, true);
        this.gmail_inputelem.dispatchEvent(evt);
    }
}

/* In case of an error, even if we have already interposed on Gmail's 
 * original attachment mechanisms, we need to bring up a local file 
 * selection dialog. This function creates a temporary <input> element
 * and sets our custom element's .files field to the <input> element's
 * .files array.
 */
View.prototype._simulateLocalAttachment = function() {
    if (!this.tmpinputelem) {
        this.tmpinputelem = $('<input type="file" class="cloudy_invisible">')
            .appendTo("#tmpparent");
        var cloudy_view = this;
        this.tmpinputelem.change(function() {
            cloudy_view.attachFiles(this.files);
            $(this).remove();
            cloudy_view.tmpinputelem = null;
        });
    }
    $(this.tmpinputelem).trigger('click');
}

/* Add download view to show the user a file's download progress from the cloud. 
 */
View.prototype.addDownloadView = function(dwnldViewId, filename, size) {
    var progdiv = $(this.downloaddivhtml).appendTo("#filepicker_downloads");
    progdiv.attr("id", dwnldViewId);
    $("#filepicker_customrow").css("display", "table-row");
    progdiv.find("span").filter("#filename").html(filename + "  " + 
        Math.ceil(size/1024) + "K");
    progdiv.find("#download_status_img").attr("src", 
        getData("downloadloading_path"));
}

View.prototype._setDownloadViewStatus = function(dwnldViewId, text, imgurl,                                                      clear) {
    var progdiv = $(document.getElementById(dwnldViewId));
    progdiv.find("#downloading_msg").text(text);
    if (imgurl)
        progdiv.find("#download_status_img").attr("src", imgurl);
    if (clear) 
        setTimeout(function(){
            progdiv.remove();
        }, 10000);
}

/* Update the download view of a file to reflect new state of the download.
 */
View.prototype.updateDownloadView = function(dwnldViewId, state) {
    if (state === "done") {
        this._setDownloadViewStatus(dwnldViewId, "Done.", 
            this.dwnldcompleteimgurl, true);
    } else if (state === "progress") {
        // in the current implementation, this will never happen
        /* var statusdiv = $(document.getElementById(fileHandlers[concatFilename(FPFile.filename)].divId));
        statusdiv.find("div").filter("#progbar").css("width", percent + "%"); */
    } else if (state === "processing") {
        this._setDownloadViewStatus(dwnldViewId, "Processing");
    } else if (state === "maxSizeExceeded") {
        this._setDownloadViewStatus(dwnldViewId, 
            "25MB attachment size limit exceeded.", this.errorimgurl, true);
    } else if (state === "error") { 
        this._setDownloadViewStatus(dwnldViewId, 
            "Error, please try again.", this.errorimgurl, true);
    }
}

/* Initialize an element of type <input> (which we have in fact turned 
 * into a <div>). Define behavior on click() -- open a FilePicker 
 * dialog and, once the user chooses a file, notify Controller, 
 * which will take care of creating a handler to start downloading 
 * the file.
 */
View.prototype._initInputElement = function(elem) {
    var cloudy_view = this;
    $(elem).click(function (e) {
        if (cloudy_view.enabled && Gmailr.filepickerLoaded){
            e.preventDefault();
            filepicker.pick(function(FPFile) {
                cloudy_view.callbacks.fire("attach", FPFile);
            });
        } else {
            cloudy_view._simulateLocalAttachment();
        }
    });
    this.gmail_inputelem = elem;
}

/* Gmail uses a container div to create <input type="file"> elements.
 * Override the div's removeChild method to return an element
 * which we control. 
 * Set that element to be a 'div' instead of 'input', as we later
 * need to set elem.files = [blob], which is not allowed
 * on input elements for security reasons. 
 */
View.prototype._initContainerDiv = function(container) {
    var cloudy_view = this;
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
            cloudy_view._initInputElement(child);
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
View.prototype._interposeCreateElem = function() {
    var cloudy_view = this;
    top.document.gmail_createElement = top.document.createElement;
    top.document.createElement = function(htmlstr) {
        var orig_htmlstr = htmlstr;
        // Instead of modifying <input> elements at this stage,
        // need to look further when their "type" is assigned.
        // If it is type="file", then need to set "type" to something
        // else and instrument the element. 
        // So far this is not necessary, but if the Gmail implementation
        // changes we'll need to look into it.
        /*if (this.expectClick && orig_htmlstr.indexOf("input") !== -1) {
            htmlstr.replace("input", "div");
        }*/
        var result = top.document.gmail_createElement(htmlstr);
        if (orig_htmlstr.indexOf("div") !== -1) {
            cloudy_view._initContainerDiv(result);
        } /*else if (orig_htmlstr.indexOf("input") !== -1) {
            cloudy_view._initInputElement(result); 
        }*/
        return result;
    }
}

View.prototype._init = function() {
    var that = this;
    // get templates from DOM
    var templates = Templates();
    this.customrowhtml = templates.customRow;// $("#filepicker_customrow_template")[0].dataset.html;
    this.downloaddivhtml = templates.downloadDiv;// $("#filepicker_customprogress_template")[0].dataset.html;

    // get URL to cloud icon -- to add next to "attach a file" link
    this.cloudimgurl = getData("cloudiconon_path");
    this.cloudimgoffurl = getData("cloudiconoff_path");
    this.errorimgurl = getData("erroricon_path");
    this.dwnldcompleteimgurl = getData("downloadcomplete_path");

    // erase data divs passed in DOM
    $("#filepicker_customrow_template").remove();
    $("#filepicker_customprogress_template").remove();
     
    // add tmpparent div, used to add elements temporarily to the DOM
    var tmpParentHtml = $("<div id='tmpparent' style='display: none;'></div>");
    tmpParentHtml.prependTo($(document.body));

    // initialize callbacks object, so the Controller can bind callbacks to the View.
    this.callbacks = $.Callbacks();

    // Check for "Compose" mode every second.
    setInterval(function() {that.checkCompose()}, 500);

    // interpose on key document functions to catch when the user is
    // attaching a file
    this._interposeCreateElem();

    // set View as enabled. Marking this as false effectively disables the 
    // entire extension, as it will no longer receive any inputs.
    this.enabled = true;
}




