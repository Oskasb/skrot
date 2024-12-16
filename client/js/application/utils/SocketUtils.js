let socket;


function handleMessage(msg) {
    console.log("Socket Message: ", msg);
}

function setupSocket() {
    let host = location.origin.replace(/^http/, 'ws');
    let pings = 0;


    socket = new WebSocket(host);
    socket.responseCallbacks = {};

    socket.onopen = function (event) {
        console.log("Socket Open", event)
    };

    socket.onclose = function (event) {
        console.log("Socket Closed", event)
    };

    socket.onmessage = function (message) {
        let msg = JSON.parse(message.data)
        handleMessage(msg);
    };

    socket.onerror = function (error) {
        console.log('WebSocket error: ' + error);
    };

}

export {
    setupSocket
}

