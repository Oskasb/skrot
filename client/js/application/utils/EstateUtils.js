import {detachConfig, saveWorldModelEdits} from "./ConfigUtils.js";
import {getPlayerStatus, setPlayerStatus} from "./StatusUtils.js";
import {ENUMS} from "../ENUMS.js";
import {getItemConfigs, getPlayerActor} from "./ActorUtils.js";
import {poolFetch, poolReturn} from "./PoolUtils.js";
import {notifyCameraStatus} from "../../3d/camera/CameraFunctions.js";
import {Item} from "../../game/gamepieces/Item.js";
import {loadItemStatus, saveItemStatus} from "../setup/Database.js";
import {evt} from "../event/evt.js";


function generateModelId(config, pos) {
    let worldLevel = GameAPI.getPlayer().getStatus(ENUMS.PlayerStatus.PLAYER_WORLD_LEVEL)
    ThreeAPI.tempVec3.copy(pos);
    MATH.decimalifyVec3(ThreeAPI.tempVec3, 1); // File Server uses split('.') for file indexing
    return "wmdl_"+worldLevel+"_"+ThreeAPI.tempVec3.x+"_"+ThreeAPI.tempVec3.y+"_"+ThreeAPI.tempVec3.z;
}

function createByTemplate(templateId, pos, callback) {
    console.log("createByTemplate", templateId, pos);
    let loadedTemplates = GameAPI.worldModels.getLoadedTemplates();
    console.log("Selected Model Template ", templateId, loadedTemplates)
    let map = loadedTemplates[templateId];
    let newConfig = detachConfig(map.config);
    newConfig.grid = 1;
    newConfig.on_ground = true;
    newConfig.edit_id = generateModelId(newConfig, pos);
    MATH.vec3ToArray(pos, newConfig.pos, 1);
    let newWmodel = GameAPI.worldModels.addConfigModel(newConfig, newConfig.edit_id , true)
    newWmodel.call.worldModelLodUpdate(0);
    MATH.vec3FromArray(newWmodel.getPos(),  newConfig.pos);
 //   saveWorldModelEdits(newWmodel);

    callback(newWmodel);

    return newConfig;
}

function itemListHasEstateDeed(estate, itemList) {
    let estWorldLevel = estate.call.getStatusWorldLevel();
    let estWPos = estate.call.getStatusPos();
    let checkSum = MATH.stupidChecksumArray(estWPos)

    for (let i = 0; i < itemList.length; i++) {
        let item = GameAPI.getItemById(itemList[i]);
        if (item !== null) {
            if (item.getStatus(ENUMS.ItemStatus.ITEM_TYPE) === ENUMS.itemTypes.DEED) {
                let wLevel = item.getStatus(ENUMS.ItemStatus.WORLD_LEVEL);
                if (wLevel === estWorldLevel) {
                    let deedChecksum = MATH.stupidChecksumArray(item.getStatus(ENUMS.ItemStatus.POS))
                    if (checkSum === deedChecksum) {
                        return estate;
                    }
                }
            }
        }
    }
    return false;
}

function hasEstateDeed(actor, estate) {

    let invItemIDs = actor.getStatus(ENUMS.ActorStatus.INVENTORY_ITEMS);
    let deedEstate = itemListHasEstateDeed(estate, invItemIDs);

    if (deedEstate === false) {
        deedEstate = itemListHasEstateDeed(estate, getPlayerStatus(ENUMS.PlayerStatus.STASH_TAB_HOUSING));
    }

    return deedEstate;
}

function isPlayerManagedEstate(estate) {
    return hasEstateDeed(getPlayerActor(), estate);
}


function estateQualifiesForConstruction(estate, item) {
    let buildingTemplate = item.config['building_template'];
    return estate;
}

function canBuildConstructionKit(item, actor) {
    let iwl = item.getStatus(ENUMS.ItemStatus.WORLD_LEVEL)
    if (iwl !== actor.getStatus(ENUMS.ActorStatus.WORLD_LEVEL)) {
    //    return false;
    }

    let activeEstate = GameAPI.worldModels.getActiveEstateAtPosition(actor.getPos())
    if (!activeEstate) {
        return false;
    } else {
        activeEstate = isPlayerManagedEstate(activeEstate)
        if (activeEstate) {
            let qualifies = estateQualifiesForConstruction(activeEstate, item);
            if (qualifies) {
                return qualifies
            }
        }
    }
    return false;
}


