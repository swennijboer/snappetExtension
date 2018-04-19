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
        var uitvoer = "Done";    //Can be removed later

        // We now have the full source of the page
        var source = request.source;

        // Lets get to the interesting part, after var option the javascript with the student data is saved
        var data = source.split('var options');
        var segment = data[1].split("");        // Make an character array from the string

        // Within segment we will search for pupils, once pupils is found, take everything behind it between { and } (is correct JSON)
        var i = 0;                              // We define this early because we also want to use it in the second loop
        var save = false;                       // If true we save the part that we see to a variable, otherwise we don't
        var pupils = "";                        // We save the pupil data to this variable (will later be converted to the respective object)
        for(; i < segment.length && save; i++){
            alert(segment[i]);
            if (segment[i] == '{') {save = true; alert("hio");}

            if (save) {pupils += segment[i];}

            if (segment[i] == "}") {save = false;}
        }
        uitvoer = pupils;

        // Continue where the last reader stopped, and search for progressPerPupil, here { } is used within so keep a counter of number of opened and closed ones


        // Can be removed later, we will generate a PDF and open it in a new tab. For now easy for debugging
        message.innerText = uitvoer;
    }
});

window.onload = onWindowLoad;