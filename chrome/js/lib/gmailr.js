/**
 * Gmailr v0.0.1
 * Licensed under The MIT License
 *
 * Copyright 2011, James Yu
 */

(function($, window) {

    // Utility methods

    var dbg = function(msg) {
        if(Gmailr.debug)
            console.log(msg);
    };

    var p = function(els, m) {
        if(!els) {
            dbg(els);
        } else if(els.each) {
            if(els.length == 0) {
                dbg('p: Empty');
            } else {
                els.each(function(i,e) {
                    dbg(e);
                });
            }
        } else {
            dbg(els);
        }
    };

    var Gmailr = {

        /*****************************************************************************************
         * Public Methods and Variables
         */

        debug: false,
        inboxLink: null,
        elements: {},

        /*
            This is the main initialization routine. It bootstraps Gmailr into the Gmail interface.
            You must call this with a callback, like so:

            Gmailr.init(function(G) {
                // .. G is the Gmailr API object
            });
        */

        init: function(cb) {
            var self = this;

            dbg('Initializing Gmailr API');

            var delayed_loader_count = 0;

            // Here we do delayed loading until success. This is in the case
            // that our script loads after Gmail has already loaded.
            self.delayed_loader = setInterval(function() {
                var canvas_frame;
                self.elements.canvas = (canvas_frame = document.getElementById("canvas_frame")) ?
                    $(canvas_frame.contentDocument) : $(document);
                self.elements.body   = self.elements.canvas.find('body').first();

                if(self.loaded) {
                    if(delayed_loader_count != 0) 
                        dbg('Delayed loader success, email: ' + 
                            self.emailAddress() );

                    clearInterval(self.delayed_loader);
                } else {
                    dbg('Calling delayed loader...');
                    delayed_loader_count += 1;
                    // we search from the body node, since there's no event to attach to
                    self.bootstrap(self.elements.body, cb);
                }
            }, 500);
        },

        /*
            Inserts the element to the top of the Gmail interface.
        */

        insertTop: function(el) {
            if(!this.loaded) throw "Call to insertTop before Gmail has loaded";
            this.elements.body.prepend($(el));
        },

        /*
            Allows you to apply jQuery selectors in the Gmail DOM, like so:

            G.$('.my_class');
        */

        $: function(selector) {
            return this.elements.body.find(selector);
        },

        /*
            Inserts a CSS file into the Gmail DOM.
        */

        insertCss: function(cssFile) {
            var css = $('<link rel="stylesheet" type="text/css">');
            css.attr('href', cssFile);
            this.elements.canvas.find('head').first().append(css);
        },

        /**
         * Email address of the Gmail account.
         */
        emailAddress: function() {
            if(!this.loaded) throw "Call to emailAddress before Gmail has loaded";

            // add selectors here if/when gmail changes this
            var emailSelectors = ['#guser b', '.gbmp1', ".gbps2"]

            var candidates = this.elements.canvas.find(emailSelectors.join(','));
            var email;
            if (candidates.length > 0) {
                email = candidates.first().html();
            } else {
                email = "unavailable";
            }
            return email;
        },

        /*****************************************************************************************
         * Private Methods
         */


        /**
         * This method attempts to bootstrap Gmailr into the Gmail interface.
         * Basically, this amounts polling to make sure Gmail has fully loaded,
         * and then setting up some basic hooks.
         */

        bootstrap: function(el, cb) {
            var self = this;
            if(el) {
                var el = $(el);

                // get handle on the left menu
                if(!this.leftMenu || this.leftMenu.length == 0 || 
                    !this.inboxLink || this.inboxLink.length == 0) {
                    this.leftMenu = el.find('div.nH.oy8Mbf.nn.aeN');

                    this.inboxLink = this.leftMenu.find("a.J-Ke.n0").eq(0);

                    if(this.leftMenu && this.leftMenu.length > 0 &&
                        this.inboxLink && this.inboxLink.length > 0) {
                        this.leftMenuItems = this.leftMenu.find('.TO');

                        p('Fully loaded');
                        this.loaded = true;

                        if(cb) cb(self);
                    }
                } 
                
                if (!this.loaded && el.hasClass("xE")) {
                    // popped out mode (chat, email thread, or compose)
                    p("Loaded in popped out window");
                    this.loaded = true;
                    this.poppedOut = true;
                    if (cb) cb(self);
                }
            }
        },

        loaded: false,
    };

    window.Gmailr = Gmailr;
})($jQcl, window);
