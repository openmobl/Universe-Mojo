/*
    The contents of this file are subject to the Mozilla Public License
    Version 1.1 (the "License"); you may not use this file except in
    compliance with the License. You may obtain a copy of the License at
    http://www.mozilla.org/MPL/

    Software distributed under the License is distributed on an "AS IS"
    basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See the
    License for the specific language governing rights and limitations
    under the License.

    The Original Code is Nelsun Apps code.

    The Initial Developer of the Original Code is OpenMobl Systems.
    Portions created by OpenMobl Systems are Copyright (C) 2010-2011
    OpenMobl Systems. All Rights Reserved.

    Contributor(s):
        Nelsun Apps
        OpenMobl Systems
        Donald C. Kirker

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
 
function CrossAppSecurity()
{
    this._issuedTokens = [];
}

CrossAppSecurity.prototype.appHasToken = function(appid, token)
{
    var result = this._issuedTokens[appid];
    
    return result == token;
}

CrossAppSecurity.prototype.getAppToken = function(appid){
    var result = this._issuedTokens[appid];
    
    if (!result) {
        var newToken = new Date().getTime().toString();
        this._issuedTokens[appid] = newToken;
        result = this._issuedTokens[appid];
    }
    
    return result;
}

CrossAppSecurity.prototype.removeToken = function(token)
{
    var tokenIndex = this._issuedTokens.indexOf(token);
    
    if (tokenIndex > -1) {
        this._issuedTokens.splice(tokenIndex,1);
    }
}


function CrossAppManager()
{
    this.security = new CrossAppSecurity();
    this.deskmarks = new CrossAppDeskmarks(this);
    
}

CrossAppManager.prototype.launch = function(stageController, appParams, launchParams)
{    
    //Attach cross-app config (for callbacks via cross app launching).
    if(!launchParams.xapp){
        launchParams.xapp = {};
    }
    
    launchParams.xapp.token = this.security.getAppToken(appParams.appId);
    launchParams.xapp.caller = Mojo.appInfo.id;
    launchParams.xapp.icon = Mojo.appInfo.icon;
    launchParams.xapp.path = Mojo.appPath;
    launchParams.xapp.targetStageID = stageController.window.name;
    launchParams.xapp.theme = "palm-default";
    launchParams.xapp.methods = {
        addedBookmark: {
            param:"addedBookmark"
        },
        deletedBookmark: {
            param:"deletedBookmark"
        },
        deletedFolder: {
            param:"deletedFolder"
        },
        updatedBookmark: {
            param:"updatedBookmark"
        },
        openBookmark: {
            param:"target"
        }                    
    }
    Mojo.Log.error("Universe: stageName: ", launchParams.xapp.targetStageID);
    
    /* TODO: We need to check to see if the app we are xlaunching is actually installed */
    stageController.pushScene(appParams, launchParams);
}

function CrossAppDeskmarks(CrossAppManager)
{
    this.manager = CrossAppManager;
    
    this.config = {
        appid: "com.nelsun.deskmarks",
        launchParams: {
            broadcastBookmark: "broadcastBookmark",
            broadcastBookmarkCatch: "broadcastBookmarkCatch",
            showBookmarks: "list",
            bookmarkEdit: "bookmarkEdit"
        }
    }
}

