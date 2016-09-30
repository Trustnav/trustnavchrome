/********************************************************************************************************************************
Initialize.js

Initialize.js Se encarga de leer todas las funciones almacenadas en actions y ejecutar cada una de ellas.

*********************************************************************************************************************************/


var actions = {};
var eventsInfo = {
    rating : {
        first : true,
    },
    comment : {
        first : true,
    }
}


/**
 * @function run()
 * @desc Auto ejecuta todas las funciones deseadas.
 *      Almacenara todas las propiedades del objecto actions y evaluara cada una, siempre que la propiedad sea distinta de "run" ejecutara cada funcion.
 *
 */

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


/**
 * @function setCountBlocked()
 * @desc Recibe la cantidad de anuncios bloqueados y los setea en el html del popUp.
 *
 */


var time = 0;
actions.getCountBlocked = function() {
    if(!checkWhitelisted(page)){
        setTimeout(function(){
            sendMessage({
                'action' : 'get_counter',
                'data' : {id:page.id},
            }, function(blocked){
                time = 1000;
                actions.setCountBlockeds();
                $("#adsBlocked").text(blocked);
            })
        }, time);
    }
};

/**
 * @function setCountBlockeds()
 * @desc Valida que la pagina tenga una whiteList y incrusta en el html si esta activada o no.
 *
 */

actions.setCountBlockeds = function() {
    if(checkWhitelisted(page)){
        $('.isEnabled').html("Adblocker disabled");
        return $('#enabled').attr('checked', false);
    }
    $('.isEnabled').html("Adblocker enabled");
    return $('#enabled').attr('checked', true);
};

/**
 * @function enabled()
 * @desc Verifica si el adBlock esta habilitado/desabilitado y cambia el icono dinamicamente, envia un evento de activacion y cambia el html.
 *
 */

actions.enabled = function() {
    $("#enabled").click(function() {
        var newEventData = {}

        chrome.tabs.getSelected(null, function(tab) {
            var url = new URL(tab.url);
            var domain = parseDomain(url.hostname);
            var isEnabled = $('#enabled').is(':checked');

            if (!isEnabled) {
                newEventData.type = "ADBLOCK_DISABLED";
                newEventData.value = {
                    domain : domain,
                };
                chrome.browserAction.setIcon({
                    path: "../popup/img/logo-gris.png"
                });
            } else {
                newEventData.type = "ADBLOCK_ENABLED";
                newEventData.value = {
                    domain : domain,
                };
                sendMessage({
                    'action' : 'getRating',
                    'domain' : domain,
                }, function(response) {
                    if (response.ratingData.averageRating < 3 && response.ratingData.averageRating  != 0) {
                        chrome.browserAction.setIcon({
                            path: "../popup/img/logo-rojo.png"
                        });
                    } else {
                        chrome.browserAction.setIcon({
                            path: "../popup/img/logo.png"
                        });
                    }
                });

            }

            if (validateUrl(url)) {
                sendMessage({
                    'action': 'newEvent',
                    'data': newEventData,
                });
            }

            if (!isEnabled) {
                $(".tooltiptext").html("Enable Trustnav in this site/domain");
                $('.isEnabled').html("Adblocker disabled");
            } else {
                $(".tooltiptext").html("Disable Trustnav in this site/domain");
                $('.isEnabled').html("Adblocker enabled");
            }

            sendMessage({
                'action': 'change_status',
                'value': isEnabled,
                'domain': domain,
            }, function(){});
        });

    });
}

/**
 * @function onSetRating()
 * @event setRating.
 * @desc Se ejecuta cada vez q se haga click en una estrella de valoracion, crea el objeto que contiene el ultimo comentario y la puntuacion y tambien genera el objeto para enviar el eventos
 *      Envia el evento y la puntuacion al servidor, luego que tiene la respuesta ejecuta la funcion getRating() que actuaiza la informacion de las votaciones.
 *
 */

actions.onSetRating = function() {
    $(document).on("click", ".starRating input", function() {
        var that = this;
        chrome.tabs.getSelected(null, function(tab) {

            var url = new URL(tab.url);

            if (validateUrl(url)) {
                var domain = parseDomain(url.hostname)

                var ratingData = {
                    rating: $(that).val(),
                    message: $(".lastComment").text(),
                    domain: parseDomain(domain)
                }

                var newEventData = {
                    type: 'CALIFICATION_GIVEN',
                    value: {
                        'domain' : domain,
                        'value' : ratingData.rating,
                    }
                }

                if (!eventsInfo.rating.first) {
                    newEventData.type = 'CALIFICATION_UPDATED';
                    newEventData.value = {
                        'domain' : domain,
                        'new_value' : ratingData.rating,
                        'old_value' : eventsInfo.rating.oldRating
                    }
                }

                sendMessage({
                    'action': 'newEvent',
                    'data': newEventData,
                });

                if (ratingData.message === "Give us a comment about this site!") {
                    ratingData.message = null;
                }

                $(".bars").removeClass("width-transation");

                sendMessage({
                    'action': 'sendRating',
                    'value': ratingData
                },
                function() {
                    $(".thanksForVote").html("Successful vote, thanks for rating!");
                    getRating(domain);
                });

                eventsInfo.rating.first = false;
                eventsInfo.rating.oldRating = ratingData.rating;

                $("#starRatingContainer .text-primary").addClass("hide");
                $("#starRatingContainer .text-primary").addClass("hideText");
                $("#starRatingContainer").css("height", "70px");
                $(".starRating").css("transform", "scale(0.7, 0.7)");
                $("#commentRating").fadeIn();
            }
        });
    });
}

