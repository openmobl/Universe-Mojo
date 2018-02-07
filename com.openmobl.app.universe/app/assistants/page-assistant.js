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

/* TODO: Remove constants from here and use ones from their appropriate locations */

PageAssistant.ContextMenu = {
    NewCard: {label: $L("Open in New Card"), command: "do-ctxNewCard"},
    Bookmark: {label: $L("Add Link to Bookmarks"), command: "do-ctxBookmark"},
    CopyLink: {label: $L("Copy Link"), command: "do-ctxCopy"},
    TweetThis: {label: $L("Tweet this"), command: "do-ctxTweet"},
    DialWithPhone: {label: $L("Phone"), command: "do-ctxDialPhone"},
    DialWith: {
        label: $L("Dial with..."),
        items: [
            {label: $L("Phone"), command: "do-ctxDialPhone"}
        ]
    },
    TextNumber: {label: $L("Text"), command: "do-ctxTextNum"},
    AddToContacts: {label: $L("Add To Contacts"), command: "do-ctxAddToContacts"},
    SaveImage: {label: $L("Download Image"), command: "do-downloadImage"},
    DownloadAs: {label: $L("Download Link"), command: "do-downloadAs"}
};

PageAssistant.errorCodes = {
    HTTP_DENIED: 403,
    HTTP_NOT_FOUND: 404,
    
    ERR_USER_CANCELED: 1000,
    ERR_NO_INTERNET_CONNECTION: 1005,
    
    CURLE_UNSUPPORTED_PROTOCOL: 2001,
    CURLE_URL_MALFORMAT: 2003,
    CURLE_COULDNT_RESOLVE_HOST: 2006,
    CURLE_COULDNT_CONNECT: 2007,
    CURLE_REMOTE_ACCESS_DENIED: 2009,
    CURLE_HTTP_RETURNED_ERROR: 2022,
    CURLE_WRITE_ERROR: 2023,
    CURLE_OPERATION_TIMEDOUT: 2028,
    CURLE_SSL_CONNECT_ERROR: 2035,
    CURLE_FILE_COULDNT_READ_FILE: 2037,
    CURLE_TOO_MANY_REDIRECTS: 2047,
    CURLE_SEND_ERROR: 2055,
    CURLE_RECV_ERROR: 2056,
    CURLE_SSL_CERTPROBLEM: 2058,
    CURLE_SSL_CIPHER: 2059,
    CURLE_SSL_CACERT: 2060,
    CURLE_BAD_CONTENT_ENCODING: 2061,
    CURLE_USE_SSL_FAILED: 2064,
    CURLE_LOGIN_DENIED: 2067,
    CURLE_SSL_CACERT_BADFILE: 2077,
    CURLE_SSL_CRL_BADFILE: 2082,
    CURLE_SSL_ISSUER_ERROR: 2083,

};

PageAssistant.aboutTranslate = {
    "about": {
        "blank": { file: "blank.html" },
        "browser": { file: "browser.html" },
        "home": { file: "home.html" },
        "poem": { file: "poem.html" },
        "license": { file: "license.html" },
        "plugins": { file: "plugins.html" },
        "notfound": { file: "errors/notfound.html" },
        "nointernet": { file: "errors/nointernet.html" },
        "nohost": { file: "errors/nohost.html" },
        "accessdenied": { file: "errors/accessdenied.html" },
        "redirects": { file: "errors/redirects.html" },
        "timeout": { file: "errors/timeout.html" }
    }
};

function PageAssistant(params)
{
    if (params.url) {
        this.loadingURL = params.url;
    } else {
        this.loadingURL = undefined;
    }
    this.errorURL = undefined;
    this.url = undefined;
    this.title = undefined;
    
    if (params.search !== undefined) {
        this.search = UrlUtil.decode(params.search);
    } else {
        this.search = undefined;
    }
    
    this.firstOpen = true;
    
    /* Attributes */
    this.webView = null;
    this.webViewAttr = {
        minFontSize: 12,
        cacheAdapter: true, /* TODO: What to do about defaults re private browsing */
        /*interrogateClicks: true,*/
        showClickedLink: true
    };
    this.webViewModel = {};
    
    this.menuAssistant = new MenuAssistant(Universe, this);
    
    this.progressBar = null;
    this.bookmarked = null;
    
    /* We were created as a new page. Need to load in the identifier. */
    if (params.pageIdentifier !== undefined) {
        this.webViewAttr.pageIdentifier = params.pageIdentifier;
    }
    this.tabID = params.tabID;
    
    /* General callbacks */
    this.keyDownHandler             = this.keyDown.bind(this);
    this.focusHandler               = this.blur.bind(this);
    this.blurHandler                = this.focus.bind(this);
    
    /* Setup callbacks for the webView */
    this.onLoadStartHandler         = this.onLoadStart.bind(this);
    this.onLoadProgressHandler      = this.onLoadProgress.bind(this);
    this.onLoadStopHandler          = this.onLoadStop.bind(this);
    this.onLoadFailedHandler        = this.onLoadFailed.bind(this);
    this.onDownloadFinishedHandler  = this.onDownloadFinished.bind(this);
    this.onLinkClickedHandler       = this.onLinkClicked.bind(this);
    this.onTitleURLChangedHandler   = this.onTitleURLChanged.bind(this);
    this.onTitleChangedHandler      = this.onTitleChanged.bind(this);
    this.onURLChangedHandler        = this.onURLChanged.bind(this);
    this.onCreatePageHandler        = this.onCreatePage.bind(this);
    this.onTapRejectedHandler       = this.onTapRejected.bind(this);
    this.onViewEditorFocusedHandler = this.onViewEditorFocused.bind(this);
    this.onUrlRedirectHandler       = this.onUrlRedirect.bind(this);
    //this.onModifierTapHandler       = this.onModifierTap.bind(this);
    this.onFirstPaintHandler        = this.onFirstPaint.bind(this);
    this.mimeNotSupportedHandler    = this.mimeNotSupported.bind(this);
    this.documentLoadErrorHandler   = this.documentLoadError.bind(this);
    this.onSingleTapHandler         = this.onSingleTap.bind(this);
    this.updateHistoryHandler       = this.updateHistory.bind(this);
    this.downloadFileHandler        = this.downloadFile.bind(true);
    this.pluginSpotlightStartHandler= this.pluginSpotlightStart.bind(this);
    this.pluginSpotlightEndHandler  = this.pluginSpotlightEnd.bind(this);
    this.browserServerConnectedHandler = this.browserServerConnected.bind(this);
    this.browserServerDisconnectedHandler = this.browserServerDisconnected.bind(this);
    
    /* Setup callbacks for the Addressbar */
    this.openURLHandler             = this.openURL.bind(this);
    this.reloadHandler              = this.reload.bind(this);
    this.stopHandler                = this.stopLoad.bind(this);
    
    /* General callbacks */
    this.holdEventHandler           = this.holdEvent.bind(this);
    this.movementEventHandler       = this.movementEvent.bind(this);
    this.scrollStartEventHandler    = this.scrollStartEvent.bind(this);
    
    this.isEditing = false;
    this.hasEdited = false; /* TODO: We need to check to see if we have edited input on the page and not submitted it */
    this.wvCanGoForward = false;
    this.wvCanGoBack = false;
    this.chromeHidden = false;
    //this.doubleTap = false;
    this.privateBrowsing = false;
    this.isSpotlight = false;
    
    Universe.getTabManager().setTabController(this.tabID, this);
}


