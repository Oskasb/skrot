import {jsonAsset} from "../../application/utils/AssetUtils.js";
import {poolFetch} from "../../application/utils/PoolUtils.js";

class PieceHardpoint {
    constructor(pointName, controllablePiece) {
        this.id = pointName;
        const attachments = [];

        function setJson(json) {
            if (!controllablePiece.assetInstance) {
                console.log("assetInstance not found on controllable:", controllablePiece);
                setTimeout(function() {
                    setJson(json);
                }, 1000)
                return;
            }
            let point = controllablePiece.getDynamicPoint(pointName);
            if (point === null) {
                console.log("Dynamic Point not found on controllable:", controllablePiece);
                setTimeout(function() {
                    setJson(json);
                }, 1000)
                return;
            }
            while (attachments.length) {
                let attachment = attachments.pop();
                point.call.removePointStateChangeCallback(attachment.call.onAttachmentStateChange);
            }

            for (let i = 0; i < json['attachments'].length; i++) {
                let attach = json['attachments'][i]['attach'];
                let opts = json['attachments'][i]['options'];
                let attachment = poolFetch(attach);
                attachment.call.applyHardpointOptions(point, opts);
                point.call.addPointStateChangeCallback(attachment.call.onAttachmentStateChange);
                attachments.push(attachment);
            }
        }

        function setHardpointAttachment(fileName) {
            jsonAsset(fileName, setJson);
        }

        this.call = {
            setHardpointAttachment:setHardpointAttachment
        }

    }


}

export { PieceHardpoint };