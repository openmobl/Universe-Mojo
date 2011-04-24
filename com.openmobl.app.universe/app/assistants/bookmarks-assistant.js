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

function BookmarksAssistant(pageIdentifier)
{
    this.appMenuAttr = { omitDefaultItems: true };
    this.appMenuModel = {
        visible: true,
        items: [
            {label: $L("New Bookmark"), command: "do-sceneNewBookmark"}
        ]
    };
    this.cmdMenuAttr = { menuClass:"no-fade" };
    this.cmdMenuModel = {
        items: [
            {iconPath: "images/menu-icon-new-bookmark.png", command: "do-sceneNewBookmark"}
            ]
    };
    
    this.listDividerHandler = this.listDivider.bind(this);
    this.listTapHandler = this.listTap.bind(this);
    this.listDeleteHandler = this.listDelete.bind(this);
    this.listHoldHandler = this.listHold.bind(this);
    this.drawerTapHandler = this.drawerTap.bind(this);
    
    this.listRenderItemsHandler = this.listRenderItems.bind(this);
    this.listRenderFoldersHandler = this.listRenderFolders.bind(this);
    
    this.folderList = [
        {
            displayName: BookmarksAssistant.Unfiled,
            palmArrowOrientation: "palm-arrow-closed",
            folder: BookmarksAssistant.Unfiled,
            collapsedDisplay: "none",
            innerHTML: ""
        },
    ];
    this.folderListAttr = {
            itemTemplate: "bookmarks/bookmarks-list-container",
			itemsCallback: this.listRenderFoldersHandler
        };
    this.folderListModel = {
            items: []
        };
        
    this.bookmarksList = [];
    this.bookmarksListAttr = {
            itemTemplate: "bookmarks/bookmarks-list-item",
			itemsCallback: this.listRenderItemsHandler
        };
    this.bookmarksListModel = {
            items: []
        };
}


BookmarksAssistant.prototype.setup = function()
{
    this.setupMenus();
    //this.setupDrawers();
    
    this.controller.setupWidget("bookmarks-list-container", this.folderListAttr, this.folderListModel);
    
    //this.controller.listen("bookmarks-list-container", Mojo.Event.listTap, this.listTapHandler, false);
    //this.controller.listen("bookmarks-list-container", Mojo.Event.listDelete, this.listDeleteHandler, false);
    //this.controller.listen("bookmarks-list-container", Mojo.Event.hold, this.listHoldHandler, false);
    this.controller.listen("bookmarks-list-container", Mojo.Event.tap, this.drawerTapHandler, false);
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
    //this.controller.stopListening("bookmarks-list-container", Mojo.Event.listTap, this.listTapHandler, false);
    //this.controller.stopListening("bookmarks-list-container", Mojo.Event.listDelete, this.listDeleteHandler, false);
    //this.controller.stopListening("bookmarks-list-container", Mojo.Event.hold, this.listHoldHandler, false);
    this.controller.stopListening("bookmarks-list-container", Mojo.Event.tap, this.drawerTapHandler, false);
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
        this.updateScene();
    }
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
        if (this.bookmarksList[results[i].folder] == undefined) {
            this.bookmarksList[results[i].folder] = [];
        }
        this.bookmarksList[results[i].folder].push(results[i]);
    }

    this.folderList.each(function(item) {
            item.innerHTML = Mojo.View.render({collection: this.bookmarksList[item.folder], template: "bookmarks/bookmarks-list-item"});
            
            this.controller.get("bookmarks-list-container").mojo.setLengthAndInvalidate(this.folderList.length);
            this.controller.get("bookmarks-list-container").mojo.revealItem(0, false);
        }.bind(this));
};

BookmarksAssistant.prototype.foldersUpdate = function(results)
{
    Mojo.Log.info("BookmarksAssistant#foldersUpdate");
    
    var i = 0;
    
    this.folderList.clear();
    this.folderList = [];
    
    for (i = 0; i < results.length; i++) {
        if (!this.folderListContainsFolder(results[i].folder)) {
            var folderItem = {};

            folderItem.displayName = results[i].folder;
            folderItem.palmArrowOrientation = "palm-arrow-closed";
            folderItem.folder = results[i].folder;
            folderItem.collapsedDisplay = "none";
            folderItem.innerHTML = "";
            
            this.folderList.push(folderItem);
        }
    }
    
	var bookmarksUpdateCallback = this.bookmarksUpdate.bind(this);
    Universe.getBookmarksManager().getBookmarks(bookmarksUpdateCallback);
};


