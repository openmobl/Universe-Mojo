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

Universe = {};

function AppAssistant()
{
    Mojo.Log.info("AppAssistant#new");
    
    Universe = this;
    
    this.mainStageName = "main";
    this.dockStageName = "dock";
    this.downloadsStageName = "downloads";
    this.mainSceneName = "page";
    this.dockSceneName = "topsites"; /* Same as topsites */
    this.bookmarksSceneName = "bookmarks";
    this.historySceneName = "history";
    this.preferencesSceneName = "preferences";
    this.viewOptionsSceneName = "viewoptions";
    this.topSitesSceneName = "topsites";
    this.aboutSceneName = "about";
    this.supportSceneName = "appsupportinfo";
    this.helpSceneName = "help";
    this.downloadsSceneName = "download";
    
    //this.menuAssistant = new MenuAssistant(this);
    this.tabManager = undefined;
    this.historyManager = undefined;
    this.bookmarksManager = undefined;
    this.prefsManager = undefined;
    this.cookie = {};
    this.prefs = {};
    this.needSetup = false;
}

AppAssistant.prototype.setup = function()
{
    Mojo.Log.info("AppAssistant#setup");
	/*
	This function is for setup tasks that have to happen when the app is first created.
	This should be used to intialize any application-level data structures.
	*/
    
    this.prefsManager = new PrefsManager();
    this.tabManager = new TabManager(this.controller);
    this.historyManager = new HistoryManager();
    this.bookmarksManager = new BookmarksManager(this.controller);
};

//AppAssistant.prototype.getMenuAssistant = function() { return this.menuAssistant; };
AppAssistant.prototype.getTabManager = function() { return this.tabManager; };
AppAssistant.prototype.getHistoryManager = function() { return this.historyManager; };
AppAssistant.prototype.getBookmarksManager = function() { return this.bookmarksManager; };
AppAssistant.prototype.getPrefsManager = function() { return this.prefsManager; };
AppAssistant.prototype.needsSetup = function() { return this.needSetup; };
AppAssistant.prototype.wasSetup = function() { this.needSetup = false; };
AppAssistant.prototype.getActiveStageController = function()
{
    var stageController = this.controller.getStageController(this.mainStageName);
    
    return stageController;
};

AppAssistant.prototype.clearHistory = function()
{
    this.getHistoryManager().clearHistory();
    this.getTabManager().clear(TabManager.clearHistory);
};
AppAssistant.prototype.clearCache = function()
{
    this.getTabManager().clear(TabManager.clearCache);
};
AppAssistant.prototype.clearCookies = function()
{
    this.getTabManager().clear(TabManager.clearCookies);
};

AppAssistant.prototype.launchSceneInMainCard = function(stageName, sceneName, params)
{
    var stageController = this.controller.getStageProxy(stageName);
	if (stageController) {
		stageController.pushScene(sceneName, params);
	} else {
        var that = this;
        this.controller.createStageWithCallback({
                    name: stageName,
                    lightweight: true,
                },
                function(stageController) {
                    stageController.pushScene(sceneName, params);
                },
                Mojo.Controller.StageType.card);
    }
};

AppAssistant.prototype.launchSceneInDownloads = function(stageName, sceneName, params)
{
    var stageController = this.controller.getStageProxy(stageName);
	if (stageController) {
		stageController.delegateToSceneAssistant("queueUpDownload", params);
	} else {
        var that = this;
        this.controller.createStageWithCallback({
                    name: stageName,
                    lightweight: true,
                },
                function(stageController) {
                    stageController.pushScene(sceneName, params);
                },
                Mojo.Controller.StageType.card);
    }
};

AppAssistant.prototype.launchTouchstone = function(sceneName, params)
{
	var dockStage = this.controller.getStageController(this.dockStageName);
	if (dockStage) {
		dockStage.window.focus();
	} else {
		var f = function(stageController) {
            var newParams = params;
            
            newParams.dockmode = true;
            
			stageController.pushScene(sceneName, newParams);
		}.bind(this);
		this.controller.createStageWithCallback({name: this.dockStageName, lightweight: true}, f, "dockMode");	
	}
};

AppAssistant.prototype.launchFavorites = function(params)
{
    this.launchSceneInMainCard(this.mainStageName, this.favoritesSceneName, params);
};

AppAssistant.prototype.launchHistory = function(params)
{
    this.launchSceneInMainCard(this.mainStageName, this.historySceneName, params);
};

AppAssistant.prototype.launchPreferences = function(params)
{
    this.launchSceneInMainCard(this.mainStageName, this.preferencesSceneName, params);
};

AppAssistant.prototype.launchViewOptions = function(params)
{
    this.launchSceneInMainCard(this.mainStageName, this.viewOptionsSceneName, params);
};

AppAssistant.prototype.launchDownloads = function(params)
{
    this.launchSceneInDownloads(this.downloadsStageName, this.downloadsSceneName, params);
};

AppAssistant.prototype.launchFilePicker = function(that)
{
    var params = {
        kinds: ["file"],
        extensions: ["htm", "html", "xhtml"],
        defaultKind: "file",
        onSelect: function(file) {
            var url = "file://" + file.fullPath;
            
            this.controller.serviceRequest("palm://com.palm.applicationManager",
                {
                    method: "open",
                    parameters: {
                        "id": "com.openmobl.app.universe",
                        "params": {"url": url}
                    }
                });
        }.bind(that)
    };
    Mojo.FilePicker.pickFile(params, that.controller.stageController); 
};

AppAssistant.prototype.launchAbout = function(params)
{
    this.launchSceneInMainCard(this.mainStageName, this.aboutSceneName, params);
};

AppAssistant.prototype.considerForNotification = function(notificationData)
{
	/*
	This function is called if all other notification commanders do not
	process a particular sendToNotification call. The assistant may perform
	any default processing here if desired.
	*/
};

AppAssistant.prototype.handleLaunch = function(params)
{
    Mojo.Log.info("AppAssistant#handleLaunch");
	/*
	This function is called after the application has launched by the user or
	the applicationManager service. This may be called while the app is already
	running.

	This function should handle any application-defined commands stored in the
	params field and launch the main stage, if necessary.
	*/

    Mojo.Log.info("Launched with params: " + Object.toJSON(params));

    var stageName = this.mainStageName + "-" + Date.now();
    
    if (params.dockMode || params.touchstoneMode) {
        this.launchTouchstone(this.dockSceneName, params);
    } else {
        this.getTabManager().openNewTab(params, stageName, this.mainSceneName);
    }
};

AppAssistant.prototype.handleCommand = function(event)
{
    //this.menuAssistant.handleCommand(event);
};

AppAssistant.prototype.cleanup = function()
{
	/* this function should do any cleanup needed before the app is destroyed */
    this.getPrefsManager().set("rotateLock", false);
};
