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



function PrefsManager()
{
    this.started = false;
    this.db = new PrefsDB(this.cacheSettings.bind(this));
    this.watcherList = [];
    this.cache = [];
    this.watcherQueue = undefined;
}

PrefsManager.kQueueTimeout = 500; // ms

PrefsManager.prototype.cacheSettings = function(results)
{
    Mojo.Log.info("PrefsManager#cacheSettings");
    
    if (results.length === PrefsDB.defaultPrefs.length) {
        this.started = true;
        
        results.each(function(item) {
            //Mojo.Log.info("this.cache[" + item.key + "] = " + item.value);
            this.cache[item.key] = item.value;
        }.bind(this));
        
        //this.callWatchers(this.cache);
        this.queueWatchCall();
    } else {
        Mojo.Log.info("Still waiting on set defaults to complete");
    }
};

PrefsManager.prototype.set = function(key, value)
{
    Mojo.Log.info("PrefsManager#set(" + key + "," + value + ")");
    this.db.set(key, value);
};

PrefsManager.prototype.get = function(key)
{
    Mojo.Log.info("PrefsManager#get(" + key + ")");
    
    return this.cache[key];
    /*var blocking = true;
    var value = undefined;
    
    var callback = function(result) {
        Mojo.Log.info("getCallback -- result: " + Object.toJSON(result));
        blocking = false;
        value = result.value;
    };
    
    this.db.get(key, callback);

    var i = 0;
    while (blocking) {
        if (i > 5000000)
            break;
        i++;
    }
    
    Mojo.Log.info("PrefsManager#get = " + value);
    return value;*/
};

PrefsManager.prototype.hasStarted = function()
{
    Mojo.Log.info("The preference DB is started? " + this.started);
    return this.started;
};

PrefsManager.prototype.addWatcher = function(name, callback)
{
    var i = 0;
    for (i = 0; i < this.watcherList.length; i++) {
        if (this.watcherList[i].name === name) {
            break;
        }
    }
    
    if (i == this.watcherList.length) {
        this.watcherList.push({"name": name, "callback": callback});
    }
};

PrefsManager.prototype.removeWatcher = function(name)
{
    var i = 0;
    for (i = 0; i < this.watcherList.length; i++) {
        if (this.watcherList[i].name === name) {
            this.watcherList[i].callback = undefined;
        }
    }
};

PrefsManager.prototype.queueWatchCall = function()
{
    if (this.watcherQueue === undefined) {
        this.watcherQueue = window.setTimeout(this.callWatchers.bind(this, this.cache), PrefsManager.kQueueTimeout);
    }
};

PrefsManager.prototype.callWatchers = function(results)
{
    Mojo.Log.info("PrefsManager#callWatchers");
    
    window.clearTimeout(this.watcherQueue);
    this.watcherQueue = undefined;
    
    var i = 0;
    for (i = 0; i < this.watcherList.length; i++) {
        Mojo.Log.info("Have watcher " + this.watcherList[i].name);
        if (this.watcherList[i].callback !== undefined) {
            Mojo.Log.info("Calling watcher " + this.watcherList[i].name);
            this.watcherList[i].callback(results);
        }
    }
};
