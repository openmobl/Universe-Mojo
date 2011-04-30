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

function PreferencesAssistant()
{

}
PreferencesAssistant.openOnStart = [
        {label: $L("Blank"), value: "blank"},
        {label: $L("Homepage"), value: "homepage"},
        /*
        {label: $L("Top Sites"), value: "topsites"},
        {label: $L("Bookmarks"), value: "bookmarks"},
        */
    ];
PreferencesAssistant.searchProvider = [
        {label: $L("Google"), value: "google"},
        {label: $L("Yahoo"), value: "yahoo"},
    ];
PreferencesAssistant.phoneDialer = [
        {label: $L("Phone"), value: "phone"},
        {label: $L("Voogle"), value: "voogle"},
        {label: $L("Prompt"), value: "prompt"},
    ];
PreferencesAssistant.twitterClient = [
        {label: $L("None"), value: "none"},
        {label: $L("Carbon"), value: "carbon"},
        {label: $L("Spaz"), value: "spaz"},
        {label: $L("Twee"), value: "twee"},
        {label: $L("Bad Kitty"), value: "badkitty"},
    ];
PreferencesAssistant.prototype.setup = function()
{
    try {
        this.prefsOk = Universe.getPrefsManager().hasStarted();
        Universe.getPrefsManager().addWatcher("prefs", this.handlePrefsChange.bind(this));
        
        this.toggleChangeHandler = this.toggleChanged.bindAsEventListener(this);
        this.textChangedHandler = this.textChanged.bindAsEventListener(this);
        this.listChangedHandler = this.listChanged.bindAsEventListener(this);
        
        this.clearHistoryHandler = this.clearHistory.bind(this);
        this.clearCacheHandler = this.clearCache.bind(this);
        this.clearCookiesHandler = this.clearCookies.bind(this);
        /*this.regDefaultBrowserHandler = this.defaultBrowser.bind(this, true);
        this.unregDefaultBrowserHandler = this.defaultBrowser.bind(this, false);*/
        
        // Setup the Help subsystem
		this.helpTapHandler = this.helpRowTapped.bind(this);
        this.helpButtonTapHandler = this.helpButtonTapped.bind(this);
		this.controller.listen("help-toggle", Mojo.Event.tap, this.helpButtonTapHandler);
        
        var helps = this.controller.get("container").querySelectorAll("div.help-overlay");
		for (var h = 0; h < helps.length; h++) {
			this.controller.listen(helps[h], Mojo.Event.tap, this.helpTapHandler);
		}
        
        /*this.accountsList = this.controller.get("accountsList");
        this.controller.listen(this.accountsList, Mojo.Event.listTap, this.listTapHandler.bindAsEventListener(this));
        this.controller.listen(this.accountsList, Mojo.Event.listDelete, this.listDeleteHandler.bindAsEventListener(this));
        this.controller.listen(this.accountsList, Mojo.Event.listAdd, this.listAddHandler.bindAsEventListener(this));*/
        
        this.models = [];
        
        var prefs = Universe.getPrefsManager();
        
        this.setupTextField("homePage", prefs.get("homePage"));
        // openOnStart: blank, homepage, // topsites, bookmarks
        this.setupList("openOnStart", prefs.get("openOnStart"), PreferencesAssistant.openOnStart, $L("Open On Start"));
        this.setupList("openOnNewCard", prefs.get("openOnNewCard"), PreferencesAssistant.openOnStart, $L("On New Card"));
        // searchProvider: google, yahoo // bing
        this.setupList("searchProvider", prefs.get("searchProvider"), PreferencesAssistant.searchProvider, $L("Search Provider"));
        //// minFontSize
        // phoneDialer: phone, voogle, prompt
        this.setupList("phoneDialer", prefs.get("phoneDialer"), PreferencesAssistant.phoneDialer, $L("Phone Dialer"));
        // twitterClient: spaz, twee, bad kitty, carbon
        this.setupList("twitterClient", prefs.get("twitterClient"), PreferencesAssistant.twitterClient, $L("Twitter Client"));
        
        this.setupToggle("privateBrowsing", Utils.toBool(prefs.get("privateBrowsing")));
        this.setupToggle("enableCache", Utils.toBool(prefs.get("enableCache")));
        this.setupToggle("blockPopUps", Utils.toBool(prefs.get("blockPopUps")));
        this.setupToggle("acceptCookies", Utils.toBool(prefs.get("acceptCookies")));
        this.setupToggle("enableJS", Utils.toBool(prefs.get("enableJS")));
        //this.setupToggle("enableFlash", Utils.toBool(prefs.get("enableFlash")));
        //this.setupToggle("autoPlayFlash", Utils.toBool(prefs.get("autoPlayFlash")));
        this.setupToggle("hideIconsWhileBrowsing", Utils.toBool(prefs.get("hideIconsWhileBrowsing")));
        this.setupToggle("autoRotate", Utils.toBool(prefs.get("autoRotate")));
        this.setupToggle("showBookmark", Utils.toBool(prefs.get("showBookmark")));
        
        this.controller.listen("clearHistory", Mojo.Event.tap, this.clearHistoryHandler);
        this.controller.listen("clearCookies", Mojo.Event.tap, this.clearCookiesHandler);
        this.controller.listen("clearCache", Mojo.Event.tap, this.clearCacheHandler);
        
        /* Google Bookmarks is not supported on webOS versions other than 2.0.1 and 2.1 */
        /*if (Mojo.Environment.DeviceInfo.platformVersionMajor < 2) {
            this.controller.get("googleContainer").style.display = "none";
        }*/
        
        this.setupGoogle();
    } catch (e) {
        Mojo.Log.info("E: " + e);
    }
};

