class Mode {
    constructor(options) {
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

    onEscape() {
        return true;
    }

    onKeyDown(key) {
        return true;
    }
}

class ModeSearch extends Mode {
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

class ModeNav extends ModeSearch {

    onTextChange() {
        let text = $('#search-text').val();
        new Message('post', 'nav', text)
            .sendToTab()
            .then(response => {
                console.log('search response:', response);
                setSearchHint(response);
            });
    }

    onEscape() {
        changeModeTo('nav-esc');
        return false;
    }
}

class ModeMulti extends ModeSearch {

    onTextChange() {
        let text = $('#search-text').val();
        new Message('post', 'multi', text)
            .sendToTab()
            .then(response => {
                console.log('search response:', response);
                setSearchHint(response);
            });
    }
}

class ModeCode extends Mode {
    onInit() {
        $('#textarea-container').css('height', '200px');
    }

    onQuit() {
        $('#textarea-container').css('height', '42px');
    }

    onShiftEnter() {
        let text = $('#search-text').val();
        new Message('post', 'code', text)
            .sendToTab()
            .then(response => {
                setSearchText('');
                setSearchHint(response);
            });
        return false;
    }
}

class ModeNavEsc extends ModeSearch {
    onInit() {
        $('body').css('opacity', 0.5);
    }

    onQuit() {
        $('body').css('opacity', 1);
    }

    onKeyDown(key) {
        console.log(key, String.fromCharCode(key));
        switch (String.fromCharCode(key)) {
        case 'J':
            new Message('post', 'scroll', 'down').sendToTab();
            break;
        case 'K':
            new Message('post', 'scroll', 'up').sendToTab();
            break;
        case 'H':
            new Message('post', 'scroll', 'left').sendToTab();
            break;
        case 'L':
            new Message('post', 'scroll', 'right').sendToTab();
            break;
        case 'A':
            changeModeTo('nav');
            break;
        }
        return false;
    }

    onTextChange() {
        super.onTextChange();
        changeModeTo('nav');
    }

    onEscape() {
        changeModeTo('nav');
        return true;
    }
}
