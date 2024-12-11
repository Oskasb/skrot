"use strict";

class DataPipelineMessageHandler {

    constructor(pipelineMessageCB) {
        this.onMessageCB = pipelineMessageCB;
        this.okCount = 0;
        this.failCount = 0;
    }


    generateMsgLevels = function(err) {
        var msg = [];
        if (typeof(err) == "array") {
            for (var i = 0; i < err.length; i++) {
                msg.push(err[i])
            }
        } else {
            msg.push(err);
        }
        return msg;
    };

    handleWorkerError = function(url, err) {

        var msg = this.generateMsgLevels(err);
        msg.push(this.failCount);
        msg.push(url);
        this.failCount += 1;
        this.delayedSend('data_error_channel', msg, 50)
    };

    handleErrorUpdate = function(update, err) {
        var msg = this.generateMsgLevels(err);
        msg.push(update);
        this.delayedSend('data_error_update_channel', msg, 300);


    };


    delayedSend = function(channel, msg, delay) {
        this.onMessageCB("Worker message: ", channel, msg)
    };

    handleDataUpdated = function(url) {
        this.okCount += 1;
        this.delayedSend('data_update_channel', url+' '+this.okCount, 50);
        //	delayedSend('data_update_channel', url+' '+okCount, 500);
        //	delayedSend('data_update_channel', url+' '+okCount, 2500);
    };

    handleValidationPass = function(list) {
        this.delayedSend('data_validation_update_channel', list, 50);
        //	delayedSend('data_validation_update_channel', list, 600);
        //	delayedSend('data_validation_update_channel', list, 3500);
    };

    handleValidationError = function(msg) {
        this.delayedSend('data_validation_error_channel', msg, 50);
        //	delayedSend('data_validation_error_channel', msg, 600);
        //	delayedSend('data_validation_error_channel', msg, 3500);
    };


    notifyWorkerReady = function(msg, pipeName) {
        console.log("worker ready add event for this?", msg, pipeName)
        //	ConfigCache.pipelineReady(true)
    };

}

export { DataPipelineMessageHandler	}