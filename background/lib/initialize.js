/**
 * Run init actions
 *
 * @param {object} onRequest
 */

var actions = {};
var tabsRegistred = {};

actions.run = function() {
    var keys = Object.keys(this);
    keys.forEach(function(key) {
        if (key !== 'run') {
            actions[key]();
        }
    });
}

/**
 * Actions list
 *
 */

actions.default = function() {
    ClientToken = localStorage.getItem('ClientToken_trustnav');
    var flag = localStorage.getItem('flagInstalation_trustnav');
    if (!ClientToken && flag) {
        installRequest(function(msg) {
            setClientToken(msg);
        });
    }
}

actions.whenUninstall = function() {
    var flag = localStorage.getItem('flagInstalation_trustnav');
    var urlUninstall = Configserver.server + "client/uninstall?client=" + ClientToken;

    if (flag) {
        chrome.runtime.setUninstallURL(urlUninstall, function() {});
    }
}

actions.whenIstall = function() {
    if (!ClientToken) {
        chrome.runtime.onInstalled.addListener(function() {
            installRequest(function(msg) {
                setClientToken(msg);
                localStorage.setItem('flagInstalation_trustnav', "true");
                actions.whenUninstall();
            });
        });
    }
}

/**
 * @event onLogoChange()
 * @desc Evento que actualiza el icono en base a si el dominio visitado es seguro o el adblocker es desabilitado
 *
 */

actions.onLogoChange = function() {
    chrome.tabs.onSelectionChanged.addListener(function() {
        chrome.tabs.query({
            'active': true,
            'lastFocusedWindow': true
        }, function(tabs) {
            if (tabs.length > 0) {
                var url;
                try{
                    url = new URL(tabs[0].url);
                }catch(e){
                    url = false;
                }
                if(!url){
                    return;
                }

                var domain = parseDomain(url.hostname);
                if (BlockEnabled[domain] !== false && BlockEnabled.allEnable) {
                    var domain = {
                        domain: url.host,
                    }

                    chrome.browserAction.setIcon({
                        path: "../popup/img/logo.png"
                    });

                    if (validateUrl(url)) {
                        HandlerMessages.getRating(domain,{},function(data) {
                            if (data && data.ratingData) {
                                if (data.ratingData.averageRating < 3 && data.ratingData.averageRating != 0 && data.ratingData.totalClients>5) {
                                    chrome.browserAction.setIcon({
                                        path: "../popup/img/logo-rojo.png"
                                    });
                                }
                            }
                        });
                    }
                } else {
                    chrome.browserAction.setIcon({
                        path: "../popup/img/logo-gris.png"
                    });
                }
            }
        });
    });

    chrome.tabs.onCreated.addListener(function(tab) {
        chrome.browserAction.setIcon({
            path: "../popup/img/logo.png"
        });
    });
}

/**
 * @event onUpdateTab()
 * @desc Evento que se ejecuta cada vez que se actualiza la pestaña (cambios de url).
 *     Se guardara la url que es visitada, y se hara un timeStamp para saber cuanto tiempo paso el usuario en cada dominio
 *
 */

actions.onUpdateTab = function() {

    // Evento para atajar el pre-renderizado de chrome
    chrome.tabs.onReplaced.addListener(function(newId, removedId) {
        tabsRegistred[newId] = tabsRegistred[removedId]; // Remplazo objetos
        delete tabsRegistred[removedId]; // Borro objeto viejo
    });

    chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
debugger
        if (changeInfo.url) {
            var url = new URL(changeInfo.url);
            var date;
            var rangeTime;
            var allowedProtocol = validateUrl(url);

            var tabInfo = {
                url: parseDomain(url.host), // dominio
                start: +new Date, // timeStamp
            }

            var domain = {
                domain: parseDomain(url.host),
            }

            if (BlockEnabled.allEnable === false) {
                BlockEnabled[domain.domain] = false;
            }


            if (allowedProtocol) {
                if (BlockEnabled[parseDomain(domain.domain)] === false) {
                    chrome.browserAction.setIcon({
                        path: "../popup/img/logo-gris.png"
                    });
                } else {
                    HandlerMessages.getRating(domain,{},function(data) {
                        if (data && data.ratingData) {
                            if (data.ratingData.averageRating < 3 && data.ratingData.averageRating != 0 && data.ratingData.totalClients >= 5) {
                                chrome.browserAction.setIcon({
                                    path: "../popup/img/logo-rojo.png"
                                });
                            } else {
                                chrome.browserAction.setIcon({
                                    path: "../popup/img/logo.png"
                                });
                            }
                        }
                    });
                }

                if (tabsRegistred[tabId]) {
                    if (tabsRegistred[tabId].url != url.host) { // Si el usuario cambio de domino ejecuta el fin del timeStamp y setea la url que deja de ser solicitada para que pase a ser prevUrl

                        //Set
                        tabInfo.prevUrl = tabsRegistred[tabId].url;
                        date = +new Date - tabsRegistred[tabId].start;
                        //TimeStamp nuevo
                        tabsRegistred[tabId].start = +new Date;
                        //Conversion a mm:ss
                        tabInfo.rangeTime = msToTime(date);
                        //Envio evento
                        var newEventData = {
                            type: 'CHECK_DOMAIN',
                            value: {
                                'referrer' : parseDomain(tabsRegistred[tabId].url),
                                'siteDomain'  : parseDomain(url.host),
                                'domainDuration' : tabInfo.rangeTime
                            }
                        }

                        if (allowedProtocol) {
                            HandlerMessages.newEvent(newEventData);
                        }

                    } else {
                        //Si el dominio sigue siendo el mismo mantengo prevUrl igual.
                        tabInfo.prevUrl = tabsRegistred[tabId].prevUrl;
                    }
                }
                //Set
                tabsRegistred[tabId] = tabInfo;
            }
        }

    });
}

