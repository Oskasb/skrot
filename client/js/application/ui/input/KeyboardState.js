import {KeyState} from "./KeyState.js";


window.document.addEventListener('keydown', function(event) {
    updateKeyState(event.key, true, event);
});

window.document.addEventListener('keyup', function(event) {
    updateKeyState(event.key, false, event);
});

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


function keyToValue(key) {
    if (isPressed(key)) {
        return 1;
    } else {
        return 0;
    }
}

export {
    updateKeyboardFrame,
    updateKeyState,
    getKeyStates,
    isPressed,
    keyToValue
}