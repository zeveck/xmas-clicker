// Expects global "gameData" variable.

var selectedTool = document.querySelector(".selected-tool");
var selectedToolImg = selectedTool.querySelector(".selected-tool-image");

var selectedToy = document.querySelector(".selected-toy");
var selectedToyImg = selectedToy.querySelector(".selected-toy-image");
var selectedToyProgressOverlay = selectedToy.querySelector(".progress-overlay");

var toolDivs = [];
var toyDivs = [];

var ITEM_COUNT_WIDTH = 4;

function addItem(item, itemCssClass, container, index) {
    var itemDiv = document.createElement("div");
    itemDiv.className = "item";
    itemDiv.classList.add(itemCssClass);
    itemDiv.dataset.title = item.name;
    itemDiv.dataset.index = index;
    itemDiv.addEventListener("click", handleItemClicked);
    addInfoboxSupport(itemDiv);

    itemDiv.dataset.locked = item.locked;
    if (!item.locked) {
        itemDiv.classList.add("unlocked");
    }

    if (item.selected) {
        itemDiv.classList.add("selected");
    }

    var itemImg = document.createElement("img");
    itemImg.className = "item-image";
    itemImg.src = item.imgPath;
    itemDiv.appendChild(itemImg);

    var lockedOverlayDiv = document.createElement("div");
    lockedOverlayDiv.className = "locked-overlay";
    itemDiv.appendChild(lockedOverlayDiv);

    if (item.count !== undefined) {
        itemDiv.classList.add("item-with-count");
        var itemCountDiv = document.createElement("div");
        itemCountDiv.className = "item-count";
        itemCountDiv.textContent = prefixToLengthWithLeadingZeroes(item.count, ITEM_COUNT_WIDTH);
        itemDiv.appendChild(itemCountDiv);
    }

    var lockImg = document.createElement("img");
    lockImg.className = "lock-image";
    lockImg.src = gameData.lockImage;
    lockedOverlayDiv.appendChild(lockImg);

    var progressOverlayDiv = document.createElement("div");
    progressOverlayDiv.className = "progress-overlay";
    itemImg.appendChild(progressOverlayDiv);

    container.appendChild(itemDiv);

    return itemDiv;
}

function handleItemClicked(ev) {
    if (this.dataset.locked === "true") {
        var EMPHASIZE_LOCK_LENGTH_MS = 2000;
        this.classList.add("emphasize-lock");

        setTimeout(function() {
            this.classList.remove("emphasize-lock");
        }.bind(this), EMPHASIZE_LOCK_LENGTH_MS);

        return;
    }

    if (this.classList.contains("toy")) {
        handleToyIconClicked.bind(this)(ev);
    } else if (this.classList.contains("tool")) {
        handleToolIconClicked.bind(this)(ev);
    }
}

function handleToyIconClicked(ev) {
    var toyIndex = this.dataset.index;
    setSelectedToy(toyIndex);
}

function handleToolIconClicked(ev) {
    console.log("TOOL ICON CLICKED");
}

function setSelectedTool(toolIndex) {
    toolDivs[gameData.selectedTool].classList.remove("selected");
    gameData.tools[gameData.selectedTool].selected = false;
    toolDivs[toolIndex].classList.add("selected");
    gameData.tools[toolIndex].selected = true;
    gameData.selectedTool = toolIndex;
    selectedToolImg.src = gameData.tools[gameData.selectedTool].imgPath;
}

function setSelectedToy(toyIndex) {
    toyDivs[gameData.selectedToy].classList.remove("selected");
    gameData.toys[gameData.selectedToy].selected = false;
    toyDivs[toyIndex].classList.add("selected");
    gameData.toys[toyIndex].selected = true;
    gameData.selectedToy = toyIndex;
    selectedToyImg.src = gameData.toys[gameData.selectedToy].imgPath;

    var percentCompleted = Math.round(((gameData.toys[toyIndex].progress / gameData.toys[toyIndex].workRequired)) * 100);
    updateWorkProgressBar(percentCompleted);
    updateSelectedToyProgress(percentCompleted);
}

function updateSelectedToyProgress(percentCompleted) {
    selectedToyProgressOverlay.style.height = (100 - percentCompleted) + "%";
}

function initItems(toolbox, toybox) {
    const LINE_BREAK_TOOLBOX = 2;
    const LINE_BREAK_TOYBOX = 5;

    gameData.tools.forEach(function(tool, i) {
        toolDivs.push(addItem(tool, "tool", toolbox, i));
        if (i === (LINE_BREAK_TOOLBOX - 1)) {
            toolbox.appendChild(document.createElement("br"));
        }
    });
    setSelectedTool(gameData.selectedTool);

    gameData.toys.forEach(function(toy, i) {
        toyDivs.push(addItem(toy, "toy", toybox, i));
        if (i === (LINE_BREAK_TOYBOX - 1)) {
            toybox.appendChild(document.createElement("br"));
        }
    });
    setSelectedToy(gameData.selectedToy);
}

function unlockToy(toyIndex) {
    var UNLOCK_DELAY_MS = 3000;

    gameData.toys[toyIndex].locked = false;
    toyDivs[toyIndex].dataset.locked = false;

    toyDivs[toyIndex].classList.add("unlock-effect");

    setTimeout(function() {
        toyDivs[toyIndex].classList.remove("unlock-effect");
        toyDivs[toyIndex].classList.add("unlocked");
    }, UNLOCK_DELAY_MS);
}

function unlockTool(toolIndex) {
}

function updateToyCount(toyIndex) {
    var itemCountDiv = toyDivs[toyIndex].querySelector(".item-count");
    if (itemCountDiv) {
        itemCountDiv.textContent = prefixToLengthWithLeadingZeroes(gameData.toys[toyIndex].count, ITEM_COUNT_WIDTH);
    }
}