import { ExpandingPool } from "./ExpandingPool.js";
import {DynamicGrid} from "../../game/gameworld/DynamicGrid.js";
import {VegetationPatch} from "../../3d/three/terrain/vegetation/VegetationPatch.js";
import {DynamicTile} from "../../game/gameworld/DynamicTile.js";
import {WorldBox} from "../../game/gameworld/WorldBox.js";
import {Plant} from "../../3d/three/terrain/vegetation/Plant.js";
import {VisualTile } from "../../game/visuals/VisualTile.js";
import {ActorAction} from "../../game/actor/ActorAction.js";
import {VisualAction} from "../../game/visuals/VisualAction.js";
import {VisualIndicator} from "../../game/visuals/VisualIndicator.js";
import {Vector3} from "../../../libs/three/math/Vector3.js";
import {GuiScreenSpaceText} from "../ui/gui/widgets/GuiScreenSpaceText.js";
import {PathPoint} from "../../game/gameworld/PathPoint.js";
import {SpatialTransition} from "./SpatialTransition.js";

import { VisualTrajectory } from "../../game/visuals/effects/VisualTrajectory.js";
import { VisualPointFX } from "../../game/visuals/VisualPointFX.js";
import { WorldActorStatusUI } from "../ui/gui/systems/WorldActorStatusUI.js";
import { VisualPulse } from "../../game/visuals/effects/VisualPulse.js";
import { VisualModel } from "../../game/visuals/VisualModel.js";
import {PhysicalModel} from "../../game/gameworld/PhysicalModel.js";
import {PhysicalShape} from "../../game/gameworld/PhysicalShape.js";
import {VisualPieceEffectContinuous} from "../../game/visuals/effects/VisualPieceEffectContinuous.js";
import {VisualPieceEffectTransition} from "../../game/visuals/effects/VisualPieceEffectTransition.js";
import {VisualModelPalette} from "../../game/visuals/VisualModelPalette.js";
import {StatisticalAction} from "../../game/actions/StatisticalAction.js";
import {VisualEngagementIndicator} from "../../game/visuals/effects/VisualEngagementIndicator.js";
import {VisualEngagementArc} from "../../game/visuals/effects/VisualEngagementArc.js";
import {VisualGridBorder} from "../../game/visuals/VisualGridBorder.js";
import {VisualEdgeLine} from "../../game/visuals/effects/VisualEdgeLine.js";
import {HtmlElement} from "../ui/dom/HtmlElement.js";
import {ScalarTransition} from "./ScalarTransition.js";
import {DynamicSpawnPoint} from "../../game/gamescenarios/DynamicSpawnPoint.js";
import {ProceduralEncounterConfig} from "../../game/encounter/ProceduralEncounterConfig.js";
import {DomLootNotice} from "../ui/dom/DomLootNotice.js";
import {DomItem} from "../ui/dom/DomItem.js";
import {DomInventory} from "../ui/dom/DomInventory.js";
import {DomItemCard} from "../ui/dom/DomItemCard.js";
import {DomPalette} from "../ui/dom/DomPalette.js";
import {DomEnvEdit} from "../ui/dom/DomEnvEdit.js";
import {DomEditWorld} from "../ui/dom/DomEditWorld.js";
import {DomEditWorldModel} from "../ui/dom/DomEditWorldModel.js";
import {DomEditCursor} from "../ui/dom/DomEditCursor.js";
import {DomEditTerrain} from "../ui/dom/DomEditTerrain.js";
import {DomEditEncounter} from "../ui/dom/DomEditEncounter.js";
import {DomEditLocation} from "../ui/dom/DomEditLocation.js";
import {VisualEdgeCircle} from "../../game/visuals/effects/VisualEdgeCircle.js";
import {DomEditGrid} from "../ui/dom/DomEditGrid.js";
import {EncounterGrid} from "../../game/encounter/EncounterGrid.js";
import {DomEditSpawns} from "../ui/dom/DomEditSpawns.js";
import {DomEditModel} from "../ui/dom/DomEditModel.js";
import {DomEditAdd} from "../ui/dom/DomEditAdd.js";
import {DomEditConfig} from "../ui/dom/DomEditConfig.js";
import {DomEditValues} from "../ui/dom/DomEditValues.js";
import {DomEditCreate} from "../ui/dom/DomEditCreate.js";
import {DomEditAttach} from "../ui/dom/DomEditAttach.js";
import {DomEditTemplate} from "../ui/dom/DomEditTemplate.js";
import {DomEditString} from "../ui/dom/DomEditString.js";
import {LodTest} from "../../game/visuals/LodTest.js";
import {DomEditActor} from "../ui/dom/DomEditActor.js";
import {DomWorldButtonLayer} from "../ui/dom/DomWorldButtonLayer.js";
import {DomEditEquipment} from "../ui/dom/DomEditEquipment.js";
import {VisualActor} from "../../game/visuals/VisualActor.js";
import {VisualItem} from "../../game/visuals/VisualItem.js";
import {ItemSlot} from "../../game/gamepieces/ItemSlot.js";
import {DomEditAdventure} from "../ui/dom/DomEditAdventure.js";
import {DomEditAdventureNode} from "../ui/dom/DomEditAdventureNode.js";
import {DomEditAdventureNodes} from "../ui/dom/DomEditAdventureNodes.js";
import {AdventureNode} from "../../game/gamescenarios/AdventureNode.js";
import {NodeHost} from "../../game/gamescenarios/NodeHost.js";
import {VisualDestinationPointer} from "../../game/visuals/effects/VisualDestinationPointer.js";
import {DomAdventureNote} from "../ui/dom/DomAdventureNote.js";
import {DomStash} from "../ui/dom/DomStash.js";
import {DebrisModel} from "../../game/gameworld/DebrisModel.js";
import {PhysicalShockwave} from "../physics/PhysicalShockwave.js";


