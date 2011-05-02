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
 
 /*
   TODO: We need to create a hook so that when a bookmark update fails, we can
         re-prompt for login and try again. This needs to happen from the UI
         layer.
  */
 
function Google(shouldOperate)
{
    this.shouldOperate = shouldOperate;
    
    this.galx = null;
    this.sid = null;
    this.lsid = null;
    this.hsid = null;
    this.ssid = null;
    this.xt = undefined;
    this.threadID = "BDQAAAAAQAA";
    //this.gausr = null;
    
    this.loggedIn = false;
}

Google.LoginFailed = "login-fail";
Google.UnexpectedStatus = "unexpected-status";
Google.UnfoundCookie = "unfound-cookie";
Google.InvalidResponse = "invalid-response";
Google.ReLogin = "Please Re Login.";

Google.prototype.login = function(username, password, success, fail)
{
    Mojo.Log.info("Google#login");
    this.setupLogin(this.finishLogin.bind(this,username,password,success,fail), fail);
};

Google.prototype.setupLogin = function(callback, fail)
{
    Mojo.Log.info("Google#setupLogin");
    var params = jQuery.param({
            "service": "bookmarks",
            "passive": "true",
            "nui": "1",
            "continue": "https://www.google.com/bookmarks/l",
            "followup": "https://www.google.com/bookmarks/l"
        });
    
    jQuery.ajax({
            url: "https://www.google.com/accounts/ServiceLogin?" + params,
            type: "GET",
            success: (function(data, textStatus, jqXHR) {
                            if (jqXHR.status != 200) {
                                fail(Google.UnexpectedStatus, {status: jqXHR.status, wanted: 200});
                            } else {
                                var input = jQuery(data).find('input[name="GALX"]');
                                var galx = input.attr("value");
                                
                                if (galx) {
                                    this.galx = galx;
                                    
                                    if (callback)
                                            callback();
                                } else {
                                    fail(Google.LoginFailed, {general: "no GALX"});
                                }
                            }
                        }).bind(this),
            error: (function(jqXHR, textStatus, errorThrown) { if (fail) fail(Google.LoginFailed); }).bind(this)
        });
};

Google.prototype.finishLogin = function(username, password, callback, fail)
{
    Mojo.Log.info("Google#finishLogin");
    var params = {
            Email: username,
            Passwd: password,
            service: "bookmarks",
            PersistentCookie: "yes",
            GALX: this.galx,
            "continue": "https://www.google.com/bookmarks/l"
        };
    
    jQuery.ajax({
            url: "https://www.google.com/accounts/ServiceLoginAuth",
            type: "POST",
            data: params,
            success: (function(data, textStatus, jqXHR) {
                            if (jqXHR.status != 200) {
                                fail(Google.UnexpectedStatus, {status: jqXHR.status, wanted: 200});
                            } else {
                                var cookie = jqXHR.getResponseHeader("Set-Cookie");
                                
                                if (cookie) {
                                    var sid = UrlUtil.getCookie(cookie, "SID");
                                    var lsid = UrlUtil.getCookie(cookie, "LSID");
                                    var hsid = UrlUtil.getCookie(cookie, "HSID");
                                    var ssid = UrlUtil.getCookie(cookie, "SSID");
                                    //var gausr = UrlUtil.getCookie(cookie, "GAUSR");
                                    
                                    if (sid && lsid && hsid && ssid/*&& gausr*/) {//if (sid || lsid || hsid || ssid/*&& gausr*/) {
                                        this.sid = sid;
                                        this.lsid = lsid;
                                        this.hsid = hsid;
                                        this.ssid = ssid;
                                        //this.gausr = gausr;
                                        
                                        this.loggedIn = true;
                                        if (callback)
                                            callback({SID: this.sid, LSID: this.lsid, HSID: this.hsid, SSID: this.ssid, GALX: this.galx});
                                    } else {
                                        if (fail)
                                            fail(Google.UnfoundCookie, {wanted: "SID,LSID,HSID,SSID"});
                                    }
                                } else {
                                    fail(Google.LoginFailed, {generic: "no cookies"});
                                }
                            }
                        }).bind(this),
            error: (function(jqXHR, textStatus, errorThrown) { if (fail) fail(Google.LoginFailed); }).bind(this)
        });
};

