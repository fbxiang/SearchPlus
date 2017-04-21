class CommandRegistry {
    constructor() {
        this.registry = {};
    }

    register(id, callback) {
        this.registry[id] = callback;
    }

    getCommand(id) {
        if (this.registry[id])
            return this.registry[id];
        else
            return () => setSearchHint('unknown command');
    }
}

let commandRegistry = new CommandRegistry();
let getCommandById = id => commandRegistry.getCommand(id);

class ModeRegistry {

    constructor() {
        this.registry = {};
    }

    register(modeObj, id) {
        this.registry[id] = modeObj;
        commandRegistry.register(id, () => {
            changeModeTo(id);
            setSearchHint('mode set', 'green');
        });
    }

    getMode(id) {
        return this.registry[id];
    }
}

let modeRegistry = new ModeRegistry();
let getModeById = id => modeRegistry.getMode(id);

