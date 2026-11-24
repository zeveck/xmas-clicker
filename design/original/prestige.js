// Expects global "gameData" variable.

// <div class="prestige-display">
//     <div class="prestige-title">Assistant Junior Toy Maker</div>
//     <div class="raw-prestige">00000</div>
// </div>

var prestigeDisplayDiv = document.querySelector(".prestige-display");
var prestigeTitleDiv = prestigeDisplayDiv.querySelector(".prestige-title");
var rawPrestigeDiv = prestigeDisplayDiv.querySelector(".raw-prestige");

var prestigeLevelUpCallback = function() {};

function setPrestigeLevelUpCallback(callback) {
    prestigeLevelUpCallback = callback;
}

function prestigeLevelUp() {
    ++gameData.prestige.level;
    if (gameData.prestige.level > gameData.prestigeLevels.length) {
        return;
    }

    gameData.prestige.progress = 0;
    gameData.prestige.neededForNextLevel = gameData.prestigeLevels[gameData.prestige.level + 1].cost;

    prestigeLevelUpCallback();
}

function updatePrestigeDisplay() {
    var PRESTIGE_SCORE_WIDTH = 7;

    prestigeTitleDiv.textContent = gameData.prestigeLevels[gameData.prestige.level].title;
    rawPrestigeDiv.textContent = prefixToLengthWithLeadingZeroes(gameData.prestige.total, PRESTIGE_SCORE_WIDTH);
}

function addPrestigeProgress(amountToAdd) {
    gameData.prestige.progress += amountToAdd;
    gameData.prestige.total += amountToAdd;

    while (gameData.prestige.progress >= gameData.prestige.neededForNextLevel) {
        prestigeLevelUp();
    }

    var percentCompleted = Math.round((gameData.prestige.progress / gameData.prestige.neededForNextLevel) * 100);
    updatePrestigeProgressBar(percentCompleted);
    updatePrestigeDisplay();
    return percentCompleted;
}

function initPrestige() {
    updatePrestigeDisplay();
}
initPrestige();