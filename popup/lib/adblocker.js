var backgroundPage = ext.backgroundPage.getWindow();
var require = backgroundPage.require;

var Filter = require("filterClasses").Filter;
var FilterStorage = require("filterStorage").FilterStorage;
var checkWhitelisted = require("whitelisting").checkWhitelisted;
var getDecodedHostname = require("url").getDecodedHostname;

var page = null;

function onLoad() {
    ext.pages.query({
        active: true,
        lastFocusedWindow: true
    }, function(pages) {
        page = pages[0];
        if (!page || (page.url.protocol != "http:" && page.url.protocol != "https:"))
            document.body.classList.add("local");
        else
        if (!require("filterComposer").isPageReady(page)) {
            document.body.classList.add("nohtml");
            require("messaging").getPort(window).on("composer.ready", function(message, sender) {
                if (sender.page.id == page.id){
                    document.body.classList.remove("nohtml");
                }
            });
        }

        if (page) {
            actions.run();
            if (checkWhitelisted(page)){
                document.body.classList.add("disabled");
                document.body.classList.add("allDisabled");
            }

            page.sendMessage({ type: "composer.content.getState" }, function(response) {
                if (response && response.active){
                    document.body.classList.add("clickhide-active");
                }
            });
        }

        ext.backgroundPage.sendMessage({ type: "safari.contentBlockingActive" }, function(contentBlockingActive) {
            if (contentBlockingActive){
                document.body.classList.add("contentblocking-active");
            }
        });
    });

    FilterStorage.isAllWhitelist = function(){
        var flagWhiteList = false;
        FilterStorage.subscriptions.forEach(function(subscription){
            if(subscription && subscription.defaults && subscription.defaults[0] == "whitelist"){
                subscription.filters.forEach(function(filter){
                    if(filter && filter.text == "@@||*^$document"){
                        flagWhiteList = true;
                    }
                });
            }
        });
        return flagWhiteList;
    }

    $("#enabled").click(toggleEnabled);
    document.getElementById("allEnabled").addEventListener("click", toggleAllEnabled, false);
}

function toggleEnabled() {
    var disabled = $('#enabled').data('checked');
    if (!disabled) {
        var host = getDecodedHostname(page.url).replace(/^www\./, "");
        var filter = Filter.fromText("@@||" + host + "^$document");
        FilterStorage.addFilter(filter);
    } else {
        var filter = checkWhitelisted(page);
        if(filter){
            FilterStorage.removeFilter(filter);
        }
    }
}

function toggleAllEnabled() {
    var disabled = $('#allEnabled').is(':checked');
    var filter = Filter.fromText("@@||" + "*" + "^$document");
    if (!disabled) {
        FilterStorage.addFilter(filter);
    } else {
        FilterStorage.removeFilter(filter);
    }
}

document.addEventListener("DOMContentLoaded", onLoad, false);
