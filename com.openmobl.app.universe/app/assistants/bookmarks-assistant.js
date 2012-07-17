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
 
BookmarksAssistant.Unfiled = $L("Unfiled");

BookmarksAssistant.folder = "folder";
BookmarksAssistant.bookmarks = "bookmarks";

function BookmarksAssistant(pageIdentifier)
{
    this.appMenuAttr = { omitDefaultItems: true };
    this.appMenuModel = {
        visible: true,
        items: [
            {label: $L("New Bookmark"), command: "do-sceneNewBookmark"},
            {label: $L("Clear Bookmarks"), command: "do-sceneClearBookmarks"}
        ]
    };
    this.cmdMenuAttr = { menuClass:"no-fade" };
    this.cmdMenuModel = {
        items: [
            {iconPath: "images/menu-icon-new-bookmark.png", command: "do-sceneNewBookmark"},
            {},
            {icon: "sync", command: "do-sceneSync"}
            ]
    };
    
    this.mode = BookmarksAssistant.folder;
    this.currentFolder = "";
    
    this.listTapHandler = this.listTap.bind(this);
    this.listDeleteHandler = this.listDelete.bind(this);
    
    this.listRenderItemsHandler = this.listRenderItems.bind(this);
    
    this.bookmarksList = [];
    this.folderList = [];
    
    this.combinedList = [
        ];
    this.combinedListAttr = {
            swipeToDelete: true,
            itemTemplate: "bookmarks/bookmarks-list-item",
			itemsCallback: this.listRenderItemsHandler
        };
    this.combinedListModel = {
            items: []
        };
}


BookmarksAssistant.prototype.setup = function()
{
    this.setupMenus();
    
    this.controller.setupWidget("bookmark-list", this.combinedListAttr, this.combinedListModel);
    
    this.controller.listen("bookmark-list", Mojo.Event.listTap, this.listTapHandler, false);
    this.controller.listen("bookmark-list", Mojo.Event.listDelete, this.listDeleteHandler, false);
};

BookmarksAssistant.prototype.aboutToActivate = function(callback)
{
    callback.defer(); //makes the setup behave like it should.
};

BookmarksAssistant.prototype.setupMenus = function()
{
    this.controller.setupWidget(Mojo.Menu.appMenu, this.appMenuAttr, this.appMenuModel);
    this.controller.setupWidget(Mojo.Menu.commandMenu, this.cmdMenuAttr, this.cmdMenuModel);
};

BookmarksAssistant.prototype.activate = function(event)
{
    this.updateScene();
};

BookmarksAssistant.prototype.deactivate = function(event)
{
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
};

BookmarksAssistant.prototype.cleanup = function(event)
{
    this.controller.stopListening("bookmark-list", Mojo.Event.listTap, this.listTapHandler, false);
    this.controller.stopListening("bookmark-list", Mojo.Event.listDelete, this.listDeleteHandler, false);
    //this.controller.stopListening("bookmarks-list-container", Mojo.Event.hold, this.listHoldHandler, false);
    //this.controller.stopListening("bookmarks-list-container", Mojo.Event.tap, this.drawerTapHandler, false);
};

BookmarksAssistant.prototype.addBookmark = function(id, title, url, desc, folder)
{
    Mojo.Log.info("BookmarksAssistant#addBookmark(" + title + "," + url + ")");
    Universe.getBookmarksManager().addBookmark(url, title, desc, folder);
    
    this.updateScene();
};

BookmarksAssistant.prototype.updateBookmark = function(id, title, url, desc, folder, deleteItem)
{
    Mojo.Log.info("BookmarksAssistant#updateBookmark(" + title + "," + url + ")");
    
    if (deleteItem) {
        Universe.getBookmarksManager().removeBookmark(id, this.updateScene.bind(this));
    } else {
        Universe.getBookmarksManager().updateBookmark(id, url, title, desc, folder);
    }
    this.updateScene();
};

BookmarksAssistant.prototype.folderListContainsFolder = function(folder)
{
    var i = 0;
    for (i = 0; i < this.folderList.length; i++) {
        if (this.folderList[i] && this.folderList[i].folder === folder) {
            return true;
        }
    }
    
    return false;
};

