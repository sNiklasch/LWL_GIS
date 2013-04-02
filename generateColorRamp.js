function interpolate(pBegin, pEnd, pStep, pMax) {
    if (pBegin < pEnd) {
        return ((pEnd - pBegin) * (pStep / pMax)) + pBegin;
    } else {
        return ((pBegin - pEnd) * (1 - (pStep / pMax))) + pEnd;
    }

}

function generateColor(theColorBegin, theColorEnd, theNumSteps) {
    var colorArray = new Array();
    theColorBegin = parseInt(theColorBegin, 16);
    theColorEnd = parseInt(theColorEnd, 16);

    theR0 = (theColorBegin & 0xff0000) >> 16;
    theG0 = (theColorBegin & 0x00ff00) >> 8;
    theB0 = (theColorBegin & 0x0000ff) >> 0;
    theR1 = (theColorEnd & 0xff0000) >> 16;
    theG1 = (theColorEnd & 0x00ff00) >> 8;
    theB1 = (theColorEnd & 0x0000ff) >> 0;

    for (i = 0; i <= theNumSteps; i++) {
        theR = interpolate(theR0, theR1, i, theNumSteps);
        theG = interpolate(theG0, theG1, i, theNumSteps);
        theB = interpolate(theB0, theB1, i, theNumSteps);
        theVal = (((theR << 8) | theG) << 8) | theB;
        colorArray[i] = theVal.toString(16);
        console.log(theVal.toString(16));
    }
    return colorArray;
}
