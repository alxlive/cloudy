/* 
 * HTML templates for download progress div and injected table rows 
 * in Compose view. Ideally these would be in separate HTML files and 
 * loaded at runtime, but Chrome does not allow XMLHttpRequests
 * from local files. 
 *
 * Similarly, the javascript code for the worker thread (see Model.js)
 * could not be loaded as a file at runtime, so I had to resort to storing
 * it here as a string. 
 */
var Templates = function() {
    return {downloadDiv: 
'<div>' +
'<table cellpadding="0" style="border-collapse:  collapse;">' +
'<tbody>' +
'<tr>' +
'' +
'<td>' +
'<span id="filename">02 Shot for Me.mp3  8906K</span>' +
'</td>' +
'' +
'<td style="padding: 0 2px;">' +
'<div><div>' +
'<img id="download_status_img">' +
'</div></div>' +
'</td>' +
'' +
'<td style="padding:  0 2px;">' +
'<span id="downloading_msg" tabindex="2">Downloading from the cloud</span>' +
'</td>' +
'</tr>' +
'</tbody>' +
'</table>' +
'</div>', 

            customRow: 
'<tr style="display:none;" id="filepicker_customrow">' +
'' +
'<td></td>' +
'' +
'<td style="padding-left:  5px; margin-bottom:  2px; padding-bottom:  1px;">' +
'<div id="filepicker_downloads" style="font-size:  80%;"></div>' +
'</td>' +
'' +
'</tr>',

            updatedViewDownload:
'<div>' + 
    '<div class="cloudy_updatedview_download" tabindex="2">' +
        '<div class="cloudy_updatedview_download_wrapper">' + 
            '<span class="cloudy_updatedview_download_msg">' + 
                'Downloading:' + 
            '</span>' + 
            '<span> </span>' +
            '<span class="cloudy_updatedview_download_filename">Folder.jpg' + 
            '</span>' + 
        '</div>' + 
        '<div class="cloudy_updatedview_download_size">(40K)</div>' +
        '<img class="cloudy_updatedview_download_statusicon" tabindex="1" />' +
    '</div>' +
'</div>',

            decodeWorker: 'var keyStr="ABCDEFGHIJKLMNOP"+"QRSTUVWXYZabcdef"+"ghijklmnopqrstuv"+"wxyz0123456789+/"+"=";function decode64(input){var output="";var chr1,chr2,chr3="";var enc1,enc2,enc3,enc4="";var i=0;var base64test=/[^A-Za-z0-9\+\/\=]/g;input=input.replace(/[^A-Za-z0-9\+\/\=]/g,"");do{enc1=keyStr.indexOf(input.charAt(i++));enc2=keyStr.indexOf(input.charAt(i++));enc3=keyStr.indexOf(input.charAt(i++));enc4=keyStr.indexOf(input.charAt(i++));chr1=(enc1<<2)|(enc2>>4);chr2=((enc2&15)<<4)|(enc3>>2);chr3=((enc3&3)<<6)|enc4;output=output+String.fromCharCode(chr1);if(enc3!=64){output=output+String.fromCharCode(chr2)}if(enc4!=64){output=output+String.fromCharCode(chr3)}chr1=chr2=chr3="";enc1=enc2=enc3=enc4=""}while(i<input.length);return output}function ab2str(buf){}self.addEventListener("message",function(e){if(e.data.cmd!=="decode"){return}var decodedstr=decode64(e.data.datastr);var buf=new ArrayBuffer(decodedstr.length);var bufView=new Uint8Array(buf);for(var i=0,strLen=decodedstr.length;i<strLen;i++){bufView[i]=(decodedstr.charCodeAt(i)&0xff)}self.postMessage=self.webkitPostMessage||self.postMessage;self.postMessage({result:"success",ab:buf,handlerId:e.data.handlerId},[buf])},false);'

    }
            
}
