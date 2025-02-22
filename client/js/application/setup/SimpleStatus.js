import {MATH} from "../MATH.js";


class SimpleStatus {
    constructor(statusValues) {
        this.statusMap = statusValues || {};

        this.onKeyChangeCallbacks = {};

    }

    setStatusKey(key, status) {

        if(this.statusMap[key] !== status) {
            if (this.onKeyChangeCallbacks[key]) {
                MATH.callAll(this.onKeyChangeCallbacks[key], status);
            }
        }

        this.statusMap[key] = status;
    }

    getStatus(key) {
        if (!key) {
            return this.statusMap;
        } if (!this.statusMap[key]) {
            this.setStatusKey(key, 0);
        }
        return this.statusMap[key];
    }

    getStatusByKey(key) {
        if (!key) {
            return this.statusMap;
        }
        return this.statusMap[key];
    }

    addStatusKeyCallback(key, callback) {
        if (!this.onKeyChangeCallbacks[key]) {
            this.onKeyChangeCallbacks[key] = [];
        }
        this.onKeyChangeCallbacks[key].push(callback);
    }

}

export { SimpleStatus }