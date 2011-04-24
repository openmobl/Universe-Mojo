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

DownloadAssistant.kDownloadPath = "/media/internal/Downloads/";

function DownloadAssistant(params)
{
    this.downloadQueue = [];
    this.downloadList = [];
    this.active = false;
    
    this.downloadListAttr = {
            itemTemplate: "download/download-entry",
			listTemplate: "download/downloads-container",
			itemsCallback: this.listRenderItems.bind(this),
			renderLimit: 16,
			lookahead: 8
        };
        
    this.downloadListElement = undefined;
    
    this.listTapHandler = this.listTap.bind(this);
    
    this.queueUpDownload(params);
}

DownloadAssistant.prototype.aboutToActivate = function(callback)
{
    callback.defer(); //makes the setup behave like it should.
};

DownloadAssistant.prototype.setup = function()
{
    this.active = true;
    
    this.controller.setupWidget("download-list", this.downloadListAttr);
    this.downloadListElement = this.controller.get("download-list");
    
    this.controller.listen("download-list", Mojo.Event.listTap, this.listTapHandler, false);
};

DownloadAssistant.prototype.cleanup = function()
{
    this.controller.stopListening("download-list", Mojo.Event.listTap, this.listTapHandler, false);
    
    var i = 0;
    for (i = 0; i < this.downloadList.length; i++) {
        if (!this.downloadList[i].complete &&
            !this.downloadList[i].error) {
            this.controller.serviceRequest("palm://com.palm.downloadmanager/", {
                    method: "cancelDownload",
                    parameters: { "ticket": this.downloadList[i].ticket },
                    onSuccess: function(resp) { }.bind(this),
                    onFailure: function(e) { }.bind(this)
                });
        }
    }
};

DownloadAssistant.prototype.activate = function()
{
    this.processDownloads();
};

DownloadAssistant.prototype.deactivate = function()
{

};

DownloadAssistant.prototype.queueUpDownload = function(params)
{
    Mojo.Log.info("Queueing up download: " + params.url);
    
    this.downloadQueue.push(params);
    
    if (this.active) {
        this.processDownloads();
    }
};

DownloadAssistant.prototype.processDownloads = function()
{
    var i = 0;
    
    for (i = 0; i < this.downloadQueue.length; i++) {
        this.kickoffDownload(this.downloadQueue[i]);
    }
    
    this.downloadQueue = [];
};

DownloadAssistant.prototype.lookupDownload = function(ticket)
{
    var i = 0;
    
    for (i = 0; i < this.downloadList.length; i++) {
        if (this.downloadList[i].ticket === ticket) {
            return i;
        }
    }
    
    return -1;
};

DownloadAssistant.prototype.redrawDownloadList = function()
{
    this.downloadListElement.mojo.setLengthAndInvalidate(this.downloadList.length);
	this.downloadListElement.mojo.revealItem(0, false);
};

DownloadAssistant.prototype.updateDownloadList = function(foundDownload)
{
    //this.downloadListElement.mojo.setLengthAndInvalidate(this.downloadList.length);
	//this.downloadListElement.mojo.revealItem(0, false);
    
    this.controller.modelChanged(this.downloadList[foundDownload]);
};

DownloadAssistant.prototype.downloadSuccess = function(resp)
{
    try {
        if (resp.subscribed && !resp.completed) {
            var newDownload = {
                    ticket: resp.ticket,
                    target: resp.target,
                    url: resp.url,
                    completed: false,
                    error: false,
                    mimeType: "",
                    
                    status: "active",
                    action: "",
                    
                    fileName: "",
                    progress: 0,
                    icon: "download-action-icon"
                };
            newDownload.fileName = UrlUtil.decode(Utils.parseOutFile(resp.target));
                
            this.downloadList.push(newDownload);

            this.redrawDownloadList();
        } else {
            var foundDownload = this.lookupDownload(resp.ticket);
            if (resp.completed) {
                Mojo.Log.info("DownloadAssistant#downloadSuccess - download done!");
                this.downloadList[foundDownload].progress = 100;
                this.downloadList[foundDownload].completed = true;
                this.downloadList[foundDownload].status = "inactive";
                this.downloadList[foundDownload].action = "complete";
                this.downloadList[foundDownload].mimeType = resp.mimetype;
            } else if (resp.aborted) {
                Mojo.Log.info("DownloadAssistant#downloadSuccess - download aborted!");
                this.downloadList[foundDownload].completed = false;
                this.downloadList[foundDownload].error = true;
                this.downloadList[foundDownload].status = "inactive";
                this.downloadList[foundDownload].action = "";
            } else {
                this.downloadList[foundDownload].progress = Math.round((resp.amountReceived / resp.amountTotal) * 100);
                this.downloadList[foundDownload].status = "active";
                this.downloadList[foundDownload].action = "cancel";
                Mojo.Log.info("DownloadAssistant#downloadSuccess - download " + resp.ticket + " is " + this.downloadList[foundDownload].progress + "% complete");
            }
            
            this.redrawDownloadList();
        }
    } catch (e) {
        Mojo.Log.error("Could not read success data: " + e);
    }
};

DownloadAssistant.prototype.downloadFailure = function(error)
{
    try {
        var foundDownlad = this.lookupDownload(resp.ticket);
        this.downloadList[foundDownlad].completed = false;
        this.downloadList[foundDownlad].error = true;
        
        this.redrawDownloadList();
    } catch (e) {
        Mojo.Log.error("Could not read error data: " + e);
    }
};

DownloadAssistant.prototype.kickoffDownload = function(download)
{
    this.controller.serviceRequest("palm://com.palm.downloadmanager/", {
            method: "download",
            parameters: {
                    target: download.url,
                    mime: download.mimeType,
                    targetDir : DownloadAssistant.kDownloadPath,
                    keepFilenameOnRedirect: false,
                    subscribe: true
                },
            onSuccess: this.downloadSuccess.bind(this),
            onFailure: this.downloadFailure.bind(this)
        });
};

DownloadAssistant.prototype.listRenderItems = function(list, offset, count)
{
    Mojo.Log.info("DownloadAssistant#listRenderItems");
    
	var visibleItems = this.downloadList.slice(offset, offset + count);
    
	list.mojo.noticeUpdatedItems(offset, visibleItems);
};

DownloadAssistant.prototype.listTap = function(event)
{
    Mojo.Log.info("DownloadAssistant#listTap");
    
    if (event.item) {
        var ticket = event.item.ticket;
        var target = event.item.target;
        var completed = event.item.completed;
        var mimeType = event.item.mimeType;
        
        if (!completed) {
            this.controller.serviceRequest("palm://com.palm.downloadmanager/", {
                    method: "cancelDownload",
                    parameters: { "ticket": ticket },
                    onSuccess: this.downloadSuccess.bind(this),
                    onFailure: function(e) { }.bind(this)
                });
        } else if (event.item.action === "complete") {
            Utils.launchDefaultHandler("file://" + target, mimeType);
        }
    }
};

DownloadAssistant.prototype.handleCommand = function(event)
{        

};


