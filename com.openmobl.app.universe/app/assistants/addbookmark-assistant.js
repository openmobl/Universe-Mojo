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

AddBookmarkAssistant.addBookmark = $L("Add Bookmark");
AddBookmarkAssistant.updateBookmark = $L("Update Bookmark");
AddBookmarkAssistant.addToLauncher = $L("Add To Launcher");

function AddBookmarkAssistant(sceneAssistant, id, title, url, folder, callbackFunc, canDelete, showFolder)
{
	this.sceneAssistant = sceneAssistant;
	this.callbackFunc = callbackFunc;
    this.title = title;
    this.url = url;
    this.id = id;
    this.folder = folder;
    this.canDelete = canDelete;
    this.showFolder = showFolder;

    this.titleModel = {
        value: this.title,
        disabled: false
    };
    this.titleAttributes = {
        multiline: false,
        limitResize: true,
        enterSubmits: false,
        autoFocus: true,
        textCase: Mojo.Widget.steModeSentenceCase /* TODO: Or TitleCase ? */
    };
    
    this.urlModel = {
        value: this.url,
        disabled: false
    };
    this.urlAttributes = {
        multiline: true,
        limitResize: true,
        enterSubmits: false,
        autoFocus: false,
        focusMode: Mojo.Widget.focusSelectMode,
        autoReplace: false,
        textCase: Mojo.Widget.steModeLowerCase
    };

    this.folderModel = {
        value: this.folder,
        disabled: false
    };
    this.folderAttributes = {
        multiline: false,
        limitResize: true,
        enterSubmits: false,
        autoFocus: true,
        textCase: Mojo.Widget.steModeSentenceCase /* TODO: Or TitleCase ? */
    };
}

AddBookmarkAssistant.prototype.setup = function(widget)
{
    this.widget = widget;
    
    this.saveHandler = this.save.bindAsEventListener(this);
    this.cancelHandler = this.cancel.bindAsEventListener(this);
    this.deleteHandler = this.deleteItem.bindAsEventListener(this);
    
    this.titleField = this.sceneAssistant.controller.get("bookmark-title");
    this.urlField = this.sceneAssistant.controller.get("bookmark-url");
    this.folderField = this.sceneAssistant.controller.get("bookmark-folder");
    
    this.sceneAssistant.controller.setupWidget("bookmark-title", this.titleAttributes, this.titleModel);
    this.sceneAssistant.controller.setupWidget("bookmark-url", this.urlAttributes, this.urlModel);
    this.sceneAssistant.controller.setupWidget("bookmark-folder", this.folderAttributes, this.folderModel);
    
    this.sceneAssistant.controller.setupWidget("update", {}, {label: "Save", buttonClass: "primary"});
    this.sceneAssistant.controller.setupWidget("cancel", {}, {label: "Cancel", buttonClass: "seconadry"});
    this.sceneAssistant.controller.setupWidget("delete", {}, {label: "Delete", buttonClass: "negative"});
    
    this.sceneAssistant.controller.listen("update", Mojo.Event.tap, this.saveHandler);
    this.sceneAssistant.controller.listen("cancel", Mojo.Event.tap, this.cancelHandler);
    this.sceneAssistant.controller.listen("delete", Mojo.Event.tap, this.deleteHandler);
    
    if (this.canDelete) {
        this.sceneAssistant.controller.get("delete").style.display = "block";
    } else {
        this.sceneAssistant.controller.get("delete").style.display = "none";
    }
    
    if (this.showFolder) {
        this.sceneAssistant.controller.get("folder-group").style.display = "block";
    } else {
        this.sceneAssistant.controller.get("folder-group").style.display = "none";
    }
};

AddBookmarkAssistant.prototype.cleanup = function(widget)
{
    this.sceneAssistant.controller.stopListening("update", Mojo.Event.tap, this.saveHandler, false);
    this.sceneAssistant.controller.stopListening("cancel", Mojo.Event.tap, this.cancelHandler, false);
    this.sceneAssistant.controller.stopListening("delete", Mojo.Event.tap, this.deleteHandler, false);
};

AddBookmarkAssistant.prototype.save = function()
{
    var title = this.titleField.mojo.getValue();
    var url = this.urlField.mojo.getValue();
    var folder = this.folderField.mojo.getValue();
    
    /* TODO: Support description and category/folder */
    this.callbackFunc(this.id, title, url, "", folder);
    this.widget.mojo.close();
};

AddBookmarkAssistant.prototype.cancel = function()
{
    this.widget.mojo.close();
};

AddBookmarkAssistant.prototype.deleteItem = function()
{
    var title = this.titleField.mojo.getValue();
    var url = this.urlField.mojo.getValue();
    var folder = this.folderField.mojo.getValue();
    
    /* TODO: Support description and category/folder */
    this.callbackFunc(this.id, title, url, "", folder, true);
    this.widget.mojo.close();
};
