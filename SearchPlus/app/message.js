class Message {

    constructor(method, action, content) {
        this.method = method;
        this.action = action;
        this.content = content;
    }

    toPacket() {
        return {method: this.method,
                action: this.action,
                content: this.content};
    }

    fromPacket(packet) {
        this.method = packet.method;
        this.action = packet.action;
        this.content = packet.content;
        return this;
    }

    sendToTab() {
        this.responsePromise = new Promise((resolve, conflict) => {
            chrome.tabs.query({active: true, currentWindow: true}, tabs => {
                chrome.tabs.sendMessage(tabs[0].id, this.toPacket(), response => {
                    resolve(response);
                });
            });
        });
        return this;
    }

    then(callback) {
        this.responsePromise.then(callback);
        return this;
    }

    catch(callback) {
        this.responsePromise.catch(callback);
        return this;
    }
}
