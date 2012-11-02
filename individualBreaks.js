function addIndivBreakField() {
    var initialFrom = minValues[activeLayer];
    var initialTo = maxValues[activeLayer];

    if (breakCount > 0) {
        initialFrom = document.getElementById("breakTo" + (breakCount)).value;
        initialTo = parseInt(document.getElementById("breakTo" + (breakCount)).value);

        var d = document.getElementById("td" + breakCount);
        var olddiv = document.getElementById("addBtn" + breakCount);
        d.removeChild(olddiv);

        var rembtn = document.createElement("input");
        rembtn.setAttribute("type", "image");
        rembtn.setAttribute("id", "rembtn" + (breakCount));
        rembtn.setAttribute("onclick", "remIndivBreakField(" + breakCount + ")");
        rembtn.setAttribute("src", "images/close20.png");
        d.appendChild(rembtn);
    }

    breakCount++;
    var breaksList = document.getElementById("Breaks");

    var breakEntry = document.createElement("tr");
    breakEntry.setAttribute("id", "tr" + breakCount);

    var breakFieldFrom = document.createElement("td");
    breakFieldFrom.innerHTML = '<input type="text" class="range" style="width:50px;" id="breakFrom' + breakCount + '" value="' + initialFrom + '"></input>';
    breakEntry.appendChild(breakFieldFrom);

    var breakFieldTo = document.createElement("td");
    breakFieldTo.innerHTML = '<input type="text" class="range" style="width:50px;" id="breakTo' + breakCount + '" value="' + initialTo + '"></input>';
    breakEntry.appendChild(breakFieldTo);

    var breakColor = document.createElement("td");
    breakColor.innerHTML = '<input class="color" id="cp' + breakCount + '" onchange="colorChange(' + breakCount + ')" style="width:50px;">';
    breakEntry.appendChild(breakColor);


    var addBreak = document.createElement("td");
    addBreak.setAttribute("id", "td" + breakCount);
    addBreak.innerHTML = '<input type="image" src="images/plus20.png" id="addBtn' + breakCount + '" onclick="addIndivBreakField()" >';
    breakEntry.appendChild(addBreak);


    breaksList.appendChild(breakEntry);


    jscolor.init();


}

function remIndivBreakField(count) {
    var d = document.getElementById("Breaks");
    var olddiv = document.getElementById("tr" + count);
    d.removeChild(olddiv);

}
