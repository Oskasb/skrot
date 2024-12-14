import {poolFetch, poolReturn} from "./PoolUtils.js";

let activeEntries = [];
let queueFeedback = null;
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
        if (queueFeedback === null) {
            queueFeedback = poolFetch('DomQueueNotice');
            this.statusMap.activeEntries = activeEntries;
            queueFeedback.call.activate(this.statusMap)
        }
    //     console.log(activeEntries.length)
        return activeEntries;
    }

    closeQueueEntry() {
        MATH.splice(activeEntries, this)
    //    console.log(activeEntries.length)
        poolReturn(this);
    //    this.domNotice.call.close()
        if (activeEntries.length < 3) {
            if (activeEntries[0]) {
                console.log(activeEntries[0].key)
            } else {
                console.log(activeEntries)
                if (queueFeedback !== null) {
                //    queueFeedback.call.close()
                //    queueFeedback = null;
                }
            }

        }
    }

}

export { AsynchQueueFeedback }