Google.prototype.testLogin = function(callback, fail)
{
    jQuery.ajax({
            url: "https://www.google.com/bookmarks/api/threadsearch?fo=Starred&g&q&start&nr=1",
            type: "GET",
            beforeSend: (function(jqXHR, settings) {
                            var header = "SID=" + this.sid + "; HSID=" + this.hsid + "; SSID=" + this.ssid + ";"; //"GALX=" + this.galx + "; SID=" + this.sid + "; LSID=" + this.lsid + "; HSID=" + this.hsid + "; SSID=" + this.ssid + ";";
                            jqXHR.setRequestHeader("Cookie", header);
                        }).bind(this),
            success: (function(data, textStatus, jqXHR) {
                            
                        }).bind(this),
            error: (function(jqXHR, textStatus, errorThrown) { if (fail) fail(Google.LoginFailed); }).bind(this)
        });
};

Google.prototype.buildHeader = function()
{
    var header = "";
    
    if (this.sid) {
        header += "SID=" + this.sid + "; ";
    }
    if (this.hsid) {
        header += "HSID=" + this.hsid + "; ";
    }
    if (this.ssid) {
        header += "SSID=" + this.ssid + "; ";
    }
    
    return header;
};

Google.prototype.getXT = function(callback, fail)
{
    Mojo.Log.info("Google#getXT");

    if (this.xt) {
        Mojo.Log.info("Already have XT");
        
        if (callback)
            callback();
    } else {
        jQuery.ajax({
                url: "https://www.google.com/bookmarks/l",
                type: "GET",
                dataType: "text",
                cache: false,
                beforeSend: (function(jqXHR, settings) {
                                //var header = "SID=" + this.sid + "; HSID=" + this.hsid + "; SSID=" + this.ssid + ";"; //"GALX=" + this.galx + "; SID=" + this.sid + "; LSID=" + this.lsid + "; HSID=" + this.hsid + "; SSID=" + this.ssid + ";";
                                //jqXHR.setRequestHeader("Cookie", header);
                                var header = this.buildHeader();
                                if (header != "") {
                                    jqXHR.setRequestHeader("Cookie", header);
                                }
                            }).bind(this),
                success: (function(data, textStatus, jqXHR) {
                                var xtCookie = data.match(/xt[\s+]=[\s+]'(\S+)'/);
                                
                                if (xtCookie) {
                                    var xt = xtCookie[1];
                                    
                                    if (xt) {
                                        Mojo.Log.info("Got XT");
                                        
                                        this.xt = xt;
                                        
                                        if (callback)
                                            callback();
                                    } else {
                                        if (fail)
                                            fail(Google.InvalidResponse);
                                    }
                                } else {
                                    /* TODO: Re-login */
                                    if (fail)
                                            fail(Google.ReLogin);
                                }
                            }).bind(this),
                error: (function(jqXHR, textStatus, errorThrown) {
                        Mojo.Log.error("getXT failed");
                        
                        if (fail)
                            fail(Google.LoginFailed);
                    }).bind(this)
            });
    }
};

/* Set the cookie values from the database */
Google.prototype.setLoggedIn = function(galx, sid, hsid, lsid, ssid, xt)
{
    Mojo.Log.info("Google#setLoggedin");
    
    this.galx = galx;
    this.sid = sid;
    this.hsid = hsid;
    this.lsid = lsid;
    this.ssid = ssid;
    this.xt = undefined; //xt;
    //this.gausr = gausr;
    
    this.loggedIn = true;
};

Google.prototype.getLoggedIn = function()
{
    return {
            GALX: this.galx,
            SID: this.sid,
            LSID: this.lsid,
            HSID: this.hsid,
            XT: this.xt
        };
};

Google.prototype.enableOperation = function(shouldOperate)
{
    Mojo.Log.info("Google#enableOperation");
    
    this.shouldOperate = shouldOperate;
};

