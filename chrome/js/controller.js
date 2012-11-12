/* Small Controller class for the sake of having the Model
 * and the View not know about each other. Does not do much
 * besides gluing the two together.
 */
var Controller = function () {
    if (arguments.callee.singleton_instance) {
        return arguments.callee.singleton_instance;
    }

    arguments.callee.singleton_instance = new (function () {
        var controller;
        var model;
        var viewManager;

        /* File Handler in the model calls this function back to signify a 
         * change in status for its file download/processing.
         */
        var processDownloadEvent = function(messageId, msg, /* array */ files) { 
            if (msg.cmd === "create") {
                viewManager.getView().addDownloadView(msg.dwnldViewId, 
                    msg.filename, msg.size, messageId);
                return;
            }
            viewManager.getView().updateDownloadView(msg.dwnldViewId, 
                msg.state, messageId);
            if (msg.cmd === "done") {
                viewManager.getView().attachFiles(files, messageId);
            }
        }

        /* The view calls this callback whenever an element we have subscribed 
         * to occurs. So far we have only subscribed to the "attach" event. 
         */ 
        var processViewEvent = function(msg, FPFile, messageId) {
            if (msg === "attach") {
                model.addFileHandler(FPFile, 
                    function() {
                        processDownloadEvent.apply(controller, arguments);
                    },
                    messageId);
            }
        }


        var init = function() {
            // Retrieve worker script, passed by content script through the DOM.
            // Create blob from script, will later user blob to create worker
            // threads for parallelism during conversion from base64.
            var templates = Templates();
            var workerblob = new Blob([templates.decodeWorker]);

            model = new Model(workerblob);
            viewManager = new ViewManager();
            controller = this;
            viewManager.addViewObserver(function() {
                processViewEvent.apply(controller, arguments)
            });
        }

        init.call(this);
        return this;
    })();

    return arguments.callee.singleton_instance;
}

