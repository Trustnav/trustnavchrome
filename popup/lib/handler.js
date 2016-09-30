/*****************************************************************************************************************************************
Handler.js

Handler.js es un objeto que contiene las respuestas para cada mensaje, cada funcion se ejecutara siempre y cuando sea pedida por un mensaje

******************************************************************************************************************************************/

var handlerMessages = function(onRequest){
    var handler = this;
    onRequest.addListener(function(message, request, callback){
        if(handler[message.action]){
            handler[message.action](message, request, callback);
        }
    });
};


/**
 * HandlerMessages List
 *
 */

handlerMessages.blockedCounter = function(message, request, callback){
    $("#adsBlocked").html(message.counter);
}
