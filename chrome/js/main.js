/**
    This is the example app using the Gmailr API.

    In this file, you have access to the Gmailr object.
 */


Gmailr.debug = true; // Turn verbose debugging messages on 

Gmailr.init(function(G) {
    G.insertCss(getData('css_path'));
    var head= document.getElementsByTagName('head')[0];
    var script= document.createElement('script');
    script.type= 'text/javascript';
    script.src= '//api.filepicker.io/v1/filepicker.js';
    script.onload = function(){
        // filepicker.setKey("A8V-fpBbbR9aKC79dy3Vbz");
        filepicker.setKey("AAOYcsKYQlGPHU98KlF2qz");
    	G.filepickerLoaded = true;
    };
    head.appendChild(script);

    var controller = new Controller();
});
