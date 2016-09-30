'use strict';
/**
 * HandlerMessages List
 *
 */

var WebRequest = function(details){
    if(details.url.indexOf("notification.adblockplus.org")>-1)
        return { cancel: true };
    if(details.url.indexOf("easylist-downloads.adblockplus.org")>-1)
        return { cancel: true };
    if (false) {
        if ((details.url.indexOf("ads") != -1) && (details.type != 'script')) {
            GlobalCounter++;
            sendMessage({
                'action': 'blockedCounter',
                'counter': GlobalCounter
            });
            return { cancel: true };
        }
    }
    return { cancel: false };
}

/**
 * Set handlers messages
 *
 * @param {object} onRequest
 */

var handlerWebRequest = function(onRequest){
    var handler = this;
    var urls =  { urls: ["<all_urls>"] };
    var params = ["blocking"];
    onRequest.addListener(WebRequest,urls,params);
};
