function addFloatingScoreBonusEffect(x, y, numberOfPoints, container) {
    var DELTA_Y = 100;

    var bonusEffectDiv = document.createElement("div");
    bonusEffectDiv.className = "floating-score-bonus";
    bonusEffectDiv.textContent = "+" + numberOfPoints;
    bonusEffectDiv.style.left = x + "px";
    bonusEffectDiv.style.top = y + "px";
    bonusEffectDiv.addEventListener("click", function(ev) {
       ev.preventDefault();
    });
    bonusEffectDiv.addEventListener("dragstart", function(ev) {
        ev.preventDefault();
    });

    container.appendChild(bonusEffectDiv);

    setTimeout(function() {
        bonusEffectDiv.style.transition = "1.5s";
        bonusEffectDiv.style.top = (y - DELTA_Y) + "px";
        bonusEffectDiv.style.opacity = "0";

        setTimeout(function() {
            container.removeChild(bonusEffectDiv);
        }, 500);
    }, 0);
}