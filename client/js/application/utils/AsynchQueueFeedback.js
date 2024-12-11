import {poolReturn} from "./PoolUtils.js";

let activeEntries = [];
import {MATH} from "../MATH.js";

class AsynchQueueFeedback {
    constructor() {
        this.key = null;
    }

    initQueueEntry(key, queue) {
        this.key = key;
        activeEntries.push(this)
        console.log(activeEntries.length)
        return activeEntries;
    }

    closeQueueEntry() {
        MATH.splice(activeEntries, this);
        console.log(activeEntries.length)
        poolReturn(this);
        if (activeEntries.length < 3) {
            if (activeEntries[0]) {
                console.log(activeEntries[0].key)
            } else {
                console.log(activeEntries)
            }

        }
    }

}

export { AsynchQueueFeedback }