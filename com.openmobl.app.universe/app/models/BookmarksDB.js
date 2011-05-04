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

BookmarksDB.name = "ext:" + Mojo.appInfo.title + "_bookmarks";
BookmarksDB.version = "0.1";
BookmarksDB.displayName = Mojo.appInfo.title + " Bookmarks";
BookmarksDB.tableName = "bookmarks_main";
BookmarksDB.folderTableName = "bookmarks_folders";

function BookmarksDB() {
    this.db = null;

    try {
        this.db = openDatabase(BookmarksDB.name, BookmarksDB.version, BookmarksDB.displayName);
        if (!this.db) {
            Mojo.Log.info("BookmarksDB#init - Could not load database");
            return false;
        }
        
        this.create();
        /* TOD: Support categories */
        /*sqlCreate = "CREATE TABLE IF NOT EXISTS '" + BookmarksDB.folderTableName + "' " + 
                    "(url TEXT NOT NULL, title TEXT NOT NULL, desc TEXT NOT NULL, folder TEXT NOT NULL, " +
                    "hitCount INTEGER DEFAULT 0, date TIMESTAMP)";
        this.db.transaction((function (transaction) {
                    transaction.executeSql(sqlCreate,
                    [],
                    function() { Mojo.Log.info("BookmarksDB#init - main created"); },
                    this.errorHandler
                );
            }).bind(this));*/
    } catch (e) {
        Mojo.Log.error("BookmarksDB#init - Could not load database. Exception: " + e);
        return false;
    }
    
    return true;
};

BookmarksDB.prototype.create = function(callback)
{
    var sqlCreate = "CREATE TABLE IF NOT EXISTS '" + BookmarksDB.tableName + "' " + 
                    "(id INTEGER PRIMARY KEY AUTOINCREMENT, url TEXT NOT NULL, title TEXT NOT NULL, desc TEXT NOT NULL, folder TEXT NOT NULL, " +
                    "hitCount INTEGER DEFAULT 0, date TIMESTAMP, googleID TEXT)";
    this.db.transaction((function (transaction) {
                transaction.executeSql(sqlCreate,
                [],
                function() {
                        Mojo.Log.info("BookmarksDB#init - main created"); 
                        if (callback)
                            callback();
                    },
                this.errorHandler
            );
        }).bind(this));
};

BookmarksDB.prototype.add = function(url, title, desc, folder, callback)
{
    Mojo.Log.info("BookmarksDB#add");
    var sqlAdd = "INSERT INTO '" + BookmarksDB.tableName + "' (url, title, desc, folder, date) " +
                 "VALUES (?, ?, ?, ?, ?)";
    var date = Date.now();

    this.db.transaction((function (transaction) { 
        transaction.executeSql(sqlAdd,
        [url, title, desc, folder, date],
        function(transaction, resultSet) {
            Mojo.Log.info("BookmarksDB#add - results: %j", resultSet);
            
            if (callback)
                callback("added");
        },
        this.errorHandler.bind(this, "add"));
    }).bind(this));
};

BookmarksDB.prototype.update = function(id, url, title, desc, folder, callback)
{
    Mojo.Log.info("BookmarksDB#update");
    var sqlUpdate = "REPLACE INTO '" + BookmarksDB.tableName + "' (id, url, title, desc, folder, date) " +
                    "VALUES (?, ?, ?, ?, ?, ?)";
    var date = Date.now();

    this.db.transaction((function (transaction) { 
        transaction.executeSql(sqlUpdate,
        [id, url, title, desc, folder, date],
        function(transaction, resultSet) {
            Mojo.Log.info("BookmarksDB#update - results: %j", resultSet);
            
            if (callback)
                callback("updated");
        },
        this.errorHandler.bind(this, "update"));
    }).bind(this));
};

BookmarksDB.prototype.updateHitCount = function(url, hitCount)
{
    Mojo.Log.info("BookmarksDB#updateHitCount");
    var sqlUpdate = "REPLACE INTO '" + BookmarksDB.tableName + "' (url, hitCount) " +
                    "VALUES (?, ?)";

    /* TODO: constraint failed bug here */
    this.db.transaction((function (transaction) { 
        transaction.executeSql(sqlUpdate,
        [url, hitCount],
        function(transaction, resultSet) {
            Mojo.Log.info("BookmarksDB#update - results: %j", resultSet);
        },
        this.errorHandler.bind(this, "updateHitCount"));
    }).bind(this));
};

BookmarksDB.prototype.touch = function(id, url, title, desc, folder, callback)
{
    /* See if the entry exists
       Update title and hit count */
    if (id === -1) {
        this.add(url, title, desc, folder, callback);
    } else {
        this.update(id, url, title, desc, folder, callback);
    }
    //this.get(title, folder, this.touchResultsCallback.bind(this));
};

BookmarksDB.prototype.touchResultsCallback = function(url, results)
{
    Mojo.Log.info("BookmarksDB#touchResultsCallback");
    var hitCount = 0;
    
    if (results.length > 0) {
        hitCount = results[0].hitCount + 1;
    }
    
    this.updateHitCount(url, hitCount);
};

