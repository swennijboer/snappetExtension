function onWindowLoad() {

    // We set a var to access the inner content of the message div on the main extension page
    var message = document.querySelector('#message');

    // Params (tab id, script to inject, callback funcion)
    chrome.tabs.executeScript(null, {
        file: "getPagesSource.js"
    }, function() {
        // Is called after the script has been executed
        // If you try and inject into an extensions page or the webstore/NTP you'll get an error
        if (chrome.runtime.lastError) {
            message.innerText = 'There was an error injecting script : \n' + chrome.runtime.lastError.message;
        }
    });
}

chrome.runtime.onMessage.addListener(function(request, sender) {
    if (request.action == "getSource") {
        message.innerText = request.source;
    }
});

window.onload = onWindowLoad;