/*
    The contents of this file are subject to the Mozilla Public License
    Version 1.1 (the "License"); you may not use this file except in
    compliance with the License. You may obtain a copy of the License at
    http://www.mozilla.org/MPL/

    Software distributed under the License is distributed on an "AS IS"
    basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See the
    License for the specific language governing rights and limitations
    under the License.

    The Original Code is OpenMobl Systems code.

    The Initial Developer of the Original Code is OpenMobl Systems.
    Portions created by OpenMobl Systems are Copyright (C) 2010-2011
    OpenMobl Systems. All Rights Reserved.

    Contributor(s):
        OpenMobl Systems
        Donald C. Kirker <donald.kirker@openmobl.com>

    Alternatively, the contents of this file may be used under the terms
    of the GNU General Public License Version 2 license (the  "GPL"), in
    which case the provisions of GPL License are applicable instead of
    those above. If you wish to allow use of your version of this file only
    under the terms of the GPL License and not to allow others to use
    your version of this file under the MPL, indicate your decision by
    deleting the provisions above and replace them with the notice and
    other provisions required by the GPL License. If you do not delete
    the provisions above, a recipient may use your version of this file
    under either the MPL or the GPL License.
 */

TopsitesAssistant.History = {mode: "history", menu: {iconPath: "images/menu-icon-history.png", command: "do-switchHistory"}};
TopsitesAssistant.Bookmarks = {mode: "bookmarks", menu: {iconPath: "images/menu-icon-bookmarks.png", command: "do-switchBookmarks"}};
TopsitesAssistant.TopSites = {mode: "tophits", menu: {iconPath: "images/menu-icon-topsites.png", command: "do-switchTopSites"}};


function TopsitesAssistant(params)
{
    this.dockMode = params.dockMode || params.touchstoneMode;
    
    this.cmdMenuAttr = { menuClass:"no-fade" };
    this.cmdMenuModel = {
            items: [
                    {},
                    {
                        items: [TopsitesAssistant.TopSites.menu, TopsitesAssistant.Bookmarks.menu, TopsitesAssistant.History.menu],
                        toggleCmd: TopsitesAssistant.TopSites.menu.command
                    },
                    {}
                ]
        };
    
    this.sitesListAttr = {
            itemTemplate: "topsites/topsites-entry",
			listTemplate: "topsites/topsites-container",
			itemsCallback: this.listRenderItems.bind(this),
			renderLimit: 16,
			lookahead: 8
        };
    
    this.sitesListItems = [];
    this.sitesList = undefined;
    
    this.mode = TopsitesAssistant.TopSites.mode;
    
    this.listTapHandler = this.listTap.bind(this);
}

TopsitesAssistant.prototype.setup = function()
{
    if (this.dockMode) {
        this.controller.setupWidget(Mojo.Menu.commandMenu, this.cmdMenuAttr, this.cmdMenuModel);
        
        this.controller.get("topsites-spacer").addClassName("palm-header-spacer");
    }
    
    this.controller.setupWidget("sites-list", this.sitesListAttr, {});
    this.controller.listen("sites-list", Mojo.Event.listTap, this.listTapHandler, false);
    this.sitesList = this.controller.get("sites-list");
    
    this.updateList();
};

TopsitesAssistant.prototype.cleanup = function()
{
    this.controller.stopListening("sites-list", Mojo.Event.listTap, this.listTapHandler, false);
};

TopsitesAssistant.prototype.clearList = function()
{
    this.sitesListItems = [];
};

TopsitesAssistant.prototype.listTap = function(event)
{
    Mojo.Log.info("TopsitesAssistant#listTap");
    
    if (event.item) {
        var url = event.item.url;
        
        if (url.length > 0) {
            if (this.dockMode) {
                Utils.subLaunchWithInstall(this.controller, "com.openmobl.app.universe", "Universe", "web browser", {action: "loadURL", target: url});
            } else {
                this.controller.stageController.popScene({action: "loadURL", target: url});
            }
        }
    }
};

TopsitesAssistant.prototype.finishBuildTopSites = function(results)
{
    Mojo.Log.info("TopsitesAssistant#finishBuildTopSites");
    var i = 0;
    var length = results.length;
    
    if (this.mode === TopsitesAssistant.TopSites.mode) {
        if (results.length > 10) {
            length = 10;
        }
    }
    
    if (this.mode === TopsitesAssistant.History.mode) {
        for (i = (length - 1); i >= 0; i--) {
            var item = {};
            item.iconClass = this.mode;
            item.title = results[i].title;
            item.url = results[i].url;
            
            this.sitesListItems.push(item);
        }
    } else {
        for (i = 0; i < length; i++) {
            var item = {};
            item.iconClass = this.mode;
            item.title = results[i].title;
            item.url = results[i].url;
            
            this.sitesListItems.push(item);
        }
    }
    
    this.sitesList.mojo.setLengthAndInvalidate(this.sitesListItems.length);
	this.sitesList.mojo.revealItem(0, false);
};

TopsitesAssistant.prototype.updateList = function()
{
    Mojo.Log.info("TopsitesAssistant#updateEvent");
    
    this.clearList();
    
    var callback = this.finishBuildTopSites.bind(this);
    switch (this.mode) {
        case TopsitesAssistant.TopSites.mode:
            Universe.getHistoryManager().getTopHits(callback);
            break;
        case TopsitesAssistant.Bookmarks.mode:
            Universe.getBookmarksManager().getBookmarks(callback);
            break;
        case TopsitesAssistant.History.mode:
            Universe.getHistoryManager().getHistory(callback);
            break;
    }
    
    //this.sitesList.mojo.setLengthAndInvalidate(this.sitesListItems.length);
	//this.sitesList.mojo.revealItem(0, false);
};

TopsitesAssistant.prototype.listRenderItems = function(list, offset, count)
{
    Mojo.Log.info("TopsitesAssistant#listRenderItems");
    
	var visibleItems = this.sitesListItems.slice(offset, offset + count);
    
	list.mojo.noticeUpdatedItems(offset, visibleItems);
};

TopsitesAssistant.prototype.handleCommand = function(event)
{
    var handled = false;
    
    if (event.type == Mojo.Event.command) {
        switch (event.command) {
            case TopsitesAssistant.TopSites.menu.command:
                this.mode = TopsitesAssistant.TopSites.mode;
                break;
            case TopsitesAssistant.Bookmarks.menu.command:
                this.mode = TopsitesAssistant.Bookmarks.mode;
                break;
            case TopsitesAssistant.History.menu.command:
                this.mode = TopsitesAssistant.History.mode;
                break;
        }
        this.updateList();
    }
    
    if (handled) {
        event.preventDefault();
        event.stopPropagation();
    }
};
