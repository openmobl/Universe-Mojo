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

HistoryDB.name = "ext:" + Mojo.appInfo.title + "_history";
HistoryDB.version = "0.1";
HistoryDB.displayName = Mojo.appInfo.title + " History";
HistoryDB.tableName = "history_main";

function HistoryDB() {
    this.db = null;

    try {
        this.db = openDatabase(HistoryDB.name, HistoryDB.version, HistoryDB.displayName);
        if (!this.db) {
            Mojo.Log.info("HistoryDB#init - Could not load database");
            return false;
        }
        
        var sqlCreate = "CREATE TABLE IF NOT EXISTS '" + HistoryDB.tableName + "' " + 
                        "(url TEXT PRIMARY KEY NOT NULL, title TEXT NOT NULL, " +
                        "hitCount INTEGER DEFAULT 0, date TIMESTAMP)";
        this.db.transaction((function (transaction) {
                    transaction.executeSql(sqlCreate,
                    [],
                    function() { Mojo.Log.info("HistoryDB#init - created"); },
                    this.errorHandler.bind(this, "new")
                );
            }).bind(this));
    } catch (e) {
        Mojo.Log.error("HistoryDB#init - Could not load database. Exception: " + e);
        return false;
    }
    
    return true;
};

HistoryDB.prototype.add = function(url, title)
{
    Mojo.Log.info("HistoryDB#add");
    var sqlAdd = "INSERT INTO '" + HistoryDB.tableName + "' (url, title, date) " +
                 "VALUES (?, ?, ?)";
    var date = Date.now();

    this.db.transaction((function (transaction) { 
        transaction.executeSql(sqlAdd,
        [url, title, date],
        function(transaction, resultSet) {
            Mojo.Log.info("HistoryDB#add - results: %j", resultSet);
        },
        this.errorHandler.bind(this, "add"));
    }).bind(this));
};

HistoryDB.prototype.update = function(url, title)
{
    Mojo.Log.info("HistoryDB#update");
    var sqlUpdate = "REPLACE INTO '" + HistoryDB.tableName + "' (url, title, date) " +
                    "VALUES (?, ?, ?)";
    var date = Date.now();

    this.db.transaction((function (transaction) { 
        transaction.executeSql(sqlUpdate,
        [url, title, date],
        function(transaction, resultSet) {
            Mojo.Log.info("HistoryDB#update - results: %j", resultSet);
        },
        this.errorHandler.bind(this, "update"));
    }).bind(this));
};

HistoryDB.prototype.updateHitCount = function(title, url, hitCount)
{
    Mojo.Log.info("HistoryDB#updateHitCount");
    var sqlUpdate = "REPLACE INTO '" + HistoryDB.tableName + "' (url, title, hitCount, date) " +
                    "VALUES (?, ?, ?, ?)";
    var date = Date.now();

    this.db.transaction((function (transaction) { 
        transaction.executeSql(sqlUpdate,
        [url, title, hitCount, date],
        function(transaction, resultSet) {
            Mojo.Log.info("HistoryDB#update - results: %j", resultSet);
        },
        this.errorHandler.bind(this, "updateHitCount"));
    }).bind(this));
};

HistoryDB.prototype.touch = function(url, title)
{
    /* See if the entry exists
       Update title and hit count */
    //this.update(url, title);
    this.get(url, this.touchResultsCallback.bind(this, title));
};

HistoryDB.prototype.touchResultsCallback = function(title, url, results)
{
    Mojo.Log.info("HistoryDB#touchResultsCallback");
    var hitCount = 1;
    
    if (results  && results.hitCount) {
        hitCount = results.hitCount + 1;
    }
    
    this.updateHitCount(title, url, hitCount);
};

HistoryDB.prototype.get = function(url, callback)
{
    Mojo.Log.info("HistoryDB#get");
    var sqlSelect =  "SELECT title, hitCount, date FROM '" + HistoryDB.tableName + "' WHERE url=?";

    Mojo.Log.info("HistoryDB#get");

    this.db.transaction((function (transaction) {
        transaction.executeSql(sqlSelect,
        [url], 
        function(transaction, resultSet) {
            var results = [];
            
            try {
                if (resultSet.rows) {
                    results = Object.clone(resultSet.rows.item(0));
                }
            } catch (e) {
            
            }

            //Mojo.Log.info("HistoryDB#get - resutls: %j", results);
            if (callback)
                callback(url, results);
        },
        this.errorHandler.bind(this, "get"));
    }).bind(this));
};

