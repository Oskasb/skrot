import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {getPlayerStatus, getSetting, setSetting} from "../../utils/StatusUtils.js";
import {getPlayerActor} from "../../utils/ActorUtils.js";
import {storePlayerStatus} from "../../setup/Database.js";

let htmlElement = null;
let statusMap = {};
let pages = [];

let page0 = {
    label:'GENERAL',
    icon_class:'icon_settings',
    settings:[
    //    {name:'Battle Cam',    key:ENUMS.Settings.BATTLE_CAMERA_MODE, type:'select', list:["CAM_MOVE", "CAM_ENCOUNTER"]},
        {name:'3D Tile Boxes', key:ENUMS.Settings.DRAW_TILE_BOXES, type:'range', min:0, max:1, default:1},
        {name:'3D Pixel Size', key:ENUMS.Settings.RENDER_SCALE, type:'range', min:1, max:8, default:1},
        {name:'Network Random Delay', key:ENUMS.Settings.NETWORK_RANDOM_DELAY, type:'range', min:0, max:1000, default:0},
        {name:'Axis Cam Vertical', key:ENUMS.Settings.CAMERA_VERTICAL, type:'range', min:-100, max:100, default:30},
        {name:'Axis Cam Horizontal', key:ENUMS.Settings.CAMERA_HORIZONTAL, type:'range', min:-100, max:100, default:30},
        {name:'Zoom Strength', key:ENUMS.Settings.ZOOM_STRENGTH, type:'range', min:-100, max:100, default:50},
        {name:'Terrain Range', key:ENUMS.Settings.TERRAIN_RANGE, type:'range', min:0, max:4, default:2},
        {name:'Instance Multiplier', key:ENUMS.Settings.INSTANCE_MULTIPLIER, type:'range', min:1, max:5, default:1},
        {name:'View Distance', key:ENUMS.Settings.VIEW_DISTANCE, type:'range', min:0, max:10, default:1},
        {name:'Vegetation Density', key:ENUMS.Settings.VEGETATION_DENSITY, type:'range', min:1, max:20, default:4},
        {name:'Vegetation Range', key:ENUMS.Settings.VEGETATION_RANGE, type:'range', min:0, max:5, default:2},
        {name:'Adv Auto Select Dist', key:ENUMS.Settings.ADVENTURE_AUTO_SELECT_DISTANCE, type:'range', min:0, max:80, default:2}
    ]
}

let page1 = {
    label:'WORLD CAMERA',
    icon_class:'icon_camera',
    settings:[
        {name:'Auto Behind', key:ENUMS.Settings.CHARACTER_STIFFNESS, type:'range', min:0, max:100, default:5},
        {name:'Elevation', key:ENUMS.Settings.ABOVE_HEIGHT, type:'range', min:-100, max:100, default:10},
        {name:'Look Above', key:ENUMS.Settings.LOOK_ABOVE, type:'range', min:-100, max:100, default:20},
        {name:'Look Ahead', key:ENUMS.Settings.LOOK_AHEAD, type:'range', min:0, max:100, default:15},
        {name:'Stiffness', key:ENUMS.Settings.RIG_STIFFNESS, type:'range', min:0, max:100, default:50},
        {name:'Ground Min', key:ENUMS.Settings.CAMERA_TERRAIN_MIN, type:'range', min:0, max:100, default:20},
        {name:'Overcompensate', key:ENUMS.Settings.ROTATION_COMPENSATION, type:'range', min:-100, max:100, default:50},
        {name:'Collide Push', key:ENUMS.Settings.OBSTRUCTION_REACTIVITY, type:'range', min:0, max:100, default:100},
        {name:'Collide Pierce', key:ENUMS.Settings.OBSTRUCTION_PENETRATION, type:'range', min:0, max:100, default:50},
        {name:'Zoom Max', key:ENUMS.Settings.ZOOM_MAX, type:'range', min:0, max:100, default:60},
        {name:'Zoom Min', key:ENUMS.Settings.ZOOM_MIN, type:'range', min:0, max:100, default:10}
    ]
}

