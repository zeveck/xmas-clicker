var DEFAULT_GAME_DATA = {
    tools: [
        { name: "Cheap Hammer", imgPath: "img/tool-level2.png", locked: false, selected: false, cost: 0 },
        { name: "Heavy Hammer", imgPath: "img/tool-level3.png", locked: true, selected: false, cost: 1000 },
        { name: "Supreme Hammer", imgPath: "img/tool-level4.png", locked: true, selected: false, cost: 5000 },
        { name: "Thor's Hammer", imgPath: "img/tool-level10.png", locked: true, selected: false, cost: 10000 }
    ],
    toys: [
        { name: "Wooden Tractor", imgPath: "img/toy-slot0.png",
            workRequired: 10, progress: 0, prestige: 5, value: 10, locked: false, selected: false, count: 0, cost: 0 },
        { name: "Yo-yo", imgPath: "img/toy-slot1.png",
            workRequired: 20, progress: 0, prestige: 10, value: 10, locked: true, selected: false, count: 0, cost: 0 },
        { name: "Puzzle Cube", imgPath: "img/toy-slot2.png",
            workRequired: 30, progress: 0, prestige: 15, value: 20, locked: true, selected: false, count: 0, cost: 0 },
        { name: "Wooden Sword", imgPath: "img/toy-slot5.png",
            workRequired: 50, progress: 0, prestige: 20, value: 30, locked: true, selected: false, count: 0, cost: 0 },
        { name: "Sketch An Etch", imgPath: "img/toy-slot4.png",
            workRequired: 40, progress: 0, prestige: 25, value: 50, locked: true, selected: false, count: 0, cost: 0 },
        { name: "Fidget Spinner", imgPath: "img/toy-slot6.png",
            workRequired: 60, progress: 0, prestige: 50, value: 5, locked: true, selected: false, count: 0, cost: 0 },
        { name: "Chess", imgPath: "img/toy-slot7.png",
            workRequired: 70, progress: 0, prestige: 25, value: 100, locked: true, selected: false, count: 0, cost: 0 },
        { name: "Super Game System", imgPath: "img/toy-slot8.png",
            workRequired: 80, progress: 40, prestige: 75, value: 300, locked: true, selected: false, count: 0, cost: 0 },
        { name: "Bike", imgPath: "img/toy-slot9.png",
            workRequired: 90, progress: 0, prestige: 50, value: 500, locked: true, selected: false, count: 0, cost: 0 },
        { name: "Smartphone", imgPath: "img/toy-slot10.png",
            workRequired: 100, progress: 0, prestige: 100, value: 1000, locked: true, selected: false, count: 0, cost: 0 }
    ],
    selectedTool: 0,
    selectedToy: 0,
    prestige: {
        progress: 0,
        neededForNextLevel: 0,
        level: 0,
        total: 0
    },
    prestigeLevels: [
        { title: "Assistant Junior Toy Maker", cost: 0 },
        { title: "Junior Toy Maker", cost: 100 },
        { title: "Assistant Toy Maker", cost: 500 },
        { title: "Pretty Good Toy Maker", cost: 1000 },
        { title: "Crafty Toy Maker", cost: 5000 },
        { title: "Master Toy Maker", cost: 10000 },
        { title: "Senior Master Toy Maker", cost: 25000 },
        { title: "Principal Toy Maker", cost: 50000 },
        { title: "Assistant Toy Officer", cost: 100000 },
        { title: "Chief Toy Officer", cost: 1000000 }
    ],
    lockImage: "img/lock.png"
};

window.gameData = JSON.parse(JSON.stringify(DEFAULT_GAME_DATA));
function validateGameData(gameData) {
    gameData.prestige.neededForNextLevel = gameData.prestigeLevels[gameData.prestige.level + 1].cost;

    // TODO
}
validateGameData(gameData);