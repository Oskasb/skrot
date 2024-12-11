let cache = {};
let poolList = [];
let poolKeys = [];
let track = null;
let biggestPool = 0;
let pools = []
let mostAdded = 0;
let trackPool = function(expandingPool) {
    let size = expandingPool.poolEntryCount()

    track.passive += size;
    if (size > biggestPool) {
        biggestPool = size;
        track.big = expandingPool.dataKey;
        track.bigSize = size;
    }

    if (mostAdded < expandingPool.count.added) {
        mostAdded = expandingPool.count.added;
        track.mostAdd = mostAdded;
        track.addId =  expandingPool.dataKey;
    }
}

let updatePoolTracking = function() {
    track.passive = 0;
    biggestPool = 0;
    mostAdded = 0;
    for (let i = 0; i < pools.length; i++) {
        trackPool(pools[i])
    }
    track.active = track.added - track.passive;
}

class ExpandingPool {
    constructor(dataKey, createFunc) {

        pools.push(this);

        if (!cache['DEBUG']) {
            cache = PipelineAPI.getCachedConfigs();
            if (!cache['DEBUG']) {
                cache.DEBUG = {};
            }
        }
        if (!cache['DEBUG']['POOLS']) {
            cache.DEBUG.POOLS = {
                added:0,
                pools: 0,
                passive: 0,
                active: 0,
                big: dataKey,
                bigSize: 0,
                poolKeys:poolKeys,
                poolList:poolList,
                addId:'_',
                mostAdd:0
            };
            setTimeout(function() {
                ThreeAPI.addPrerenderCallback(updatePoolTracking)
            }, 5000);

        }

        this.dataKey = dataKey;
        track = cache.DEBUG.POOLS
        track.pools++
        poolKeys.push(dataKey)
        this.pool = [];
        poolList.push(this.pool)

        this.count = {
            added:0,
            active:0
        }

        this.generatePoolEntry = function(callback) {
            track.added++
            this.count.added++
            createFunc(dataKey, callback)
        }.bind(this);

    };

    poolEntryCount = function() {
        return this.pool.length
    };

    pushEP = function(entry) {
        return this.pool.push(entry);
    };

    shiftEP = function() {
        return this.pool.shift()
    };

    getFromExpandingPool = function(callback) {
        this.count.active++
        if (this.poolEntryCount() !== 0) {
            callback(this.shiftEP());
        } else {
            this.generatePoolEntry(callback)
        }
    };

    returnToExpandingPool = function(entry) {
        this.count.active--
        if (this.pool.indexOf(entry) === -1) {
            this.pushEP(entry)
        } else {
        //    console.log("Entry already in pool, no good!", entry)
        }
    };


}

export { ExpandingPool }