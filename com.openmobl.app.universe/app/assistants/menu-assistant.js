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

MenuAssistant.Back = {pref: "back", menu: {icon: "back", command: "do-goBack", disabled: true}};
MenuAssistant.Forward = {pref: "forward", menu: {icon: "forward", command: "do-goForward", disabled: true}};
MenuAssistant.History = {pref: "history", menu: {iconPath: "images/menu-icon-history.png", command: "do-goHistory"}};
MenuAssistant.Bookmarks = {pref: "bookmarks", menu: {iconPath: "images/menu-icon-bookmarks.png", command: "do-goBookmarks"}};
MenuAssistant.AddBookmark = {pref: "addbookmark", menu: {iconPath: "images/menu-icon-new-bookmark.png", command: "do-pageBookmark"}};
MenuAssistant.Home = {pref: "home", menu: {iconPath: "images/menu-icon-home.png", command: "do-goHome"}};
MenuAssistant.TopSites = {pref: "topsites", menu: {iconPath: "images/menu-icon-topsites.png", command: "do-goTopSites"}};
MenuAssistant.OrientationLock = {pref: "orientationlock", menu: {iconPath: "images/menu-icon-orientationlock.png", command: "do-goOrientationLock"}};

MenuAssistant.BackMenu = {label: $L("Back"), command: MenuAssistant.Back.menu.command, checkEnabled: true, shortcut: "b"};
MenuAssistant.ForwardMenu = {label: $L("Forward"), command: MenuAssistant.Forward.menu.command, checkEnabled: true, shortcut: "f"};
MenuAssistant.ReloadMenu = {label: $L("Reload"), command: "do-goReload", checkEnabled: true, shortcut: "r"};
MenuAssistant.HomeMenu = {label: $L("Home"), command: MenuAssistant.Home.menu.command, shortcut: "h"};
MenuAssistant.BookmarksMenu = {label: $L("Bookmarks"), command: MenuAssistant.Bookmarks.menu.command};
MenuAssistant.HistoryMenu = {label: $L("History"), command: MenuAssistant.History.menu.command};
MenuAssistant.TopSitesMenu = {label: $L("Top Sites"), command: "do-goTopSites", checkEnabled: true};

MenuAssistant.Bookmark = {label: $L("Bookmark"), command: "do-pageBookmark"};
MenuAssistant.AddToLauncher = {label: $L("Add To Launcher"), command: "do-pageAddToLauncher"};
MenuAssistant.Relego = {label: $L("Add to Relego"), command: "do-pageSaveForLater"};
MenuAssistant.Tweet = {label: $L("Send to Twitter"), command: "do-pageTweet", checkEnabled: true};
MenuAssistant.Share = {label: $L("Share..."), command: "do-pageShare"};

function MenuAssistant(appAssistant, scene)
{
    Mojo.Log.info("MenuAssistant#new");
    
    this.appAssistant = appAssistant;
    this.scene = scene;
    
    this.appMenuAttr = { omitDefaultItems: true };
    this.appMenuModel = {
        visible: true,
        items: [
            Mojo.Menu.editItem,
            {label: $L("New Card"), command: "do-appNewCard", shortcut: "n"},
            {label: $L("Open File..."), command: "do-appOpen", shortcut: "o"},
            
            {label: $L("Navigation"), items: [
                        MenuAssistant.BackMenu,
                        MenuAssistant.ForwardMenu,
                        MenuAssistant.ReloadMenu,
                        MenuAssistant.HomeMenu,
                        MenuAssistant.TopSitesMenu,
                        MenuAssistant.BookmarksMenu,
                        MenuAssistant.HistoryMenu
                    ]},
            
            {label: $L("Page"), items: [
                        MenuAssistant.Bookmark,
                        MenuAssistant.AddToLauncher,
                        MenuAssistant.Relego, MenuAssistant.Share,
                        MenuAssistant.Tweet
                    ]},
            
            {label: $L("Preferences & Accounts..."), command: "do-appPrefs"},
            {label: $L("View Options..."), command: "do-appViewOpts"},
            {label: $L("Help"), command: "do-appHelp"},
            {label: $L("About #{title}").interpolate({title: Mojo.appInfo.title}), command: "do-appAbout"}
        ]
    };
    this.cmdMenuAttr = { menuClass:"no-fade" };
    this.cmdMenuModel = {
        items: [
            {items: [MenuAssistant.Back.menu]},
            {items: [MenuAssistant.Forward.menu]},
            {},
            {items: [MenuAssistant.Home.menu]},
            {items: [MenuAssistant.Bookmarks.menu]},
            {items: [MenuAssistant.History.menu]}
            ]
    };
    
};

