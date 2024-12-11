class KeyState {
    constructor(key) {
        this.key = key
        this.press = false;
        this.updateFrame = 0
    }

    updateKeyState(press, frame) {
        this.press = press;
        this.updateFrame = frame;
    }

    pressed() {
        return this.press;
    }

}

export {KeyState}