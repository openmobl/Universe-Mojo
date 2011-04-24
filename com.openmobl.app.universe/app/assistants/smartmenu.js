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
 
function SmartMenu(controller, addressBar, showChromeCallback)
{
    Mojo.Log.info("SmartMenu#new");
    this.controller = controller;
    
    this.addressBar = addressBar;
    this.showChromeCallback = showChromeCallback; /* TODO: Ugly hack... */
    
    this.getDividerHandler = this.getDivider.bind(this);
    
    this.searchListItems = [];
    this.searchListAttr = {
            itemTemplate: "page/smart-menu/smart-menu-entry",
			listTemplate: "page/smart-menu/smart-menu-container",
			itemsCallback: this.listRenderItems.bind(this),
            dividerTemplate: "page/smart-menu/smart-menu-divider",
            dividerFunction: this.getDividerHandler,
			renderLimit: 16,
			lookahead: 8
        };
    this.searchListModel = {
            items: []
        };
    
    this.haveFavorites = false;
    this.haveHistory = false;

}
 
SmartMenu.prototype.setup = function()
{
    Mojo.Log.info("SmartMenu#setup");
    
    this.smartMenu = this.controller.get("smart-menu");
    this.controller.setupWidget("search-list", this.searchListAttr);
    this.searchList = this.controller.get("search-list");
    
    this.controller.listen("search-list", Mojo.Event.listTap, this.listSelectItem.bind(this), false);
    this.controller.listen("search-list", Mojo.Event.tap, this.listSelectTabItem.bind(this), false);
    
    this.handleScrimTap = this.handleScrimTap.bind(this);
    
    this.controller.listen("smart-menu", Mojo.Event.tap, this.handleScrimTap, false);
};
 
SmartMenu.prototype.cleanup = function()
{
    Mojo.Log.info("SmartMenu#cleanup");
    
    //this.controller.removeEventListener(Mojo.Event.tap, this.handleScrimTap, false);
    this.controller.stopListening("search-list", Mojo.Event.listTap, this.listSelectItem.bind(this), false);
    this.controller.stopListening("search-list", Mojo.Event.tap, this.listSelectTabItem.bind(this), false);
    this.controller.stopListening("smart-menu", Mojo.Event.tap, this.handleScrimTap, false);
};

SmartMenu.prototype.clearList = function()
{
    this.searchListItems = [];
};

SmartMenu.prototype.isVisible = function()
{
    //return .hasClassName("panel-visible");
    return this.smartMenu.style.display !== "none";
};
SmartMenu.prototype.makeVisible = function(visible)
{
    Mojo.Log.info("SmartMenu#makeVisible(" + visible + ")");
    
    if (visible === true) {
        Mojo.Log.info("SmartMenu#makeVisible/visible");
        this.smartMenu.style.display = "block";
    } else {
        Mojo.Log.info("SmartMenu#makeVisible/invisible");
        this.smartMenu.style.display = "none";
    }
};

SmartMenu.prototype.updateEvent = function()
{
    Mojo.Log.info("SmartMenu#updateEvent");
    
    var searchFor = this.addressBar.getURL(); // TODO: Just pass it in?...
    Mojo.Log.info("searchFor = " + searchFor);
    
    this.clearList();
    
    /* TODO: Make this update better */
    this.buildSearchList(searchFor);
    this.buildTabsList(searchFor);
    this.buildBookmarksList(searchFor);
    this.buildHistoryList(searchFor);
    
    this.searchList.mojo.setLengthAndInvalidate(this.searchListItems.length);
	this.searchList.mojo.revealItem(0, false);
    
    if (!this.isVisible()) {
        this.makeVisible(true);
        this.addressBar.focusText();
    }
};

SmartMenu.prototype.listRenderItems = function(list, offset, count)
{
    Mojo.Log.info("SmartMenu#listRenderItems");
    
	var visibleItems = this.searchListItems.slice(offset, offset + count);
    //Mojo.Log.info("List items: " + Object.toJSON(visibleItems));
    
    var tabModel = {
           snapElements: { x: $$(".smartmenu-tab-item") },
           snapIndex: 0
       };
    this.controller.setupWidget("smart-menu-tab-scroller",
                { mode: "horizontal-snap" }, tabModel);
    
	list.mojo.noticeUpdatedItems(offset, visibleItems);
};

SmartMenu.prototype.listSelectItem = function(event)
{
    Mojo.Log.info("SmartMenu#listSelectItem");
    
    if (event.item) {
        switch (event.item.class) {
            case "search":
            case "bookmark":
            case "history":
                var url = event.item.url;
                
                if (url.length > 0) {
                    this.addressBar.loadURL(url);
                }
                
                event.preventDefault();
                event.stopPropagation();
                break;
            case "tabs":
                break;
        }
    }
};