PageAssistant.prototype.setup = function()
{
	/* this function is for setup tasks that have to happen when the scene is first created */
		
	/* Setup templates */
	this.addressBar = new AddressBar(this.controller, this.openURLHandler,
                                     this.reloadHandler, this.stopHandler,
                                     this.showChromeIfNeeded.bind(this));
    this.addressBar.setup();
    
	/* Widget creation */
    this.setupMenus();    
    this.setupWebView();
    
    this.controller.setupWidget('server-disconnected-spinner', {spinnerSize: Mojo.Widget.spinnerLarge});
    this.disconnectedScrim = this.controller.get('server-disconnected');
    this.disconnectedScrim.hide();
    this.disconnectedSpinner = this.controller.get('server-disconnected-spinner');
    
	
	/* Event Handlers */
    //this.controller.listen(this.controller.sceneElement, Mojo.Event.tap, this.onSingleTapHandler, false);
    this.controller.listen(this.controller.sceneElement, Mojo.Event.keydown, this.keyDownHandler, false);
    this.controller.listen(this.controller.sceneElement, Mojo.Event.stageActivate, this.focusHandler, false);
    this.controller.listen(this.controller.sceneElement, Mojo.Event.stageDeactivate, this.blurHandler, false);
    this.controller.listen(this.controller.getSceneScroller(), Mojo.Event.scrollStarting, this.scrollStartEventHandler, false);
    this.controller.listen("web-page", Mojo.Event.hold, this.holdEventHandler, false);

    this.webView.addEventListener(Mojo.Event.webViewLoadStarted, this.onLoadStartHandler, false);
    this.webView.addEventListener(Mojo.Event.webViewLoadProgress, this.onLoadProgressHandler, false);
    this.webView.addEventListener(Mojo.Event.webViewLoadStopped, this.onLoadStopHandler, false);
    this.webView.addEventListener(Mojo.Event.webViewLoadFailed, this.onLoadFailedHandler, false);
    this.webView.addEventListener(Mojo.Event.webViewDownloadFinished, this.onDownloadFinishedHandler, false);
    /* webViewLinkClicked seems to cause the page to reload when embedded ads (like on nytimes.com) are loaded... */
    //this.webView.addEventListener(Mojo.Event.webViewLinkClicked, this.onLinkClickedHandler, false);
    this.webView.addEventListener(Mojo.Event.webViewTitleUrlChanged, this.onTitleURLChangedHandler, false);
    this.webView.addEventListener(Mojo.Event.webViewTitleChanged, this.onTitleChangedHandler, false);
    this.webView.addEventListener(Mojo.Event.webViewUrlChanged, this.onURLChangedHandler, false);
    this.webView.addEventListener(Mojo.Event.webViewCreatePage, this.onCreatePageHandler, false);
    this.webView.addEventListener(Mojo.Event.webViewTapRejected, this.onTapRejectedHandler, false);
    this.webView.addEventListener(Mojo.Event.webViewEditorFocused, this.onViewEditorFocusedHandler, false);
    this.webView.addEventListener(Mojo.Event.webViewUrlRedirect, this.onUrlRedirectHandler, false);
    //this.webView.addEventListener(Mojo.Event.webViewModifierTap, this.onModifierTapHandler, false);
    this.webView.addEventListener(Mojo.Event.webViewFirstPaintComplete, this.onFirstPaintHandler, false);
    this.webView.addEventListener(Mojo.Event.webViewMimeNotSupported, this.mimeNotSupportedHandler, false);
    this.webView.addEventListener(Mojo.Event.webViewSetMainDocumentError, this.documentLoadErrorHandler, false);
    this.webView.addEventListener(Mojo.Event.webViewUpdateHistory, this.updateHistoryHandler, false);
    this.webView.addEventListener(Mojo.Event.webViewPluginSpotlightStart, this.pluginSpotlightStartHandler, false);
    this.webView.addEventListener(Mojo.Event.webViewPluginSpotlightEnd, this.pluginSpotlightEndHandler, false);
    this.webView.addEventListener(Mojo.Event.webViewServerConnect, this.browserServerConnectedHandler, false);
    this.webView.addEventListener(Mojo.Event.webViewServerDisconnect, this.browserServerDisconnectedHandler, false);
    this.webView.addEventListener(Mojo.Event.webViewMimeHandoff, this.downloadFileHandler, false);
    this.webView.addEventListener("singletap", this.onSingleTapHandler, true);
    /*
    this.webView.addEventListener(Mojo.Event.webViewScrollAndScaleChanged, 
    */
    
    this.setupPageBackground();
};


PageAssistant.prototype.setupPageBackground = function()
{
    var mode = (this.controller.window.innerWidth < this.controller.window.innerHeight) ? "portrait" : "landscape";
    
    Mojo.Log.info("PageAssistant#setupPageBackground: ", mode);
    
    var background = this.controller.get("background");
    
    switch (mode) {
        case "portrait":
            background.setAttribute("class", "page-background");
            break;
        case "landscape":
            background.setAttribute("class", "page-background-landscape");
            break;
    }
};

PageAssistant.prototype.aboutToActivate = function(callback)
{
    callback.defer(); //makes the setup behave like it should.
};

PageAssistant.prototype.setupMenus = function()
{
    this.menuAssistant.showBrowserIcons();
    this.menuAssistant.showMainMenu();
};

PageAssistant.prototype.setupWebView = function()
{
    this.progressBar = this.controller.get("progress-bar");
    this.bookmarked = this.controller.get("bookmarked");
    
    this.controller.setupWidget("web-page", this.webViewAttr, this.webViewModel);
    this.webView = this.controller.get("web-page");
};

PageAssistant.prototype.setupRedirects = function()
{
    try {
        /* The call to Mojo.loadJSONFile in webView widget is broken, manually update this... File a bug @ Palm */
        // TODO: Update the Maps URL
        this.webView.mojo.addUrlRedirect("^http://((www\\.)?google\\.(com|[a-z]{2}|com?\\.[a-z]{2})/maps(/m)?|maps\\.google\\.(com|[a-z]{2}|com?\\.[a-z]{2})(/maps(/m)?)?)(/)?(\\?.*)?$", true, "com.palm.app.maps", 0);
        this.webView.mojo.addUrlRedirect("^[^:]+://www.youtube.com/watch\\?v=", true, "com.palm.app.youtube", 0);
        //this.webView.mojo.addUrlRedirect("^[^:]+://m.youtube.com/watch", true, "com.palm.app.youtube", 0);
        this.webView.mojo.addUrlRedirect("^http://developer.palm.com/appredirect/?", true, "com.palm.app.findapps", 0);
        this.webView.mojo.addUrlRedirect("^about:", true, "com.openmobl.app.universe", 0);
    } catch (e) {
        Mojo.Log.error("PageAssistant#setupRedirects - e: ", e);
    }
};

PageAssistant.prototype.finalActivate = function(results)
{
    Mojo.Log.info("PageAssistant#finalActivate()");
    
    if (!Utils.toBool(results["hideIconsWhileBrowsing"])) {
        this.menuAssistant.finishSceneLoad();
    }
    
    this.updateChrome();
    
    if (Utils.toBool(results["hideIconsWhileBrowsing"])) {
        this.addressBar.setShouldHide(true);
    }
    
    if (this.firstOpen) {
        if (this.webViewAttr.pageIdentifier === undefined &&
            this.search === undefined &&
            this.loadingURL === undefined) {
            switch (results["openOnStart"]) {
                case "homepage":
                    this.loadingURL = results["homePage"];
                    break;
                case "blank":
                    this.loadingURL = "about:blank";
                    break;
            }
        }
    }

    try {
        this.webView.mojo.setBlockPopups(Utils.toBool(results["blockPopUps"]));
        this.webView.mojo.setAcceptCookies(Utils.toBool(results["acceptCookies"]));
        this.webView.mojo.setEnableJavaScript(Utils.toBool(results["enableJS"]));
    } catch (e) {
        Mojo.Log.error("PageAssistant#finalActivate - e: ", e);
    }
    
    this.setupRedirects();
    
    if (this.controller.stageController.setWindowOrientation && Utils.toBool(Universe.getPrefsManager().get("autoRotate"))) {
        this.controller.stageController.setWindowOrientation("free");
    }
    
    //this.addressBar.startListening();
    this.addressBar.show(true);
    if (this.loadingURL !== undefined) {
        this.openURL(this.loadingURL);
    }
    this.privateBrowsing = Utils.toBool(results["privateBrowsing"]);
    this.addressBar.showPrivateBrowsing(this.privateBrowsing);
    
    if (Utils.toBool(results["enableMetrix"])) {
        Universe.identify();
    } else if (!Utils.toBool(results["enableMetrixPrompted"])) {
        Universe.identifyPrompt(this.controller);
    }
    
    
    /*if (results["openOnStart"] !== "blank") {
        this.addressBar.changeMode("title");
    } else {
        this.addressBar.changeMode("url");
        this.addressBar.selectText();
    }*/
    this.addressBar.changeMode("title");
    
    if (this.search !== undefined) {
        this.addressBar.startActivity(this.search);
        this.search = undefined;
    }
    
    //this.firstOpen = false;
    
    Universe.metrix.checkBulletinBoard(this.controller);

    Universe.getPrefsManager().removeWatcher(this.tabID + "-start");
    Universe.getPrefsManager().addWatcher(this.tabID, this.handlePrefsChanged.bind(this));
};