BookmarksAssistant.prototype.setupDrawers = function()
{
    Mojo.Log.info("BookmarksAssistant#setupDrawers");
};

BookmarksAssistant.prototype.updateScene = function()
{
    Mojo.Log.info("BookmarksAssistant#updateScene");
    
	var foldersUpdateCallback = this.foldersUpdate.bind(this);
    Universe.getBookmarksManager().getBookmarks(foldersUpdateCallback);
};

BookmarksAssistant.prototype.listDivider = function(itemModel)
{
    Mojo.Log.info("BookmarksAssistant#listDivider");
    
    Mojo.Log.info("Lookup divider name for item: " + Object.toJSON(itemModel));
    
    var label = itemModel.folder;
    
    return label;
};

BookmarksAssistant.prototype.listRenderItems = function(arrayName, list, offset, count)
{
    Mojo.Log.info("BookmarksAssistant#listRenderItems");
    
    try {
        var visibleItems = this.bookmarksList[arrayName].slice(offset, offset + count);
        
        list.mojo.noticeUpdatedItems(offset, visibleItems);
    } catch (e) {
        Mojo.Log.info("List is not ready");
    }
};


BookmarksAssistant.prototype.listRenderFolders = function(list, offset, count)
{
    Mojo.Log.info("BookmarksAssistant#listRenderFolders(" + offset + ", " + count + ")");
    
    try {
        var visibleItems = this.folderList.slice(offset, offset + count);
        
        list.mojo.noticeUpdatedItems(offset, visibleItems);
    } catch (e) {
        Mojo.Log.info("List is not ready");
    }
};

BookmarksAssistant.prototype.listDelete = function(event)
{
    Mojo.Log.info("BookmarksAssistant#listDelete(" + event.item.id + ")");
        
    Universe.getBookmarksManager().removeBookmark(event.item.id, this.updateScene.bind(this));
};

BookmarksAssistant.prototype.listTap = function(event)
{
    Mojo.Log.info("BookmarksAssistant#listTap");
    
    /*if (event.item) {
        var url = event.item.url;
        
        if (url && url.length > 0) {
            this.controller.stageController.popScene({action: "loadURL", target: url});
        }
    }*/
    var row = this.controller.get(event.target);
    while (row !== undefined && row.hasAttribute &&
        !row.hasAttribute("x-openmobl-browser-url")) {
        row = row.up();
    }
	if (row === undefined) {
        Mojo.Log.warn("Can't find row attribute");
    } else if (!row.hasAttribute) {
        Mojo.Log.warn("row.hasAttribute not defined!");
    } else if (row.hasAttribute("x-openmobl-browser-url")) {
        var url = row.readAttribute("x-openmobl-browser-url");
        var id = row.readAttribute("x-openmobl-browser-id");
        var title = row.readAttribute("x-openmobl-browser-title");
        var folder = row.readAttribute("x-openmobl-browser-folder");
        
        if (url.length > 0) {
            this.controller.stageController.popScene({action: "loadURL", target: url});
        }
    }
};

BookmarksAssistant.prototype.listHold = function(event)
{
    Mojo.Log.info("BookmarksAssistant#listHold");
    
    var row = this.controller.get(event.target);
    while (row !== undefined && row.hasAttribute &&
        !row.hasAttribute("x-openmobl-browser-url")) {
        row = row.up();
    }
	if (row === undefined) {
        Mojo.Log.warn("Can't find row attribute");
    } else if (!row.hasAttribute) {
        Mojo.Log.warn("row.hasAttribute not defined!");
    } else if (row.hasAttribute("x-openmobl-browser-url")) {
        var url = row.readAttribute("x-openmobl-browser-url");
        var id = row.readAttribute("x-openmobl-browser-id");
        var title = row.readAttribute("x-openmobl-browser-title");
        var folder = row.readAttribute("x-openmobl-browser-folder");
        
        if (url.length > 0) {
            event.preventDefault();
            event.stopPropagation();
            
            this.controller.showDialog({
                    template: "bookmarks/bookmarks-add-dialog",
                    assistant: new AddBookmarkAssistant(this, id, title, url, folder, this.updateBookmark.bind(this), true, true),
                    mode: AddBookmarkAssistant.updateBookmark
                });
        }
    }
};

