/* The Model has two important properties:
 *  - a worker, which is used to convert files from base64 to binary
 *      without interrupting the main thread and freezing the UI
 *  - an associative array of FileHandler objects that are currently
 *      handling downloads and decoding of their respective files.
 *
 *  The controller calls addDownloadHandler to start  a new file
 *  download. The newly created FileHandler periodically calls 
 *  a controller callback to update the UI. When the handler is
 *  done, it calls the controller callback one last time to pass 
 *  a Blob that will be attached by Gmail, and erases itself from
 *  the fileHandlers associative array.
 */
var Model = function (workerblob) {
    this.fileHandlers = {};
    this.workerblob = workerblob;

    this.worker = new Worker(window.webkitURL.createObjectURL(workerblob));

    // Use webkitPostMessage if available, to send ArrayBuffers 
    // to the worker by reference as transferrable objects instead 
    // of copying them over to the worker's environment.
    this.worker.postMessage = this.worker.webkitPostMessage || 
                               this.worker.postMessage;

    that = this;
    this.worker.addEventListener('message', function(e) {
        var fhandler = that.fileHandlers[e.data.handlerId];
        fhandler.fileProcessed(e.data);
    }, false);
}

/* Create a download handler to download the file from the 
 * cloud. 
 */
Model.prototype.addDownloadHandler = function(FPFile, cb) {
    var fhandler = new FileHandler(this, FPFile, cb);
    this.fileHandlers[fhandler.id] = fhandler;
    fhandler.downloadFile();
}

/* HELPER OBJECTS */

var FileHandler = function(model, FPFile, cb) {
    this.model = model;
    this.fpfile = FPFile;
    // use filename + current time as ID, to allow a user to attach same
    // file twice (don't know why a user would want that, but let's not
    // limit them).
    this.id = removeWhitespace(FPFile.filename) + (new Date()).getTime();
    this.cb = cb;
}

FileHandler.prototype.fileProcessed = function(data) {
    // data is an ArrayBuffer (not Uint8Array)
    var ab = data.ab; 

    var blob = new Blob([new Uint8Array(ab)], {type: this.fpfile.mimetype});

    // extend our Blobs to have all properties of a file
    blob.lastModifiedDate = Date();
    blob.name = this.fpfile.filename;

    var files = [blob];
          
    this.cb({cmd: "done", state: "done", dwnldViewId: this.id}, files);

    delete this.model.fileHandlers[this.id];
}

/* Called on completion of a download from FilePicker. 
 * Decode the data from base64, then create a Blob and 
 * set elem.files = [blob]. Then raise "change" event 
 * for Gmail to pick up that there is a file available
 * to be attached.
 */
FileHandler.prototype.completeDownload = function(data) {
    var FPFile = this.fpfile;
    //data = filepicker.base64.decode(data);
    // When using filepicker's decode function,
    // must specify second arg as "false", because
    // we don't want the decoded data to be encoded
    // into UTF-8.
    // We are using our own base64decode function
    // anyway, in the worker script.

    this.cb({cmd: "updateView", dwnldViewId: this.id, state: "processing"});

    this.model.worker.postMessage({cmd: "decode", datastr: data, 
                                   handlerId: this.id}, [])
}

/* Start downloading file
 * Update UI to reflect download state
 * Register callback to handle download completion
 */
FileHandler.prototype.downloadFile = function() {
    var FPFile = this.fpfile;

    this.cb({cmd: "create", dwnldViewId: this.id, state: "started", 
             filename: FPFile.filename, size: FPFile.size});
    if (FPFile.size > MAX_ATTACHMENT_SIZE) {
        this.cb({cmd: "error", dwnldViewId: this.id, state: "maxSizeExceeded"});
    	delete this.model.fileHandlers[this.id];
	return;
    }

    var fhandler = this;
    // read data with filepicker.read()
    // TODO: don't read all files as binary, check mimeType
    //       This would speed up execution as decoding would not be 
    //       necessary.
    filepicker.read(FPFile, {base64encode: true, cache: false, asText: false}, 
        function() {
            fhandler.completeDownload.apply(fhandler, arguments);
        }, 
        function(fperror) {
            fhandler.cb({cmd: "error", state: "error", dwnldViewId: this.id});
        }, function(percent) {
            // for some reason this function never gets called. 
            // Submitted feedback to Filepicker.io.
            console.log("Progress update: " + percent + "% complete");
        });
};