BookmarksDB.prototype.get = function(title, folder, callback)
{
    Mojo.Log.info("BookmarksDB#get");
    var sqlSelect =  "SELECT id, url, title, hitCount, date FROM '" + BookmarksDB.tableName + "' WHERE title=?";

    this.db.transaction((function (transaction) {
        transaction.executeSql(sqlSelect,
        [title], 
        function(transaction, resultSet) {
            var results = [];
            
            try {
                if (resultSet.rows) {
                    results = Object.clone(resultSet.rows.item(0));
                }
            } catch (e) {
            
            }

            //Mojo.Log.info("BookmarksDB#get - resutls: %j", results);
            
            if (callback)
                callback(url, results);
        },
        this.errorHandler.bind(this, "get"));
    }).bind(this));
};

BookmarksDB.prototype.getByURL = function(url, callback)
{
    Mojo.Log.info("BookmarksDB#getByURL");
    var sqlSelect =  "SELECT id, url, title, hitCount, date FROM '" + BookmarksDB.tableName + "' WHERE url=?";

    this.db.transaction((function (transaction) {
        transaction.executeSql(sqlSelect,
        [url], 
        function(transaction, resultSet) {
            var results = {};
            
            try {
                if (resultSet.rows) {
                    results = Object.clone(resultSet.rows.item(0));
                }
            } catch (e) {
            
            }

            Mojo.Log.info("BookmarksDB#getByURL - resutls: %j", results);
            
            if (callback)
                callback(results);
        },
        this.errorHandler.bind(this, "getByURL"));
    }).bind(this));
};

BookmarksDB.prototype.searchForTitle = function(searchStr, callback)
{
    Mojo.Log.info("BookmarksDB#searchForTitle");
    var newSearch = "%" + searchStr + "%";
    var sqlSelect =  "SELECT id, url, title, hitCount, date FROM '" + BookmarksDB.tableName + "' WHERE title LIKE '" + newSearch + "'";

    Mojo.Log.info("BookmarksDB#get");

    this.db.transaction((function (transaction) {
        transaction.executeSql(sqlSelect,
        [], 
        function(transaction, resultSet) {
            var results = [];
            
            for (var i = 0; i < resultSet.rows.length; i++) {
                results[i] = resultSet.rows.item(i);
                //Mojo.Log.info("BookmarksDB#get - resutls[%i]: %j", i, results[i]);
            }

            if (callback)
                callback(results);
        },
        this.errorHandler.bind(this, "searchForTitle"));
    }).bind(this));
};

BookmarksDB.prototype.getAll = function(callback)
{
    Mojo.Log.info("BookmarksDB#getAll");
    var sqlSelect =  "SELECT * FROM '" + BookmarksDB.tableName + "'";

    Mojo.Log.info("BookmarksDB#getAll");
    
    this.db.transaction((function (transaction) {
        transaction.executeSql(sqlSelect,
        [], 
        function(transaction, resultSet) {
            var results = [];
            
            for (var i = 0; i < resultSet.rows.length; i++) {
                results[i] = resultSet.rows.item(i);
                //Mojo.Log.info("BookmarksDB#get - resutls[%i]: %j", i, results[i]);
            }

            if (callback)
                callback(results);
        },
        this.errorHandler.bind(this, "getAll"));
    }).bind(this));
};

BookmarksDB.prototype.remove = function(id, callback)
{
    Mojo.Log.info("BookmarksDB#remove");
    var sqlDelete = "DELETE FROM '" + BookmarksDB.tableName + "' WHERE (id=?)";

    this.db.transaction((function (transaction) {
        transaction.executeSql(sqlDelete,
            [id], 
            function (transaction, resultSet) {
                Mojo.Log.info("BookmarksDB#delete - deleted");
                if (callback)
                    callback();
            },
            function(transaction, error) {
                this.errorHandler(transaction, error);
                if (callback)
                    callback(transaction, error);
            });
    }).bind(this));
};

BookmarksDB.prototype.removeFolder = function(folder, callback)
{
    Mojo.Log.info("BookmarksDB#remove");
    var sqlDelete = "DELETE FROM '" + BookmarksDB.tableName + "' WHERE (folder=?)";

    this.db.transaction((function (transaction) {
        transaction.executeSql(sqlDelete,
            [folder], 
            function (transaction, resultSet) {
                Mojo.Log.info("BookmarksDB#delete - deleted");
                if (callback)
                    callback();
            },
            function(transaction, error) {
                this.errorHandler(transaction, error);
                if (callback)
                    callback(transaction, error);
            });
    }).bind(this));
};

BookmarksDB.prototype.clear = function(callback)
{
    Mojo.Log.info("BookmarksDB#clear");
    var sqlDelete = "DROP TABLE '" + BookmarksDB.tableName + "'";

    this.db.transaction((function (transaction) {
        transaction.executeSql(sqlDelete,
            [], 
            (function (transaction, resultSet) {
                Mojo.Log.info("BookmarksDB#clear - cleared");
                this.create(callback);
            }).bind(this),
            function(transaction, error) {
                this.errorHandler(transaction, error);
            });
    }).bind(this));
};

BookmarksDB.prototype.errorHandler = function(caller, transaction, error)
{
    Mojo.Log.error("BookmarksDB#errorHandler from: " + caller + " - (" + error.code + ") : " + error.message);
};