CrossAppDeskmarks.prototype.bookmarkAdd = function(stageController, bookmark)
{    
    //Get all bookmarks (to build folder list from) and pass on to Deskmarks via xapp launch
    
    var getBookmarksCallback = function(results) {
        var folderNames = [];
        var folders = [];
        var folderName;
        
        //Convert bookmarks and folders into Deskmarks format.
        for (var i = 0; i < results.length; i++) {
            folderName = results[i].folder;
            var folderIndex = folderNames.indexOf(folderName.toLowerCase());
            
            if (folderIndex < 0) {
                var folder = {
                    id: new Date().getTime(),
                    title: folderName,
                    type: "place-container",
                    readonly: true
                }
                folders.push(folder);
                folderNames.push(folderName.toLowerCase());
            }
        }
        delete foldersMade;
        delete results;
        delete folder;
        
        //Create xapp launch params.
        var appParams = {
            appId: this.config.appid,
            name: this.config.launchParams.bookmarkEdit
        };
        var launchParams = {
            bookmark: this.convertBookmarkForDeskmarks(bookmark),
            folders: folders
        };
        
        //Execute the xapp launch
        this.manager.launch(stageController,appParams,launchParams);
    }.bind(this);
    
    Universe.getBookmarksManager().getBookmarks(getBookmarksCallback);
}
//CrossAppDeskmarks.prototype.bookmarkEdit = function(stageController, bookmark){
//    //Create xapp launch params.
//    var appParams = {
//        appId: this.config.appid
//        ,name: this.config.launchParams.bookmarkEdit
//    };
//    var launchParams = {
//        bookmark: this.convertBookmarkForDeskmarks(bookmark)
//    };
//    
//    this.manager.launch(stageController,appParams, launchParams);
//}

CrossAppDeskmarks.prototype.convertBookmarkForDeskmarks = function(bookmark)
{
    //convert this apps bookmark object to Deskmarks format
    if (!bookmark) {
        return {
           id: -1,
           title: "",
           type: "place",
           uri: "http://",
           readonly: false,
           folder: L$("Unfiled")
        }   
    }
    return {
        id: bookmark.id,
        title: bookmark.title,
        type: "place",
        uri: bookmark.url,
        readonly: false,
        folder: bookmark.folder
    }
}

CrossAppDeskmarks.prototype.broadcastURL = function(stageController, url, title)
{
    //Create xapp launch params.
    var appParams = {
        appId: this.config.appid,
        name: this.config.launchParams.broadcastBookmark
    };
    var launchParams = {
        url: url,
        name: title
    }
    this.manager.launch(stageController, appParams, launchParams);
}
CrossAppDeskmarks.prototype.broadcastURLCatch = function(stageController)
{
    //Create xapp launch params.
    var appParams = {
        appId: this.config.appid,
        name: this.config.launchParams.broadcastBookmarkCatch
    };
    var launchParams = {};
    
    this.manager.launch(stageController,appParams, launchParams);
}
CrossAppDeskmarks.prototype.showBookmarks = function(stageController){
    var getBookmarksCallback = function(results) {
        var foldersMade = [];
        var folders = [];
        var folderName;
        
        //Convert bookmarks and folders into Deskmarks format.
        for (var i = 0; i < results.length; i++) {
            folderName = results[i].folder;
            var folderIndex = foldersMade.indexOf(folderName.toLowerCase());
            
            if (folderIndex < 0) {
                var folder = {
                    id: new Date().getTime(),
                    allowAddBookmark: true,
                    title: folderName,
                    type: "place-container",
                    readonly: false,
                    children:[]
                }
                folders.push(folder);
                folderIndex = folders.length - 1;
                foldersMade.push(folderName.toLowerCase());
            }
            folders[folderIndex].children.push(
                this.convertBookmarkForDeskmarks(results[i])
            );
        }
        delete foldersMade;
        delete results;
        delete folder;
        delete folderIndex;
        
        //Create xapp launch params.
        var appParams = {
            appId: this.config.appid,
            name: this.config.launchParams.showBookmarks
        };
        //Create params to pass in to deskmarks list view.
        var launchParams = {
            title: "Bookmarks",
            allowAddBookmark: true,
            xapp: {
                bookmarks: folders
            }
        };
        //Execute the xapp launch
        this.manager.launch(stageController, appParams, launchParams);
    }.bind(this);
    
    //Get all bookmarks and pass them on to Deskmarks via xapp launch
    Universe.getBookmarksManager().getBookmarks(getBookmarksCallback);
}
