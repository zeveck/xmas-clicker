var workProgressDiv = document.querySelector('.work-progress');
var workProgressBar = workProgressDiv.querySelector('.progress-bar');
var workProgressTextLight = workProgressDiv.querySelector('.progress-text');
var workProgressTextDark = workProgressBar.querySelector('.progress-text');

var prestigeProgressDiv = document.querySelector('.prestige-progress');
var prestigeProgressBar = prestigeProgressDiv.querySelector('.progress-bar');
var prestigeProgressTextLight = prestigeProgressDiv.querySelector('.progress-text');
var prestigeProgressTextDark = prestigeProgressBar.querySelector('.progress-text');

var workProgress = 0;
var workRequired = 100;

var workCompletedCallback = function() {};

function setWorkCompletedCallback(callback) {
    workCompletedCallback = callback;
}

function addWorkProgress(amountToAdd) {
    var toy = gameData.toys[gameData.selectedToy];
    toy.progress += amountToAdd;
    while (toy.progress >= toy.workRequired) {
        toy.progress -= toy.workRequired;
        workCompletedCallback();
    }
    var percentCompleted = Math.round(((toy.progress / toy.workRequired)) * 100);
    updateWorkProgressBar(percentCompleted);
    return percentCompleted;
}

function updateWorkProgressBar(percentCompleted) {
    workProgressBar.style.width = percentCompleted + "%";
    workProgressTextLight.textContent = percentCompleted + "%";
    workProgressTextDark.textContent = percentCompleted + "%";
}

function updatePrestigeProgressBar(percentCompleted) {
    prestigeProgressBar.style.width = percentCompleted + "%";
    prestigeProgressTextLight.textContent = percentCompleted + "%";
    prestigeProgressTextDark.textContent = percentCompleted + "%";
}