let page2 = {
    label:'FLiGHT CAMERA',
    icon_class:'icon_camera_flight',
    settings:[
        {name:'Look Above', key:ENUMS.Settings.FLIGHT_LOOK_ABOVE, type:'range', min:-100, max:100, default:50},
        {name:'Look Ahead', key:ENUMS.Settings.FLIGHT_LOOK_AHEAD, type:'range', min:0, max:100, default:50},
        {name:'Elevation', key:ENUMS.Settings.FLIGHT_ELEVATION, type:'range', min:-100, max:100, default:50},
        {name:'Stiffness', key:ENUMS.Settings.FLIGHT_STIFFNESS, type:'range', min:0, max:100, default:50},
        {name:'Throttle Influence', key:ENUMS.Settings.THROTTLE_INFLUENCE, type:'range', min:0, max:100, default:50},
        {name:'Roll Influence', key:ENUMS.Settings.ROLL_INFLUENCE, type:'range', min:0, max:100, default:50},
        {name:'Pitch Influence', key:ENUMS.Settings.PITCH_INFLUENCE, type:'range', min:0, max:100, default:50},
        {name:'Yaw Influence', key:ENUMS.Settings.YAW_INFLUENCE, type:'range', min:0, max:100, default:50},
        {name:'Slack', key:ENUMS.Settings.FLIGHT_ROTATION_COMPENSATION, type:'range', min:-100, max:100, default:50}
    ]
}

let page3 = {
    label:'DEBUG RENDER',
    icon_class:'icon_paper_note',
    settings:[
        {name:'ACTIVE', key:ENUMS.Settings.DEBUG_VIEW_ACTIVE, type:'range', min:0, max:1, default:0},
        {name:'Attachment Joints', key:ENUMS.Settings.DEBUG_VIEW_ATTACHMENTS, type:'range', min:0, max:1, default:0},
        {name:'Lod Tests', key:ENUMS.Settings.DEBUG_VIEW_LOD_TESTS, type:'range', min:0, max:1, default:0},
        {name:'Terrain Queries', key:ENUMS.Settings.DEBUG_VIEW_TERRAIN_QUERIES, type:'range', min:0, max:1, default:0},
        {name:'Skeletons', key:ENUMS.Settings.DEBUG_VIEW_SKELETONS, type:'range', min:0, max:1, default:0},
        {name:'Physics Ray Casts', key:ENUMS.Settings.DEBUG_VIEW_RAYCASTS, type:'range', min:0, max:1, default:0},
        {name:'Physics Kinematics', key:ENUMS.Settings.DEBUG_VIEW_PHYSICS_KINEMATICS, type:'range', min:0, max:1, default:0},
        {name:'Physics Sensors', key:ENUMS.Settings.DEBUG_VIEW_PHYSICS_SENSORS, type:'range', min:0, max:1, default:0},
        {name:'Physics AABBS', key:ENUMS.Settings.DEBUG_VIEW_PHYSICS_AABBS, type:'range', min:0, max:1, default:0},
        {name:'Performance Stats', key:ENUMS.Settings.DEBUG_VIEW_PERFORMANCE, type:'range', min:0, max:1, default:0},
        {name:'System Status', key:ENUMS.Settings.DEBUG_VIEW_STATUS, type:'range', min:0, max:1, default:0}
    ]
}

