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
        // first we want to inspect the pupils part
        var data = source.split('var options');
        data = data[1].split('pupils');
        var segment = data[1].split("");        // Make an character array from the string

        // Within segment we will search for pupils, once pupils is found, take everything behind it between { and } (is correct JSON)
        var save = false;                       // If true we save the part that we see to a variable, otherwise we don't
        var doorgaan = true;                    // We stop the loop when this turns to false -> so when we have reached the end of the student name part
        var pupils = "";                        // We save the pupil data to this variable (will later be converted to the respective JSON object)

        for(var i = 0; i < segment.length && doorgaan; i++) {
            if (segment[i] == '{') {save = true;}

            if (save) {pupils += segment[i];}

            if (segment[i] == "}") {save = false; doorgaan = false;}
        }




        // Search for progressPerPupil, here { } is used within so keep a counter of number of opened and closed ones
        var i = 0;
        data = data[1].split("progressPerPupil");   // Get to the part where student progress is saved
        segment = data[1].split("");                // Character array again

        // We want to find the first opening bracket
        while (segment[i] != "{") {
            i++;
        }
        i++;                                        // We manually add the first { by increasing i and setting open to 1

        var open = 1;
        var progress = "{";

        for(; i < segment.length && open > 0; i++) {
            if (segment[i] == '{') {open++;}

            progress += segment[i];

            if (segment[i] == "}") {open--;}
        }



        // We have now got the pupil info and the progress for each pupil, so now we can generate the PDF

        pupils = JSON.parse(pupils);
        progress = JSON.parse(progress);
        alert("hoi");






        // Can be removed later, we will generate a PDF and open it in a new tab. For now easy for debugging
        message.innerText = uitvoer;
    }
});

window.onload = onWindowLoad;