/* From eMail application. Copyright (c) 2010 Palm, Inc. */
BookmarksAssistant.prototype.setDrawerState = function(id, expand)
{
	var rowElement = this.controller.get(id);
    var toggling;
	
	Mojo.Log.info("BookmarksAssistant#setDrawerState(): id=%s, expand=%s", id, expand);
	
	if (!rowElement || !rowElement.hasClassName("bookmark-category-container")) {
		return;
	}
	
	// Make sure it's visible -- it may have been hidden if user was filtering.
	rowElement.style.display = "";
	
	// Find the arrow button, and determine current drawer state
	var toggleButton = rowElement.querySelector("div.arrow-button");
	var currentlyExpanded = toggleButton.hasClassName("palm-arrow-expanded");
	
	if (!currentlyExpanded && !toggleButton.hasClassName("palm-arrow-closed")) {
		return;
	}
	
	// If 'expand' is not specified, toggle the state.
	// If the state is already correct, just return.
	if (expand === undefined) {
		expand = !currentlyExpanded;
		toggling = true;
	} else if(expand === currentlyExpanded) {
		return;
	}
	
	// get the container div.
	var container = this.controller.get(id + "-container");
	var maxHeight = container.offsetHeight;
	
	// Update classes on the button
	if (expand) {
		toggleButton.addClassName("palm-arrow-expanded");
		toggleButton.removeClassName("palm-arrow-closed");
		container.style.display = "";
		maxHeight = container.offsetHeight;
		container.style.height = "1px";

		// See if the div should scroll up a little to show the contents
        /*var elementTop = container.viewportOffset().top;
        var scroller = Mojo.View.getScrollerForElement(container);
        if (elementTop > viewPortMidway && scroller && toggling) {
            //Using setTimeout to give the animation time enough to give the div enough height to scroll to
            var scrollToPos = scroller.mojo.getScrollPosition().top - (elementTop - viewPortMidway);
            setTimeout(function() {scroller.mojo.scrollTo(undefined, scrollToPos, true);}, 200);
        }*/
	} else {
		container.style.height = maxHeight + "px";
		toggleButton.addClassName("palm-arrow-closed");
		toggleButton.removeClassName("palm-arrow-expanded");
	}

	// Animate height change on the container div.
	Mojo.Log.info("setDrawerState: reverse:%s, from: 1, maxHeight:%d", !currentlyExpanded, maxHeight);
	var options = {
            reverse: !currentlyExpanded,
            onComplete: this.animationComplete.bind(this, expand, rowElement.id, maxHeight, toggling),
            curve: "over-easy",
            from: 1,
            to: maxHeight,
            duration: 0.4
        };
	Mojo.Animation.animateStyle(container, "height", "bezier", options);
};

BookmarksAssistant.prototype.animationComplete = function(expand, accountId, listHeight, toggling, itemContainer, cancelled)
{
    if (!expand) {
        itemContainer.style.display = "none";
    }
    itemContainer.style.height = "auto";
};

BookmarksAssistant.prototype.drawerTap = function(event)
{
    Mojo.Log.info("BookmarksAssistant#drawerTap");
	if (event.target.hasAttribute("drawer")) {
		this.setDrawerState(event.target.getAttribute("drawer"));
		event.stopPropagation();
	} else {
        var row = this.controller.get(event.target);
        while (row !== undefined &&
            !row.hasAttribute("x-openmobl-browser-url") &&
            !row.hasAttribute("x-openmobl-browser-action")) {
            row = row.up();
        }
        if (row === undefined) {
            Mojo.Log.warn("Can't find row attribute");
        } else if (row.hasAttribute("x-openmobl-browser-action")) {
            this.listHold(event);
        } else if (row.hasAttribute("x-openmobl-browser-url")) {
            var url = row.readAttribute("x-openmobl-browser-url");
            var id = row.readAttribute("x-openmobl-browser-id");
            var title = row.readAttribute("x-openmobl-browser-title");
            var folder = row.readAttribute("x-openmobl-browser-folder");
            
            if (url.length > 0) {
                this.controller.stageController.popScene({action: "loadURL", target: url});
            }
        }
    }
};


BookmarksAssistant.prototype.handleCommand = function(event)
{
    Mojo.Log.info("BookmarksAssistant#handleCommand");
    var handled = false;
    
    if (event.type == Mojo.Event.command) {
        switch (event.command) {
            case "do-sceneNewBookmark":
                this.controller.showDialog({
                        template: "bookmarks/bookmarks-add-dialog",
                        assistant: new AddBookmarkAssistant(this, -1, "", "", $L("Unfiled"), this.addBookmark.bind(this), false, true),
                        mode: AddBookmarkAssistant.addBookmark
                    });
                break;
        }
    }
    
    /*if (handled) {
        // stop propagation
    }*/
    
    return handled;
};
