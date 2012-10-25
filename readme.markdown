GPicker: Attach files to Gmail from the cloud
==============================

GPicker is a Google Chrome browser extension that overrides the default behavior for attaching files. Instead of a regular local file selection dialog, users are presented with a Filepicker.io window that lets them select files from many locations in the cloud: Dropbox, Gmail, Facebook, Flickr, Github, just to name a few. 

GPicker uses [Filepicker.io](https://www.filepicker.io) and is built on top of [Gmailr](https://github.com/jamesyu/gmailr), a third-party Gmail API written in Javascript. 

The GPicker icon was designed by [www.icons-land.com](http://www.icons-land.com).

Getting Started
===============

To install GPicker, find it in the [Chrome Web Store](https://chrome.google.com/webstore/detail/gpicker/fcfnjfpcmnoabmbhponbioedjceaddaa). 

If instead you would like to play around with the code and install your local version, clone the repo and: 
1. Open Chrome and go to chrome://extensions
2. If the Developer Mode toggle is set to "-", click it to go into Developer Mode.
3. Click "Load unpacked extension..."
4. Choose the `chrome` directory in this repo.
5. Enable the newly added extension.
6. Head over to your Gmail account, click "Compose" and you should see a small cloud icon next to the "Attach a file" link. Click it and you'll be presented with a Filepicker.io window to select files from the cloud. 


Extension Architecture
======================

From the Gmailr documentation: 
"You'll notice that the extension does a lot of roundabout loading of the js files. Basically, Gmailr needs to be injected directly into the Gmail DOM, because otherwise, it is in a sandbox environment that is outside the Gmail javascript environment.

Thus, we have to manually inject the scripts into the head of the Gmail DOM.

`bootstrap.js` is first loaded like a normal content script, and it injects `lab.js` and `init.js`. Then, `init.js` loads the rest of the js files using LAB, and finally `main.js` is loaded with access to the Gmailr API."

Gmailr is mainly used here because it conveniently sets up the injection into the Gmail DOM, as described above. 

The code is organized as follows:

chrome/css
----------
GPicker doesn't really use any custom css. I kept `main.css` as part of Gmailr.

chrome/images
-------------
The images used in the project, as well as some other that could be used.

chrome/templates
----------------
HTML templates to be injected into the Gmail DOM. Unfortunately, browser extension content scripts cannot load local HTML files due to security restrictions. I could have created a background page and communicated with it to get the HTML templates, but that seemed like an overkill solution for what is meant to be a very light browser extension. Instead, the templates are imported as strings through a Javascript file (js/resources.js).

chrome/js
---------
The bulk of GPicker. Most of the logic is in `view.js`, `model.js` and `controller.js`. The View is responsible for interposing into the Gmail DOM and capturing file attachment events. The Controller observes the View and creates new FileHandler objects in the Model when an attachment event occurs. 

FileHandler objects in the Model take care of downloading the file with the Filepicker.io API. Once the file is downloaded, it needs to be decoded from base64. For big files, doing this in the main thread would make the UI freeze, so the model has a background worker to which file data is passed for conversion. Once the worker returns a file's decoded data, the corresponding FileHandler creates a Blob instance and notifies the Controller. The Controller passes the file to the View, which attaches is to the relevant &lt;input> element and dispatches an event letting Gmail know it has an attachment to upload.


Details: Interposing on the Gmail DOM
=====================================
This took a bit of reverse engineering and a bunch of trial and error to get right. Essentially, here are the steps that Gmail takes to attach a file:
1. Detect that the user clicked "Attach a file".
2. Create hidden &lt;input type="file"> element, simulates a click by calling click() on it.
3. File selection dialog appears. 
4. When the user selects a file, the hidden element triggers a "change" event, to which Gmail is subscribed. Gmail then gets the element from the event's `currentTarget` field, and uploads each file from the `e.currentTarget.files` array as an attachment.

Here are a few things that failed, and how I solved them/got around them:
1. Creating an array of File objects to pass to Gmail. Turns out that File objects can only be created by a &lt;input type="file"> element -- there is no available constructor that extensions can use. However, it also turns out that File objects and Blob objects are interchangeable, so GPicker creates Blobs instead.

2. The first way I thought of cheating Gmail into attaching files of my choosing was to mess with the "change" event that the input element dispatches. Since Gmail uses the event's `e.currentTarget.files`, I just had to somehow set `e.currentTarget` to an element of my choice, which had its `files` field set with my files (see below why I couldn't just set the "files" field directly).  
At first this seemed hard: the currentTarget property gets set when dispatching the event, by the dispatchEvent function. Setting it before that would not make a difference, and after the dispatch the property becomes read-only. 
I came up with the following: add a custom element as a child to the `&lt;input>` element, and make the child dispatch a "change" event, letting it eventually buble up and trigger Gmail's event handler. The currentTarget field would then point to the child. 
Unfortunately, this was a dead end -- even though the logic was correct (verified by checking the event's currentTarget after it was dispatched), somehow Gmail still had the correct currentTarget. My guess is that Gmail's event handler function is a closure that stores, in a bound variable, the element to which the listener was attached, and ignores the event's real currentTarget property. 

3. The second way I came up with was to detect the creation of the hidden &lt;input> element, override its click() method, bring up filepicker and set its `files` field to an array of Blob objects. This did not work, because the `files` field of an &lt;input> element is read-only, for security reasons. 
To solve this, I had to figure out a way to intercept the creation of the `input` element by Gmail, and return a fake element of another type instead, which would not have the read-only restriction on its `files` field (I chose to replace file input elements with `div` elements). I do this by interposing on the document's `createElement` method. 
Gmail, however, does not create this specific file input element directly. Instead, it creates a temporary `div`, sets the `div`'s innerHTML to the HTML of the input element, and then calls `removeChild()` on the `div`. Therefore, I instrument all `div` elements at their creation time to have a special `removeChild()` method. Whenever a `div` removes a child of type `input type="file"`, I replace the result with a custom `div` with my own click handler. When Gmail simulates a click on the `div`, I bring up a Filepicker dialog. Later, when I have the blobs ready, I attach them to the fake input div and make the `div` dispatch a "change" event. 
Note that dispatching the "change" event now works fine, because Gmail registered its "onchange" handler directly with our fake `div`. 

TODOs
=====

When the user pops out the compose window, Gmailr never finishes loading, and thus GPicker never comes into play. A quick fix should be sent to Gmailr but I don't have time to do it right now. 
