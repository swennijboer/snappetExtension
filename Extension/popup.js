function onWindowLoad() {
    document.getElementById('print').addEventListener('click', function () {
        printClicked();
    });

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

function printClicked() {
    var radios = document.getElementsByName('lesson');

    var itemSelected = false;
    for (var i = 0; i < radios.length; i++) {
        if (radios[i].checked) {
            var les = radios[i].value;
            itemSelected = true;
        }
    }

    if (!itemSelected) {
        alert('Kies een item uit de lijst met lessen');
    }

    else {
        // Start generating the PDF
        var columns = ["Naam", "Score (%)", "Aantal opgaven"];
        var doc = new jsPDF('p', 'pt');
        var splitTitle = doc.splitTextToSize(title, 530);

        // If any other option than 'geen les toevoegen' is selected, we add the lesson to the header of the PDF
        if (les != 'Geen les toevoegen') {
            splitTitle.unshift(les);
        }

        var date = new Date();
        var printedOn = "Geprint op " + date.getDate() + '-' + (date.getMonth() + 1) + '-' + date.getFullYear() + ' om ' + date.getHours() + ':' + date.getMinutes();

        starty = 65 + splitTitle.length * 13;
        doc.autoTable(columns, docdata,
            {
                startY: starty,
                addPageContent: function (data) {
                    doc.text(splitTitle, 40, 60);

                    doc.text(printedOn, 50, 820);
                },
                createdCell: function (cell, opts) {
                    var ability = docdata[opts.row.index][1];

                    if (ability >= 0 && ability < 21 && opts.column.index == 1) {
                        //cell.styles.fillColor = "#c71717";
                        cell.styles.fillColor = [199, 23, 23];
                    }

                    if (ability >= 20 && ability < 41 && opts.column.index == 1) {
                        // cell.styles.fillColor = "#e95f15";
                        cell.styles.fillColor = [233, 95, 21];
                    }

                    if (ability >= 40 && ability < 61 && opts.column.index == 1) {
                        // cell.styles.fillColor = "#f6cf19";
                        cell.styles.fillColor = [246, 207, 25];
                    }

                    if (ability >= 60 && ability < 81 && opts.column.index == 1) {
                        // cell.styles.fillColor = "#9dcd1c";
                        cell.styles.fillColor = [157, 205, 28];
                    }

                    if (ability >= 80 && ability < 101 && opts.column.index == 1) {
                        // cell.styles.fillColor = "#6d8e13";
                        cell.styles.fillColor = [109, 142, 19];
                    }
                }
            });
        doc.save('data.pdf');

        // Can be removed later, we will generate a PDF and open it in a new tab. For now easy for debugging
        message.innerText = "Done";
    }
}

// Event listener, when we send a message we want this function to receive it and handle it
chrome.runtime.onMessage.addListener(function(request, sender) {
    if (request.action == "getSource") {
        // We now have the full source of the page
        var source = request.source;

        // TODO: Check if the data is snappet or a wrong page, might have to be done slightly later than this, but you get the idea

        // First we get the name of the page
        var sourceCopy = source;
        title = sourceCopy.split("<div class=\"heading\"")[1];
        title = title.split("title=\"")[1];
        title = title.split("\"")[0];

        // Lets get to the interesting part, after var option the javascript with the student data is saved
        // first we want to inspect the pupils part
        var data = source.split('var options');
        data = data[1].split('pupils');
        var segment = data[1].split("");        // Make an character array from the string

        // Get the pupil data
        var save = false;                       // If true we save the part that we see to a variable, otherwise we don't
        var doorgaan = true;                    // We stop the loop when this turns to false -> so when we have reached the end of the student name part
        pupils = "";                            // We save the pupil data to this variable (will later be converted to the respective JSON object)

        for(var i = 0; i < segment.length && doorgaan; i++) {
            if (segment[i] == '{') {save = true;}

            if (save) {pupils += segment[i];}

            if (segment[i] == "}") {save = false; doorgaan = false;}
        }


        // Get the lesson data
        lessonData = data[2];                       // We save the part in which the lesson data is saved, we will need this later
        lessonData = lessonData.split("lessons")[1];
        // The lessons are saved as [{lesson1}, {lesson2}, {lessonX}], so we need the part within the []
        lessonData = lessonData.split('[')[1];
        lessonData = lessonData.split(']')[0];
        lessonData = lessonData.split('}');
        for (var t = 0; t < lessonData.length - 1; t++) {
            // Because we split on the }, we have to add it back everywhere
            lessonData[t] = lessonData[t] + '}';

            // Every item except the first starts with ',', we want to remove this ','
            if(t>0){
                lessonData[t] = lessonData[t].substr(1);
            }

            // Finally we convert the item to an element
            lessonData[t] = JSON.parse(lessonData[t]);

            var fullSectionName = lessonData[t]['fullSectionName']. split(',');
            var lessonName = lessonData[t]['lesson'];
            lessonData[t] = fullSectionName[0] + "," + fullSectionName[1] + ", " + lessonName;
        }
        lessonData.pop();
        lessonData.push('Geen les toevoegen');
        lessonData.sort();


        // Get the progress per pupil data
        data = data[1].split("progressPerPupil")[1];   // Get to the part where student progress is saved
        progress = extractEnclosedJson(data);

        // We now have all the data, we will add them to get the pupil info and their score together
        pupils = JSON.parse(pupils);
        progress = JSON.parse(progress);

        var keys = Object.keys(pupils);                             // All keys of the students, so we can access them like an array
        docdata = [];                                               // Preparing array for document data
        for(var c = 0; c < keys.length; c++) {
            var pupil = pupils[keys[c]];                            // Select the current student
            var score = progress[keys[c]];                          // Select the score info for the current student

            var naam = pupil[2] + ', ' + pupil[0];                  // Make the student name -> lastName, firstName
            var ability = score['abilityPercent'];                  // Ability percentage of the student
            var questions = score['answersCount'];                  // Amount of answered questions

            docdata.push([naam, ability, questions]);
        }

        docdata.sort();                                             // Make sure that the array is sorted by name


        // We will now make the form where the user can select the lesson
        var textHeader = '<form action="">';

        var textBody = '';
        for(var t = 0; t < lessonData.length; t++) {
            textBody = textBody + '<input type="radio" name="lesson" value="' + lessonData[t] + '"> ' + lessonData[t] + '<br>';
        }

        var textFooter = '</form>';

        message.innerHTML = textHeader + textBody + textFooter;
    }
});

/**
 * Finds the JSON within a piece of text, the JSON can contain multiple { {}, {}, {}}
 * @param data
 * @returns {string}
 */
extractEnclosedJson = function(data){
    // We want to find the first opening bracket
    var arrayToFindJSONIn = data.split("");                 // Character array again
    var positionInText = 0;
    while (arrayToFindJSONIn[positionInText] != "{") {
        positionInText++;
    }
    positionInText++;                                       // We manually add the first { by increasing i and setting open to 1

    var countOfOpenBrackets = 1;                            // We manually added the first { so we set the counter to 1
    var resultingJSONString = "{";                                // Here we manually add the first {

    // From here we continue to look in the text, while we have not yet closed all brackes we add the text (and keep track of the amount of open/closed {})
    for(; positionInText < arrayToFindJSONIn.length && countOfOpenBrackets > 0; positionInText++) {
        if (arrayToFindJSONIn[positionInText] == '{') {countOfOpenBrackets++;}

        resultingJSONString += arrayToFindJSONIn[positionInText];

        if (arrayToFindJSONIn[positionInText] == "}") {countOfOpenBrackets--;}
    }

    return resultingJSONString;
}

window.onload = onWindowLoad;