SmartMenu.prototype.listSelectTabItem = function(event)
{
    Mojo.Log.info("SmartMenu#listSelectTabItem");
    
    var row = this.controller.get(event.target);
    while (row !== undefined && row.hasAttribute &&
        !row.hasAttribute("x-openmobl-browser-tab-id")) {
        row = row.up();
    }
	if (row === undefined) {
        Mojo.Log.warn("Can't find row attribute");
    } else if (!row.hasAttribute) {
        Mojo.Log.warn("row.hasAttribute not defined!");
    } else if (row.hasAttribute("x-openmobl-browser-tab-id")) {
        var tabID = row.readAttribute("x-openmobl-browser-tab-id");
        
        event.preventDefault();
        event.stopPropagation();
        
        this.addressBar.changeMode("title");
        this.addressBar.endActivity();
        this.showChromeCallback(false);
        Universe.getTabManager().gotoTab(tabID);
    }
};

SmartMenu.prototype.handleScrimTap = function(event)
{
    this.addressBar.endActivity();
};

SmartMenu.prototype.getDivider = function(item)
{
    /* TODO: There is a bug in this logic somewhere. A divider is first drawn on
             above the search option, but that goes away when the list is scrolled... */
    if (!item.exclude && (item.class === "tabs" || item.class === "bookmark")) {
        return item.class;
    }
};

SmartMenu.prototype.buildSearchList = function(searchFor)
{
    var item = {};
    
    item.class = "search";
    var search = {};
    search.iconClass = "search-icon";
    search.result = "Search for " + searchFor;
    search.sub = "";
    
    /* TODO: Search through list of prefered search providers and list them here! */
    switch (Universe.getPrefsManager().get("searchProvider")) {
        case "google":
            item.url = "http://www.google.com/search?q=" + UrlUtil.encode(searchFor);
            search.icon = "images/providers/google-32x32.png";
            break;
        case "yahoo":
            item.url = "http://search.yahoo.com/search?p=" + UrlUtil.encode(searchFor);
            search.icon = "images/providers/yahoo-32x32.png";
            break;
    }
    
    item.innerHTML = Mojo.View.render({object: search, template: "page/smart-menu/smart-menu-search-item"});
    
    this.searchListItems.push(item);
};

SmartMenu.prototype.buildTabsList = function(searchFor)
{
    /* TODO: This should probably be a flag or something. Abstract this out. */
    if (Utils.toBool(Universe.getPrefsManager().get("privateBrowsing"))) {
        return;
    }
    
    var haveTab = 0;
    var item = {};
    item.class = "tabs";
    item.url = ""
    
    var tabs = {};
    tabs.tabsHTML = "";
    var tabList = Universe.getTabManager().getTabList();
    var i = 0;
    
    /* Iterate through the list of tabs and find the ones that match our search! */
    for (i = 0; i < tabList.length; i++) {
        var tab = tabList[i];
        
        /* If there is a title AND part of it matches our search term, add it */
        if (tab.title !== undefined && tab.title.toLowerCase().indexOf(searchFor.toLowerCase()) != -1) {
            haveTab++;
            tabs.tabsHTML += Mojo.View.render({object: tab, template: "page/smart-menu/smart-menu-tab-item"});
        }
    }
    
    if (haveTab > 0) {
        tabs.tabWidth = (haveTab * 80);
        item.innerHTML = Mojo.View.render({object: tabs, template: "page/smart-menu/smart-menu-tabs"});
    
        this.searchListItems.push(item);
    }
};

SmartMenu.prototype.buildHistoryList = function(searchFor)
{
    var callback = this.finishBuildHistory.bind(this, searchFor);
    
    Universe.getHistoryManager().searchForTitle(searchFor, callback);
};

SmartMenu.prototype.finishBuildHistory = function(searchFor, results)
{
    Mojo.Log.info("SmartMenu#finishBuildHistory");
    var i = 0;
    
    for (i = 0; i < results.length; i++) {
        var item = {};
        item.class = "history";
        item.url = results[i].url;
        
        var search = {};
        search.icon = "images/history-list-icon.png";
        search.iconClass = "history-icon";
        search.result = results[i].title;
        search.sub = results[i].url;
        
        item.innerHTML = Mojo.View.render({object: search, template: "page/smart-menu/smart-menu-search-item"});
        this.searchListItems.push(item);
    }
    
    this.searchList.mojo.setLengthAndInvalidate(this.searchListItems.length);
	this.searchList.mojo.revealItem(0, false);
};

SmartMenu.prototype.buildBookmarksList = function(searchFor)
{
    var callback = this.finishBuildBookmarksList.bind(this, searchFor);
    
    Universe.getBookmarksManager().searchForTitle(searchFor, callback);
};

SmartMenu.prototype.finishBuildBookmarksList = function(searchFor, results)
{
    Mojo.Log.info("SmartMenu#finishBuildBookmarksList");
    var i = 0;
    
    for (i = 0; i < results.length; i++) {
        var item = {};
        item.class = "bookmark";
        item.url = results[i].url;
        
        var search = {};
        search.icon = "images/bookmarks-list-icon.png";
        search.iconClass = "bookmark-icon";
        search.result = results[i].title;
        search.sub = results[i].url;
        
        item.innerHTML = Mojo.View.render({object: search, template: "page/smart-menu/smart-menu-search-item"});
        this.searchListItems.push(item);
    }
    
    this.searchList.mojo.setLengthAndInvalidate(this.searchListItems.length);
	this.searchList.mojo.revealItem(0, false);
};