/**
 * @function onSendComment()
 * @event setComment.
 * @desc Cuando se envie un comentario genera el objeto de calificacion y el objeto de eventos, envia el evento y comentario y luego actualiza el ultimo valor del popUp dinamicamente.
 *
 */

actions.onSendComment = function() {
    $(document).on("click", ".submittBtn", function() {

        $("#commentRating").fadeOut();

        chrome.tabs.getSelected(null, function(tab) {

            var url = new URL(tab.url);
            var domain = parseDomain(url.hostname);

            if (validateUrl(url)) {

                if ($(".messageArea").val() === "") {
                    return $(".thanksForVote").html("Successful vote, thanks for rating!");
                }

                var ratingData = {
                    rating: $(".starRating input:checked").val(),
                    message: $(".messageArea").val(),
                    domain: domain
                }

                var newEventData = {
                    type: 'COMMENT_LEFT',
                    value: {
                        'domain' : domain,
                        'rating' : ratingData.rating,
                        'comment' : ratingData.message
                    }
                }

                if (!eventsInfo.comment.first) {
                    newEventData.type = 'COMMENT_UPDATED';
                    newEventData.value = {
                        'domain' : domain,
                        'rating' : ratingData.rating,
                        'new_comment' : ratingData.message
                    };
                }

                sendMessage({
                    'action': 'newEvent',
                    'data': newEventData,
                });

                sendMessage({
                    'action': 'sendRating',
                    'value': ratingData
                },
                function() {});

                $(".messageArea").val("");

                $(".lastComment").html(ratingData.message + '<i class="fa fa-pencil" aria-hidden="true"></i>');
                $(".lastCommentWrap").show();
                $(".thanksForVote").html("Thanks for rating!");

                eventsInfo.comment.first = false;
                eventsInfo.comment.oldComment = ratingData.message;

            }

        });

    })
}

/**
 * @function onEditComment()
 * @desc Cuando se haga click en el ultimo comentario para editar, se cambiara el valor del textarea y se redimensiona el popUp
 *
 */

actions.onEditComment = function() {
    $(document).on("click", ".lastComment", function() {
        $(".messageArea").val($(this).text());
        $("#starRatingContainer .text-primary").addClass("hideText");
        $("#starRatingContainer").css("height", "70px");
        $(".starRating").css("transform", "scale(0.7, 0.7)");
        $("#commentRating").fadeIn();
    });
}

/**
 * @function onOpenPopUp()
 * @desc Cuando el popUp es abierto, se guara un evento y tambien le pregunta al servidor las calificaciones del dominio en particular y son seteadas en el popUp.
 *       De esta forma el popUp contiene la informacion del sitio.
 *
 */

actions.onOpenPopUp = function() {
    chrome.tabs.getSelected(null, function(tab) {

        var url = new URL(tab.url);
        var domain = parseDomain(url.hostname);

        if (validateUrl(url)) {
            var newEventData = {
                type: "POPUP_OPENED",
                value: {
                    domain : domain
                },
            }

            sendMessage({
                'action': 'newEvent',
                'data': newEventData,
            });

            sendMessage({
                'action': 'getRating',
                'domain': domain
            },
            function(response) {
                if (response.ratingData) {

                    $(".starRating input[value=" + response.ratingData.client.rating + "]").prop("checked", "true"); // Rating seteado

                    if (response.ratingData.client.rating != 0) {
                        $("#commentRating").show();
                        eventsInfo.rating.first = false;
                        eventsInfo.rating.oldRating = response.ratingData.client.rating;
                    }

                    if (response.ratingData.client.comment !== "") {
                        $(".lastCommentWrap").show();
                        eventsInfo.comment.first = false;
                        eventsInfo.comment.oldComment = response.ratingData.client.comment;
                        $(".lastComment").html(response.ratingData.client.comment + '<i class="fa fa-pencil" aria-hidden="true"></i>');
                    }

                    if (response.ratingData.totalClients > 5) {
                        $(".totalClients").html(response.ratingData.totalClients); // Clientes Totales
                        $(".averageRating").html(response.ratingData.averageRating);
                        for (var property in response.ratingData.totalRating) {
                            if (response.ratingData.totalRating.hasOwnProperty(property)) {
                                $(".rating-bar-" + property).css("width", response.ratingData.totalRating[property] + "%");
                            }
                        }
                    } else {
                        $(".ratingInfo").hide();
                        $(".no-info").show();
                    }

                    if (response.ratingData.averageRating < 3 && response.ratingData.averageRating != 0 ) {
                        $(".trusnav-logo").attr("src","img/tn-red.svg");
                        $(".isTrusted").text("Untrusted Site!");
                    }

                    $(".bars").addClass("width-transation");
                }
            });
        } else {
            $(".ratingInfo").hide();
            $(".no-info").html("The rate on this site is not allowed");
            $(".no-info").show();
        }
    });
}