BookmarksAssistant.prototype.bookmarksUpdate = function(results)
{
    Mojo.Log.info("BookmarksAssistant#bookmarksUpdate");
    
    var i = 0;
    
    this.bookmarksList.clear();
    this.bookmarksList = [];
    
    for (i = 0; i < results.length; i++) {
        var folder = results[i].folder;
        /* TODO: We need to actually force the bookmark to be updated instead of masking the folder name */
        if (folder.length == 0) {
            folder = BookmarksAssistant.Unfiled;
        }
        
        if (this.bookmarksList[folder] == undefined) {
            this.bookmarksList[folder] = [];
        }
        var newResults = {};
        
        newResults.class = "bookmark";
        newResults.lineHeight = "multi-line";
        newResults.folder = folder;
        newResults.markDisplay = "block";
        newResults.folderDisplay = "none";
        newResults.title = results[i].title;
        newResults.url = results[i].url;
        newResults.id = results[i].id;
        
        this.bookmarksList[folder].push(newResults);
    }
        
    if (this.mode === BookmarksAssistant.folder) {
        this.controller.get("bookmark-list").mojo.setLengthAndInvalidate(this.folderList.length);
    } else {
        this.controller.get("bookmark-list").mojo.setLengthAndInvalidate(this.bookmarksList[this.currentFolder].length);
    }
    
    this.controller.get("bookmark-list").mojo.revealItem(0, false);
};

BookmarksAssistant.prototype.foldersUpdate = function(results)
{
    Mojo.Log.info("BookmarksAssistant#foldersUpdate");
    
    var i = 0;
    
    this.folderList.clear();
    this.folderList = [];
    
    for (i = 0; i < results.length; i++) {
        var folder = results[i].folder;
        /* TODO: We need to actually force the bookmark to be updated instead of masking the folder name */
        if (folder.length == 0) {
            folder = BookmarksAssistant.Unfiled;
        }
        
        if (!this.folderListContainsFolder(folder)) {
            var folderItem = {};

            folderItem.class = "folder";
            folderItem.lineHeight = "";
            folderItem.folder = folder;
            folderItem.markDisplay = "none";
            folderItem.folderDisplay = "block";
            folderItem.title = "";
            folderItem.url = "";
            folderItem.id = "";
            
            this.folderList.push(folderItem);
        }
    }
    
	var bookmarksUpdateCallback = this.bookmarksUpdate.bind(this);
    Universe.getBookmarksManager().getBookmarks(bookmarksUpdateCallback);
};

BookmarksAssistant.prototype.updateScene = function()
{
    Mojo.Log.info("BookmarksAssistant#updateScene");
    
	var foldersUpdateCallback = this.foldersUpdate.bind(this);
    Universe.getBookmarksManager().getBookmarks(foldersUpdateCallback);
};

BookmarksAssistant.prototype.listRenderItems = function(list, offset, count)
{
    Mojo.Log.info("BookmarksAssistant#listRenderItems");
    
    try {
        var visibleItems = 0;
        
        if (this.mode === BookmarksAssistant.folder) {
            visibleItems = this.folderList.slice(offset, offset + count);
        } else {
            visibleItems = this.bookmarksList[this.currentFolder].slice(offset, offset + count);
        }
        
        list.mojo.noticeUpdatedItems(offset, visibleItems);
    } catch (e) {
        Mojo.Log.info("List is not ready (" + e + ")");
    }
};

BookmarksAssistant.prototype.listDelete = function(event)
{
    Mojo.Log.info("BookmarksAssistant#listDelete(" + event.item.id + ")");
    
    if (this.mode === BookmarksAssistant.folder) {
        Universe.getBookmarksManager().removeBookmarksInFolder(event.item.folder, this.updateScene.bind(this));
    } else {
        Universe.getBookmarksManager().removeBookmark(event.item.id, this.updateScene.bind(this));
    }
};

