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

PrefsDB.name = "ext:" + Mojo.appInfo.title + "_prefs";
PrefsDB.version = "0.1";
PrefsDB.displayName = Mojo.appInfo.title + " Prefs";
PrefsDB.tableName = "prefs_main";

function PrefsDB(callback) {
    this.db = null;
    this.cacheCallback = callback;

    try {
        this.db = openDatabase(PrefsDB.name, PrefsDB.version, PrefsDB.displayName);
        if (!this.db) {
            Mojo.Log.info("PrefsDB#init - Could not load database");
            return false;
        }
        
        var sqlCreate = "CREATE TABLE IF NOT EXISTS '" + PrefsDB.tableName + "' " + 
                        "(key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL)";
                        
        this.db.transaction((function (transaction) {
                    transaction.executeSql(sqlCreate,
                    [],
                    function() {
                        Mojo.Log.info("PrefsDB#init - created");
                        //this.getAll(this.cacheCallback);
                        this.setDefaults();
                    }.bind(this),
                    this.errorHandler.bind(this, "new")
                );
            }).bind(this));
    } catch (e) {
        Mojo.Log.error("PrefsDB#init - Could not load database. Exception: " + e);
        return false;
    }
    
    return true;
};

PrefsDB.defaultPrefs = [
        /* General */
        { key: "homePage", value: "about:home" },
        { key: "openOnStart", value: "homepage" },
        { key: "openOnNewCard", value: "homepage" },
        { key: "searchProvider", value: "google" },
        { key: "minFontSize", value: "12" },
        { key: "phoneDialer", value: "prompt" },
        { key: "twitterClient", value: "none" },

        /* Privacy */
        { key: "privateBrowsing", value: "false" },
        { key: "enableCache", value: "true" },
        { key: "blockPopUps", value: "true" },
        { key: "acceptCookies", value: "true" },
        { key: "enableJS", value: "true" },
        { key: "enableFlash", value: "true" },
        { key: "autoPlayFlash", value: "false" },
        
        /* User Interface */
        { key: "hideIconsWhileBrowsing", value: "false" },
        { key: "autoRotate", value: "true" },
        { key: "rotateLock", value: "false" },
        { key: "showBookmark", value: "false" },
        
        /* Google Bookmarks */
        { key: "useGoogle", value: "false" },
        { key: "googleGALX", value: "0000" },
        { key: "googleSID", value: "0000" },
        { key: "googleHSID", value: "0000" },
        { key: "googleLSID", value: "0000" },
        { key: "googleSSID", value: "0000" },
        
        /* View Options */
        { key: "navButton1", value: MenuAssistant.Back.pref },
        { key: "navButton2", value: MenuAssistant.Forward.pref },
        { key: "navButton3", value: MenuAssistant.Home.pref },
        { key: "navButton4", value: MenuAssistant.Bookmarks.pref },
        { key: "navButton5", value: MenuAssistant.History.pref },
        
    ];

PrefsDB.prototype.setDefaults = function(key, value)
{
    Mojo.Log.info("PrefsDB#setDefaults");
    var sqlUpdate = "INSERT INTO '" + PrefsDB.tableName + "' (key, value) VALUES (?, ?)";

    this.db.transaction((function (transaction) {
        /*PrefsDB.defaultPrefs.each((function(transaction, error, item) {
                transaction.executeSql(sqlUpdate, [item.key, item.value], function() {}, error);
            }).bind(this, transaction, this.errorHandler.bind(this, "setDefaults")));*/
        var i = 0;
        var errorHand = this.errorHandler.bind(this, "setDefaults");
        for (i = 0; i < PrefsDB.defaultPrefs.length; i++) {
            //Mojo.Log.info("Calling - " + sqlUpdate);
            transaction.executeSql(sqlUpdate, [PrefsDB.defaultPrefs[i].key, PrefsDB.defaultPrefs[i].value],
            function(transaction, resultSet) {
                Mojo.Log.info("PrefsDB#setDefaults - results: %j", resultSet);
                this.getAll(this.cacheCallback);
            }.bind(this),
            function(transaction, error) {
                errorHand(transaction, error);
                this.getAll(this.cacheCallback);
            }.bind(this));
        }
    }).bind(this));
};

PrefsDB.prototype.set = function(key, value)
{
    Mojo.Log.info("PrefsDB#set");
    var sqlUpdate = "REPLACE INTO '" + PrefsDB.tableName + "' (key, value) " +
                    "VALUES (?, ?)";

    this.db.transaction((function (transaction) { 
        transaction.executeSql(sqlUpdate,
        [key, value],
        function(transaction, resultSet) {
            Mojo.Log.info("PrefsDB#set - results: %j", resultSet);
            this.getAll(this.cacheCallback); // TODO: This seems intensive
        }.bind(this),
        this.errorHandler.bind(this, "set"));
    }).bind(this));
};

PrefsDB.prototype.get = function(key, callback)
{
    Mojo.Log.info("PrefsDB#get");
    var sqlSelect =  "SELECT value FROM '" + PrefsDB.tableName + "' WHERE key=?";

    this.db.transaction((function (transaction) {
        transaction.executeSql(sqlSelect,
        [key], 
        function(transaction, resultSet) {
            var results = [];
            
            try {
                if (resultSet.rows) {
                    results = Object.clone(resultSet.rows.item(0));
                }
            } catch (e) {
            
            }

            //Mojo.Log.info("PrefsDB#get - resutls: %j", results);
            
            if (callback)
                callback(results);
        },
        this.errorHandler.bind(this, "get"));
    }).bind(this));
};


PrefsDB.prototype.getAll = function(callback)
{
    Mojo.Log.info("PrefsDB#getAll");
    var sqlSelect =  "SELECT * FROM '" + PrefsDB.tableName + "'";

    Mojo.Log.info("PrefsDB#getAll");
    
    this.db.transaction((function (transaction) {
        transaction.executeSql(sqlSelect,
        [], 
        function(transaction, resultSet) {
            var results = [];
            
            for (var i = 0; i < resultSet.rows.length; i++) {
                results[i] = resultSet.rows.item(i);
                //Mojo.Log.info("PrefsDB#get - resutls[%i]: %j", i, results[i]);
            }


            if (callback)
                callback(results);
        },
        this.errorHandler.bind(this, "getAll"));
    }).bind(this));
};

PrefsDB.prototype.remove = function(id, callback)
{
    Mojo.Log.info("PrefsDB#remove");
    /*var sqlDelete = "DELETE FROM 'servers' WHERE (id=?)";

    Mojo.Log.info("PrefsDB#delete");

    this.db.transaction((function (transaction) {
        transaction.executeSql(sqlDelete,
            [id], 
            function (transaction, resultSet) {
                Mojo.Log.info("PrefsDB#delete - deleted");
                callback();
            },
            function(transaction, error) {
                this.errorHandler(transaction, error);
                callback(transaction, error);
            });
    }).bind(this));*/
};

PrefsDB.prototype.clear = function()
{
    Mojo.Log.info("PrefsDB#clear");
    
};

PrefsDB.prototype.errorHandler = function(caller, transaction, error)
{
    Mojo.Log.error("PrefsDB#errorHandler from: " + caller + " - (" + error.code + ") : " + error.message);
};