PreferencesAssistant.prototype.cleanup = function()
{
    Universe.getPrefsManager().removeWatcher("prefs", this.handlePrefsChange.bind(this));
        
    this.destroyTextField("homePage");
    this.destroyList("openOnStart");
    this.destroyList("openOnNewCard");
    this.destroyList("searchProvider");
    this.destroyList("phoneDialer");
    this.destroyList("twitterClient");
    
    this.destroyToggle("privateBrowsing");
    this.destroyToggle("enableCache");
    this.destroyToggle("blockPopUps");
    this.destroyToggle("acceptCookies");
    this.destroyToggle("enableJS");
    //this.destroyToggle("enableFlash");
    //this.destroyToggle("autoPlayFlash");
    this.destroyToggle("hideIconsWhileBrowsing");
    this.destroyToggle("autoRotate");
    this.destroyToggle("showBookmark");
    
    this.controller.stopListening("clearHistory", Mojo.Event.tap, this.clearHistoryHandler);
    this.controller.stopListening("clearCookies", Mojo.Event.tap, this.clearCookiesHandler);
    this.controller.stopListening("clearCache", Mojo.Event.tap, this.clearCacheHandler);
        
    this.destroyGoogle();
    
    /*this.controller.stopListening(this.accountsList, Mojo.Event.listTap, this.listTapHandler);
    this.controller.stopListening(this.accountsList, Mojo.Event.listDelete, this.listDeleteHandler);
    this.controller.stopListening(this.accountsList, Mojo.Event.listAdd, this.listAddHandler);
    
    if (this.changed) {
        gSIPper.appAssistant.unregisterSIP();
        gSIPper.appAssistant.registerSIP();
    }*/
};

PreferencesAssistant.prototype.helpButtonTapped = function(event)
{
	if (this.controller.get("container").hasClassName("help")) {
		this.controller.get("container").removeClassName("help");
		event.target.removeClassName("selected");
	} else {
		this.controller.get("container").addClassName("help");
		event.target.addClassName("selected");
	}
}
PreferencesAssistant.prototype.helpRowTapped = function(event)
{
	event.stop();
	event.stopPropagation();
	event.preventDefault();
	
	var lookup = event.target.id.replace(/help-/, "");
	var help = helpData.get(lookup);
	
	if (lookup && help)
	{
		this.controller.stageController.pushScene("help-data", help);
	}
}

