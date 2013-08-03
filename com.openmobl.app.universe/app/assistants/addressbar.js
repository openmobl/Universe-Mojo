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

function AddressBar(controller, openURLCallback, reloadCallback, stopLoadCallback, showChromeCallback)
{
    Mojo.Log.info("AddressBar#new");
    this.controller = controller;
    this.openURLCallback = openURLCallback;
    this.reloadCallback = reloadCallback;
    this.stopLoadCallback = stopLoadCallback;
    this.shouldHide = false;
    
    this.showChromeCallback = showChromeCallback;
    
    this.smartMenu = new SmartMenu(this.controller, this, showChromeCallback);
    
    this.handleURLEntryHandler = this.handleURLEntry.bind(this);
    this.onFlickHandler = this.onFlick.bind(this);
    this.orientationChangedHandler = this.orientationChanged.bind(this);
    
    this.securePadlock = false;
    this.privateBrowsing = false;
}

AddressBar.Commands =
{
    Padlock: {
        template: "page/addressbar-padlock",
        command: "addressbar-padlock-keydown"

    },
    Mask: {
        template: "page/addressbar-mask",
        command: "addressbar-mask-keydown"

    },
    
    Stop: {
        template: "page/addressbar-stop",
        command: "addressbar-stop-keydown"

    },
    Reload: {
        template: "page/addressbar-reload",
        command: "addressbar-reload-keydown"
    },
    
    Go: {
        template: "page/addressbar-go",
        command: "addressbar-go-keydown"
    },
    
    Title: {
        template: "page/addressbar-title",
        command: "addressbar-title-touch",
        title: "",
        width: 270,
        padlock: "none",
        mask: "none"
    }
};
AddressBar.hintText = $L("Enter a URL or Search Term");
AddressBar.defaultTitle = "";

AddressBar.Modes =
{
    url: "url",
    title: "title"
};

AddressBar.prototype.setup = function()
{
    Mojo.Log.info("AddressBar#setup");
    
    this.controls = {
        input: {
            template: "page/addressbar-url",
            attr: {
                hintText: AddressBar.hintText,
                modelProperty: "url",
                modifierState: "none",
                focusMode: Mojo.Widget.focusInsertMode,
                requiresEnterKey: true,
                inputName: "addressbar-url-input",
                changeOnKeyPress: true,
                autoReplace: false,
                textCase: Mojo.Widget.steModeLowerCase
            },
            model: {
                url: ""
            },
            width: 270
        },
        
        title: Object.clone(AddressBar.Commands.Title),
        go: Object.clone(AddressBar.Commands.Go),
        stop: Object.clone(AddressBar.Commands.Stop),
        reload: Object.clone(AddressBar.Commands.Reload)
    };
    
    this.controller.setupWidget("addressbar-url-input",
        this.controls.input.attr,
        this.controls.input.model);
    
    /* This is by default. We don't actually know what the user has
       decided that we will be... */
    this.barMode = {
        mode: "title", /* url || title */
        state: "stop",
        model: {
            visible: true,
            items: [{items: [this.controls.title, this.controls.stop]}, {}]
        }
    };
    
    this.controller.setupWidget(Mojo.Menu.viewMenu,
        {menuClass: "no-fade", spacerHeight: 0}, this.barMode.model);
        
    //this.controller.watchModel(this.barMode.model, this, this.modelUpdated.bind(this))
        
    this.smartMenu.setup();
    
    //Mojo.Event.listen(this.controller.document, "orientationchange", this.orientationChangeHandler);
};

AddressBar.prototype.cleanup = function()
{
    //Mojo.Event.stopListening(this.controller.document, "orientationchange", this.orientationChangeHandler);
};

AddressBar.prototype.orientationChanged = function(event)
{
    Mojo.Log.info("AddressBar#orientationChanged");
    this.updateModel();
    this.controller.modelChanged(this.barMode.model);
};

