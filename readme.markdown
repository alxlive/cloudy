Cloudy: Attach files to Gmail from the cloud
==============================

Warning: this documentation is out of date. Nevertheless, it should still contain most of the key pieces of information necessary to understand and extend Cloudy.

Cloudy is a Google Chrome browser extension that overrides Gmail's default behavior for attaching files. Instead of a regular local file selection dialog, users are presented with a Filepicker.io window that lets them select files from many locations in the cloud: Dropbox, Gmail, Facebook, Flickr, Github, just to name a few. 

Cloudy uses [Filepicker.io](https://www.filepicker.io) and is built on top of [Gmailr](https://github.com/jamesyu/gmailr), a third-party Gmail API written in Javascript. 

The Cloudy icon was designed by [www.icons-land.com](http://www.icons-land.com).

Getting Started
===============

To install Cloudy, find it in the [Chrome Web Store](https://chrome.google.com/webstore/detail/cloudy/fcfnjfpcmnoabmbhponbioedjceaddaa). 

If instead you would like to play around with the code and install your local version, clone the repo and: 

1. Open Chrome and go to chrome://extensions
2. If the Developer Mode toggle is set to "-", click it to go into Developer Mode.
3. Click "Load unpacked extension..."
4. Choose the `chrome` directory in this repo.
5. Enable the newly added extension.
6. Head over to your Gmail account, click "Compose" and you should see a small cloud icon next to the "Attach a file" link. Click the link and you'll be presented with a Filepicker.io window to select files from the cloud. 


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
Cloudy doesn't really use any custom css. I kept `main.css` as part of Gmailr.

chrome/images
-------------
The images used in the project, as well as some others that could be used.

chrome/templates
----------------
HTML templates to be injected into the Gmail DOM. Unfortunately, browser extension content scripts cannot load local HTML files due to security restrictions. I could have created a background page and communicated with it to get the HTML templates, but that seemed like an overkill solution for what is meant to be a very light browser extension. Instead, the templates are imported as strings through a Javascript file (js/resources.js).

chrome/js
---------
The bulk of Cloudy. Most of the logic is in `view.js`, `model.js` and `controller.js`. The View is responsible for interposing into the Gmail DOM and capturing file attachment events. The Controller observes the View and creates new FileHandler objects in the Model when an attachment event occurs. 

FileHandler objects in the Model take care of downloading the file with the Filepicker.io API. Once the file is downloaded, it needs to be decoded from base64. For big files, doing this in the main thread would make the UI freeze, so the model has a background worker to which file data is passed for conversion. Once the worker returns a file's decoded data, the corresponding FileHandler creates a Blob instance and notifies the Controller. The Controller passes the file to the View, which attaches is to the relevant &lt;input> element and dispatches an event letting Gmail know it has an attachment to upload.


Details: Interposing on the Gmail DOM
=====================================

This section requires a lengthy explanation that does not have its place in a readme file. Please refer to [this blog post I wrote](http://www.milouchev.com/blog/2012/10/cloudy-attach-files-to-gmail-from-the-cloud/) about how exactly Cloudy intercepts and modifies Gmail's regular file attachment behavior. Reversing Gmail's logic was the most fun part of this project!

TODOs
=====

1. When the user pops out the compose window, Gmailr never finishes loading, and thus Cloudy never comes into play. A quick fix should be sent to Gmailr but I don't have time to do it right now. 

2. All files are currently downloaded encoded in base64. This is unnecessary for text content. Download text without encoding it on Filepicker's end and decoding it on our end.

3. Add possibility to download files to the cloud.

4. Style the dialog to be prettier, place Cloudy icon instead of "Filepicker.io".

5. Add failure detection in case Gmail code changes and breaks Cloudy.