PageAssistant.prototype.handleLaunch = function(params)
{
    if (params.url) {
        this.openURL(params.url);
        this.controller.stageController.popScenesTo(this.controller);
    }
};


PageAssistant.prototype.activate = function(event)
{
    Mojo.Log.info("PageAssistant#activate()");
    if (Universe.getPrefsManager().hasStarted()) {
        Mojo.Log.info("Preference database has loaded");
        
        this.finalActivate(Universe.getPrefsManager().getAll());
    } else {
        Mojo.Log.info("Preference database has not loaded");
        
        Universe.getPrefsManager().addWatcher(this.tabID + "-start", this.finalActivate.bind(this));
    }
    
    /* We received an event from a previous scene. We must act on it. */
    if (event) {
        Mojo.Log.error("Activating -- event:", event.type, "action:", event.action); // SENTINAL FOR ALPHA DEBUGGING
        
        switch (event.action) {
            case "loadURL":
                this.loadingURL = event.target;
                break;
            default:
                break;
        }
    }
    
    if (event || (this.firstOpen && Universe.getPrefsManager().hasStarted())) {
        Mojo.Log.error("Loading a url -- event:", event, ", firstOpen:", this.firstOpen);
        
        this.addressBar.show(true);
        if (this.loadingURL !== undefined) {
            this.openURL(this.loadingURL);
        }
        
        
        /*if (Universe.getPrefsManager().get("openOnStart") !== "blank") {
            this.addressBar.changeMode("title");
        } else {
            this.addressBar.changeMode("url");
            this.addressBar.selectText();
        }*/
        this.addressBar.changeMode("title");
        
        if (this.search !== undefined) {
            this.addressBar.startActivity(this.search);
            this.search = undefined;
        }
        
        this.firstOpen = false;
    }
};

PageAssistant.prototype.deactivate = function(event)
{
    //this.addressBar.deactivate();
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
};

PageAssistant.prototype.cleanup = function(event)
{
    if (this.isSpotlight) {
        this.pluginSpotlightEnd();
    }
    
    Universe.getPrefsManager().removeWatcher(this.tabID);
    Universe.getTabManager().closeTab(this.tabID);
    
	/* Event Handlers */
    this.webView.removeEventListener(Mojo.Event.webViewLoadStarted, this.onLoadStartHandler, false);
    this.webView.removeEventListener(Mojo.Event.webViewLoadProgress, this.onLoadProgressHandler, false);
    this.webView.removeEventListener(Mojo.Event.webViewLoadStopped, this.onLoadStopHandler, false);
    this.webView.removeEventListener(Mojo.Event.webViewLoadFailed, this.onLoadFailedHandler, false);
    this.webView.removeEventListener(Mojo.Event.webViewDownloadFinished, this.onDownloadFinishedHandler, false);
    this.webView.removeEventListener(Mojo.Event.webViewLinkClicked, this.onLinkClickedHandler, false);
    this.webView.removeEventListener(Mojo.Event.webViewTitleUrlChanged, this.onTitleURLChangedHandler, false);
    this.webView.removeEventListener(Mojo.Event.webViewTitleChanged, this.onTitleChangedHandler, false);
    this.webView.removeEventListener(Mojo.Event.webViewUrlChanged, this.onURLChangedHandler, false);
    this.webView.removeEventListener(Mojo.Event.webViewCreatePage, this.onCreatePageHandler, false);
    this.webView.removeEventListener(Mojo.Event.webViewTapRejected, this.onTapRejectedHandler, false);
    this.webView.removeEventListener(Mojo.Event.webViewEditorFocused, this.onViewEditorFocusedHandler, false);
    this.webView.removeEventListener(Mojo.Event.webViewUrlRedirect, this.onUrlRedirectHandler, false);
    //this.webView.removeEventListener(Mojo.Event.webViewModifierTap, this.onModifierTapHandler, false);
    this.webView.removeEventListener(Mojo.Event.webViewFirstPaintComplete, this.onFirstPaintHandler, false);
    this.webView.removeEventListener(Mojo.Event.webViewMimeNotSupported, this.mimeNotSupportedHandler, false);
    this.webView.removeEventListener(Mojo.Event.webViewSetMainDocumentError, this.documentLoadErrorHandler, false);
    this.webView.removeEventListener(Mojo.Event.webViewUpdateHistory, this.updateHistoryHandler, false);
    this.webView.removeEventListener(Mojo.Event.webViewPluginSpotlightStart, this.pluginSpotlightStartHandler, false);
    this.webView.removeEventListener(Mojo.Event.webViewPluginSpotlightEnd, this.pluginSpotlightEndHandler, false);
    this.webView.removeEventListener(Mojo.Event.webViewServerConnect, this.browserServerConnectedHandler, false);
    this.webView.removeEventListener(Mojo.Event.webViewServerDisconnect, this.browserServerDisconnectedHandler, false);
    this.webView.removeEventListener(Mojo.Event.webViewMimeHandoff, this.downloadFileHandler, false);
    this.webView.removeEventListener("singletap", this.onSingleTapHandler, true);
    /*
    this.webView.removeEventListener(Mojo.Event.webViewScrollAndScaleChanged,
    */
    this.controller.stopListening("web-page", Mojo.Event.hold, this.holdEventHandler, false);
    this.controller.stopListening(this.controller.getSceneScroller(), Mojo.Event.scrollStarting, this.scrollStartEventHandler, false);
    this.controller.stopListening(this.controller.sceneElement, Mojo.Event.stageDeactivate, this.blurHandler, false);
    this.controller.stopListening(this.controller.sceneElement, Mojo.Event.stageActivate, this.focusHandler, false);
    this.controller.stopListening(this.controller.sceneElement, Mojo.Event.keydown, this.keyDownHandler, false);
    //this.controller.stopListening(this.controller.sceneElement, Mojo.Event.tap, this.onSingleTapHandler, false);

    this.addressBar.cleanup();
    this.deleteView();
};

PageAssistant.prototype.orientationChanged = function(event)
{
    Mojo.Log.info("PageAssistant#orientationChanged");
    this.setupPageBackground();
    this.addressBar.orientationChanged(event);
};

PageAssistant.prototype.handlePrefsChanged = function(prefs)
{
    Mojo.Log.info("PageAssistant#handlePrefsChanged");
    
    this.updateChrome();
    
    try {
        this.webView.mojo.setBlockPopups(Utils.toBool(prefs["blockPopUps"]));
        this.webView.mojo.setAcceptCookies(Utils.toBool(prefs["acceptCookies"]));
        this.webView.mojo.setEnableJavaScript(Utils.toBool(prefs["enableJS"]));
    } catch (e) {
        Mojo.Log.error("PageAssistant#handlePrefsChanged - e: ", e);
    }
    
    if (this.controller.stageController.setWindowOrientation) {
        if (Utils.toBool(prefs["autoRotate"])) {
            this.controller.stageController.setWindowOrientation("free");
        } else {
            this.controller.stageController.setWindowOrientation("up");
        }
        
        if (Utils.toBool(prefs["rotateLock"])) {
            var oldOrientation = this.controller.stageController.getWindowOrientation();
            this.controller.stageController.setWindowOrientation(oldOrientation);
            
            this.menuAssistant.setOrientationLock(true);
        } else {
            this.controller.stageController.setWindowOrientation("free");
            
            this.menuAssistant.setOrientationLock(false);
        }
    }
    
    if (Utils.toBool(prefs["privateBrowsing"]) != this.privateBrowsing) {
        /* TODO: This will call clear cookies/cache for every card that is open, should we
           ony call the clear on the webView? */
        Universe.clearCookies();
        Universe.clearCache();
    }
    
    this.privateBrowsing = Utils.toBool(prefs["privateBrowsing"]);
    this.addressBar.showPrivateBrowsing(this.privateBrowsing);
    this.addressBar.restart(); // Refocus, re-listen and set cursor
};

PageAssistant.prototype.focus = function()
{
    Mojo.Log.info("PageAssistant#focus");
    //this.addressBar.show(false);
};

PageAssistant.prototype.blur = function()
{
    Mojo.Log.info("PageAssistant#blur");
    //this.addressBar.show(true);
};