BookmarksAssistant.prototype.listTap = function(event)
{
    Mojo.Log.info("BookmarksAssistant#listTap");
    
    if (event.item) {
        if (this.controller.get(event.originalEvent.target).match("#edit")) {
            var id = event.item.id;
            var title = event.item.title;
            var url = event.item.url;
            var folder = event.item.folder;
            
            event.preventDefault();
            event.stopPropagation();
            
            this.controller.showDialog({
                    template: "bookmarks/bookmarks-add-dialog",
                    assistant: new AddBookmarkAssistant(this, id, title, url, folder, this.updateBookmark.bind(this), true),
                    mode: AddBookmarkAssistant.updateBookmark
                });
        } else {
            var type = event.item.class;
            
            if (type === BookmarksAssistant.folder) {
                this.currentFolder = event.item.folder;
                this.mode = BookmarksAssistant.bookmark;
                
                this.controller.get("bookmark-list").mojo.setLengthAndInvalidate(this.bookmarksList[this.currentFolder].length);
                this.controller.get("bookmark-list").mojo.revealItem(0, false);
            } else {
                var url = event.item.url;
        
                if (url && url.length > 0) {
                    this.controller.stageController.popScene({action: "loadURL", target: url});
                }
            }
        }
    }
};

BookmarksAssistant.prototype.syncBookmarks = function()
{
    var start = function() {
            Mojo.Log.info("BookmarksAssistant#start");
            
            var bannerMessage = $L("Starting Bookmark Sync");
            Mojo.Controller.getAppController().showBanner({
                    messageText: bannerMessage,
                    icon: "images/notification-small-sync.png"
                },
                {source: "notification"}, "Universe");
        };
    var progress = function() {
            //this.updateScene();
        };
    var finish = function(msg) {
            Mojo.Log.info("BookmarksAssistant#finish - " + msg);
            
            var bannerMessage = $L("Sync Complete! Loading bookmarks...");
            Mojo.Controller.getAppController().showBanner({
                    messageText: bannerMessage, 
                    icon: "images/notification-small-sync.png"
                }, {source: "notification"}, "Universe");
            
            this.updateScene();
        };
    var fail = function(msg) {
            Mojo.Log.info("BookmarksAssistant#fail - " + msg);
            
            var bannerMessage = $L("Failed to sync bookmarks");
            Mojo.Controller.getAppController().showBanner({
                    messageText: bannerMessage,
                    icon: "images/notification-small-sync.png"
                },
                {source: "notification"}, "Universe");
        };
    Universe.getBookmarksManager().syncBookmarks(start.bind(this), progress.bind(this), finish.bind(this), fail.bind(this));
};

BookmarksAssistant.prototype.handleCommand = function(event)
{
    Mojo.Log.info("BookmarksAssistant#handleCommand");
    var handled = false;
    
    if (event.type == Mojo.Event.back) {
        if (this.mode === BookmarksAssistant.bookmark) {
            this.mode = BookmarksAssistant.folder;
            
            this.controller.get("bookmark-list").mojo.setLengthAndInvalidate(this.folderList.length);
            this.controller.get("bookmark-list").mojo.revealItem(0, false);
            
            event.preventDefault();
            event.stopPropagation();
        }
    } else if (event.type == Mojo.Event.command) {
        switch (event.command) {
            case "do-sceneNewBookmark":
                this.controller.showDialog({
                        template: "bookmarks/bookmarks-add-dialog",
                        assistant: new AddBookmarkAssistant(this, -1, "", "",
                                        this.mode === BookmarksAssistant.bookmark ? this.currentFolder : $L("Unfiled"),
                                        this.addBookmark.bind(this), true),
                        mode: AddBookmarkAssistant.addBookmark
                    });
                break;
            case "do-sceneClearBookmarks":
                // TODO: Confirm!
                var callback = function() {
                        this.updateScene();
                    };
                Universe.getBookmarksManager().clearBookmarks(callback.bind(this));
                break;
            case "do-sceneSync":
                this.syncBookmarks();
                break;
        }
    }
    
    /*if (handled) {
        // stop propagation
    }*/
    
    return handled;
};