AddressBar.prototype.startListening = function()
{
    Mojo.Log.info("AddressBar#startListening");
    
    if (this.getMode() === "url") {
        this.controller.listen("addressbar-url-input", Mojo.Event.propertyChange, this.handleURLEntryHandler, false);
        this.controller.listen("addressbar-url-input", Mojo.Event.flick, this.onFlickHandler, false);
    }
};

AddressBar.prototype.stopListening = function()
{
    Mojo.Log.info("AddressBar#stopListening");
    
    if (this.getMode() === "url") {
        this.controller.stopListening("addressbar-url-input", Mojo.Event.propertyChange, this.handleURLEntryHandler, false);
        this.controller.stopListening("addressbar-url-input", Mojo.Event.flick, this.onFlickHandler, false);
    }
};

AddressBar.prototype.getURL = function()
{
    return this.controls.input.model.url;
};

AddressBar.prototype.setURL = function(url)
{
    url = url || "";
    
    Mojo.Log.info("AddressBar#setURL(", url, ")");
    
    this.controls.input.model.url = url;
    this.controller.modelChanged(this.controls.input.model);
    
    this.showPadlock(true);
};

AddressBar.prototype.setTitle = function(title)
{
    title = title || AddressBar.defaultTitle;
    
    this.controls.title.title = title;
    this.controller.modelChanged(this.barMode.model);
};

AddressBar.prototype.getTitle = function()
{
    return this.controls.title.title;
};

AddressBar.prototype.setShouldHide = function(shouldHide)
{
    this.shouldHide = shouldHide;
};

AddressBar.prototype.isVisible = function()
{
    Mojo.Log.info("AddressBar#isVisible = ", this.barMode.model.visible);
    return this.barMode.model.visible;
};

AddressBar.prototype.showPadlock = function(visible)
{
    if (visible && this.getURL().toLowerCase().indexOf("https") === 0) {
        this.controls.title.padlock = this.isVisible() ? "block" : "none";
        this.securePadlock = true;
    } else {
        this.controls.title.padlock = "none";
        this.securePadlock = false;
    }
    
    if (this.getMode() === "title") {
        this.controller.modelChanged(this.barMode.model);
    }
};

AddressBar.prototype.showPrivateBrowsing = function(visible)
{
    if (visible && Utils.toBool(Universe.getPrefsManager().get("privateBrowsing"))) {
        this.controls.title.mask = this.isVisible() ? "block" : "none";
        this.privateBrowsing = true;
    } else {
        this.controls.title.mask = "none";
        this.privateBrowsing = false;
    }
    
    if (this.getMode() === "title") {
        this.controller.modelChanged(this.barMode.model);
    }
};

AddressBar.prototype.show = function(visible)
{
    var isVisible = visible; // || true;
    
    Mojo.Log.info("AddressBar#show(", isVisible, ")");
    
    // We're not calling modelChanged here to avoid a bug with flickering
    
    if (!isVisible) {
        this.controls.title.mask = "none";
        this.controls.title.padlock = "none";
        //this.controller.modelChanged(this.barMode.model);
        
        try {
            this.controller.get("mask").style.display = this.controls.title.mask;
            this.controller.get("padlock").style.display = this.controls.title.padlock;
        } catch (e) {}
    }
    
    this.controller.setMenuVisible(Mojo.Menu.viewMenu, isVisible);
    this.barMode.model.visible = isVisible;
    
    if (isVisible) {
        this.controls.title.mask = this.privateBrowsing ? "block" : "none";
        this.controls.title.padlock = this.securePadlock ? "block" : "none";
        //this.controller.modelChanged(this.barMode.model);
        
        var iconFade = function() {
                try {
                    this.controller.get("mask").style.display = this.controls.title.mask;
                    this.controller.get("padlock").style.display = this.controls.title.padlock;
                } catch(e) {}
            };
        window.setTimeout(iconFade.bind(this), 150);
    }
    
    /*this.barMode.model.visible = visible || true;
    
    this.controller.modelChanged(this.barMode.model);*/
};

AddressBar.prototype.toggleMenuVisible = function()
{
    this.show(!this.isVisible());
};

