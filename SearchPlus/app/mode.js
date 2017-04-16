class Mode {
    constructor(options) {
        this.name = "";
    }

    onInit() {
        return;
    }

    onQuit() {
        return;
    }

    onTextChange() {
        return;
    }

    onEnter() {
        return;
    }

    onShiftEnter() {
        return;
    }

    onCtrlEnter() {
        return;
    }

    onLoad() {
        return;
    }
}

class ModeSearch extends Mode {

    onTextChange() {
        let text = $('#search-text').val();
        new Message('post', 'search', text)
            .sendToTab()
            .then(response => {
                console.log('search response:', response);
                setSearchHint(response);
            });
    }

    onEnter() {
        new Message('post', 'next')
            .sendToTab()
            .then(response => {
                console.log('next response:', response);
                setSearchHint(response);
            });
        return false;
    }

    onShiftEnter() {
        new Message('post', 'prev')
            .sendToTab()
            .then(response => {
                console.log('prev response', response);
                setSearchHint(response);
            });
        return false;
    }

    onCtrlEnter() {
        new Message('post', 'click')
            .sendToTab()
            .then(response => {
                console.log('click response', response);
                setSearchHint('');
                setSearchText('');
            });
        return false;
    }
}

