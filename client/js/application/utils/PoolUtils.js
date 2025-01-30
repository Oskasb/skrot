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
import {ModelAsset} from "../../3d/three/assets/ModelAsset.js";
import {ModelMaterial} from "../../3d/three/assets/ModelMaterial.js";
import {ModelGeometry} from "../../3d/three/assets/ModelGeometry.js";
import {AssetInstance} from "../../3d/three/assets/AssetInstance.js";
import {AssetTexture} from "../../3d/three/assets/AssetTexture.js";
import {ControllablePiece} from "../../game/pieces/ControllablePiece.js";
import {DomFlightstick} from "../ui/dom/ui/DomFlightstick.js";
import {DomYawPedals} from "../ui/dom/ui/DomYawPedals.js";
import {DomSweep} from "../ui/dom/ui/DomSweep.js";
import {DomGear} from "../ui/dom/ui/DomGear.js";
import {DomPower} from "../ui/dom/ui/DomPower.js";
import {OceanSplash} from "../../3d/three/water/OceanSplash.js";
import {NodeParticleEmitter} from "../../3d/three/fx/NodeParticleEmitter.js";
import {NodeParticleSpawner} from "../../3d/three/fx/NodeParticleSpawner.js";
import {TerrainForestSection} from "../../game/world/woods/TerrainForestSection.js";
import {ForestTreeLodable} from "../../game/world/woods/ForestTreeLodable.js";

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
    registerPool(ModelAsset);
    registerPool(ModelMaterial);
    registerPool(ModelGeometry);
    registerPool(AssetInstance);
    registerPool(AssetTexture);
    registerPool(ControllablePiece)
    registerPool(DomFlightstick)
    registerPool(DomYawPedals)
    registerPool(DomSweep)
    registerPool(DomGear)
    registerPool(DomPower)
    registerPool(OceanSplash)
    registerPool(NodeParticleEmitter);
    registerPool(NodeParticleSpawner);
    registerPool(TerrainForestSection);
    registerPool(ForestTreeLodable);
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