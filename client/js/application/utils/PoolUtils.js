import { ExpandingPool } from "./ExpandingPool.js";
import {VegetationPatch} from "../../3d/three/terrain/vegetation/VegetationPatch.js";
import {Plant} from "../../3d/three/terrain/vegetation/Plant.js";
import {GuiScreenSpaceText} from "../ui/gui/widgets/GuiScreenSpaceText.js";
import {SpatialTransition} from "./SpatialTransition.js";
import { WorldActorStatusUI } from "../ui/gui/systems/WorldActorStatusUI.js";
import {HtmlElement} from "../ui/dom/HtmlElement.js";
import {ScalarTransition} from "./ScalarTransition.js";
import {AsynchQueueFeedback} from "./AsynchQueueFeedback.js";
import {Vector3} from "../../../../libs/three/math/Vector3.js";
import {DomQueueNotice} from "../ui/dom/DomQueueNotice.js";

let pools = {}
let stats = {};

function initPools() {

    registerPool(VegetationPatch);
    registerPool(Plant);
    registerPool(Vector3);
    registerPool(GuiScreenSpaceText);

    registerPool(SpatialTransition);

    registerPool(WorldActorStatusUI);
    registerPool(HtmlElement);
    registerPool(ScalarTransition);
    registerPool(AsynchQueueFeedback);
    registerPool(DomQueueNotice);
}

function registerPool(DataObj) {

    let dataKey = DataObj.name;

    if (pools[dataKey]) {
    //    console.log("Pool already registered", dataKey)
    } else {
        let createFunc = function(key, cb) {
            cb(new DataObj())
        }
        pools[dataKey] = new ExpandingPool(dataKey, createFunc)
    }
}

let fetched = null;
let fetcher = function(entry) {
    fetched = entry;
}

function poolFetch(dataKey) {
   // if (!pools[dataKey])

    pools[dataKey].getFromExpandingPool(fetcher)
    let entry = fetched;
    fetched = null;
    if (!entry) {
        console.log("fetcher() is giving nothing... fix!")
    }
    entry.poolFetched = true;
    return entry;
}

function poolReturn(entry) {
    if (entry === null) {
        console.log("null entry returned to pool, assume double tap")
        return;
    }
    pools[entry.constructor.name].returnToExpandingPool(entry)
}

function poolStats(dataKey, store) {
    if (!store) store = stats;
    let expPool = pools[dataKey]
    store.size = expPool.poolEntryCount();
    store.added = expPool.count.added;
    store.active = expPool.count.active
}

export {
    initPools,
    registerPool,
    poolFetch,
    poolReturn,
    poolStats
}