Google.prototype.addBookmark = function(title, url, category, callback, fail)
{
    if (this.shouldOperate) {
        Mojo.Log.info("Google#addBookmark");

        this.getXT(this.addBookmarkFinal.bind(this,title,url,category,callback,fail),fail);
    }
};

Google.prototype.addBookmarkFinal = function(bkTitle, bkUrl, category, callback, fail)
{
    var createURL = "https://www.google.com/bookmarks/api/thread?op=Star&xt=" + UrlUtil.encode(this.xt);
    
    var params = {
            results: [{
                    threadId: this.threadID,
                    elementId: 0,
                    title: bkTitle,
                    url: bkUrl,
                    snippet: "", /* TODO: Support description */
                    labels: [ category ],
                    timestamp: 0,
                    formattedTimestamp: 0,
                    authorId: 0,
                    signedUrl: "",
                    previewUrl: "",
                    threadComments: [],
                    parentId: this.threadID
                }]
        };
    
    this.createOrUpdateBookmark(createURL, params, callback, fail);
};

Google.prototype.updateBookmark = function(title, url, elementId, category, callback, fail)
{
    if (this.shouldOperate)
        this.getXT(this.updateBookmarkFinal.bind(this,title,url,elementId,category,callback,fail),fail);
};

Google.prototype.updateBookmarkFinal = function(bkTitle, bkUrl, bkElementId, category, callback, fail)
{
    var createURL = "https://www.google.com/bookmarks/api/thread?op=UpdateThreadElement&xt=" + UrlUtil.encode(this.xt);
    
    var params = {
            threadResults: [{
                    threadId: this.threadID,
                    elementId: bkElementId,
                    title: bkTitle,
                    url: bkUrl,
                    snippet: "", /* TODO: Support description */
                    labels: [ category ],
                    timestamp: 0,
                    formattedTimestamp: 0,
                    authorId: 0,
                    signedUrl: "",
                    previewUrl: "",
                    threadComments: [],
                    parentId: this.threadID
                }],
            threads: [],
            threadQueries: [],
            threadComments: []
        };
    
    this.createOrUpdateBookmark(createURL, params, callback, fail);
};

Google.prototype.removeBookmark = function(title, url, callback, fail)
{
    if (this.shouldOperate)
        this.getXT(this.removeBookmarkFinal.bind(this,title,url,callback,fail),fail);
};

Google.prototype.removeBookmarkFinal = function(bkTitle, bkUrl, callback, fail)
{

};

Google.prototype.createOrUpdateBookmark = function(executeUrl, bookmark, callback, fail)
{
    Mojo.Log.info("Google#createOrUpdateBookmark");
    
    var json = Object.toJSON(bookmark);
    
    jQuery.ajax({
            url: executeUrl,
            type: "POST",
            beforeSend: (function(jqXHR, settings) {
                            //var header = "SID=" + this.sid + "; HSID=" + this.hsid + "; SSID=" + this.ssid + ";"; //"GALX=" + this.galx + "; SID=" + this.sid + "; LSID=" + this.lsid + "; HSID=" + this.hsid + "; SSID=" + this.ssid + ";";
                            //jqXHR.setRequestHeader("Cookie", header);
                            var header = this.buildHeader();
                            if (header != "") {
                                jqXHR.setRequestHeader("Cookie", header);
                            }
                        }).bind(this),
            data: {td: json},
            dataType: "json",
            dataFilter: function(data, type){ return data.replace(")]}'",""); }, /* Google seems to return some garbage. We want to clean it up... */
            success: (function(data, textStatus, jqXHR) {
                            Mojo.Log.info("createOrUpdateBookmark succeeded");
                            if (callback)
                                callback(data);
                        }).bind(this),
            error: (function(jqXHR, textStatus, errorThrown) {
                    Mojo.Log.error("createOrUpdateBookmark failed -- status: " + textStatus + " err: " + errorThrown);
                        
                    if (fail)
                        fail(Google.LoginFailed);
                }).bind(this)
        });
};

Google.prototype.error = function(caller, jqXHR, textStatus, errorThrown)
{
    
};