/**
 * @event onCloseTab()
 * @desc Evento que se ejecuta cada vez que es cerrada una tab.
 *     Se generara el fin del timeStamp y enviara el evento de cierre de pestaña.
 *
 */

actions.onCloseTab = function() {
    chrome.tabs.onRemoved.addListener(function(tabId) {
        //Si la pestaña tiene tiempo de vida
        if (tabsRegistred[tabId]) {
            if (tabsRegistred[tabId].rangeTime) {
                //Calculo nuevo tiempo de vida
                date = +new Date - tabsRegistred[tabId].start;
                //Envio evento
                var newEventData = {
                    type: 'CHECK_DOMAIN',
                    value: {
                       'referrer' : parseDomain(tabsRegistred[tabId].prevUrl),
                       'siteDomain': "",
                       'domainDuration': msToTime(date)
                    }
                }
                HandlerMessages.newEvent(newEventData);
                //Borro el objeto que contiene la tab que fue cerrada.
                delete tabsRegistred[tabId];
            }
        }
    });
}

/**
 * @event onCloseBrowser()
 * @desc Evento que se ejecuta cada vez que es cerrado el navegador.
 *      Se genera un buclee para cada pestaña registrada, siempre y cuando tengan tiempo de vida, sera enviado el evento con la url actual y la anterior, y el tiempo que duro hasta ser cerrada.
 *
 */

actions.onCloseBrowser = function() {
    chrome.windows.onRemoved.addListener(function(windowId) {
        //Inicio bucle
        for (var property in tabsRegistred) {
            if (tabsRegistred.hasOwnProperty(property)) {
                //Si la pestaña tiene tiempo de vida
                if (tabsRegistred[property].rangeTime) {
                    //Calculo nuevo tiempo de vida
                    date = +new Date - tabsRegistred[property].start;
                    //Envio evento
                    var newEventData = {
                        type: 'CHECK_DOMAIN',
                        value: {
                            'referrer' : parseDomain(tabsRegistred[property].prevUrl),
                            'siteDomain' : "",
                            'domainDuration' : msToTime(date)
                        }
                    }
                    HandlerMessages.newEvent(newEventData);
                    //Borro el objeto que contiene la tab que fue cerrada.
                    delete tabsRegistred[property];
                }
            }
        }
    });
}

/**
 * @event adsBlocked()
 * @desc Evento que se ejecuta cada 10 segundos, verificando la cantidad de anuncios bloqueados en el sitio.
 *      Se genera un objeto que contendra las tabs con la propiedad "flag" en esta se guardara la cantidad de anuncios bloqueados, validando que sea distinto a la cantidad de anuncios ya bloqueados y de esta forma no bombardear el servidor.
 *
 */

actions.adsBlocked = function() {
    //Objeto de tabs
    var tabsFlag = {};
    //Comienza intervalo
    setInterval(function() {
        //Selecciono la tab activa
        chrome.tabs.query({active:true}, function(tab){
            var url = new URL(tab[0].url);

            if (validateUrl(url)) {
                //Id de la tab para solicitar la cantidad de anuncios bloqueados
                var data = {
                    id: tab[0].id
                }
                //Solicito
                HandlerMessages.get_counter({data}, {}, function(response) {
                    //Si la tab no esta guardada, o el flag es distinto a la respuesta
                    if (!tabsFlag[tab[0].id] || tabsFlag[tab[0].id].flag != response) {
                        //Creo mi evento
                        var newEventData = {
                            type: 'ADS_BLOCKED',
                            value: {
                                'domain' : parseDomain(url.host),
                                'siteDomain' : tab[0].url,
                                'quantity' : response,
                            }
                        }
                        //Lo envio
                        HandlerMessages.newEvent(newEventData);
                        //Guardo el nuevo flag
                        tabsFlag[tab[0].id] = {
                            flag : response
                        };
                    }
                });
            }
        });
    },10000);
}

// Ping Domain, envia cada 5 segundos un ping para la pestaña activa
// actions.pingDomain = function() {
//     setInterval(function() {
//         chrome.tabs.query({active:true}, function(tab) {
//             var url = new URL(tab[0].url);
//             var newEventData = {
//                 type: 'ping_domain',
//                 value: {
//                     "domain": url.host
//                 }
//             };
//             HandlerMessages.newEvent(newEventData);
//             });
//         },5000);
// }


/**
 * Utils functions
 *
 */

function installRequest(cb) {
    var urlInstall = Configserver.server + "client";
    $.ajax({
            method: "POST",
            url: urlInstall,
            headers: {
                'Authorization': 'Basic 7f1c64fad8a835f867743c9762abc4dccf82832c',
                'Content-Type': 'application/json'
            }
        })
        .done(cb);
}

function setClientToken(msg) {
    if (msg && msg.data && msg.data.hash && msg.data.hash !== "") {
        ClientToken = msg.data.hash;
        localStorage.setItem('ClientToken_trustnav', ClientToken);
    }
}

function sendMessage() {
    chrome.extension.sendRequest.apply(null, arguments);
}
