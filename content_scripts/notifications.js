$(document).ready(function() {
    if (!inIframe()) {
        var url = new URL(window.location.href);
        var domain = parseDomain(url.hostname);

        sendMessage({
            'action' : 'checkUrl',
            'domain' : domain
        },function(isSameDomain) {
            if (!isSameDomain) {

            }
            console.log(isSameDomain);
        });

        sendMessage({
            'action' : 'getRating',
            'domain' : domain,
        }, function(response) {
            if (response && response.ratingData && response.ratingData.totalClients >= 5) {

                if (response.ratingData.averageRating < 3 && response.ratingData.averageRating != 0) {

                    $("body").prepend("<iframe name='trustnav_iframe' id='trustnav_iframe' style='border:0; border-radius:2px; width:400px; height:130px;'></iframe>");

                    var html = getFrameHtml('../popup/noTrustedNotification.html');
                    var doc = document.getElementById('trustnav_iframe').contentWindow.document;

                    doc.open();
                    doc.write(html);
                    doc.close();

                }

            }
        });
    }
});

function getFrameHtml(htmlFileName) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET", chrome.extension.getURL(htmlFileName), false);
    xmlhttp.send();

    return xmlhttp.responseText;
}


function parseDomain(domain) {
    var protocolArr = ['https://', 'http://', 'www.'];
    protocolArr.forEach(function (index, i) {
        if (domain.search(protocolArr[i]) === 0) {
            domain = domain.replace(index, '');
        }
    });
    return domain;
}

function inIframe () {
    try {
        return window.self !== window.top;
    } catch (e) {
        return true;
    }
}

function sendMessage(){
    chrome.extension.sendRequest.apply(null, arguments);
}
