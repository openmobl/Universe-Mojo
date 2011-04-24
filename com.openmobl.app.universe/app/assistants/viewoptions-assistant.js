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

ViewoptionsAssistant.Empty = {icon: "images/menu-icon-scrim.png", command: "do-Nothing",  disabled: true};

function ViewoptionsAssistant()
{
    this.cmdMenuAttr = { menuClass:"no-fade" };
    this.cmdMenuModel = {
        items: [
                {items: [ViewoptionsAssistant.Empty]},
                {items: [ViewoptionsAssistant.Empty]},
                {},
                {items: [ViewoptionsAssistant.Empty]},
                {items: [ViewoptionsAssistant.Empty]},
                {items: [ViewoptionsAssistant.Empty]}
            ]
    };

    this.listChangedHandler = this.listChanged.bindAsEventListener(this);
}

ViewoptionsAssistant.buttonOptions = [
        /*{label: $L("None"), value: "none"},*/ /* TODO: Implement */
        {label: $L("Back"), value: "back"},
        {label: $L("Forward"), value: "forward"},
        {label: $L("History"), value: "history"},
        {label: $L("Bookmarks"), value: "bookmarks"},
        {label: $L("Home"), value: "home"},
        {label: $L("Top Sites"), value: "topsites"},
        {label: $L("Orientation Lock"), value: "orientationlock"},
    ];

ViewoptionsAssistant.prototype.setup = function()
{
    this.prefsOk = Universe.getPrefsManager().hasStarted();
    Universe.getPrefsManager().addWatcher("viewoptions", this.handlePrefsChange.bind(this));
    
    this.models = [];
    
    var prefs = Universe.getPrefsManager();
    
    this.setupList("navButton1", prefs.get("navButton1"), ViewoptionsAssistant.buttonOptions, $L("First"));
    this.setupList("navButton2", prefs.get("navButton2"), ViewoptionsAssistant.buttonOptions, $L("Second"));
    this.setupList("navButton3", prefs.get("navButton3"), ViewoptionsAssistant.buttonOptions, $L("Third"));
    this.setupList("navButton4", prefs.get("navButton4"), ViewoptionsAssistant.buttonOptions, $L("Fourth"));
    this.setupList("navButton5", prefs.get("navButton5"), ViewoptionsAssistant.buttonOptions, $L("Fifth"));
    
    this.cmdMenuModel.items[0].items[0] = Utils.cmdMenuLookupItem(prefs.get("navButton1"));
    this.cmdMenuModel.items[1].items[0] = Utils.cmdMenuLookupItem(prefs.get("navButton2"));
    this.cmdMenuModel.items[3].items[0] = Utils.cmdMenuLookupItem(prefs.get("navButton3"));
    this.cmdMenuModel.items[4].items[0] = Utils.cmdMenuLookupItem(prefs.get("navButton4"));
    this.cmdMenuModel.items[5].items[0] = Utils.cmdMenuLookupItem(prefs.get("navButton5"));
    
    this.controller.setupWidget(Mojo.Menu.commandMenu, this.cmdMenuAttr, this.cmdMenuModel);
};

ViewoptionsAssistant.prototype.cleanup = function()
{
    this.destroyList("navButton1");
    this.destroyList("navButton2");
    this.destroyList("navButton3");
    this.destroyList("navButton4");
    this.destroyList("navButton5");
};

ViewoptionsAssistant.prototype.handlePrefsChange = function(update)
{
    this.prefsOk = true; // We have loaded some preferences in, so we are ok
    
    // go through each preference, set new model value, call model changed
    this.models.each((function(item) {
        item.original = update[item.key];
        
        this.controller.modelChanged(item);
    }).bind(this));
};

ViewoptionsAssistant.prototype.setupList = function(name, value, data, displayLabel)
{
    Mojo.Log.info("ViewoptionsAssistant#setupList - name: " + name + " value: " + value);
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
ViewoptionsAssistant.prototype.destroyList = function(name)
{
    this.controller.stopListening(name, Mojo.Event.propertyChange, this.listChangedHandler);
};

ViewoptionsAssistant.prototype.listChanged = function(event)
{
    if (this.prefsOk) { // DO NOT accept the pref changes since we have not loaded the saved prefs
        this.changed = true;
    
        Universe.getPrefsManager().set(event.target.id, event.value);
        var newItem = Utils.cmdMenuLookupItem(event.value);
        var newPos = Utils.cmdMenuNameToPos(event.target.id);
        
        this.cmdMenuModel.items[newPos].items[0] = newItem;
        
        var i = 0;
        for (i = 0; i < this.cmdMenuModel.items.length; i++) {
            if (i != newPos && 
                this.cmdMenuModel.items[i].items &&
                this.cmdMenuModel.items[i].items[0] &&
                this.cmdMenuModel.items[i].items[0].command === newItem.command) {
                    this.cmdMenuModel.items[i].items[0] = ViewoptionsAssistant.Empty;
                    // TODO: set prefences and update list
            }
        }
        
        this.controller.modelChanged(this.cmdMenuModel);
    }
};
