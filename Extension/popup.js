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

// Event listener, when we send a message we want this function to receive it and handle it
chrome.runtime.onMessage.addListener(function(request, sender) {
    if (request.action == "getSource") {

        // We now have the full source of the page
        var source = request.source;

        // Lets get to the interesting part
        var data = source.split('var options');

        // Within segment we will search for pupils, once pupils is found, take everything behind it between { and } (is correct JSON)
        var segment = data[1];
        var pupils = "Get DEM PUPILS";

        // Continue where the last reader stopped, and search for progressPerPupil, here { } is used within so keep a counter of number of opened and closed ones


        // Can be removed later, we will generate a PDF and open it in a new tab. For now easy for debugging
        message.innerText = source;
    }
});

window.onload = onWindowLoad;