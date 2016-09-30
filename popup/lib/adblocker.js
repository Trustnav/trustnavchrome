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

    document.getElementById("enabled").addEventListener("click", toggleEnabled, false);
}

function toggleEnabled() {
    var disabled = document.body.classList.toggle("disabled");
    if (disabled) {
        var host = getDecodedHostname(page.url).replace(/^www\./, "");
        var filter = Filter.fromText("@@||" + host + "^$document");
        if (filter.subscriptions.length && filter.disabled)
            filter.disabled = false;
        else {
            filter.disabled = false;
            FilterStorage.addFilter(filter);
        }
    } else {
        var filter = checkWhitelisted(page);
        while (filter) {
            FilterStorage.removeFilter(filter);
            if (filter.subscriptions.length)
                filter.disabled = true;
            filter = checkWhitelisted(page);
        }
    }
}

document.addEventListener("DOMContentLoaded", onLoad, false);