import {poolFetch, poolReturn} from "./PoolUtils.js";

let activeEntries = [];
import {MATH} from "../MATH.js";

class AsynchQueueFeedback {
    constructor() {
        this.key = null;
        this.domNotice = null;
        this.statusMap = {}
    }

    initQueueEntry(key, queue) {
        this.key = key;
        activeEntries.push(this)
        console.log(activeEntries.length)
        this.statusMap.key = key;
        this.statusMap.queue = queue;
        this.statusMap.entry = this;
        this.statusMap.activeEntries = activeEntries;
        this.domNotice = poolFetch('DomQueueNotice');
        this.domNotice.call.activate(this.statusMap)
        return activeEntries;
    }

    closeQueueEntry() {
        MATH.splice(activeEntries, this);
        console.log(activeEntries.length)
        poolReturn(this);
        this.domNotice.call.close()
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