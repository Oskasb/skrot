class InputActionListener {

    constructor() {
        this.pressedButtons = [0, 0];

        this.inputAction = [0, 0];

        this.buttons = {
            RIGHT: 'RIGHT',
            LEFT: 'LEFT',
            MIDDLE: 'MIDDLE'
        };

        this.events = {
            touchstart: 'touchstart',
            touchend: 'touchend',
            touchmove: 'touchmove',
            mousedown: 'mousedown',
            mouseup: 'mouseup',
            mouseout: 'mouseout',
            click: 'click'
        };
    }

    handleElementMouseEvent = function (eventType, button, inputStore) {
        switch (button) {
            case this.buttons.RIGHT:

                switch (eventType) {
                    case this.events.mousedown:
                        this.pressedButtons[1] = 1;
                        break;
                    case this.events.mouseup:
                        this.pressedButtons[1] = 0;
                        break;
                    case this.events.mouseout:
                        break;
                    case this.events.click:
                        break;
                }

                break;
            case this.buttons.LEFT:
                switch (eventType) {
                    case this.events.mousedown:
                        this.pressedButtons[0] = 1;
                        break;
                    case this.events.mouseup:
                        this.pressedButtons[0] = 0;
                        break;
                    case this.events.click:
                        break;
                }
                break;
            case this.buttons.MIDDLE:
                switch (eventType) {
                    case this.events.mousedown:
                        this.pressedButtons[0] = 1;
                        this.pressedButtons[1] = 1;
                        break;
                    case this.events.mouseup:
                        this.pressedButtons[0] = 0;
                        this.pressedButtons[1] = 0;
                        break;
                    case this.events.click:
                        break;
                }
                break;
        }
    };

    handleMouseEvt = function (evt) {
        let _this = this;
        let clickType = this.buttons.LEFT;
        if (evt.which) {
            if (evt.which === 3) clickType = this.buttons.RIGHT;
            if (evt.which === 2) clickType = this.buttons.MIDDLE;
        } else if (evt.button) {
            if (evt.button === 2) clickType = this.buttons.RIGHT;
            if (evt.button === 4) clickType = this.buttons.MIDDLE;
        }
        _this.handleElementMouseEvent(evt.type, clickType)
    };

    setupElementInputListener = function (element, callUpdate, pState) {
        let _this = this;

        let handleMouseEvent = function (e) {
            //	e.stopPropagation();
            let evt = (e == null ? event : e);
            _this.handleMouseEvt(evt);
            pState.mouse.action[0] = this.pressedButtons[0];
            pState.mouse.action[1] = this.pressedButtons[1];
            callUpdate(pState.mouse);
        }.bind(this);

        element.addEventListener(this.events.mouseup, handleMouseEvent);
        element.addEventListener(this.events.click, handleMouseEvent);
        element.addEventListener(this.events.mousedown, handleMouseEvent);
        element.addEventListener(this.events.mouseout, handleMouseEvent);

    };
}

export { InputActionListener }