/*****************************************************************************************************************************************
Handler.js

Handler.js es un objeto que contiene las respuestas para cada mensaje, cada funcion se ejecutara siempre y cuando sea pedida por un mensaje

******************************************************************************************************************************************/

'use strict';

var HandlerMessages = {};

var scopeStats = require.scopes["stats"];


/**
 * @function get_counter()
 * @param {object} message Datos que fueron recibidos.
 * @param {object} request
 * @param {function} callback
 * @desc Responde con los anuncios bloqueados por pagina.
 *
 */


HandlerMessages.get_counter = function(message, request, callback) {
    callback(scopeStats.getBlockedPerPage(message.data) || 0);
}

/**
 * @function change_status()
 * @param {object} message Datos que fueron recibidos.
 * @param {object} request
 * @param {function} callback
 * @desc Cambia el estado del adblocker por habilitado/desabilitado.
 *
 */


HandlerMessages.change_status = function(message, request, callback) {
    BlockEnabled[message.domain] = message.value;
}

/**
 * @function get_config()
 * @param {object} message Datos que fueron recibidos.
 * @param {object} request
 * @param {function} callback
 * @desc Reposponde con las configuraciones del plugin (si esta habilitado y cuantos anuncios fueron bloqueados)
 *
 */


HandlerMessages.get_config = function(message, request, callback) {
    callback({
        'enabled': BlockEnabled[message.domain] !== false ? true : false,
        'counter': GlobalCounter[message.domain] ? GlobalCounter[message.domain] : 0
    });
}

/**
 * @function sendRating()
 * @param {object} message Datos que fueron recibidos.
 * @param {object} request
 * @param {function} callback
 * @desc Crea un objeto que contiene la calificacion comentario y dominio, luego lo envia al servidor para setear la calificacion del cliente.
 *
 */

HandlerMessages.sendRating = function(message, request, callback) {

    var dataRating = {
        rating: parseInt(message.value.rating),
        comment: message.value.message,
        domain: message.value.domain
    }

    $.ajax({
        url: Configserver.server + "rating",
        method: 'POST',
        dataType: 'json',
        headers: {
            'Authorization': 'Client ' + ClientToken
        },
        data: dataRating,
        success: function(data) {
            callback({
                'success': true
            });
        }
    });
}

/**
 * @function newEvent()
 * @param {object} message Datos que fueron recibidos.
 * @param {object} request
 * @param {function} callback
 * @desc Llamada principal para manejo de eventos, recibe el objeto deseado para guardar un evento y hace la llamada al servidor.
 *
 */

HandlerMessages.newEvent = function(message, request, callback) {
    var toSend = {};

    if (!message.data) {
        toSend = message;
    } else {
        toSend = message.data;
    }

    $.ajax({
        url: Configserver.server + "event",
        method: 'POST',
        dataType: 'json',
        headers: {
            'Authorization': 'Client ' + ClientToken,
        },
        data: toSend,
    });
}

/**
 * @function getRating()
 * @param {object} message Datos que fueron recibidos.
 * @param {object} request
 * @param {function} callback
 * @desc En base al dominio pasado por parametro, devuelve la calificacion general de la web.
 *
 */

HandlerMessages.getRating = function(message, request, callback) {
    $.ajax({
        url: Configserver.server + "rating",
        method: 'GET',
        dataType: 'json',
        headers: {
            'Authorization': 'Client ' + ClientToken,
        },
        data: {
            domain: message.domain
        },
        success: function(data) {
            callback({
                'ratingData': data.data,
            });
        }
    });
}


/**
 * @function handlerMessages()
 * @param {object} onRequest
 * @desc Determinara y ejecutara cada funcion que sea pedida.
 *
 */
var handlerMessages = function(onRequest) {
    onRequest.addListener(function(message, request, callback) {
        if (HandlerMessages[message.action]) {
            HandlerMessages[message.action](message, request, callback);
        }
    });
};
