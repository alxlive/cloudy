/* Small Controller class for the sake of having the Model
 * and the View not know about each other. Does not do much
 * besides gluing the two together.
 */
var Controller = function() {
    this._init();
}

Controller.prototype._init = function() {
    // Retrieve worker script, passed by content script through the DOM.
    // Create blob from script, will later user blob to create worker
    // threads for parallelism during conversion from base64.
    var templates = Templates();
    //var workerScriptContainer = 
    //    document.getElementById("filepicker_worker_script");
    //this.workerblob = new Blob([workerScriptContainer.dataset.html]);
    this.workerblob = new Blob([templates.decodeWorker]);
    //workerScriptContainer.parentNode.removeChild(workerScriptContainer);

    this.model = new Model(this.workerblob);
    this.view = new View();
    var that = this;
    this.view.addObserver(function() {
        that._processViewEvent.apply(that, arguments)
    });
}

/* File Handler in the model calls this function back to signify a change in 
 * status for its file download/processing.
 */
Controller.prototype._processDownloadEvent = function(msg, /*array*/files) {
    if (msg.cmd === "create") {
        this.view.addDownloadView(msg.dwnldViewId, msg.filename, msg.size);
        return;
    }
    this.view.updateDownloadView(msg.dwnldViewId, msg.state);
    if (msg.cmd === "done") {
        this.view.attachFiles(files);
    }
}

/* The view calls this callback whenever an element we have subscribed to
 * occurs. So far we have only subscribed to the "attach" event. 
 */ 
Controller.prototype._processViewEvent = function(msg, FPFile) {
    var that = this;
    if (msg === "attach") {
        this.model.addDownloadHandler(FPFile, 
            function() {
                that._processDownloadEvent.apply(that, arguments);
            });
    }
}
