/********************************************************************************************************************************
Helper.js

Helper es un objeto que contendra las funciones que sean de ayuda a la hora de codificar y no repetir codigo.

*********************************************************************************************************************************/

/**
 * @function msToTime();
 * @desc Convertidor de milisegundos a mm:ss
 * @param {integrer} duration
 *      Recibe un timeStamp en milisegundos y lo convierte a formato mm:ss
 *
 */

function msToTime(duration) {
    var seconds = parseInt((duration/1000)%60)
        ,minutes = parseInt((duration/(1000*60))%60);

    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;

    return  minutes + ":" + seconds;
}

/**
 * @function sendMessage();
 * @desc Envia un mensaje al background con cada accion solicitada
 *
 */

function sendMessage(){
    chrome.extension.sendRequest.apply(null, arguments);
}

/**
 * @function getRating();
 * @param {string} domain
 * @desc Pide al servidor el rating general del dominio pasado por parametro y actualiza el popUp en base a esa respuesta
 *
 */

function getRating(domain) {
    sendMessage({
        'action': 'getRating',
        'domain': domain
    },
    function(response) {
        if (response.ratingData) {

            if (response.ratingData.totalClients > 5) {
                $(".totalClients").html(response.ratingData.totalClients);
                $(".averageRating").html(response.ratingData.averageRating);
                $(".no-info").hide();
                $(".ratingInfo").show();

                for (var property in response.ratingData.totalRating) {
                    if (response.ratingData.totalRating.hasOwnProperty(property)) {
                        $(".rating-bar-" + property).css("width", response.ratingData.totalRating[property] + "%");
                    }
                }

                $(".bars").addClass("width-transation");
                
                if (isAdBlockEnabled) {
                    if (response.ratingData.averageRating < 3 && response.ratingData.averageRating != 0) {
                        $(".trusnav-logo").attr("src","img/tn-red.svg");
                        $(".isTrusted").attr("tkey","trustnav-is-no-trusted");

                        chrome.browserAction.setIcon({
                            path: "../popup/img/logo-rojo.png"
                        });

                    } else {
                        $(".trusnav-logo").attr("src","img/tn-green.svg");
                        $(".isTrusted").attr("tkey","trustnav-is-trusted");

                        chrome.browserAction.setIcon({
                            path: "../popup/img/logo.png"
                        });
                    }
                }

                translateDinamic();
            }
        }
    });
}

/**
 * @function validateUrl();
 * @param {object} url
 * @desc Funcion que valida una url pasada a travez de unas variables propias de bloqueo, de esta forma ahorramos generar eventos basura en urls del tipo about:blank o chrome://extensions
 *
 */

function validateUrl(url) {
    var toBlock = {
        blockedProtocol : [
            "about:",
            "chrome:",
            "chrome-extension:"
        ],
        blockedHostname : [
            "localhost"
        ]
    }

    if (toBlock.blockedProtocol.indexOf(url.protocol) == - 1 && toBlock.blockedHostname.indexOf(url.hostname) == -1) {
        return true;
    } else {
        return false;
    }
}

/**
 * @function parseDomain
 * @param {object} domain
 * @desc parsea el dominio eliminando https, http, www.
 *
 */
function parseDomain(domain) {
    var protocolArr = ['https://', 'http://', 'www.'];
    protocolArr.forEach(function (index, i) {
        if (domain.search(protocolArr[i]) === 0) {
            domain = domain.replace(index, '');
        }
    });
    return domain;
}