MenuAssistant.prototype.showMainMenu = function(scene)
{
    Mojo.Log.info("MenuAssistant#showMainMenu");
    this.scene.controller.setupWidget(Mojo.Menu.appMenu, this.appMenuAttr, this.appMenuModel);
};

MenuAssistant.prototype.showBrowserIcons = function(scene)
{
    Mojo.Log.info("MenuAssistant#showBrowserIcons");
    this.scene.controller.setupWidget(Mojo.Menu.commandMenu, this.cmdMenuAttr, this.cmdMenuModel);
};

MenuAssistant.prototype.updateNavigationIcons = function()
{
    var prefs = Universe.getPrefsManager();
    
    this.cmdMenuModel.items[0].items[0] = Utils.cmdMenuLookupItem(prefs.get("navButton1"));
    this.cmdMenuModel.items[1].items[0] = Utils.cmdMenuLookupItem(prefs.get("navButton2"));
    this.cmdMenuModel.items[3].items[0] = Utils.cmdMenuLookupItem(prefs.get("navButton3"));
    this.cmdMenuModel.items[4].items[0] = Utils.cmdMenuLookupItem(prefs.get("navButton4"));
    this.cmdMenuModel.items[5].items[0] = Utils.cmdMenuLookupItem(prefs.get("navButton5"));
    
    this.scene.controller.modelChanged(this.cmdMenuModel);
};

MenuAssistant.prototype.setDisabled = function(command, disabled)
{
    var i = 0;
    for (i = 0; i < this.cmdMenuModel.items.length; i++) {
        if (this.cmdMenuModel.items[i].items &&
            this.cmdMenuModel.items[i].items[0] &&
            this.cmdMenuModel.items[i].items[0].command === command) {
                this.cmdMenuModel.items[i].items[0].disabled = disabled;
        }
    }
};

MenuAssistant.prototype.setBack = function(enabled)
{
    //this.cmdMenuModel.items[0].items[0].disabled = !enabled;
    this.setDisabled(MenuAssistant.Back.menu.command, !enabled);
    this.scene.controller.modelChanged(this.cmdMenuModel);
};
MenuAssistant.prototype.setForward = function(enabled)
{
    //this.cmdMenuModel.items[1].items[0].disabled = !enabled;
    this.setDisabled(MenuAssistant.Forward.menu.command, !enabled);
    this.scene.controller.modelChanged(this.cmdMenuModel);
};

MenuAssistant.prototype.setOrientationLock = function(locked)
{
    var command = MenuAssistant.OrientationLock.menu.command;

    var i = 0;
    for (i = 0; i < this.cmdMenuModel.items.length; i++) {
        if (this.cmdMenuModel.items[i].items &&
            this.cmdMenuModel.items[i].items[0] &&
            this.cmdMenuModel.items[i].items[0].command === command) {
                if (locked) {
                    this.cmdMenuModel.items[i].items[0].iconPath = "images/menu-icon-orientationlock-highlight.png";
                } else {
                    this.cmdMenuModel.items[i].items[0].iconPath = "images/menu-icon-orientationlock.png";
                }
        }
    }    

    this.scene.controller.modelChanged(this.cmdMenuModel);
};

// TODO: Return true or false
MenuAssistant.prototype.handleCommand = function(event)
{
    Mojo.Log.info("MenuAssistant#handleCommand");
    var handled = false;
    
    if (event.type == Mojo.Event.command) {
        switch (event.command) {
            /* App menu */
            case "do-appOpen":
                break;
            case "do-appPrefs":
                Universe.launchPreferences();
                handled = true;
                break;
            case "do-appHelp":
                //this.appAssistant.getActiveStageController().pushAppSupportInfoScene();
                handled = true;
                break;
            case "do-appAbout":
                Universe.launchAbout();
                handled = true;
                break;
        }
    }
    
    /*if (handled) {
        // stop propagation
    }*/
    
    return handled;
};
