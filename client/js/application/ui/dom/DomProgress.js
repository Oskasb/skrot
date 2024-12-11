"use strict";


define([
		'evt',
		'ui/GameScreen',
		'ui/dom/DomUtils',
		'ui/dom/DomElement'
	],
	function(
		evt,
		GameScreen,
		DomUtils,
		DomElement
	) {

		var DomProgress = function(parentElem, style, vertical) {
			this.root = new DomElement(parentElem, style);
			var barStyle = 'progress';
			if (vertical) barStyle = 'progress_vertical';
			this.progress = new DomElement(this.root.element, barStyle);

			this.width = this.root.element.offsetWidth;
		//	this.progress.element.style.width = 100 + '%';
		};

		DomProgress.prototype.setProgress = function(fraction) {
			// this.progress.element.style.width = 100 * fraction + '%';

			this.progress.scaleXYZ(fraction, fraction, 1);

		};

		DomProgress.prototype.setLowlight = function() {
			this.progress.deFlashElement();
		};

		DomProgress.prototype.setHighlight = function() {
			this.progress.flashElement();
		};

		DomProgress.prototype.removeProgress = function() {
			this.root.removeElement();
		};

		return DomProgress;

	});