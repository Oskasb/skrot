
let evt = {}
let _this = evt;

evt.setEventKeys = function(eventKeys) {

        for (let key in eventKeys) {
            _this.setupEvent(eventKeys[key])
        }
    }

evt.camEvt = {
    status_key:'',
    control_key:'',
    activate:false
}


evt.listeners = [];
evt.spliceListeners = [];
evt.evtStatus = {
        activeListeners:0,
        firedCount:0,
        onceListeners:0,
        addedListeners:0
    };

evt.setupEvent = function(event) {

        if (typeof (event) !== 'number') {
            console.log("Old Event: ", event);
            return;
        }

        if (!_this.listeners[event]) {
            _this.listeners[event] = [];
        }
    };


evt.dispatch = function(event, args) {

        while (_this.spliceListeners.length) {
        //    console.log("pre splice listeners", _this.spliceListeners);
            _this.spliceListener(_this.spliceListeners.shift(), _this.spliceListeners.shift())
        }

        for (let i = 0; i < _this.listeners[event].length; i++) {

            if (typeof (_this.listeners[event][i]) !== 'function') {
                console.log("Bad listener", event, _this.listeners);
                return;
            }

            _this.listeners[event][i](args);
        }

        while (_this.spliceListeners.length) {
        //    console.log("post splice listeners", _this.spliceListeners);
            _this.spliceListener(_this.spliceListeners.shift(), _this.spliceListeners.shift())
        }
    _this.evtStatus.firedCount++;
    };

evt.removeListener= function(event, callback, evt) {

        if (!evt.listeners[event]) {
            return;
        }

        if (evt.listeners[event].indexOf(callback) === -1) {
            return;
        }

        evt.spliceListeners.push(evt.listeners[event]);
        evt.spliceListeners.push(callback);
    };

evt.on= function(event, callback) {
    //    _this.setupEvent(event);
    _this.listeners[event].push(callback);
    };

evt.once= function(event, callback) {
    //    _this.setupEvent(event);


        const evtStatus = _this.evtStatus;

        const remove = function() {
            _this.removeListener(event, singleShot,_this);
            evtStatus.onceListeners--;
            if (evtStatus.onceListeners < 0) {
                console.log("remaining singleshots", evtStatus.onceListeners);
            }
        };

        const call = function(args) {
            callback(args);
        };

        const singleShot = function(args) {

            call(args);
            remove();

        };

    _this.evtStatus.onceListeners++;

    _this.on(event, singleShot);
    };

evt.spliceListener= function(listeners, cb) {
        MATH.splice(listeners, cb);
    };

evt.getEventSystemStatus= function() {

    _this.evtStatus.eventCount = 0;
    _this.evtStatus.listenerCount = 0;
        for (const key in _this.listeners) {
            _this.evtStatus.eventCount++;
            _this.evtStatus.listenerCount += _this.listeners[key].length;
        }

        return _this.evtStatus;
    };



export { evt }