PageAssistant.prototype.getSupportedLanguage = function()
{
    /*return navigator.language;*/
    return "en_US";
};

/* TODO: Check the length of the URL? */
PageAssistant.prototype.openURL = function(url)
{
    this.errorURL = undefined;
    this.openURLCommon(url);
}

PageAssistant.prototype.openURLError = function(url)
{
    this.openURLCommon(url);
};

PageAssistant.prototype.openURLCommon = function(url)
{
    Mojo.Log.info("PageAssistant#openURL(", url, ")");
    
    this.loadingURL = url;
    var lowerURL = this.loadingURL.toLowerCase();
    
    if (lowerURL.indexOf("about") === 0) {
        var file = "browser.html";
        var parts = lowerURL.split(":");
        var path = parts[1];
        
        if (PageAssistant.aboutTranslate["about"] !== undefined &&
            PageAssistant.aboutTranslate["about"][path] !== undefined)
            file = PageAssistant.aboutTranslate["about"][path].file;
        
        /* TODO: Localize */
        this.loadingURL = Mojo.appPath + "html/" + this.getSupportedLanguage() + "/" + file;
        Mojo.Log.info("Found local path for \"", url, "\": ", this.loadingURL);
    }
    
    this.isEditing = false;
    this.hasEdited = false;
    
    if (this.errorURL !== undefined) {
        this.addressBar.setURL(this.errorURL);
    } else {
        this.addressBar.setURL(this.loadingURL);
    }
    this.addressBar.changeMode("title");
    
    try {
        this.webView.mojo.openURL(this.loadingURL);
    } catch (e) {
        Mojo.Log.error("PageAssistant#openURLCommon - e: ", e);
        
        if (e.toString().indexOf("Disconnected") != -1) {
            this.url = url;
        }
    }
};

PageAssistant.prototype.canGoBack = function()
{
    return this.wvCanGoBack;
};

PageAssistant.prototype.goBack = function()
{
    this.addressBar.changeMode("title");
    this.webView.mojo.goBack();
};

PageAssistant.prototype.canGoForward = function()
{
    return this.wvCanGoForward;
};

PageAssistant.prototype.goForward = function()
{
    this.addressBar.changeMode("title");
    this.webView.mojo.goForward();
};

PageAssistant.prototype.stopLoad = function()
{
    this.addressBar.changeMode("title");
    this.webView.mojo.stopLoad();
};

PageAssistant.prototype.reload = function()
{
    this.addressBar.changeMode("title");
    this.webView.mojo.reloadPage();
};

PageAssistant.prototype.displayBookmarked = function(results)
{
    if (results && results.url) {
        Mojo.Log.info("PageAssistant#displayBookmarked");
        
        this.bookmarked.style.display = "block";
    }
};

PageAssistant.prototype.showProgress = function(progress)
{
    var newProgress = progress;
    
    if (newProgress === undefined || newProgress === null) {
        this.progressBar.className = "progress-overlay";
        this.progressBar.style.display = "block";
        return;
    }
    
    Mojo.Log.info("PageAssistant#showProgress(", newProgress, ")");
    
    if (newProgress < 100) {
        this.bookmarked.style.display = "none";
        
        this.showChromeIfNeeded(true);
    } else {
        if (Utils.toBool(Universe.getPrefsManager().get("showBookmark"))) {
            var callback = this.displayBookmarked.bind(this);
            
            Universe.getBookmarksManager().getByURL(this.addressBar.getURL(), callback);
        }
        
        /* This is a hack to ensure that the page does not "bounce" after loading. */
        if (!progress) {
            this.showChromeIfNeeded(true);
         
            this.isEditing = false;   
        }
    }
    
    if (this.progressBar.style.display === "none" && this.addressBar.isVisible()) {
        this.progressBar.style.display = "block";
    }
    
    if (newProgress >= 0 && newProgress <= 10) {
        this.progressBar.className = "progress-overlay p10";
    } else if (newProgress > 10 && newProgress <= 20) {
        this.progressBar.className = "progress-overlay p20";
    } else if (newProgress > 20 && newProgress <= 30) {
        this.progressBar.className = "progress-overlay p30";
    } else if (newProgress > 30 && newProgress <= 40) {
        this.progressBar.className = "progress-overlay p40";
    } else if (newProgress > 40 && newProgress <= 50) {
        this.progressBar.className = "progress-overlay p50";
    } else if (newProgress > 50 && newProgress <= 60) {
        this.progressBar.className = "progress-overlay p60";
    } else if (newProgress > 60 && newProgress <= 70) {
        this.progressBar.className = "progress-overlay p70";
    } else if (newProgress > 70 && newProgress <= 80) {
        this.progressBar.className = "progress-overlay p80";
    } else if (newProgress > 80 && newProgress <= 90) {
        this.progressBar.className = "progress-overlay p90";
    } else  {
        this.progressBar.className = "progress-overlay";
    }
    
    if (newProgress === 100) {
        this.progressBar.style.display = "none";
        this.showChromeIfNeeded(false);
    }
    
    // TODO: This is sort of a hack. It probably needs to be removed.
    //this.isEditing = false;
};

PageAssistant.prototype.launchCard = function(params)
{
    this.controller.serviceRequest("palm://com.palm.applicationManager",
        {
            method: "open",
            parameters: {
                "id": "com.openmobl.app.universe",
                "params": params
            }
        });
};

PageAssistant.prototype.saveViewScreen = function()
{
    if (Utils.toBool(Universe.getPrefsManager().get("privateBrowsing"))) {
        return;
    }
    
    var viewFileName = "/var/luna/files/universe/" + this.tabID + ".png";
    
    Mojo.Log.info("Saving view to file: ", viewFileName);
    
    try {
        this.webView.mojo.saveViewToFile(viewFileName);
        /* Compact to save precious space */
        this.webView.mojo.resizeImage(viewFileName, viewFileName, 100, 150);
    } catch (e) {
        Mojo.Log.error("Could not save view to file. Exception: ", e);
    }
};

PageAssistant.prototype.deleteView = function()
{
    var viewFileName = "/var/luna/files/universe/" + this.tabID + ".png";
    try {
        this.webView.mojo.deleteImage(viewFileName);
    } catch (e) {
        Mojo.Log.error("Could not delete view. Exception: ", e);
    }
    
};

PageAssistant.prototype.isLoading = function()
{
    return (this.addressBar.getState() === "stop");
};

