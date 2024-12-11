class DomLoadScreen {
    constructor() {

            this.bailTimeout;
			this.root = DomUtils.createDivElement(document.body, 'load_screen', '', 'point general_map');
            this.buildElements();

            this.texts = [];

            this.pipeTexts = [];

            this.entry_count = 20;
            this.file_count = 4;

            this.logChannels = {
                client_state:"#fea",
                pipeline_message:"#cfc",
                connection_status:"#9fd",
                button_update:"ff0",
                pipeline_error:"#f66",
                ping_tracker:"af6",
                receive_error:"f33",
                connection_error:"fa2",
                undefined:"#aaf",
                system_status:"#f8F",
                own_player_name:"#fbf",
                server_message:"#4f9"
            };

		};

        buildElements = function() {

            var rootStyle = {
                width: '100%',
                height: '100%',
                zIndex: 2000,
                backgroundColor: 'rgb(127, 82, 37)',
                transition: 'all 0.2s ease-in-out'
            };

            DomUtils.applyElementStyleParams(this.root, rootStyle);

            var hStyle = {
                width: '100%',
                height: '50%',
                top: '25%',
                textAlign: 'center',
                fontSize: '60em',
                zIndex: 100,
                color: 'rgba(255, 155, 45, 1)',
                transition: 'all 1.6s ease-in-out'
            };

            this.progHeader = DomUtils.createDivElement(this.root, 'phead', 'Loading...', 'point');

            DomUtils.applyElementStyleParams(this.progHeader, hStyle);

            var cStyle = {
                width: '100%',
                height: '30em',
                bottom: '0%',
                backgroundColor: 'rgb(120, 50, 12)',
                transformOrigin: "0% 0%",
                transition: 'all 0.7s ease-in-out'
            };

            this.progContainer = DomUtils.createDivElement(this.root, 'pcont', '', 'point');

            DomUtils.applyElementStyleParams(this.progContainer, cStyle);

            var pStyle = {
                width: '100%',
                height: '100%',
                left: '0%',
                backgroundColor: 'rgb(255, 150, 22)',
                transformOrigin: "0% 0%",
                transform: 'scale3d(0, 1, 1)'
            };

            this.progress = DomUtils.createDivElement(this.progContainer, 'progress', '', 'point');

            DomUtils.applyElementStyleParams(this.progress, pStyle);

            var countStyle = {
                width: '100%',
                height: '100%',
                top: "auto",
                left: '0%',
                textAlign: 'center',
                fontSize: '25em',
                zIndex: 100,
                color: 'rgb(255, 255, 195)'
            };

            this.progCounter = DomUtils.createDivElement(this.progContainer, 'pcounter', 'Prepping Loaders...', 'point');

            DomUtils.applyElementStyleParams(this.progCounter, countStyle);

            var msgStyle = {
                width: '40em',
                position: 'absolute',
                height: 'auto',
                bottom: "5em",
                left: '1em',
                textAlign: 'left',
                fontSize: '11em',
                zIndex: 100,
                color: 'rgb(255, 255, 195)'
            };

            this.progMessage = DomUtils.createDivElement(this.root, 'pmsg', 'The Loading Story', '');

            DomUtils.applyElementStyleParams(this.progMessage, msgStyle);

            var pipeStyle = {
                width: '40em',
                position: 'absolute',
                height: 'auto',
                bottom: "5em",
                right: '1em',
                textAlign: 'right',
                fontSize: '11em',
                zIndex: 100,
                color: 'rgb(255, 255, 195)'
            };


            this.pipeMessage = DomUtils.createDivElement(this.root, 'pipemsg', 'File Log', '');

            DomUtils.applyElementStyleParams(this.pipeMessage, pipeStyle);

            this.setProgress(0);

            var _this = this;

            this.bailTimeout = setTimeout(function() {
                _this.progCounter.innerHTML = "Loading fishy... reload to retry";
            }, 2000);

        };


		setProgress = function(fraction) {
            clearTimeout(this.bailTimeout);
            this.progCounter.innerHTML = Math.round(fraction*100)+'%';
			// this.progress.element.style.width = 100 * fraction + '%';
            var style = {
                transform: 'scale3d('+fraction+', 1, 2)'
            };
            DomUtils.applyElementStyleParams(this.progress, style);

		};


        renderTexts = function() {

            var text = '';
            for (var i = 0; i < this.texts.length; i++) {
                text += this.texts[i]+'\n';
                this.progMessage.innerHTML =  text;
            }
            if (this.texts.length > this.entry_count) {
                this.texts.shift();
            }
        };

        renderPipeLog = function() {

            var text = '';
            for (var i = 0; i < this.pipeTexts.length; i++) {
                text += this.pipeTexts[i]+'\n';
                this.pipeMessage.innerHTML =  text;
            }
            if (this.pipeTexts.length > this.file_count) {
                this.pipeTexts.shift();
            }
        };

        logMessage = function(msg, color, channel) {
            if (!color) color = '#f04';

            if (channel === 'pipeline_message') {
                this.pipeTexts.push("<span style='color:"+color+"'>"+ msg +"</span>");
                this.renderPipeLog()
            } else {
                this.texts.push("<span style='color:"+color+"'>"+ msg +"</span>");
                this.renderTexts()
            }

        };

		addMessageToScreen = function(args) {
            this.logMessage(args.message, this.logChannels[args.channel], args.channel);
		};

		setHighlight = function() {
			this.progress.flashElement();
		};

		removeProgress = function() {

            var style = {
                transform: 'translate3d(0px, 40px, 0px)'
            };
            DomUtils.applyElementStyleParams(this.progContainer, style);

            var _this = this;

            setTimeout(function() {

                style = {
                    backgroundColor: 'rgba(0, 0, 0, 0)'
                };

                DomUtils.applyElementStyleParams(_this.root, style);

                style = {
                    transform: 'translate3d(0px, -140px, 0px) scale3d(0.2, 0.2, 2)',
                    color: 'rgba(0, 255, 0, 0)'
                };

                DomUtils.applyElementStyleParams(_this.progHeader, style);

                setTimeout(function() {
                    DomUtils.removeElement(_this.root);
                }, 300);

                DomUtils.removeElement(_this.pipeMessage);
                DomUtils.removeElement(_this.progMessage);

            },200);

		};

	}

export { DomLoadScreen };