PreferencesAssistant.prototype.clearHistory = function()
{
    this.controller.showAlertDialog({
            title: $L("Clear History"),
            message: $L("This will clear all of your browsing history. Continue?"),
            onChoose: (function(choice) {
                    if (choice === "yes") {
                        Universe.clearHistory();
                    }
                }).bind(this),
            choices: [
                { label: $L("Yes"), type: "affirmative", value: "yes" },
                { label: $L("Cancel"), type: "dismiss", value: "cancel" }
            ]
        });
};
PreferencesAssistant.prototype.clearCache = function()
{
    this.controller.showAlertDialog({
            title: $L("Clear Cache"),
            message: $L("This will clear the browser's cache. Continue?"),
            onChoose: (function(choice) {
                    if (choice === "yes") {
                        Universe.clearCache();
                    }
                }).bind(this),
            choices: [
                { label: $L("Yes"), type: "affirmative", value: "yes" },
                { label: $L("Cancel"), type: "dismiss", value: "cancel" }
            ]
        });
};
PreferencesAssistant.prototype.clearCookies = function()
{
    this.controller.showAlertDialog({
            title: $L("Clear Cookies"),
            message: $L("This will clear all of your browsing cookies. Continue?"),
            onChoose: (function(choice) {
                    if (choice === "yes") {
                        Universe.clearCookies();
                    }
                }).bind(this),
            choices: [
                { label: $L("Yes"), type: "affirmative", value: "yes" },
                { label: $L("Cancel"), type: "dismiss", value: "cancel" }
            ]
        });
};

PreferencesAssistant.prototype.setupToggle = function(name, value)
{
    var attributes = {
        falseLabel: $L("No"),
        trueLabel: $L("Yes"),
        modelProperty: "original"
    };
    this.models[name] = {
            key: name,
            original: value
        };
    this.controller.setupWidget(name, attributes, this.models[name]);
    this.controller.listen(name, Mojo.Event.propertyChange, this.toggleChangeHandler);
};
PreferencesAssistant.prototype.destroyToggle = function(name)
{
    this.controller.stopListening(name, Mojo.Event.propertyChange, this.toggleChangeHandler);
};
PreferencesAssistant.prototype.setupTextField = function(name, value)
{
    var attributes = {
        textFieldName: name,
        hintText: "",
        modelProperty: "original",
        changeOnKeyPress: true,
        multiline: false,
        focus: false
    };
    this.models[name] = {
            key: name,
            original: value
        };
    this.controller.setupWidget(name, attributes, this.models[name]);
    this.controller.listen(name, Mojo.Event.propertyChange, this.textChangedHandler);
};
PreferencesAssistant.prototype.destroyTextField = function(name)
{
    this.controller.stopListening(name, Mojo.Event.propertyChange, this.textChangedHandler);
};

PreferencesAssistant.prototype.setupList = function(name, value, data, displayLabel)
{
    Mojo.Log.info("PreferencesAssistant#setupList - name: " + name + " value: " + value);
    var attributes = {
            label: displayLabel,
            choices: data,
            modelProperty: "original"
        };
    this.models[name] = {
            key: name,
            original: value
        };
    
    this.controller.setupWidget(name, attributes, this.models[name]);
    this.controller.listen(name, Mojo.Event.propertyChange, this.listChangedHandler);
};
PreferencesAssistant.prototype.destroyList = function(name)
{
    this.controller.stopListening(name, Mojo.Event.propertyChange, this.listChangedHandler);
};

PreferencesAssistant.prototype.saveLoginData = function(sid, lsid, hsid, ssid, galx, response)
{
    var nduid;
	for (p in response) {
	   if (p == "com.palm.properties.nduid") { nduid = response[p]; }
	}
    
    var prefs = Universe.getPrefsManager();
    
    prefs.set("useGoogle", true);
    prefs.set("googleGALX", Mojo.Model.encrypt(nduid, galx));
    prefs.set("googleSID", Mojo.Model.encrypt(nduid, sid));
    prefs.set("googleLSID", Mojo.Model.encrypt(nduid, lsid));
    prefs.set("googleHSID", Mojo.Model.encrypt(nduid, hsid));
    prefs.set("googleSSID", Mojo.Model.encrypt(nduid, ssid));
};