PageAssistant.prototype.onLoadStart = function()
{
    this.addressBar.changeMode("title", "stop");
    
    this.showProgress(0);
};
PageAssistant.prototype.onLoadProgress = function(event) // progress
{
    this.showProgress(event.progress /*/ 100*/);
    
    if (event.progress == 100) {
        this.addressBar.changeMode("title", "reload");
        //this.addressBar.show(false); /* TODO ??? The addressbar won't come back after this! :o */
        this.saveViewScreen();
        
        var internalURL = Mojo.appPath + "html/";
        
        if (!Utils.toBool(Universe.getPrefsManager().get("privateBrowsing"))) { // TODO: Do not add internal pages to the History
            if (this.errorURL === undefined) {
                Universe.getHistoryManager().addToHistory(this.url, this.title);
            }
        }
    }
};
PageAssistant.prototype.updateHistory = function(event) // url, reload
{
    Mojo.Log.info("PageAssistant#updateHistory(", event.url, ")");
    
    /* This updates way too later for my taste, so, instead just call on progress == 100% */
    /*var internalURL = Mojo.appPath + "html/";
    
    if (!Utils.toBool(Universe.getPrefsManager().get("privateBrowsing"))) { // TODO: Do not add internal pages to the History
        Universe.getHistoryManager().addToHistory(this.url, this.title);
    }*/
};
PageAssistant.prototype.onLoadStop = function()
{
    this.addressBar.changeMode("title", "reload");
    this.showProgress();
};
PageAssistant.prototype.onLoadFailed = function(event) // errorCode, message
{
    this.addressBar.changeMode("title", "reload");
    this.showProgress();
};
PageAssistant.prototype.onDownloadFinished = function(event) // url, mimeType, tmpFilePath
{

};
PageAssistant.prototype.onLinkClicked = function(event) // url
{
    Mojo.Log.info("PageAssistant#onLinkClicked(", event.url, ")");
    this.openURL(event.url);
};
PageAssistant.prototype.onTitleURLChanged = function(event) // title, url, canGoBack, canGoForward
{
    this.url = event.url;
    this.title = Utils.normalizeTitle(event.title);
    this.loadingURL = undefined;
    this.wvCanGoBack = event.canGoBack;
    this.menuAssistant.setBack(this.wvCanGoBack);
    this.wvCanGoForward = event.canGoForward;
    this.menuAssistant.setForward(this.wvCanGoForward);
    
    this.addressBar.setTitle(this.title);
    if (this.errorURL !== undefined) {
        this.addressBar.setURL(this.errorURL);
    } else {
        this.addressBar.setURL(this.url);
    }
    
    Universe.getTabManager().setTabTitle(this.tabID, this.title);
    Universe.getTabManager().setTabURL(this.tabID, this.url);
};
PageAssistant.prototype.onTitleChanged = function(event) // title
{
    this.title = Utils.normalizeTitle(event.title);
    
    this.addressBar.setTitle(this.title);
    
    Universe.getTabManager().setTabTitle(this.tabID, this.title);
};
PageAssistant.prototype.onURLChanged = function(event) // url, canGoBack, canGoForward
{
    this.url = event.url;
    this.wvCanGoBack = event.canGoBack;
    this.menuAssistant.setBack(this.wvCanGoBack);
    this.wvCanGoForward = event.canGoForward;
    this.menuAssistant.setForward(this.wvCanGoForward);
    
    if (this.errorURL !== undefined) {
        this.addressBar.setURL(this.errorURL);
    } else {
        this.addressBar.setURL(this.url);
    }
    
    Universe.getTabManager().setTabURL(this.tabID, this.url);
};
PageAssistant.prototype.onCreatePage = function(event) // pageIdentifier
{
    var params = {};
    
    params.pageIdentifier = event.pageIdentifier;
    
    this.launchCard(params);
};
PageAssistant.prototype.onTapRejected = function()
{
    if (!this.addressBar.isVisible()) {
        this.addressBar.endActivity();
    }
    
    if (this.addressBar.getMode() === "url") {
        var oldState = this.addressBar.getState();
        
        this.addressBar.changeMode("title", oldState);
    }
};
PageAssistant.prototype.onViewEditorFocused = function(event) // focused
{
    Mojo.Log.info("PageAssistant#onViewEditorFocused(", event.focused, ")");
    this.isEditing = event.focused;
    
    if (this.isEditing) {
        this.hasEdited = true;
    }
};
PageAssistant.prototype.onUrlRedirect = function(event) // url, appId
{
    Mojo.Log.info("PageAssistant#onUrlRedirect(", event.url, ")");
    //this.openURL(event.url);
    // We are being told that there is a system redirect, so let's redirect to it.
    var url = event.url || "";
    var urlLower = url.toLowerCase();
    
    if (urlLower.indexOf("file://") === 0) {
        this.openURL(event.url);
    } else {
        this.mimeNotSupported(event);
    }
};
PageAssistant.prototype.downloadFile = function(event) // url, mimeType
{
    Mojo.Log.info("PageAssistant#downloadFile(", event.url, ",", event.mimeType, ")");
    
    Universe.launchDownloads({url: event.url, mimeType: event.mimeType});
};
PageAssistant.prototype.mimeNotSupported = function(event) // url, mimeType
{
    Mojo.Log.info("PageAssistant#mimeNotSupported(", event.url, ")");
    
    var url = event.url; // UrlUtil.decode(event.url);
    
    if (url.toLowerCase().indexOf("tel:") === 0) {
        switch (Universe.getPrefsManager().get("phoneDialer")) {
            case "phone":
                this.dialWithPhone(url);
                break;
            case "voogle":
                this.dialWithVoogle(url);
                break;
            case "prompt":
                var dialChoice = function(number, choice) {
                    switch (choice) {
                        case "phone":
                            this.dialWithPhone(number);
                            break;
                        case "voogle":
                            this.dialWithVoogle(number);
                            break;
                        case "contact":
                            Utils.contactPromptToAdd(this.controller, Utils.normalizeNumber(number));
                            break;
                        default:
                            break;
                    }                                           
                };
                
                var msg = $L("Number to dial: ") + Utils.normalizeNumber(url);
                
                this.controller.showAlertDialog({
                        title: $L("Dial Phone Number"),
                        message: msg,
                        onChoose: dialChoice.bind(this, url),
                        choices: [
                            { label: $L("Phone"), value: "phone" },
                            { label: $L("Voogle"), value: "voogle" },
                            { label: $L("Save to Contact"), value: "contact" },
                            { label: $L("Cancel"), type: "dismiss", value: "cancel" }
                        ]
                    });
                break;
        }
    } else if (url.toLowerCase().indexOf("about:") === 0) {
        this.openURL(url);
    } else if (url.match("^http://((www\\.)?google\\.(com|[a-z]{2}|com?\\.[a-z]{2})/maps(/m)?|maps\\.google\\.(com|[a-z]{2}|com?\\.[a-z]{2})(/maps(/m)?)?)(/)?(\\?.*)?$") ||
        url.match("^[^:]+://www.youtube.com/watch\\?v=") ||
        url.match("^http://developer.palm.com/appredirect/?")) {
            Utils.launchDefaultHandler(url);
    } else if (url.toLowerCase().indexOf("http") === 0) {
        // So, the get Resource Info service call is protected... :( We explicitly check for URL redirects above...
        this.downloadFile(event);
        
        /*var resSuccess = function(resp) {
        Mojo.Log.error("SUCCESS: " + Object.toJSON(resp) );
        
                if (resp.returnValue) {
                    if (resp.appIdByExtension === Mojo.appInfo.id) {
                        this.downloadFile(event);
                    } else { // TODO: Should streaming be a special case?
                        Utils.launchDefaultHandler(url, event.mimeType);
                    }
                }
            };
        
        var resFailure = function(resp) {
        Mojo.Log.error("FAIL: " + Object.toJSON(resp) );
                this.downloadFile(event);
            };
        
        Utils.getResourceInfo(url, event.mimeType, resSuccess.bind(this), resFailure.bind(this));*/
    } else { //if (url.toLowerCase().indexOf("mailto:") != -1) {
        Utils.launchDefaultHandler(url);
    }
};

PageAssistant.prototype.holdEvent = function(event)
{
    Mojo.Log.info("PageAssistant#holdEvent");
    
    try {
        var point = Element.viewportOffset(this.webView);        
        point.left = event.down.pageX - point.left;
        point.top  = event.down.pageY - point.top;
        
        var contextMenu = [];
        
        var inspectLink = function(imageInfo, linkInfo) {
                var popupSelection = function(value) {
                        switch (value) {
                            case PageAssistant.ContextMenu.NewCard.command:
                                this.launchCard({url: linkInfo.url});
                                break;
                            case PageAssistant.ContextMenu.Bookmark.command:
                                this.addBookmark("", url);
                                break;
                            case PageAssistant.ContextMenu.TweetThis.command:
                                break;
                            case PageAssistant.ContextMenu.CopyLink.command:
                                this.controller.stageController.setClipboard(linkInfo.url);
                                break;
                            case PageAssistant.ContextMenu.DialWithPhone.command:
                                this.dialWithPhone(linkInfo.url);
                                break;
                            case PageAssistant.ContextMenu.TextNumber.command:
                                break;
                            case PageAssistant.ContextMenu.AddToContacts.command:
                                break;
                            case PageAssistant.ContextMenu.SaveImage.command:
                                var event = {
                                        url: imageInfo.src,
                                        mimeType: imageInfo.mimeType
                                    };
                                
                                this.downloadFile(event);
                                break;
                            case PageAssistant.ContextMenu.DownloadAs.command:
                                var event = {
                                        url: linkInfo.url,
                                        mimeType: "application/octet-stream"
                                    };
                                
                                this.downloadFile(event);
                                break;
                            default:
                                break;
                        }
                    };

                if (linkInfo && linkInfo.url) {
                    var url = linkInfo.url;
                
                    if (url.toLowerCase().indexOf("tel:") != -1) {
                        ContextMenu.push(PageAssistant.ContextMenu.DialWith);
                        ContextMenu.push(PageAssistant.ContextMenu.TextNum);
                        ContextMenu.push(PageAssistant.ContextMenu.AddToContacts);
                    } else {
                        contextMenu.push(PageAssistant.ContextMenu.NewCard);
                        contextMenu.push(PageAssistant.ContextMenu.Bookmark);
                        contextMenu.push(PageAssistant.ContextMenu.CopyLink);
                        contextMenu.push(PageAssistant.ContextMenu.DownloadAs);
                    }
                }

                if (contextMenu.length > 0) {
                    this.controller.popupSubmenu({onChoose: popupSelection.bind(this), items: contextMenu});
                }
            };
            
        var inspectImage = function(imageInfo) { // TODO: This appears to be broken...
                if (imageInfo && imageInfo.src) {
                    contextMenu.push(PageAssistant.ContextMenu.SaveImage);
                }
                
                this.webView.mojo.inspectUrlAtPoint(point.left, point.top, inspectLink.bind(this, imageInfo));
            };
        
        this.webView.mojo.getImageInfoAtPoint(point.left, point.top, inspectImage.bind(this));
    } catch (e) {
        Mojo.Log.error("PageAssistant#holdEvent(", e, ")");
    }
};

