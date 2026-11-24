var selectedToolDiv = document.querySelector(".selected-tool");
var toolImg = selectedToolDiv.querySelector(".selected-tool-image");
var scoreDisplay = document.querySelector(".score-display");
var toolbox = document.querySelector('.toolbox');
var toybox = document.querySelector('.toybox');

var clickCounter = 0;
var SCORE_WIDTH = 10;

updateScoreDisplay();

function updateScoreDisplay() {
    scoreDisplay.textContent = prefixToLengthWithLeadingZeroes(clickCounter);
}

function addClick(debug) {
    var clickIncrement = 1;
    if (debug) { clickIncrement = 50 }
    clickCounter += clickIncrement;
    updateScoreDisplay();
    updateSelectedToyProgress(addWorkProgress(clickIncrement));
}

function handleToyCompleted() {
    setTimeout(function() {
        toolImg.style.transition = "0.5s";
        toolImg.style.transform = "rotate(360deg)";

        setTimeout(function() {
            toolImg.style.transition = "";
            toolImg.style.transform = "rotate(0deg)";
        }, 500);
    }, 0);

    ++gameData.toys[gameData.selectedToy].count;
    updateToyCount(gameData.selectedToy);

    var toyPrestige = gameData.toys[gameData.selectedToy].prestige;
    addPrestigeProgress(toyPrestige);
}
setWorkCompletedCallback(handleToyCompleted);

function handlePrestigeLevelUp() {
    unlockToy(gameData.prestige.level);
}
setPrestigeLevelUpCallback(handlePrestigeLevelUp);

selectedToolDiv.addEventListener("mousedown", function(ev) {
    addClick(ev.ctrlKey);
    addFloatingScoreBonusEffect(ev.pageX - selectedToolDiv.offsetLeft - 10,
        ev.pageY - selectedToolDiv.offsetTop - 10,
        ev.ctrlKey ? 50 : 1, selectedToolDiv);
    ev.preventDefault();
});

toolImg.addEventListener("dragstart", function(ev) { ev.preventDefault() });

initInfobox(document.body);
initItems(toolbox, toybox);