let page4 = {
    label:'PHYSICS',
    icon_class:'USE',
    settings:[
        {name:'Physical Debris', key:ENUMS.Settings.PHYSICAL_DEBRIS, type:'range', min:0, max:800, default:45},
        {name:'Debris Range', key:ENUMS.Settings.DEBRIS_RANGE, type:'range', min:3, max:50, default:12},
        {name:'Debris Scale Min', key:ENUMS.Settings.DEBRIS_SCALE_MIN, type:'range', min:1, max:10, default:4},
        {name:'Debris Scale Max', key:ENUMS.Settings.DEBRIS_SCALE_MAX, type:'range', min:5, max:20, default:7},
        {name:'Debris Deform', key:ENUMS.Settings.DEBRIS_DEFORM, type:'range', min:0, max:10, default:3},
        {name:'Kick Probe Count', key:ENUMS.Settings.ACTOR_INFLUENCE_PROBES, type:'range', min:0, max:10, default:2},
        {name:'Kick Probe Reach', key:ENUMS.Settings.ACTOR_INFLUENCE_REACH,  type:'range', min:1, max:20, default:3},
        {name:'Kick Probe Power', key:ENUMS.Settings.ACTOR_INFLUENCE_POWER,  type:'range', min:1, max:50, default:10},
        {name:'Physics VFX Intensity', key:ENUMS.Settings.PHYSICS_VFX_INTENSITY,  type:'range', min:0, max:20, default:3}


    ]
}

let page5 = {
    label:'CONTROLS',
    icon_class:'icon_joystick',
    settings:[
        {name:'Battle Buttons', key:ENUMS.Settings.BATTLE_BUTTON_LAYER, type:'range', min:0, max:1, default:1},
        {name:'Battle Button Size', key:ENUMS.Settings.BATTLE_BUTTON_SCALE, type:'range', min:-100, max:100, default:0},
        {name:'Battle Point Move', key:ENUMS.Settings.BATTLE_POINT_MOVE, type:'range', min:0, max:1, default:0},

        {name:'Stick Offset X', key:ENUMS.Settings.OFFSET_CONTROL_STICK_X, type:'range', min:-100, max:100, default:45},
        {name:'Stick Offset Y', key:ENUMS.Settings.OFFSET_CONTROL_STICK_Y, type:'range', min:-100, max:100, default:12},
    ]
}

let page6 = {
    label:'CHAT',
    icon_class:'TALK',
    settings:[
        {name:'Chat position X',    key:ENUMS.Settings.OFFSET_CHAT_X,       type:'range', min:-100, max:100, default:0},
        {name:'Chat position Y',    key:ENUMS.Settings.OFFSET_CHAT_Y,       type:'range', min:-100, max:100, default:0},
        {name:'Chat scale',         key:ENUMS.Settings.CHAT_SCALE,          type:'range', min:-100, max:100, default:0},
    ]
}

let page7 = {
    label:'UI',
    icon_class:'CRAFT',
    settings:[
        {name:'Minimap pos X',      key:ENUMS.Settings.OFFSET_MINIMAP_X,    type:'range', min:-100, max:100, default:0},
        {name:'Minimap pos Y',      key:ENUMS.Settings.OFFSET_MINIMAP_Y,    type:'range', min:-100, max:100, default:0},
        {name:'Minimap scale',      key:ENUMS.Settings.SCALE_MINIMAP,       type:'range', min:-100, max:100, default:0},
        {name:'Adventures pos X',   key:ENUMS.Settings.OFFSET_ADVENTURES_X, type:'range', min:-100, max:100, default:0},
        {name:'Adventures pos Y',   key:ENUMS.Settings.OFFSET_ADVENTURES_Y, type:'range', min:-100, max:100, default:0},
        {name:'Adventures scale',   key:ENUMS.Settings.SCALE_ADVENTURES,    type:'range', min:-100, max:100, default:0},
        {name:'Right bar pos X',    key:ENUMS.Settings.OFFSET_RBAR_X,       type:'range', min:-100, max:100, default:0},
        {name:'Right bar pos Y',    key:ENUMS.Settings.OFFSET_RBAR_Y,       type:'range', min:-100, max:100, default:0},
        {name:'Right bar scale',    key:ENUMS.Settings.SCALE_RBAR,          type:'range', min:-100, max:100, default:0},
    ]
}