PageAssistant.prototype.onSingleTap = function(event)
{
    Mojo.Log.info("PageAssistant#onSingleTap - meta:", event.metaKey);

    if (event && Utils.eventHasMetaKey(event)) { // TODO: This is broken in 2.1.0.
        if (Utils.toBool(Universe.getPrefsManager().get("hideIconsWhileBrowsing"))) {
            if (this.chromeHidden) {
                this.chromeShow(true);
                this.addressBar.show(true);
            } else {
                this.chromeShow(false);
                this.addressBar.show(false);
            }
        }
    }
};

PageAssistant.prototype.onFirstPaint = function()
{
    this.saveViewScreen();
};

PageAssistant.prototype.documentLoadError = function(event) // domain, errorCode, failingURL, message
{
    Mojo.Log.info("PageAssistant#documentLoadError(", event.errorCode, ",", event.failingURL, ")");
    
    this.errorURL = event.failingURL; // We need to mask out the about page URL
    
    var loadURL = undefined;
    
    switch (event.errorCode) {
        case PageAssistant.errorCodes.ERR_USER_CANCELED:
            return;
            
        case PageAssistant.errorCodes.HTTP_NOT_FOUND:
            loadURL = "about:notfound";
            break;
        case PageAssistant.errorCodes.HTTP_DENIED:
        case PageAssistant.errorCodes.CURLE_REMOTE_ACCESS_DENIED:
        case PageAssistant.errorCodes.CURLE_LOGIN_DENIED:
            loadURL = "about:notfound";
            break;
        case PageAssistant.errorCodes.ERR_NO_INTERNET_CONNECTION:
            loadURL = "about:nointernet";
            break;
        case PageAssistant.errorCodes.CURLE_COULDNT_RESOLVE_HOST:
            loadURL = "about:nohost";
            break;
        case PageAssistant.errorCodes.CURLE_TOO_MANY_REDIRECTS:
            loadURL = "about:redirects";
            break;
        case PageAssistant.errorCodes.CURLE_OPERATION_TIMEDOUT:
            loadURL = "about:timeout";
            break;
        default:
            break;
    }
    
    if (loadURL !== undefined) {
        this.openURLError(loadURL);
        return;
    } else if (event.errorCode != PageAssistant.errorCodes.CURLE_WRITE_ERROR) {    
        this.controller.showDialog({
            template: "page/page-error-dialog",
            assistant: new PageErrorAssistant(this),
            message: event.message,
            code: event.errorCode,
            url: event.failingURL
        });
    }
};
PageAssistant.prototype.pluginSpotlightStart = function()
{
    Mojo.Log.info("Spotlight started");
    // TODO: Create a button to exit Spotlight mode
    this.isSpotlight = true;
    if (this.controller.stageController) {
        this.controller.stageController.setWindowProperties({blockScreenTimeout: true});
    }
};
PageAssistant.prototype.pluginSpotlightEnd = function()
{
    Mojo.Log.info("Spotlight stopped");
    // TODO: Create a button to exit Spotlight mode
    this.isSpotlight = false;
    if (this.controller.stageController) {
        this.controller.stageController.setWindowProperties({blockScreenTimeout: false});
    }
};

PageAssistant.prototype.browserServerConnected = function(event)
{
    if (this.disconnectedSpinner && this.disconnectedSpinner.mojo) {
        this.disconnectedSpinner.mojo.stop();
    }
    this.disconnectedScrim.hide();
    
    this.openURL(this.url);
};

PageAssistant.prototype.browserServerDisconnected = function(event)
{
    if (this.disconnectedSpinner && this.disconnectedSpinner.mojo) {
        this.disconnectedSpinner.mojo.start();
    }
    this.disconnectedScrim.show();

    this.addressBar.changeMode("title", "reload");
    this.showProgress();
    this.showChromeIfNeeded(true);
    this.isEditing = false; 
};

PageAssistant.prototype.keyDown = function(event)
{
    var c = String.fromCharCode(event.originalEvent.keyCode);

    if (event.originalEvent.metaKey) {
        return;
    }
    
    if (!this.isLoading() &&
        !this.addressBar.hasFocus() && this.addressBar.isValidInput(c) &&
        !this.isEditing) {
        Mojo.Log.info("PageAssistant#keyDown(", c, ")");
        event.preventDefault();
        event.stopPropagation();
        this.startEnteringURL();//c);
        //this.showChromeIfNeeded(true);
    }
};

PageAssistant.prototype.keyUp = function(event)
{
    var c = String.fromCharCode(event.originalEvent.keyCode);
    
    if (!this.isLoading() &&
        !this.addressBar.hasFocus() && this.addressBar.isValidInput(c) &&
        !this.isEditing) {
        Mojo.Log.info("PageAssistant#keyDown(", c, ")");
        event.preventDefault();
        event.stopPropagation();
        this.startEnteringURL();//c);
        //this.showChromeIfNeeded(true);
    }
};

PageAssistant.prototype.chromeShow = function(show)
{
    var showIt = show; // || true;
    Mojo.Log.info("PageAssistant#chromeShow(", showIt, ")");
    
    this.chromeHidden = !showIt;
    this.controller.setMenuVisible(Mojo.Menu.commandMenu, showIt);
};

PageAssistant.prototype.showChromeIfNeeded = function(show)
{
    Mojo.Log.info("PageAssistant#showChromeIfNeeded(", show, ")");
    
    if (Utils.toBool(Universe.getPrefsManager().get("hideIconsWhileBrowsing"))) {
        if (show) {
            this.chromeShow(true);
            this.addressBar.show(true);
            //this.progressBar.style.display = "block";
        } else {
            this.chromeShow(false);
            this.addressBar.show(false);
            this.progressBar.style.display = "none";
        }
    }
};

PageAssistant.prototype.updateChrome = function()
{
    this.menuAssistant.updateNavigationIcons();
    this.menuAssistant.setBack(this.wvCanGoBack);
    this.menuAssistant.setForward(this.wvCanGoForward);
};

PageAssistant.prototype.scrollStartEvent = function(event)
{
    event.scroller.addListener({moved: this.movementEventHandler});
};

