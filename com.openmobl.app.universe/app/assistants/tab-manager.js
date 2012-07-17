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
        Nelsun Apps

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

TabManager.clearCache = "clear-cache";
TabManager.clearCookies = "clear-cookies";
TabManager.clearHistory = "clear-history";

function TabManager(controller)
{
    Mojo.Log.info("TabManager#new");
    this.controller = controller;
    
    this.tabList = [];
}

TabManager.prototype.setup = function()
{

};

TabManager.prototype.cleanup = function()
{

};

TabManager.prototype.openNewTab = function(params, tabID, scene)
{
    Mojo.Log.info("TabManager#openNewTab");

    //Check for xapp launch
    if (params.token && params.caller) {
        //
        //Params are from a cross-app launch request.
        //
        Mojo.Log.error("TabManager#openNewTab: xapp request: params:", Object.toJSON(params));
       
        //Validate the request
        if (Universe.xappManager.security.appHasToken(params.caller, params.token)) {
           
            //Handle xapp request targetting a specific stage
            if (params.targetStageID) {
                tabID = params.targetStageID;
            }

            //
            //Process params...
            //
           
            //delete bookmark
            if (params.deletedBookmark) {
                //deletedBookmark contains id of bookmark to delete.
           
                var onDelete = function(transaction,result){
                        Mojo.Log.info("onDelete: ");
                        if(result){
                            Mojo.Log.info("onDelete: result: received: ");
                            Mojo.Log.info("onDelete: result: rows: length:", result.rows.length);
                        }
                    }.bind(this);
                
                Universe.getBookmarksManager().removeBookmarkByURLAndFolder(params.deletedBookmark.uri, params.deletedBookmark.folder, onDelete);
                return;
            }
           
            //delete folder
            if (params.deletedFolder) {
                //deletedBookmark contains id of bookmark to delete.
               
                var onDelete = function(transaction, result) {
                        Mojo.Log.info("onDelete: ");
                        if (result) {
                            Mojo.Log.info("onDelete: result: received: ");
                            Mojo.Log.info("onDelete: result: rows: length:", result.rows.length);
                        }
                    }.bind(this);
                
                Universe.getBookmarksManager().removeBookmarksInFolder(params.deletedFolder.title, onDelete);
                return;
            }
           
            //add / update bookmark
            if (params.addedBookmark || params.updatedBookmark) {
                //Add / update bookmark.
               
                var bookmark = params.addedBookmark ? params.addedBookmark : params.updatedBookmark;
               
                var onGetByURL = function(result) {
                        if (result && result.url) {
                            //Update existing bookmark
                            Universe.getBookmarksManager().updateBookmark(result.id,bookmark.uri, bookmark.title, "", bookmark.folder);
                        } else {
                            //Add new bookmark
                            Universe.getBookmarksManager().addBookmark(bookmark.uri, bookmark.title, "", bookmark.folder);
                        }
                    }.bind(this);
               
                Universe.getBookmarksManager().getByURL(bookmark.uri, onGetByURL);
                return;
            }
           
        } else {
            Mojo.Log.error("TabManager#openNewTab: xapp request: access denied: ");
            return;
        }
    }


	var stageController = this.controller.getStageProxy(tabID);
    var newParams = params || {};

    newParams.tabID = tabID;
    
    if (params && params.target) {
        newParams.url = params.target;
    }
    
	if (stageController) {
	    // If the stage has already launched or is in the process, forward the launch
	    // parameter on to the current scene for processing.
	    
	    //clear down any scenes until the bottom of the scene stack.
	    stageController.popScenesTo(stageController.getScenes()[0]);
	    
	    /*
	     since delegateToSceneAssistant sends to the top scene in the stack we need
	     to wait until the stackhas been cleared to the bottom scene.
	    */
	    var sendToScene = function() {
                if (stageController.getScenes().length === 1) {
                    //scene stack has cleared down - pass on params to scene.
                    stageController.delegateToSceneAssistant("handleLaunch", newParams);
                } else {
                    //Still waiting for scenestack to clear down.
                    setTimeout(sendToScene, 100);
                }
            };
	    //start monitoring for the scene stack clearing down.
	    sendToScene();
	} else {
		// The stage has not been created, initialize it and push the main scene after
		// initialization.
		this.controller.createStageWithCallback({
				name: tabID,
				lightweight: true,
			},
			function(stageController) {
				stageController.pushScene(scene, newParams);
			},
			Mojo.Controller.StageType.card);
	}
    
    this.tabList.push({id: tabID, title: "", url: "", controller: undefined});
};

TabManager.prototype.setTabTitle = function(id, title)
{
    Mojo.Log.info("TabManager#setTabTitle(", id, ",", title, ")");
    
    var setTitle = false;
    var i = 0;
    
    for (i = 0; i < this.tabList.length; i++) {
        if (this.tabList[i].id === id) {
            this.tabList[i].title = title;
            setTitle = true;
        }
    }
    
    if (!setTitle) {
        Mojo.Log.error("TabManager#setTabTitle -- Could not set tab title (", title, ") for id:", id);
    }
};

TabManager.prototype.setTabURL = function(id, url)
{
    Mojo.Log.info("TabManager#setTabURL(", id, ",", url, ")");
    
    var setURL = false;
    var i = 0;
    
    for (i = 0; i < this.tabList.length; i++) {
        if (this.tabList[i].id === id) {
            this.tabList[i].url = url;
            setURL = true;
        }
    }
    
    if (!setURL) {
        Mojo.Log.error("TabManager#setTabURL -- Could not set tab url (", url, ") for id: ", id);
    }
};

TabManager.prototype.setTabController = function(id, controller)
{
    Mojo.Log.info("TabManager#setTabController(", id, ")");
    
    var setController = false;
    var i = 0;
    
    for (i = 0; i < this.tabList.length; i++) {
        if (this.tabList[i].id === id) {
            this.tabList[i].controller = controller;
            setController = true;
        }
    }
    
    if (!setController) {
        Mojo.Log.error("TabManager#setTabTitle -- Could not set tab controller for id: ", id);
    }
};

TabManager.prototype.clear = function(method)
{
    Mojo.Log.info("TabManager#clear(", method, ")");
    
    var i = 0;
    
    for (i = 0; i < this.tabList.length; i++) {
        if (this.tabList[i].controller !== undefined) {
            if (method === TabManager.clearCache) {
                this.tabList[i].controller.clearCache();
            } else if (method === TabManager.clearCookies) {
                this.tabList[i].controller.clearCookies();
            } else if (method === TabManager.clearHistory) {
                this.tabList[i].controller.clearHistory();
            }
        }
    }
};

TabManager.prototype.getTabList = function()
{
    return this.tabList;
};

TabManager.prototype.closeTab = function(id)
{
    Mojo.Log.info("TabManager#closeTab(", id, ")");
    var i = 0;
    var pos = -1;
    
    for (i = 0; i < this.tabList.length; i++) {
        if (this.tabList[i].id === id) {
            pos = i;
            break;
        }
    }
    
    if (pos != -1) {
        this.tabList.splice(pos, 1);
    }
};

TabManager.prototype.gotoTab = function(id)
{
    Mojo.Log.info("TabManager#gotoTab(", id, ")");
    
    var stageController = this.controller.getStageProxy(id);
    if (stageController) {
        stageController.activate();
    } else {
        Mojo.Log.info("No stage controller for: ", id);
    }
};