pages.push(page0)
pages.push(page1)
pages.push(page2)
pages.push(page3)
pages.push(page4)
pages.push(page5)
pages.push(page6)
pages.push(page7)
let settingContainers = [];

let activePage = null;

function attachSettingControl(parent, setting, htmlElem) {
    let key = setting.key;

    let box = DomUtils.createDivElement(parent, 'box_'+key, '', 'control_container height_024');

    if (statusMap[key] === null) {
        statusMap[key] = setting.default;
    }

    let iHtml = '<h3>'+setting.name+'</h3>';
    if (setting.type === 'range') {
        iHtml +=  '<input id='+key+" type="+setting.type+" value="+statusMap[key]+" min="+setting.min+" max="+setting.max+'>'
        iHtml +=  '<p id='+key+'_value>'+statusMap[key]+'</p>'
    } else if (setting.type === 'select') {

        iHtml +=  '<select name='+setting.name+' id='+setting.key+'></select>';
        iHtml +=  '<h2 id='+key+'_value>'+statusMap[key]+'</h2>'
        setTimeout(function() {
            htmlElem.call.populateSelectList(key, setting.list)
        }, 100)
    }

    DomUtils.createDivElement(box, 'container_' + key, iHtml, 'slider_container');
    settingContainers.push(box);



}

function activatePage(page) {
    if (activePage!== null) {
        DomUtils.removeElementClass(activePage.buttonDiv, 'bar_button_active')
    }
    console.log('activatePage', page);
    let pageName = htmlElement.call.getChildElement('page_name');
    pageName.innerHTML = page.label;
    activePage = page;
    DomUtils.addElementClass(page.buttonDiv, 'bar_button_active');
    DomUtils.clearDivArray(settingContainers);
    let dynamicContainer = htmlElement.call.getChildElement('dynamic_container');
    for (let i = 0; i < page.settings.length; i++) {
        attachSettingControl(dynamicContainer, page.settings[i], htmlElement)
    }


}

function attachPageSelectionButton(page, parent, pageIndex) {
    let buttonDiv = DomUtils.createDivElement(parent, 'select_page_'+pageIndex, '<p>'+page.label+'</p>>', 'bar_button');
    DomUtils.addElementClass(buttonDiv, page.icon_class);
    page.buttonDiv = buttonDiv;
    function selectPage() {
        activatePage(page);
    }

    DomUtils.addClickFunction(buttonDiv, selectPage);

}

function onReady() {
    activePage = null;
    let leftTopBar = htmlElement.call.getChildElement('left_bar_top');
    for (let i = 0; i < pages.length;i++) {
        attachPageSelectionButton(pages[i], leftTopBar, i);
    }
    activatePage(pages[0])
}

function update() {
    for (let key in statusMap) {
        if (key !== 'init') {
            let value = getSetting(key);
            if (value !== statusMap[key]) {
                setSetting(key, statusMap[key])
            }
        }
    }
}

class DomSettings {
    constructor() {

        for (let key in ENUMS.Settings) {
            statusMap[key] = getSetting(key);
        }
        console.log("Settings StatusMap", statusMap)
    }

    initDomSettings(closeCb) {
        if (htmlElement !== null) {
            console.log("DomSettings not properly closed before opening...", this);
        }
        htmlElement = poolFetch('HtmlElement')
        htmlElement.initHtmlElement('settings', closeCb, statusMap, 'settings_frame', onReady);
    //    this.htmlElement.hideOtherRootElements();
        ThreeAPI.registerPrerenderCallback(update);
    }

    closeDomSettings() {
    //    this.htmlElement.revealHiddenRootElements();
        htmlElement.closeHtmlElement();
        poolReturn(htmlElement);
        htmlElement = null;
        ThreeAPI.unregisterPrerenderCallback(update);
    }

}

export { DomSettings }