import { GuiWidget} from "../elements/GuiWidget.js";
import { GuiStatsPanel } from "./GuiStatsPanel.js";
import { GuiActionButton } from "./GuiActionButton.js";
import { GuiSimpleButton } from "./GuiSimpleButton.js";
import { GuiExpandingContainer } from "./GuiExpandingContainer.js";
import { GuiTextBox } from "./GuiTextBox.js";
import { GuiScreenSpaceText } from "./GuiScreenSpaceText.js";
import { GuiProgressBar } from "./GuiProgressBar.js";
import { GuiSimpleWidget } from "./GuiSimpleWidget.js";

class WidgetBuilder {
    constructor() {
            this.widgets = {
                GuiSimpleWidget         : GuiSimpleWidget                    ,
                GuiStatsPanel           : GuiStatsPanel                      ,
                GuiActionButton         : GuiActionButton                    ,
                GuiSimpleButton         : GuiSimpleButton                    ,
                GuiExpandingContainer   : GuiExpandingContainer              ,
                GuiTextBox              : GuiTextBox                         ,
                GuiScreenSpaceText      : GuiScreenSpaceText                 ,
                GuiProgressBar          : GuiProgressBar                     ,
            };
        };

        buildWidget = function(widgetClassName, options, onReady) {
            let widgetOfClass = new this.widgets[widgetClassName](options);
            this.setupWidgetFromOptions(widgetOfClass, onReady);

        };

        setupWidgetFromOptions = function(widgetOfClass, onReady) {

            let guiWidget = new GuiWidget(widgetOfClass.options.configId);

            let wReady = function(widget) {

                widgetOfClass.setGuiWidget(widget);
                widget.applyWidgetOptions(widgetOfClass.options);
                onReady(widgetOfClass)

            };

            guiWidget.initGuiWidget(null, wReady);

        };

    }

export { WidgetBuilder }