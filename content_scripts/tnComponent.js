/****************************************************************************************************************************************************************************************************

tnComponent.js

tnComponent.js es un script que sera incrustado en toda url que contenga la palabra "trustnav", de esta mostrara el componente para visualizar la calificacion de las paginas en base a la url

****************************************************************************************************************************************************************************************************/

$(document).ready(function() {
    setTimeout(function () {
        $("#trustnav-website-component").show();
        $(".trustnavChromeInstall").hide();
    }, 500);
});