PageAssistant.prototype.movementEvent = function()
{
    var pos = this.controller.getSceneScroller().mojo.getScrollPosition();
	if (pos.top < 0) {
        var car = this.controller.get("scrollbar-y-car");
        var rail = this.controller.get("scrollbar-y-rail");
        var winHeight = this.controller.window.innerHeight;
        var scrollHeight = this.controller.getSceneScroller().scrollHeight;
        var zoneHeight = winHeight - 33;
        
        window.clearTimeout(this.scrollbarYHide);
        window.clearTimeout(this.scrollbarYFader2);
        window.clearTimeout(this.scrollbarYFader3);
        
        var scrollerFade2 = function(){
            this.controller.get("scrollbar-y-rail").setOpacity(0.5);
        };
        var scrollerFade3 = function(){
            this.controller.get("scrollbar-y-rail").setOpacity(0.3);
        };
        var scrollerHide = function(){
            this.controller.get("scrollbar-y-rail").setOpacity(0.0);
        };
        
        var mHeight = winHeight * winHeight / scrollHeight;
        var carHeight = Math.max(mHeight, 24);
        var topPercent = (Math.abs(pos.top) / scrollHeight) * 100;
        carHeight = Math.min(carHeight, (zoneHeight - (zoneHeight * (topPercent / 100))));
        
        rail.style.height = zoneHeight + "px";
        car.style.height = carHeight + "px";
        car.style.top = topPercent + "%";
        
        this.scrollbarYFader2 = window.setTimeout(scrollerFade2.bind(this), 500);
        this.scrollbarYFader3 = window.setTimeout(scrollerFade3.bind(this), 550);
        this.scrollbarYHide   = window.setTimeout(scrollerHide.bind(this), 600);
        
        rail.setOpacity(0.7);
    }
	if (pos.left < 0) {
        var car = this.controller.get("scrollbar-x-car");
        var rail = this.controller.get("scrollbar-x-rail");
        var winWidth = this.controller.window.innerWidth;
        var scrollWidth = this.controller.getSceneScroller().scrollWidth;
        var zoneWidth = winWidth - 33;

        window.clearTimeout(this.scrollbarXHide);
        window.clearTimeout(this.scrollbarXFader2);
        window.clearTimeout(this.scrollbarXFader3);
        
        var scrollerFade2 = function(){
            this.controller.get("scrollbar-x-rail").setOpacity(0.5);
        };
        var scrollerFade3 = function(){
            this.controller.get("scrollbar-x-rail").setOpacity(0.3);
        };
        var scrollerHide = function(){
            this.controller.get("scrollbar-x-rail").setOpacity(0.0);
        };
        
        var mWidth = winHeight * winWidth / scrollWidth;
        var carWidth = Math.max(mWidth, 24);
        var leftPercent = (Math.abs(pos.left) / scrollWidth) * 100;
        carWidth = Math.min(carWidth, (zoneWidth - (zoneWidth * (leftPercent / 100))));
        
        rail.style.width = zoneWidth + "px";
        car.style.width = carWidth + "px";
        car.style.left = leftPercent + "%";
        
        this.scrollbarXFader2 = window.setTimeout(scrollerFade2.bind(this), 500);
        this.scrollbarXFader3 = window.setTimeout(scrollerFade3.bind(this), 550);
        this.scrollbarXHide   = window.setTimeout(scrollerHide.bind(this), 600);
        
        rail.setOpacity(0.7);
    }
};

PageAssistant.prototype.startEnteringURL = function(url)
{
    this.addressBar.startActivity(url);
};

PageAssistant.prototype.processURL = function() /* TODO: Don't do this here? */
{
    /* TODO: Verify the URL first. And check to see if it is a URL or search string! */
    // I believe that we do this elsewhere
    this.openURL(this.addressBar.getURL());
};

PageAssistant.prototype.clearCache = function()
{
    try {
        this.webView.mojo.clearCache();
    } catch (e) {
        Mojo.Log.error("PageAssistant#clearCache - e: ", e);
    }
};
PageAssistant.prototype.clearCookies = function()
{
    try {
        this.webView.mojo.clearCookies();
    } catch (e) {
        Mojo.Log.error("PageAssistant#clearCookies - e: ", e);
    }
};
PageAssistant.prototype.clearHistory = function()
{
    try {
        this.webView.mojo.clearHistory();
    } catch (e) {
        Mojo.Log.error("PageAssistant#clearHistory - e: ", e);
    }
};

/* TODO: Condense all of these functions. Only have one this.tweet(url, title) function
         that determines the rest of the info
*/

PageAssistant.prototype.dialWithPhone = function(url)
{
    var params = { target: url };
    
    Utils.subLaunchWithInstall(this.controller, "com.palm.app.phone", "Phone", "the phone dialer", params);
};
PageAssistant.prototype.dialWithVoogle = function(url)
{
    var newURL = Utils.normalizeNumber(url);
    var params = { action: "dial", number: newURL };
    
    Mojo.Log.info("Dialing with Voogle: ", newURL);
    
    Utils.subLaunchWithInstall(this.controller, "com.kandutech.voogle", "Voogle", "the webOS Google Voice client", params);
};

PageAssistant.prototype.shareWithRelego = function()
{
    var pageURL = this.addressBar.getURL();
    var pageTitle = this.addressBar.getTitle();
    var params = { action: "addtorelego", url: pageURL, title: pageTitle };
    
    Utils.subLaunchWithInstall(this.controller, "com.webosroundup.relego", "Relego", "the Read It Later client", params);
};

PageAssistant.prototype.shareWithSpareTime = function()
{
    var pageURL = this.addressBar.getURL();
    var pageTitle = this.addressBar.getTitle();
    var params = { action: "add_url", url: pageURL, title: pageTitle };
    
    Utils.subLaunchWithInstall(this.controller, "com.semicolonapps.sparetime", "Spare Time", "the Instapaper client", params);
};

PageAssistant.prototype.tweetWithCarbon = function()
{
    var pageURL = this.addressBar.getURL();
    var pageTitle = this.addressBar.getTitle();
    var params = { action: "compose", body: pageTitle + ": " + pageURL };
    var ids = ["com.dotsandlines.carbon", "com.dotsandlines.carbonbeta"];
    
    Utils.subLaunchMultipleWithInstall(this.controller, ids, "Carbon", "the Twitter client", params);
};

PageAssistant.prototype.tweetWithTwee = function()
{
    var pageURL = this.addressBar.getURL();
    var pageTitle = this.addressBar.getTitle();
    var params = { action: "tweet", tweet: pageTitle + ": " + pageURL };
    
    Utils.subLaunchWithInstall(this.controller, "com.deliciousmorsel.twee", "Twee", "the Twitter client", params);
};

PageAssistant.prototype.tweetWithSpaz = function()
{
    var pageURL = this.addressBar.getURL();
    var pageTitle = this.addressBar.getTitle();
    var params = { action: "tweet", tweet: pageTitle + ": " + pageURL };
    var ids = ["com.funkatron.app.spaz", "com.funkatron.app.spaz-beta", "com.funkatron.app.spaz-sped"];
    
    Utils.subLaunchMultipleWithInstall(this.controller, ids, "Spaz", "the Twitter client", params);
};

PageAssistant.prototype.tweetWithBadKitty = function()
{
    var pageURL = this.addressBar.getURL();
    var pageTitle = this.addressBar.getTitle();
    var params = { action: "tweet", tweet: pageTitle + ": " + pageURL };
    
    Utils.subLaunchWithInstall(this.controller, "com.superinhuman.badkitty", "Bad Kitty", "the Twitter client", params);
};

PageAssistant.prototype.shareWithSMS = function()
{
    var pageURL = this.addressBar.getURL();
    var pageTitle = this.addressBar.getTitle();
    var params = { compose: { messageText: pageTitle + " - " + pageURL }, messageText: pageTitle + " - " + pageURL };
    
    Utils.subLaunchWithInstall(this.controller, "com.palm.app.messaging", "Messaging", "the messaging client", params);
};

PageAssistant.prototype.shareWithEmail = function()
{
    var pageURL = this.addressBar.getURL();
    var pageTitle = this.addressBar.getTitle();
    var params = { text: pageTitle + " - " + pageURL };
    
    Utils.subLaunchWithInstall(this.controller, "com.palm.app.email", "Email", "the email client", params);
};

PageAssistant.prototype.shareByBroadcast = function()
{
    Universe.getCrossAppManager().deskmarks.broadcastURL(this.controller.stageController,
        this.addressBar.getURL(), this.addressBar.getTitle());
};

PageAssistant.prototype.addToLauncher = function(title, url)
{
    this.controller.showDialog({
            template: "bookmarks/bookmarks-add-dialog",
            assistant: new AddBookmarkAssistant(this, -1, title, url, "", this.addToLauncherCallback.bind(this), false),
            mode: AddBookmarkAssistant.addToLauncher
        });
};

PageAssistant.prototype.addBookmark = function(title, url)
{
    if (Utils.toBool(Universe.getPrefsManager().get("useDeskmarks"))) {
        Universe.getCrossAppManager().deskmarks.bookmarkAdd(this.controller.stageController, {
                id: -1,
                title: title,
                url: url,
                folder: $L("Unfiled")
            });
    } else {
        this.controller.showDialog({
                template: "bookmarks/bookmarks-add-dialog",
                assistant: new AddBookmarkAssistant(this, -1, title, url, $L("Unfiled"), this.addBookmarkCallback.bind(this), true),
                mode: AddBookmarkAssistant.addBookmark
            });
    }
};

