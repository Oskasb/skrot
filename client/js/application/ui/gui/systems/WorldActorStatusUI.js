import {GuiWidget} from "../elements/GuiWidget.js";
import {poolReturn} from "../../../utils/PoolUtils.js";
import {elementColorMap} from "../../../../game/visuals/Colors.js";
import {statusIcons} from "../../../../game/visuals/Icons.js";
import {ENUMS} from "../../../ENUMS.js";

let trackMap = [
    ENUMS.ActorStatus.SELECTED_ENCOUNTER,
    ENUMS.ActorStatus.REQUEST_PARTY,
    ENUMS.ActorStatus.ACTIVATING_ENCOUNTER,
    ENUMS.ActorStatus.ACTIVATED_ENCOUNTER,
    ENUMS.ActorStatus.EXIT_ENCOUNTER,
    ENUMS.ActorStatus.RETREATING
]

let rgba = {r:1, g:1, b:1, a:1}

function getWidgetByStatus(statusKey, statusWidgets) {
    return statusWidgets[statusKey]
}

let visibleHints = 0;
function updateStatusTracker(statusKey, iconKey, actor, parentElement, statusWidgets, index, selectedActor) {
    let status = actor.getStatus(statusKey)
    let widget = getWidgetByStatus(statusKey, statusWidgets)

    let gameTime = GameAPI.getGameTime();

    let widgetRdy = function(widgt) {
        widgt.setWidgetIconKey(iconKey);
        widgt.getWidgetSurface()
        widget.icon.setGuiIconColorRGBA(elementColorMap['STATUS_HINT'])
    }

    if (status) {
        if (!widget) {
            widget = new GuiWidget('icon_actor_status_hint');
            widget.statusKey = statusKey;
            widget.initGuiWidget(null, widgetRdy);
            statusWidgets[statusKey] = widget;
        } else {

        //    let pos = actor.getSpatialPosition()
        //    pos.y += actor.getStatus(ENUMS.ActorStatus.HEIGHT) + 0.7;
        //    GuiAPI.worldPosToScreen(pos, ThreeAPI.tempVec3, 0.41, 0.0)
            ThreeAPI.tempVec3.copy(parentElement.pos)

            ThreeAPI.tempVec3.y -= (parentElement.size.y * 0.5 + 0.01);
            ThreeAPI.tempVec3.x -= (parentElement.size.x * 0.5 - 0.01);
            ThreeAPI.tempVec3.x += visibleHints * 0.026;
            let baseRgba = elementColorMap['STATUS_HINT'];

            if (selectedActor) {
                    let myStatus = selectedActor.getStatus(statusKey)
                    if (myStatus === status) {

                        rgba.r = baseRgba.r * 0.7 + 0.5 * baseRgba.r * Math.sin(visibleHints+gameTime*6)
                        rgba.g = baseRgba.g * 0.9 + 0.3 * baseRgba.g * Math.cos(visibleHints+gameTime*6)
                        rgba.b = baseRgba.b * 0.7 + 0.5 * baseRgba.r * Math.sin(visibleHints+gameTime*3)
                        rgba.a = baseRgba.a;
                        widget.icon.setGuiIconColorRGBA(rgba)

                    } else {
                        widget.icon.setGuiIconColorRGBA(baseRgba)
                    }
            }


            widget.offsetWidgetPosition(ThreeAPI.tempVec3);
            visibleHints++
        }
    } else {
        if (widget) {
            widget.recoverGuiWidget();
            statusWidgets[statusKey] = null;
        }
    }
}

function updateWorldActorStatus(actor, parentElement, statusWidgets, selectedActor) {

    let count = 0;
    visibleHints = 0;
    for (let i = 0; i < trackMap.length; i++) {
        let key = trackMap[i]
        updateStatusTracker(key, statusIcons[key], actor, parentElement, statusWidgets, count, selectedActor);
        count++;
    }

}

class WorldActorStatusUI {
    constructor() {

        let actor;
        let parentElement;
        let statusWidgets = {};

        let setActor = function(actr) {
            actor = actr;
        }
        let setParentElement = function(elem) {
            parentElement = elem
        }
        let update = function() {
            let selectedActor = GameAPI.getGamePieceSystem().selectedActor;
            updateWorldActorStatus(actor, parentElement, statusWidgets, selectedActor);
        }

        let getWidgets = function() {
            return statusWidgets;
        }



        this.call = {
            update:update,
            setActor:setActor,
            setParentElement:setParentElement,
            getWidgets:getWidgets
        }
    }

    activateWorldActorStatus(actor, parentGuiWidget) {
        this.call.setParentElement(parentGuiWidget);
        this.call.setActor(actor);
    }

    deactivateWorldActorStatus() {
        poolReturn(this);

        let statusWidgets = this.call.getWidgets();

        for (let key in statusWidgets) {
            if (statusWidgets[key]) {
                statusWidgets[key].recoverGuiWidget();
                statusWidgets[key] = null;
            }
        }
    }

}

export {WorldActorStatusUI}