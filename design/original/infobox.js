var infobox = null;

function showInfobox(x, y, info) {
    infobox.style.left = x + "px";
    infobox.style.top = y + "px";

    if (info.nolabel) {
        infobox.textContent = info.nolabel;
    }

    infobox.classList.add("show");
}

function hideInfobox() {
    infobox.classList.remove("show");
    infobox.textContent = "";
}

var infoboxTimeout = null;

function addInfoboxSupport(div) {
    var INFOBOX_DELAY_MS = 500;

    var lastPosition = {
        x: 0,
        y: 0
    };

    function handleMouseOver(ev) {
        var INFOBOX_OFFSET_PX = 25;

        infoboxTimeout && clearTimeout(infoboxTimeout);
        infoboxTimeout = setTimeout(function() {
            showInfobox(lastPosition.x, lastPosition.y + INFOBOX_OFFSET_PX, { nolabel: div.dataset.title });
        }, INFOBOX_DELAY_MS);
    }
    function handleMouseLeave(ev) {
        if (ev.target !== div) { return }

        infoboxTimeout && clearTimeout(infoboxTimeout);
        infoboxTimeout = null;
        hideInfobox();
    }
    function handleMouseMove(ev) {
        lastPosition.x = ev.x;
        lastPosition.y = ev.y;
    }

    div.addEventListener("mouseover", handleMouseOver);
    div.addEventListener("mouseleave", handleMouseLeave);
    div.addEventListener("mousemove", handleMouseMove);
}

function initInfobox(container) {
    infobox = document.createElement("div");
    infobox.className = "infobox";
    container.appendChild(infobox);
}