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

/*TabsAssistant.History = {mode: "history", menu: {iconPath: "images/menu-icon-history.png", command: "do-switchHistory"}};
TabsAssistant.Bookmarks = {mode: "bookmarks", menu: {iconPath: "images/menu-icon-bookmarks.png", command: "do-switchBookmarks"}};
TabsAssistant.TopSites = {mode: "tophits", menu: {iconPath: "images/menu-icon-topsites.png", command: "do-switchTopSites"}};*/


function TabsAssistant(params)
{
    /*this.cmdMenuAttr = { menuClass:"no-fade" };
    this.cmdMenuModel = {
            items: [
                    {},
                    {
                        items: [TabsAssistant.TopSites.menu, TabsAssistant.Bookmarks.menu, TabsAssistant.History.menu],
                        toggleCmd: TabsAssistant.TopSites.menu.command
                    },
                    {}
                ]
        };*/
    
    this.tabsListAttr = {
            itemTemplate: "tabs/tabs-entry",
			listTemplate: "tabs/tabs-container",
			itemsCallback: this.listRenderItems.bind(this),
			renderLimit: 16,
			lookahead: 8
        };
    
    this.tabsListItems = [];
    this.tabsList = undefined;
    
    this.listTapHandler = this.listTap.bind(this);
}

TabsAssistant.prototype.setup = function()
{
    this.controller.setupWidget("tabs-list", this.tabsListAttr, {});
    this.controller.listen("tabs-list", Mojo.Event.listTap, this.listTapHandler, false);
    this.tabsList = this.controller.get("tabs-list");
};

TabsAssistant.prototype.cleanup = function()
{
    this.controller.stopListening("tabs-list", Mojo.Event.listTap, this.listTapHandler, false);
};

TabsAssistant.prototype.activate = function()
{
    this.updateList();
};

TabsAssistant.prototype.clearList = function()
{
    this.tabsListItems = [];
};

TabsAssistant.prototype.listTap = function(event)
{
    Mojo.Log.info("TabsAssistant#listTap");
    
    if (event.item) {
        var id = event.item.id;
        
        if (id) {
            //this.controller.stageController.popScene({action: "loadURL", target: url});
            Universe.getTabManager().gotoTab(id);
        }
    }
};

TabsAssistant.prototype.updateMark = function(results)
{
    Mojo.Log.info("TabsAssistant#updateMark - " + Object.toJSON(results));
    
    var updated = false;
    
    if (results && results.url) {
        var i = 0;
        
        for (i = 0; i < this.tabsListItems.length; i++) {
            if (this.tabsListItems[i].url === results.url) {
                this.tabsListItems[i].ismarkDisplay = "block";
                this.tabsListItems[i].addmarkDisplay = "none";
                
                updated = true;
                break;
            }
        }
    }
    
    if (updated) {
        this.tabsList.mojo.setLengthAndInvalidate(this.tabsListItems.length);
        this.tabsList.mojo.revealItem(0, false);
    }
};

TabsAssistant.prototype.updateList = function()
{
    Mojo.Log.info("TabsAssistant#updateEvent");
    
    this.clearList();
    
    var tabs = {};
    var tabList = Universe.getTabManager().getTabList();
    var i = 0;
    
    for (i = 0; i < tabList.length; i++) {
        var tab = tabList[i];
        
        tab.ismarkDisplay = "none";
        tab.addmarkDisplay = "block";
        
        var callback = this.updateMark.bind(this);
        Universe.getBookmarksManager().getByURL(tab.url, callback);
        
        this.tabsListItems.push(tab);
    }
    
    this.tabsList.mojo.setLengthAndInvalidate(this.tabsListItems.length);
	this.tabsList.mojo.revealItem(0, false);
};

TabsAssistant.prototype.listRenderItems = function(list, offset, count)
{
    Mojo.Log.info("TabsAssistant#listRenderItems");
    
	var visibleItems = this.tabsListItems.slice(offset, offset + count);
    
	list.mojo.noticeUpdatedItems(offset, visibleItems);
};

TabsAssistant.prototype.handleCommand = function(event)
{
    /*var handled = false;
    
    if (event.type == Mojo.Event.command) {
        switch (event.command) {
            case TabsAssistant.TopSites.menu.command:
                this.mode = TabsAssistant.TopSites.mode;
                break;
            case TabsAssistant.Bookmarks.menu.command:
                this.mode = TabsAssistant.Bookmarks.mode;
                break;
            case TabsAssistant.History.menu.command:
                this.mode = TabsAssistant.History.mode;
                break;
        }
        this.updateList();
    }
    
    if (handled) {
        event.preventDefault();
        event.stopPropagation();
    }*/
};