function initActorEstateBuilding(actor, estate, buildingTemplate, buildCallback) {

    let cursor = poolFetch('DomEditCursor')
    let pos = actor.getPos();

    let modelCallback = function(model) {
        model.call.worldModelLodUpdate(0);
        model.preventLod = true;
        let imprintCallback = function(res) {
            console.log("imprintCallback", res)
            setPlayerStatus(ENUMS.PlayerStatus.PLAYER_ZOOM, 0.4);
            buildCallback(model);
        }


        function closeCursor() {
            setPlayerStatus(ENUMS.PlayerStatus.PLAYER_ZOOM, 1);
            newConfig.on_ground = true;
            let box = model.box;
            ThreeAPI.alignGroundToAABB(box);
            model.fitToTerrain();
            model.call.worldModelLodUpdate(0);
            setTimeout(function () {
                model.fitToTerrain();
                setPlayerStatus(ENUMS.PlayerStatus.PLAYER_ZOOM, 0.4);
                model.call.worldModelLodUpdate(0);
                model.imprintWorldModelToGround(imprintCallback)
            }, 500);
            cursor.closeDomEditCursor();
            poolReturn(cursor);
        }

        function clickCursor() {
            newConfig.on_ground = true;
            console.log("Click construction cursor..")
        }
        notifyCameraStatus( ENUMS.CameraStatus.CAMERA_MODE, ENUMS.CameraControls.CAM_EDIT, null)
        setPlayerStatus(ENUMS.PlayerStatus.PLAYER_ZOOM, 14);

        ThreeAPI.getCameraCursor().getLookAroundPoint().copy(pos);
        ThreeAPI.getCameraCursor().getPos().copy(pos);
        cursor.initDomEditCursor(closeCursor, model.obj3d, model.call.applyEditCursorUpdate, clickCursor);
        cursor.statusMap.grid = 1;
        cursor.call.setGrid(1);
    }

    let newConfig = createByTemplate(buildingTemplate, pos, modelCallback)

}

function initEstates() {

}

let deedConfig = {
    "visual_id":"VISUAL_DEED_ESTATE",
    "estate_template": "ITEM_ESTATE_START",
    "status": {
        "ITEM_LEVEL": 0,
        "RARITY": "UNCOMMON",
        "QUALITY": "POOR",
        "TEXT": "This deed qualifies its owner to manage the land within the estate borders."
    }
}

function generateEstateDeed(item, actor) {
    let id = item.getStatus(ENUMS.ItemStatus.ITEM_ID)+'_DEED'
    let estateTemplate = item.getStatus(ENUMS.ItemStatus.TEMPLATE);
    let deedTemplateId = estateTemplate+"_deed";

    let config = detachConfig(deedConfig);
    config['estate_template'] = estateTemplate;
    let status = config['status'];
    status[ENUMS.ItemStatus.NAME]           = item.getStatus(ENUMS.ItemStatus.NAME);
    status[ENUMS.ItemStatus.POS]            = item.getStatus(ENUMS.ItemStatus.POS);
    status[ENUMS.ItemStatus.WORLD_LEVEL]    = item.getStatus(ENUMS.ItemStatus.WORLD_LEVEL);
    status[ENUMS.ItemStatus.SIZE_XYZ]       = item.getStatus(ENUMS.ItemStatus.SIZE_XYZ);
    status[ENUMS.ItemStatus.RARITY]         = item.getStatus(ENUMS.ItemStatus.RARITY);
    status[ENUMS.ItemStatus.QUALITY]        = item.getStatus(ENUMS.ItemStatus.QUALITY);
    status[ENUMS.ItemStatus.ITEM_ID]        = id;
    status[ENUMS.ItemStatus.ITEM_TYPE]      = ENUMS.itemTypes.DEED;
    config = detachConfig(config);
    let deedItem = new Item(deedTemplateId, config)
    deedItem.config = config;
    deedItem.id = id;

    saveItemStatus(deedItem.getStatus());

    function itemLoaded(deed) {
        deed.config = config;

        function iStatusCB(itemStatus) {
            for (let key in itemStatus) {
                deed.setStatusKey(key, itemStatus[key]);
            }
            //    let slot = deed.getStatus(ENUMS.ItemStatus.EQUIPPED_SLOT);
            console.log("Deed Item Loaded ", deed.getStatus(ENUMS.ItemStatus.ITEM_ID), deed.getStatus());
            saveItemStatus(deed.getStatus());
            actor.actorInventory.addInventoryItem(deed);
        }

        loadItemStatus(deed.getStatus(ENUMS.ItemStatus.ITEM_ID), iStatusCB);

    }

    evt.dispatch(ENUMS.Event.LOAD_ITEM,  {id: status[ENUMS.ItemStatus.TEMPLATE], itemId:status[ENUMS.ItemStatus.ITEM_ID], callback:itemLoaded})
 //   actor.actorInventory.addInventoryItem(deedItem);
}


export {
    createByTemplate,
    canBuildConstructionKit,
    isPlayerManagedEstate,
    initActorEstateBuilding,
    initEstates,
    generateEstateDeed
}