let pools = {}
let stats = {};

function initPools() {
    registerPool(DynamicGrid);
    registerPool(VegetationPatch);
    registerPool(DynamicTile);
    registerPool(WorldBox);
    registerPool(Plant);
    registerPool(VisualTile);
    registerPool(ActorAction);
    registerPool(VisualAction);
    registerPool(VisualIndicator);
    registerPool(Vector3);
    registerPool(GuiScreenSpaceText);
    registerPool(PathPoint);
    registerPool(SpatialTransition);
    registerPool(VisualPointFX);
    registerPool(WorldActorStatusUI);
    registerPool(VisualTrajectory);
    registerPool(VisualPulse);
    registerPool(VisualPieceEffectContinuous);
    registerPool(VisualModel);
    registerPool(PhysicalModel);
    registerPool(PhysicalShape);
    registerPool(VisualPieceEffectTransition);
    registerPool(VisualModelPalette);
    registerPool(StatisticalAction);
    registerPool(VisualEngagementIndicator);
    registerPool(VisualEngagementArc);
    registerPool(VisualGridBorder);
    registerPool(VisualEdgeLine);
    registerPool(HtmlElement);
    registerPool(ScalarTransition);
    registerPool(DynamicSpawnPoint);
    registerPool(ProceduralEncounterConfig);
    registerPool(DomLootNotice)
    registerPool(DomItem)
    registerPool(DomInventory)
    registerPool(DomItemCard)
    registerPool(DomPalette)
    registerPool(DomEnvEdit)
    registerPool(DomEditWorld)
    registerPool(DomEditWorldModel)
    registerPool(DomEditCursor)
    registerPool(DomEditTerrain)
    registerPool(DomEditEncounter)
    registerPool(DomEditAdventure)
    registerPool(DomEditAdventureNode)
    registerPool(DomEditAdventureNodes)
    registerPool(DomEditLocation)
    registerPool(VisualEdgeCircle)
    registerPool(DomEditGrid)
    registerPool(EncounterGrid)
    registerPool(DomEditSpawns)
    registerPool(DomEditModel)
    registerPool(DomEditAdd)
    registerPool(DomEditConfig)
    registerPool(DomEditValues)
    registerPool(DomEditCreate)
    registerPool(DomEditAttach)
    registerPool(DomEditTemplate)
    registerPool(DomEditString)
    registerPool(LodTest)
    registerPool(DomEditActor)
    registerPool(DomWorldButtonLayer)
    registerPool(DomEditEquipment)
    registerPool(VisualActor)
    registerPool(VisualItem)
    registerPool(ItemSlot)
    registerPool(AdventureNode)
    registerPool(NodeHost)
    registerPool(VisualDestinationPointer)
    registerPool(DomAdventureNote)
    registerPool(DomStash)
    registerPool(DebrisModel)
    registerPool(PhysicalShockwave)
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