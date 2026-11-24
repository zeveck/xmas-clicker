function prefixToLengthWithLeadingZeroes(value, targetLength) {
    var valueDisplay = value.toString();
    while (valueDisplay.length < targetLength) {
        valueDisplay = "0" + valueDisplay;
    }
    return valueDisplay;
}