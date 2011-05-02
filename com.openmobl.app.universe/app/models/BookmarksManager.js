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
 
function BookmarksManager(controller)
{
    this.db = new BookmarksDB();
    this.google = new Google();
    this.controller = controller;
    
    Universe.getPrefsManager().addWatcher("bookmarks", this.prefsWatcher.bind(this));
}

BookmarksManager.prototype.getGoogle = function() { return this.google; }

BookmarksManager.prototype.startGoogle = function(galxEnc, sidEnc, hsidEnc, lsidEnc, ssidEnc, xtEnc, response)
{
    if (response && !this.nduid) {
        var nduid;
        for (p in response) {
           if (p == "com.palm.properties.nduid") { nduid = response[p]; }
        }
        
        this.nduid = nduid;
    }
    
    var galx = Mojo.Model.decrypt(this.nduid, galxEnc);
    var sid = Mojo.Model.decrypt(this.nduid, sidEnc);
    var hsid = Mojo.Model.decrypt(this.nduid, hsidEnc);
    var lsid = Mojo.Model.decrypt(this.nduid, lsidEnc);
    var ssid = Mojo.Model.decrypt(this.nduid, ssidEnc);
    var xt = Mojo.Model.decrypt(this.nduid, xtEnc);
    
    this.google.setLoggedIn(galx, sid, hsid, lsid, ssid, xt);
            
    this.google.enableOperation(true);
};

BookmarksManager.prototype.prefsWatcher = function(prefs)
{
    if (Utils.toBool(prefs["useGoogle"])) {
        if (this.nduid) {
            this.startGoogle(prefs["googleGALX"],prefs["googleSID"],prefs["googleHSID"],prefs["googleLSID"],prefs["googleSSID"],prefs["googleXT"]);
        } else {
            new Mojo.Service.Request("palm://com.palm.preferences/systemProperties", {
                        method: "Get",
                        parameters: {"key": "com.palm.properties.nduid"},
                        onSuccess: this.startGoogle.bind(this,prefs["googleGALX"],prefs["googleSID"],prefs["googleHSID"],prefs["googleLSID"],prefs["googleSSID"],prefs["googleXT"])
                    });
        }
    } else {
        this.google.setLoggedIn(null, null, null, null, null);
            
        this.google.enableOperation(false);
    }
};

BookmarksManager.prototype.addBookmark = function(url, title, desc, folder)
{
    var callback = function() {
        var bannerMessage = $L("Added Bookmark");
        Mojo.Controller.getAppController().showBanner({messageText: bannerMessage, icon: "images/notification-small-bookmark.png"}, {source: "notification"}, "Universe");
    };
    this.db.touch(-1, url, title, desc, folder, callback);
    this.google.addBookmark(title, url, folder,
            (function() {
                    Mojo.Log.info("BookmarksManager#addBookmarkGoogleSuccess");
                    var bannerMessage = $L("Added bookmark to Google");
                    Mojo.Controller.getAppController().showBanner({messageText: bannerMessage, icon: "images/notification-small-bookmark.png"}, {source: "notification"}, "Universe");
                }).bind(this),
            (function(reason) {
                    Mojo.Log.info("BookmarksManager#addBookmarkGoogleFail - reason: " + Object.toJSON(reason));
                    
                    var bannerMessage = $L("Failed to add bookmark to Google");
                    Mojo.Controller.getAppController().showBanner({messageText: bannerMessage, icon: "images/notification-small-bookmark.png"}, {source: "notification"}, "Universe");
                    /*this.controller.showAlertDialog({
                            title: $L("Google Bookmark Save Failed"),
                            message: $L("We could not add your bookmark to Google. Please try again."),
                            choices:[
                                {label:$L("OK"), value:"ok"}   
                            ]
                        });*/
                }).bind(this)
        );
};

BookmarksManager.prototype.updateBookmark = function(id, url, title, desc, folder)
{
    var callback = function() {
        var bannerMessage = $L("Updated Bookmark");
        Mojo.Controller.getAppController().showBanner({messageText: bannerMessage, icon: "images/notification-small-bookmark.png"}, {source: "notification"}, "Universe");
    };
    this.db.touch(id, url, title, desc, folder, callback);
};

BookmarksManager.prototype.removeBookmark = function(id, callback)
{
    this.db.remove(id, callback);
};

BookmarksManager.prototype.removeBookmarksInFolder = function(folder, callback)
{
    this.db.removeFolder(folder, callback);
};

BookmarksManager.prototype.clearBookmarks = function()
{
    this.db.clear();
};

/* TODO: Get by category */
BookmarksManager.prototype.getBookmarks = function(callback)
{
    this.db.getAll(callback);
};

BookmarksManager.prototype.getByURL = function(url, callback)
{
    this.db.getByURL(url, callback);
};

BookmarksManager.prototype.searchForTitle = function(searchFor, callback)
{
    this.db.searchForTitle(searchFor, callback);
};