PageAssistant.prototype.addBookmarkCallback = function(id, title, url, desc, folder)
{
    Mojo.Log.info("PageAssistant#addBookmarkCallback(", title, ",", url, ")");
    
    Universe.getBookmarksManager().addBookmark(url, title, desc, folder);
};

PageAssistant.prototype.addToLauncherCallback = function(id, title, url, desc, folder)
{
    Mojo.Log.info("PageAssistant#addToLauncherCallback(", title, ",", url, ")");

    var addTitle = title || $L("Web page");
    var params = {
        id: "com.openmobl.app.universe",
        "icon": "images/bookmark-launcher-icon.png",/*this.params.urlReference.tmpIconFile64,*/ /* TODO: !! Add */
        "title": addTitle,
        "params": { "url": url }
    };
    
    var success = function() {
            Mojo.Log.info("PageAssistant#addToLauncherCallback -- success");
            
            Mojo.Controller.getAppController().showBanner({messageText: $L("Added To Launcher"),
                icon: "images/notification-small-bookmark.png"}, {source: "notification"}, "Universe");
        };
    var failure = function() {
            Mojo.Log.info("PageAssistant#addToLauncherCallback -- failed");
            
            var window = Mojo.Controller.getAppController().getActiveStageController().activeScene().window;
            Mojo.Controller.errorDialog("Could not add the page to the launcher. Please try again.", window)
        };
    
    this.controller.serviceRequest("palm://com.palm.applicationManager/addLaunchPoint", {
            parameters: params,
            onSuccess: success.bind(this),
            onFailure: failure.bind(this)
        });
};

PageAssistant.prototype.handleCommand = function(event)
{
    var handled = false;
    
    Mojo.Log.info("PageAssistant#handleCommand(", event.type, ",", event.command, ")");
    
    if (!this.addressBar.handleCommand(event)) {
        if (event.type == Mojo.Event.back) {
            if (this.canGoBack()) {
                this.goBack();
                handled = true;
            }
        } else if (event.type == Mojo.Event.forward) {
            if (this.canGoForward()) {
                this.goForward();
                handled = true;
            }
        } else if (event.type == Mojo.Event.commandEnable) {
            switch (event.command) {
                case MenuAssistant.Tweet.command:
                    if (Universe.getPrefsManager().get("twitterClient") === "none") {
                        handled = true;
                    }
                    break;
                case MenuAssistant.Back.command:
                    if (!this.canGoBack()) {
                        handled = true;
                    }
                    break;
                case MenuAssistant.Forward.command:
                    if (!this.canGoForward()) {
                        handled = true;
                    }
                    break;
            }
        } else if (event.type == Mojo.Event.command) {
            switch (event.command) {
                /* App Menu */
                case "do-appNewCard":
                    var openURL = "";
                    switch (Universe.getPrefsManager().get("openOnNewCard")) {
                        case "homepage":
                            openURL = Universe.getPrefsManager().get("homePage");
                            break;
                        case "blank":
                            openURL = "about:blank";
                            break;
                    }
                    this.launchCard({url: openURL});
                    handled = true;
                    break;
                case "do-appOpen":
                    Universe.launchFilePicker(this);
                    handled = true;
                    break;
                case "do-appOpenNetwork":
                    Universe.getCrossAppManager().deskmarks.broadcastURLCatch(this.controller.stageController);
                    handled = true;
                    break;
                case "do-appPrefs":
                    Universe.launchPreferences();
                    handled = true;
                    break;
                case "do-appViewOpts":
                    Universe.launchViewOptions();
                    handled = true;
                    break;
                // TODO: Actaully support showing previous downloads
                /*case "do-appDownloads":
                    Universe.launchDownloads();
                    handled = true;
                    break;*/
                case "do-appHelp":
                    this.controller.stageController.pushScene(Universe.supportSceneName, {});
                    handled = true;
                    break;
                case "do-appAbout":
                    this.controller.stageController.pushScene(Universe.aboutSceneName, {});
                    handled = true;
                    break;
                case MenuAssistant.Bookmark.command:
                    this.addBookmark(this.addressBar.getTitle(), this.addressBar.getURL());
                    handled = true;
                    break;
                case MenuAssistant.Relego.command:
                    this.shareWithRelego();
                    handled = true;
                    break;
                case MenuAssistant.AddToLauncher.command:
                    this.addToLauncher(this.addressBar.getTitle(), this.addressBar.getURL());
                    break;
                case MenuAssistant.Share.command:
                    var shareChoice = function(choice) {
                        switch (choice) {
                            case "sms":
                                this.shareWithSMS();
                                break;
                            case "email":
                                this.shareWithEmail();
                                break;
                            case "broadcast":
                                this.shareByBroadcast();
                                break;
                            default:
                                break;
                        }                                           
                    };
                    
                    var choiceList = [];
                    
                    choiceList.push({ label: $L("SMS"), value: "sms" });
                    choiceList.push({ label: $L("Email"), value: "email" });
                    // TODO: Re-enable network sharing
                    /*if (Mojo.Environment.DeviceInfo.platformVersionMajor >= 2) {
                        choiceList.push({ label: $L("Network"), value: "broadcast" });
                    }*/
                    choiceList.push({ label: $L("Cancel"), type: "dismiss", value: "cancel" });
                    
                    this.controller.showAlertDialog({
                            title: $L("Share"),
                            message: $L("Share the current web page"),
                            onChoose: shareChoice.bind(this),
                            choices: choiceList
                        });
                    break;
                case MenuAssistant.Tweet.command:
                    switch (Universe.getPrefsManager().get("twitterClient")) {
                        case "none":
                            this.controller.showAlertDialog({
                                        title: $L("Unsupported Twitter Client"),
                                        message: $L("You have not selected a valid Twitter client. Would you like to go to the Preferences to select one?"),
                                        onChoose: (function(choice) {
                                                if (choice === "yes") {
                                                    Universe.launchPreferences();
                                                }
                                            }).bind(this),
                                        choices: [
                                            { label: $L("Yes"), value: "yes" },
                                            { label: $L("No"), type: "dismiss", value: "no" }
                                        ]
                                    });
                            break;
                        case "carbon":
                            this.tweetWithCarbon();
                            break;
                        case "spaz":
                            this.tweetWithSpaz();
                            break;
                        case "twee":
                            this.tweetWithTwee();
                            break;
                        case "badkitty":
                            this.tweetWithBadKitty();
                            break;
                    }
                    handled = true;
                    break;
                
                /* Command Bar */
                case MenuAssistant.Back.menu.command:
                    this.goBack();
                    handled = true;
                    break;
                case MenuAssistant.Forward.menu.command:
                    this.goForward();
                    handled = true;
                    break;
                case MenuAssistant.ReloadMenu:
                    this.reload();
                    handled = true;
                    break;
                case MenuAssistant.Bookmarks.menu.command:
                    if (Utils.toBool(Universe.getPrefsManager().get("useDeskmarks"))) {
                        Universe.getCrossAppManager().deskmarks.showBookmarks(this.controller.stageController);
                    } else {
                        this.controller.stageController.pushScene(Universe.bookmarksSceneName, {});
                    }
                    handled = true;
                    break;
                case MenuAssistant.History.menu.command:
                    this.controller.stageController.pushScene(Universe.historySceneName, {});
                    handled = true;
                    break;
                case MenuAssistant.Home.menu.command:
                    var url = Universe.getPrefsManager().get("homePage");
                    
                    if (url && url.length > 0) {
                        this.openURL(url);
                    }
                    handled = true;
                    break;
                case MenuAssistant.TopSitesMenu.command:
                    this.controller.stageController.pushScene(Universe.topSitesSceneName, {});
                    handled = true;
                    break;
                case MenuAssistant.TabsMenu.command:
                    this.controller.stageController.pushScene(Universe.tabsSceneName, {});
                    handled = true;
                    break;
                case MenuAssistant.OrientationLock.menu.command:
                    var oldVal = Utils.toBool(Universe.getPrefsManager().get("rotateLock"));
                    
                    Universe.getPrefsManager().set("rotateLock", !oldVal);
                    break;
                
                default:
                    break;
            }
        } else if (event.type == Mojo.Event.commandEnable) {
        
        }
    }
    
    if (handled) {
        event.preventDefault();
        event.stopPropagation();
    }
};