PreferencesAssistant.prototype.googleLogin = function()
{
    var google = new Google();
    
    var email = this.controller.get("googleEmail").mojo.getValue();
    var password = this.controller.get("googlePassword").mojo.getValue();
    
    google.login(email, password,
        (function(data) {
                Mojo.Log.info("Login succeeded!");
                
                this.controller.showAlertDialog({
                        title: $L("Login Success"),
                        message: $L("We have logged you into your Google Bookmarks account. We will ask you to re-login at a later date."),
                        choices:[
                            {label:$L("OK"), value:"ok", type:'affirmative'}   
                        ]
                    });
                
                this.controller.serviceRequest("palm://com.palm.preferences/systemProperties", {
                        method: "Get",
                        parameters: {"key": "com.palm.properties.nduid"},
                        onSuccess: this.saveLoginData.bind(this,data.SID,data.LSID,data.HSID,data.SSID,data.GALX)
                    });
                
                this.controller.get("googleEmail").mojo.setValue("");
                this.controller.get("googlePassword").mojo.setValue("");
            }).bind(this),
        (function(error, params) {
                Mojo.Log.info("Login failed: " + error + " results: " + Object.toJSON(params));
                
                var errorStr = $L("We could not log you into your Google Bookmarks. Please check your email address and password and try again.");
                
                if (error) {
                    errorStr += "\n\n(" + $L("Error: ") + error + ")";
                }
                if (params) {
                    errorStr += "\n[" + $L("Params: ") + Object.toJSON(params) + "]";
                }
                
                this.controller.showAlertDialog({
                        title: $L("Login Failed"),
                        message: errorStr,
                        choices:[
                            {label:$L("OK"), value:"ok"}   
                        ]
                    });
            }).bind(this));
};
PreferencesAssistant.prototype.googleLogout = function()
{
    var prefs = Universe.getPrefsManager();
    
    prefs.set("useGoogle", false);
    prefs.set("googleGALX", "0000");
    prefs.set("googleSID", "0000");
    prefs.set("googleLSID", "0000");
    prefs.set("googleHSID", "0000");
    prefs.set("googleSSID", "0000");
};
PreferencesAssistant.prototype.setupGoogle = function()
{
    var emailAttributes = {
        textFieldName: "googleEmail",
        hintText: "user@gmail.com",
        modelProperty: "original",
        changeOnKeyPress: true,
        multiline: false,
        focus: false,
        textCase: Mojo.Widget.steModeLowerCase
    };
    this.controller.setupWidget("googleEmail", emailAttributes, { original: "" });
    var passwordAttributes = {
        textFieldName: "googlePassword",
        hintText: "",
        modelProperty: "original",
        changeOnKeyPress: true,
        multiline: false,
        focus: false
    };
    this.controller.setupWidget("googlePassword", passwordAttributes, { original: "" });
    
    this.googleLoginHandler = this.googleLogin.bind(this);
    this.googleLogoutHandler = this.googleLogout.bind(this);
    
    //this.controller.setupWidget("googleLogin", {}, {} /*{label : $L("Google Login"), disabled: false}*/);
    //this.controller.setupWidget("googleLogout", {}, {} /*{label : $L("Google Logout"), disabled: false}*/);
    
    this.controller.listen("googleLogin", Mojo.Event.tap, this.googleLoginHandler);
    this.controller.listen("googleLogout", Mojo.Event.tap, this.googleLogoutHandler);
};
PreferencesAssistant.prototype.destroyGoogle = function()
{
    this.controller.stopListening("googleLogin", Mojo.Event.tap, this.googleLoginHandler);
    this.controller.stopListening("googleLogout", Mojo.Event.tap, this.googleLogoutHandler);
};

PreferencesAssistant.prototype.handlePrefsChange = function(update)
{
    this.prefsOk = true; // We have loaded some preferences in, so we are ok
    
    // go through each preference, set new model value, call model changed
    this.models.each((function(item) {
        item.original = update[item.key];
        
        this.controller.modelChanged(item);
    }).bind(this));
};

/*PreferencesAssistant.prototype.serverAccountsSetup = function(results)
{
    Mojo.Log.info("PreferencesAssistant#serverAccountsSetup");
    
    this.accountsListModel.items = results;
        
    this.controller.modelChanged(this.accountsListModel, this);
};*/

PreferencesAssistant.prototype.handleCommand = function(event)
{        

};

PreferencesAssistant.prototype.toggleChanged = function(event)
{
    if (this.prefsOk) { // DO NOT accept the pref changes since we have not loaded the saved prefs
        this.changed = true;
        
        Universe.getPrefsManager().set(event.target.id, event.value);
    }
};

PreferencesAssistant.prototype.textChanged = function(event)
{
    if (this.prefsOk) { // DO NOT accept the pref changes since we have not loaded the saved prefs
        this.changed = true;
    
        Universe.getPrefsManager().set(event.target.id, event.value);
    }
};

PreferencesAssistant.prototype.listChanged = function(event)
{
    if (this.prefsOk) { // DO NOT accept the pref changes since we have not loaded the saved prefs
        this.changed = true;
    
        Universe.getPrefsManager().set(event.target.id, event.value);
    }
};

