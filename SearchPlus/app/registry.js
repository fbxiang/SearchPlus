class ModeRegistry {

    constructor() {
        this.registry = {};
    }

    register(modeObj, id) {
        this.registry[id] = modeObj;
    }

    getMode(id) {
        return this.registry[id];
    }
}

let modeRegistry = new ModeRegistry();
let getModeById = id => modeRegistry.getMode(id);
