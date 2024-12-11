import {KeyState} from "./KeyState.js";

let keyStates = {};
let frame = 0;
function updateKeyState(key, press, event) {
    console.log(key, press);
    if (!keyStates[key]) {
        keyStates[key] = new KeyState(key);
    }
    keyStates[key].updateKeyState(press, frame);
}

function updateKeyboardFrame(f) {
    frame = f;
}
    function getKeyStates() {
        return keyStates;
    }

    function isPressed(key) {
        if (!keyStates[key]) {
            keyStates[key] = new KeyState(key);
        }
        return keyStates[key].pressed();
    }


export {
    updateKeyboardFrame,
    updateKeyState,
    getKeyStates,
    isPressed
}