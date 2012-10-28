
var keyStr = "ABCDEFGHIJKLMNOP" +
             "QRSTUVWXYZabcdef" +
             "ghijklmnopqrstuv" +
             "wxyz0123456789+/" +
             "=";

function decode64(input) {
    var output = "";
    var chr1, chr2, chr3 = "";
    var enc1, enc2, enc3, enc4 = "";
    var i = 0;

    // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
    var base64test = /[^A-Za-z0-9\+\/\=]/g;
    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

    do {
        enc1 = keyStr.indexOf(input.charAt(i++));
        enc2 = keyStr.indexOf(input.charAt(i++));
        enc3 = keyStr.indexOf(input.charAt(i++));
        enc4 = keyStr.indexOf(input.charAt(i++));

        chr1 = (enc1 << 2) | (enc2 >> 4);
        chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
        chr3 = ((enc3 & 3) << 6) | enc4;

        output = output + String.fromCharCode(chr1);

        if (enc3 != 64) {
            output = output + String.fromCharCode(chr2);
        }
        if (enc4 != 64) {
            output = output + String.fromCharCode(chr3);
        }

        chr1 = chr2 = chr3 = "";
        enc1 = enc2 = enc3 = enc4 = "";

    } while (i < input.length);

    return output;
}

self.addEventListener("message", function(e) {
    if (e.data.cmd !== "decode") {
        return;
    }
    
    // var decodedstr = decode64(str);
    var decodedstr = decode64(e.data.datastr);
    // data = unescape(data); // this unescapes all escaped octets.
                              // Gmail needs them to be escaped,
                              // otherwise files are not reconstructed
                              // correctly

    var buf = new ArrayBuffer(decodedstr.length);
    var bufView = new Uint8Array(buf);
    for (var i = 0, strLen = decodedstr.length; i < strLen; i++) {
        bufView[i] = (decodedstr.charCodeAt(i) & 0xff);
    }
    self.postMessage = self.webkitPostMessage || self.postMessage;
    self.postMessage({result: "success", ab: buf, 
                      handlerId: e.data.handlerId}, [buf]);
}, false);
