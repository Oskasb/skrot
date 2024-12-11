import {MATH} from "../MATH.js";
import {detachConfig, parseConfigDataKey, saveAdventureEdits} from "./ConfigUtils.js";

let count = 0;

function generateNodeId(nodeCfg, adventure) {
    count++
    let nodeId = 'node_'+count+'_'+new Date().getTime();
    return nodeId;
}

function addNodeToAdventureAtPos(adventure, pos) {
    let nodeCfg = {
        pos : [0, 0, 0],
        node_type:""
    }
    MATH.vec3ToArray(pos, nodeCfg.pos, 10);
    adventure.config.nodes.push(nodeCfg);
    nodeCfg.node_id = generateNodeId(nodeCfg, adventure);
    saveAdventureEdits(adventure);
}

function saveAdventureNodeEdit(node) {
    let adventure = node.call.getAdventure();
    adventure.config = detachConfig(adventure.config)
    saveAdventureEdits(adventure)
}


export {
    generateNodeId,
    addNodeToAdventureAtPos,
    saveAdventureNodeEdit
}