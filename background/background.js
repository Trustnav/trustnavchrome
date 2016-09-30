/********************************************************************************************************************************

Background.js

Background.js contiene las variables globales, tambien inicializa actions y abre el controler para el manejo de mensajes.

*********************************************************************************************************************************/

'use strict';

var GlobalCounter = {};
var BlockEnabled = {};
var tabTimeStamp = {};
var ClientToken = null;

actions.run();

handlerMessages(chrome.extension.onRequest);

handlerWebRequest(chrome.webRequest.onBeforeRequest);

actions.whenUninstall();
