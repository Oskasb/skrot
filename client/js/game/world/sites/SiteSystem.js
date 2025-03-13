import {listJsonFilesByFirstSubstring} from "../../../application/utils/DataUtils.js";
import {WorldSite} from "./WorldSite.js";
import {DomWorldButtonLayer} from "../../../application/ui/dom/DomWorldButtonLayer.js";
import {getGamePlayer} from "../../../Client.js";

const siteList = []

const sites = [];

const siteButtonLayer = new DomWorldButtonLayer();

function activateSites() {

    listJsonFilesByFirstSubstring('site', '_', siteList, 'json')
    console.log("Activate world sites ", siteList);

    for (let i = 0; i < siteList.length; i++) {
        sites.push(new WorldSite(siteList[i]));
    }

}

function activateSiteBySelection(e) {
    console.log('activateSiteBySelection', e);

    getGamePlayer().getPos().copy(e.target.value.getPos())

}

function editSites() {
    siteButtonLayer.initWorldButtonLayer(sites, 'PICK', activateSiteBySelection);
    siteButtonLayer.call.getSettings().maxDistance = 20000;
}

export {
    activateSites,
    editSites
}