AddressBar.prototype.getMode = function()
{
    return this.barMode.mode;
};

AddressBar.prototype.getState = function()
{
    return this.barMode.state;
};

AddressBar.prototype.hasFocus = function()
{
    return (this.getMode() === "url");
};

AddressBar.prototype.setFocus = function()
{
    this.changeMode("url");
};

AddressBar.prototype.startActivity = function(input)
{
    Mojo.Log.info("AddressBar#startActivity(", input, ")");
    if (!this.isVisible()) {
        this.show(true);
        this.showChromeCallback(true);
    }
    
    if (input !== undefined) {
        this.setURL(input); // TODO: This has a bug
        //this.setTitle(input);
    } else {
        this.setURL("");
        //this.focusText();
    }
    
    this.setFocus(true);
    this.smartMenu.makeVisible(true);
    
    if (input !== undefined) {
        this.smartMenu.updateEvent();
    }
};

AddressBar.prototype.endActivity = function()
{
    Mojo.Log.info("AddressBar#endActivity");
    if (this.shouldHide) {
        this.show(false);
        this.showChromeCallback(false);
    }
    //this.setFocus(false);
    this.smartMenu.clearList();
    this.smartMenu.makeVisible(false);
};

AddressBar.prototype.isValidInput = function(input)
{
    var validChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$-_.+!*'(),{}|\\^~[]`<>#%\";/?:@&=";
    
    return (validChars.indexOf(input) >= 0);
};

AddressBar.prototype.focusText = function()
{
    Mojo.Log.info("AddressBar#focusText");
    if (this.getMode() === "url") {
        this.controller.get("addressbar-url-input").mojo.focus();
    }
};

AddressBar.prototype.selectText = function()
{
    Mojo.Log.info("AddressBar#selectText");
    if (this.getMode() === "url") {
        this.controller.get("addressbar-url-input").mojo.setCursorPosition(0, 9999);
    }
};

/*AddressBar.prototype.modelUpdated = function()
{
    window.clearTimeout(this.updateCSSTimeout);

    this.updateCSSTimeout = window.setTimeout(this.updateCSS.bind(this),200);
};

AddressBar.prototype.updateCSS = function()
{
    var mode = this.getMode();
    var newVal = this.controller.window.innerWidth - 50;
    
    Mojo.Log.info("AddressBar#updateCSS -- newVal=" + newVal);
    
    try {
        switch (mode) {
            case "url":
                this.controller.get("url").style.width = newVal + "px;";
                this.controller.get("go-url-button").style.left = newVal + "px;";
                break;
            case "title":
                if (this.barMode.state == "stop")
                    this.controller.get("stop-title-button").style.left = newVal + "px;";
                else
                    this.controller.get("reload-title-button").style.left = newVal + "px;";
                
                this.controller.get("title").style.width = newVal + "px;";
                break;
            default:
                break;
        }
    } catch (e) {
        this.modelUpdated(); // Try again.
    }
};*/

/*AddressBar.prototype.updateWidths = function()
{
    var mode = this.getMode();
    var newVal = this.controller.window.innerWidth - 50;
    
    Mojo.Log.info("AddressBar#updateWidths -- newVal=" + newVal);
    
    switch (mode) {
        case "url":
            this.controls.input.width = newVal;
            break;
        case "title":
            this.controls.title.width = newVal;
            break;
        default:
            break;
    }
};*/

AddressBar.prototype.updateModel = function()
{
    var mode = this.getMode();
    var newVal = this.controller.window.innerWidth - 50;
    
    Mojo.Log.info("AddressBar#updateModel -- newVal=", newVal);
    
    this.barMode.model.items[0].items[0].width = newVal;
};

