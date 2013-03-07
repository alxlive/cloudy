/* The ViewManager takes care of detecting whether the user uses the old or 
 * new Compose in Gmail. Once it finds out, it takes care of instantiating
 * the appropriate view (regularView or updatedView). 
 */
var ViewManager = function () {
    if (arguments.callee.singleton_instance) {
        return arguments.callee.singleton_instance;
    }

    arguments.callee.singleton_instance = new (function () {
        var observerCallbacks = [];
        var cloudy_view;
        var mytimer;
        var enabled;

        this.addViewObserver = function (fn) {
            observerCallbacks.push(fn);
        }

        this.getView = function(){
            return cloudy_view;
        }

        /* Look for an element named "subject". If found, then a Compose window
         * must be open. If a DOM element with name "from" exists, and it is of
         * type "input", then we must be encountering the new Gmail Compose. 
         * Otherwise, we're dealing with the old one. 
         */
        var checkCompose = function() {
            if (enabled && document.getElementsByName("subject").length) {
                if (!document.getElementsByClassName("I5").length) {
                    // Gmail's old interface
                    cloudy_view = new RegularView();
                } else {
                    // Gmail's new interface
                    cloudy_view = new UpdatedView();
                }
                for (var i = 0; i < observerCallbacks.length; i++) {
                    cloudy_view.addObserver(observerCallbacks[i]);
                }
                clearInterval(mytimer);
                enabled = false;
            }
        }

        var loadSocialButtons = function() {
            // Load Tweet button
            (!function(d,s,id) {
                console.log("loading twitter");
                var js,fjs=d.getElementsByTagName(s)[0];
                if(!d.getElementById(id)) {
                    js=d.createElement(s);
                    js.id=id; 
                    js.async = true;
                    js.src="https://platform.twitter.com/widgets.js";
                    fjs.parentNode.insertBefore(js,fjs);
                }
            } (document,"script","twitter-wjs"));

            // Load Google +1 button
            (function(d, s, id) {
                console.log("loading G+");
                var po = d.createElement(s); 
                if (d.getElementById(id)) return;
                po.type = 'text/javascript'; 
                po.async = true;
                po.src = 'https://apis.google.com/js/plusone.js';
                var s = d.getElementsByTagName('script')[0]; 
                s.parentNode.insertBefore(po, s);
            })(document, 'script', 'googleplus-jssdk');

            // Load Pinterest "Pin it" button
            (function(d, s, id) {
                console.log("loading Pinterest");
                var js, fjs = d.getElementsByTagName(s)[0];
                if (d.getElementById(id)) return;
                js = d.createElement(s); 
                js.id = id;
                js.src = "https://assets.pinterest.com/js/pinit.js";
                js.async = true;
                fjs.parentNode.insertBefore(js, fjs);
            } (document, 'script', 'pinterest-jssdk'));
        }

        var init = function() {
            mytimer = setInterval(checkCompose, 500);
            enabled = true;

            // check for promo bubble, display it if loaded
            var notification_bubble = $jQcl("#cloudy_bubble");
            if (notification_bubble && notification_bubble.length > 0) {
                console.log("Showing notification");

                if (notification_bubble.hasClass("cloudy_social")) {
                    loadSocialButtons();
                }
                /* why does this not work? */
                //notification_bubble.show(); 
                notification_bubble.css("display", "block");
                notification_bubble.delay(1500).fadeTo(1000, 1, 
                        function() {
                    var cloudy_events = 
                        document.getElementById("cloudy_events");
                    if (cloudy_events) {
                        var e = document.createEvent("Events");
                        e.initEvent("cloudy_notificationDisplayed", 
                            false, true);
                        cloudy_events.dispatchEvent(e);
                    }
                });
                $jQcl("#cloudy_bubble_close").click(function(){
                    notification_bubble.fadeTo(600, 0, function(){
                        notification_bubble.hide();
                        //notification_bubble.parentNode.removeChild(
                        //    notification_bubble);
                    });
                });
            }
        }

        init.call(this);
        return this;
    })();

    return arguments.callee.singleton_instance;
}