HistoryDB.prototype.searchForTitle = function(searchStr, callback)
{
    Mojo.Log.info("HistoryDB#searchForTitle");
    var newSearch = "%" + searchStr + "%";
    var sqlSelect =  "SELECT url, title, hitCount, date FROM '" + HistoryDB.tableName + "' WHERE title LIKE '" + newSearch + "'";

    Mojo.Log.info("HistoryDB#get");

    this.db.transaction((function (transaction) {
        transaction.executeSql(sqlSelect,
        [], 
        function(transaction, resultSet) {
            var results = [];
            
            for (var i = 0; i < resultSet.rows.length; i++) {
                results[i] = resultSet.rows.item(i);
                //Mojo.Log.info("HistoryDB#get - resutls[%i]: %j", i, results[i]);
            }

            if (callback)
                callback(results);
        },
        this.errorHandler.bind(this, "searchForTitle"));
    }).bind(this));
};

HistoryDB.prototype.getAll = function(callback)
{
    Mojo.Log.info("HistoryDB#getAll");
    var sqlSelect =  "SELECT * FROM '" + HistoryDB.tableName + "'";

    Mojo.Log.info("HistoryDB#getAll");
    
    this.db.transaction((function (transaction) {
        transaction.executeSql(sqlSelect,
        [], 
        function(transaction, resultSet) {
            var results = [];
            
            for (var i = 0; i < resultSet.rows.length; i++) {
                results[i] = resultSet.rows.item(i);
                //Mojo.Log.info("HistoryDB#get - resutls[%i]: %j", i, results[i]);
            }

            if (callback)
                callback(results);
        },
        this.errorHandler.bind(this, "getAll"));
    }).bind(this));
};

HistoryDB.prototype.getAllByHitCount = function(callback)
{
    Mojo.Log.info("HistoryDB#getAllByHitCount");
    var sqlSelect =  "SELECT * FROM '" + HistoryDB.tableName + "' ORDER BY hitCount DESC";

    Mojo.Log.info("HistoryDB#getAllByHitCount");
    
    this.db.transaction((function (transaction) {
        transaction.executeSql(sqlSelect,
        [], 
        function(transaction, resultSet) {
            var results = [];
            
            for (var i = 0; i < resultSet.rows.length; i++) {
                results[i] = resultSet.rows.item(i);
                //Mojo.Log.info("HistoryDB#get - resutls[%i]: %j", i, results[i]);
            }

            if (callback)
                callback(results);
        },
        this.errorHandler.bind(this, "getAllByHitCount"));
    }).bind(this));
};

HistoryDB.prototype.remove = function(id, callback)
{
    Mojo.Log.info("HistoryDB#remove");
    /*var sqlDelete = "DELETE FROM 'servers' WHERE (id=?)";

    Mojo.Log.info("HistoryDB#delete");

    this.db.transaction((function (transaction) {
        transaction.executeSql(sqlDelete,
            [id], 
            function (transaction, resultSet) {
                Mojo.Log.info("HistoryDB#delete - deleted");
                callback();
            },
            function(transaction, error) {
                this.errorHandler(transaction, error);
                callback(transaction, error);
            });
    }).bind(this));*/
};

HistoryDB.prototype.clear = function()
{
    Mojo.Log.info("HistoryDB#clear");
    var sqlDelete = "DELETE FROM '" + HistoryDB.tableName + "'";

    this.db.transaction((function (transaction) {
        transaction.executeSql(sqlDelete,
            [], 
            function (transaction, resultSet) {
                Mojo.Log.info("HistoryDB#clear - cleared");
                //callback();
            },
            (function(transaction, error) {
                this.errorHandler(transaction, error);
                //callback(transaction, error);
            }).bind(this));
    }).bind(this));
};

HistoryDB.prototype.errorHandler = function(caller, transaction, error)
{
    Mojo.Log.error("HistoryDB#errorHandler from: " + caller + " - (" + error.code + ") : " + error.message);
};