AddressBar.prototype.changeMode = function(mode, state)
{
    var newMode = mode || "url";
    var newState = state || "reload";
    
    var modeChanged = (newMode !== this.barMode.mode);
    var stateChanged = (newState !== this.barMode.state);
    
    if (modeChanged) {
        this.stopListening();
    }
    
    /*if (!modeChanged && !stateChanged) {
        return;
    }*/
    
    this.barMode.mode = newMode;
    this.barMode.state = newState;

    Mojo.Log.info("AddressBar#changeMode(", mode, ",", state, ")");
    
    switch (mode) {
        case "url":
            this.barMode.model.items[0].items = [this.controls.input, this.controls.go];
            break;
        case "title":
            if (this.barMode.state == "stop")
                this.barMode.model.items[0].items = [this.controls.title, this.controls.stop];
            else
                this.barMode.model.items[0].items = [this.controls.title, this.controls.reload];
            
            if (this.smartMenu.isVisible()) {
                this.smartMenu.makeVisible(false);
            }
            break;
        default: /* UH OH! */
            break;
    }
    
    this.updateModel();
    this.controller.modelChanged(this.barMode.model);
    
    this.restart();
};

AddressBar.prototype.restart = function()
{
    if (this.getMode() === "url") {
        //this.controller.modelChanged(this.controls.input.model);
        this.focusText();
    }
    
    this.startListening();
};

AddressBar.prototype.handleURLEntry = function(event)
{
    var handled = false;
    var newInput = event.value;
    var keyCode = event.originalEvent.keyCode;
    
    Mojo.Log.info("AddressBar#handleURLEntry");

    if (!this.isVisible()) {
        this.show(true);
        this.showChromeCallback(true);
    }

    if (keyCode === Mojo.Char.enter) { //Mojo.Char.isEnterKey(keyCode)) {
        Mojo.Log.error("We have an enter key!");
        this.loadOrSearch();
        handled = true;
        event.preventDefault();
    }

    if (!handled) {
        this.setURL(newInput);
        //this.setTitle(newInput);
        
        if (newInput.length === 0) {
            this.smartMenu.makeVisible(false);
        } else {
            this.smartMenu.updateEvent();
        }
        this.focusText();
    }
    
    event.stopPropagation();
};

AddressBar.prototype.onFlick = function(event)
{
    /* Clear out the URL */
    if (event.velocity.x >= 500 || event.velocity.x <= -500) {
        /* TODO: Animate the "flicking" of the URL */
        this.setURL("");
        if (this.smartMenu.isVisible()) {
            this.smartMenu.makeVisible(false);
        }
    }
};

AddressBar.prototype.loadOrSearch = function()
{
    // So far we support http, https, file, about, and scheme-less URLs and IP addresses that meet the regex below
    var regex = /^https?:|^file:|^about:|^[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,3}(\S*)?$|^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;
    
    if (!this.getURL().match(regex)) {
        this.search(this.getURL());
    } else {
        this.loadURL(this.getURL());
    }
};

AddressBar.prototype.loadURL = function(url)
{
    this.endActivity();
    this.openURLCallback(url);
};

AddressBar.prototype.search = function(searchFor)
{
    this.endActivity();
    
    var url = "";
    switch (Universe.getPrefsManager().get("searchProvider")) {
        case "google":
            url = "http://www.google.com/search?q=" + UrlUtil.encode(searchFor);
            break;
        case "yahoo":
            url = "http://search.yahoo.com/search?p=" + UrlUtil.encode(searchFor);
            break;
    }
    
    this.openURLCallback(url);
};

AddressBar.prototype.handleCommand = function(event)
{
    var handled = false;
    
    Mojo.Log.info("AddressBar#handleCommand(", event.type, ",", event.command, ")");

    if (event.type == Mojo.Event.command) {
        switch (event.command) {
            case AddressBar.Commands.Title.command:
                this.changeMode("url");
                this.selectText();
                handled = true;
                break;
            case AddressBar.Commands.Go.command:
                this.loadURL(this.getURL());
                handled = true;
                break;
            case AddressBar.Commands.Reload.command:
                this.reloadCallback();
                handled = true;
                break;
            case AddressBar.Commands.Stop.command:
                this.stopLoadCallback();
                handled = true;
                break;
            default:
                break;
        }
    }

    /*if (handled) {
        // stop propagation
    }*/

    return handled;
};


