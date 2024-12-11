import {ENUMS} from "../ENUMS.js";
import {ItemRecipe} from "../../game/gamepieces/ItemRecipe.js";
import {getItemConfigs} from "./ActorUtils.js";

let resourceHierarchyConfig;

let recipes = {};

function applyResourceHierarchy(cfg) {
    resourceHierarchyConfig = cfg;
}


function generateItemRecipe(templateId, config) {
   return new ItemRecipe(templateId, config, resourceHierarchyConfig)
}

function getItemRecipe(item, recipeCallback) {
    if (!item.config) {
        console.log("No config for item:", item)
        return;
    }
    let config = item.config;
    let templateId = item.getStatus(ENUMS.ItemStatus.TEMPLATE);
    return initRecipeByItemConfig(templateId, config, recipeCallback)
}

function initRecipeByItemConfig(templateId, config, recipeCallback) {
    if (resourceHierarchyConfig) {

        if (!recipes[templateId]) {
            recipes[templateId] = generateItemRecipe(templateId, config);
        }
        if (recipes[templateId].item) {
            if (typeof (recipeCallback) === 'function') {
                recipeCallback(recipes[templateId].item)
            }
        }
        return recipes[templateId];
    } else {
        console.log("resourceHierarchyConfig not found", config);
    }
}

function initRecipeByTemplateId(templateId, cb) {
    let configs = getItemConfigs();
    let cfg = configs[templateId];
    initRecipeByItemConfig(templateId, cfg, cb);
}

export {
    applyResourceHierarchy,
    getItemRecipe,
    generateItemRecipe,
    initRecipeByTemplateId,
    initRecipeByItemConfig
}