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

function HistoryAssistant()
{
    this.listDividerHandler = this.listDivider.bind(this);
    this.listRenderItemsTodayHandler = this.listRenderItemsToday.bind(this);
    this.listRenderItemsYesterdayHandler = this.listRenderItemsYesterday.bind(this);
    this.listRenderItemsOlderHandler = this.listRenderItemsOlder.bind(this);
    this.listTapHandler = this.listTap.bind(this);
    this.drawerTapHandler = this.drawerTap.bind(this);
    
    this.historyDateList = [
        {
            displayName: HistoryAssistant.Today,
            palmArrowOrientation: "palm-arrow-expanded",
            day: "today",
            collapsedDisplay: ""
        },
        {
            displayName: HistoryAssistant.Yesterday,
            palmArrowOrientation: "palm-arrow-closed",
            day: "yesterday",
            collapsedDisplay: "none"
        },
        {
            displayName: HistoryAssistant.Older,
            palmArrowOrientation: "palm-arrow-closed",
            day: "older",
            collapsedDisplay: "none"
        },
    ];
    
    this.historyListItemsToday = [];
    this.historyListItemsYesterday = [];
    this.historyListItemsOlder = [];
    
    this.historyListTodayAttr = {
            itemTemplate: "history/history-list-item",
			itemsCallback: this.listRenderItemsTodayHandler,
        };
    this.historyListYesterdayAttr = {
            itemTemplate: "history/history-list-item",
			itemsCallback: this.listRenderItemsYesterdayHandler,
        };
    this.historyListOlderAttr = {
            itemTemplate: "history/history-list-item",
			itemsCallback: this.listRenderItemsOlderHandler,
        };
    this.historyListModel = {
            items: []
        };
}

HistoryAssistant.prototype.setup = function()
{
    this.calculateMidnights();
    this.setupDrawers();
    
    this.controller.listen("history-list-container", Mojo.Event.listTap, this.listTapHandler, false);
    this.controller.listen("history-list-container", Mojo.Event.tap, this.drawerTapHandler, false);
};

HistoryAssistant.prototype.aboutToActivate = function(callback)
{
    callback.defer(); //makes the setup behave like it should.
};

HistoryAssistant.prototype.setupMenus = function()
{

};

HistoryAssistant.prototype.calculateMidnights= function()
{
    var date = new Date();
    date.setHours(0, 0, 0, 1);
    
    this.midnight = date.getTime();
    //this.tomorrowMidnight = this.midnight + 86400000;
    this.lastMidnight = this.midnight - 86400000;
};

HistoryAssistant.prototype.setupDrawers = function()
{
    var html = Mojo.View.render({collection: this.historyDateList, template: "history/history-list-container"});
    this.controller.get("history-list-container").innerHTML = html;
    
    this.controller.setupWidget("list-today", this.historyListTodayAttr, {});
    this.todayList = this.controller.get("list-today");
    
    this.controller.setupWidget("list-yesterday", this.historyListYesterdayAttr, {});
    this.yesterdayList = this.controller.get("list-yesterday");
    
    this.controller.setupWidget("list-older", this.historyListOlderAttr, {});
    this.olderList = this.controller.get("list-older");
};

HistoryAssistant.prototype.listDivider = function(itemModel)
{
    Mojo.Log.info("HistoryAssistant#listDivider");
    
    var label = HistoryAssistant.Older;
    
    if (itemModel.date > this.midnight) {
        label = HistoryAssistant.Today;
    } else if (itemModel.date > this.lastMidnight) {
        label = HistoryAssistant.Yesterday;
    }
    
    return label; /* TODO: CHANGEME */
};

HistoryAssistant.prototype.listRenderItems = function(array, list, offset, count)
{
    Mojo.Log.info("HistoryAssistant#listRenderItems");
    
	var visibleItems = array.slice(offset, offset + count);
    
	list.mojo.noticeUpdatedItems(offset, visibleItems);
};

HistoryAssistant.prototype.listRenderItemsToday = function(list, offset, count)
{
    this.listRenderItems(this.historyListItemsToday, list, offset, count);
};
HistoryAssistant.prototype.listRenderItemsYesterday = function(list, offset, count)
{
    this.listRenderItems(this.historyListItemsYesterday, list, offset, count);
};
HistoryAssistant.prototype.listRenderItemsOlder = function(list, offset, count)
{
    this.listRenderItems(this.historyListItemsOlder, list, offset, count);
};

HistoryAssistant.prototype.listTap = function(event)
{
    Mojo.Log.info("HistoryAssistant#listTap");
    
    if (event.item) {
        var url = event.item.url;
        
        if (url.length > 0) {
            this.controller.stageController.popScene({action: "loadURL", target: url});
        }
    }
};

/* From eMail application and various SDK sample apps. Copyright (c) 2010 Palm, Inc. */
HistoryAssistant.prototype.setDrawerState = function(id, expand)
{
	var rowElement = this.controller.get(id);
    var toggling;
	
	Mojo.Log.info("HistoryAssistant#setDrawerState(): id=%s, expand=%s", id, expand);
	
	if (!rowElement || !rowElement.hasClassName("history-day-container")) {
		return;
	}
	
	// Make sure it's visible -- it may have been hidden if user was filtering.
	rowElement.style.display = "";
	
	// Find the arrow button, and determine current drawer state
	var toggleButton = rowElement.querySelector("div.arrow-button");
	var currentlyExpanded = toggleButton.hasClassName("palm-arrow-expanded");
	
	if (!currentlyExpanded && !toggleButton.hasClassName("palm-arrow-closed")) {
		return;
	}
	
	// If 'expand' is not specified, toggle the state.
	// If the state is already correct, just return.
	if(expand === undefined) {
		expand = !currentlyExpanded;
		toggling = true;
	} else if(expand === currentlyExpanded) {
		return;
	}
	
	// get the container div.
	var container = this.controller.get(id + "-container");
	var maxHeight = container.offsetHeight;
	
	// Update classes on the button
	if (expand) {
		toggleButton.addClassName("palm-arrow-expanded");
		toggleButton.removeClassName("palm-arrow-closed");
		container.style.display = "";
		maxHeight = container.offsetHeight;
		container.style.height = "1px";

		// See if the div should scroll up a little to show the contents
        /*var elementTop = container.viewportOffset().top;
        var scroller = Mojo.View.getScrollerForElement(container);
        if (elementTop > viewPortMidway && scroller && toggling) {
            //Using setTimeout to give the animation time enough to give the div enough height to scroll to
            var scrollToPos = scroller.mojo.getScrollPosition().top - (elementTop - viewPortMidway);
            setTimeout(function() {scroller.mojo.scrollTo(undefined, scrollToPos, true);}, 200);
        }*/
	} else {
		container.style.height = maxHeight + "px";
		toggleButton.addClassName("palm-arrow-closed");
		toggleButton.removeClassName("palm-arrow-expanded");
	}

	// Animate height change on the container div.
	Mojo.Log.info("setDrawerState: reverse:%s, from: 1, maxHeight:%d", !currentlyExpanded, maxHeight);
	var options = {
            reverse: !currentlyExpanded,
            onComplete: this.animationComplete.bind(this, expand, rowElement.id, maxHeight, toggling),
            curve: "over-easy",
            from: 1,
            to: maxHeight,
            duration: 0.4
        };
	Mojo.Animation.animateStyle(container, "height", "bezier", options);
};

HistoryAssistant.prototype.animationComplete = function(expand, accountId, listHeight, toggling, itemContainer, cancelled)
{
    if (!expand) {
        itemContainer.style.display = "none";
    }
    itemContainer.style.height = "auto";
    
    /*if (!toggling) {
        // If we're not toggling the drawer state, then it was forced open/closed, ad we shouldn't update the preferences.
        // This happens when we're handling typedown search.
        return;
    }*/
};

HistoryAssistant.prototype.drawerTap = function(event)
{
    Mojo.Log.info("HistoryAssistant#drawerTap");
	if(event.target.hasAttribute("drawer")) {
		this.setDrawerState(event.target.getAttribute("drawer"));
		event.stopPropagation();
	}
};

HistoryAssistant.prototype.historyUpdate = function(results)
{
    var i = 0;
    for (i = (results.length - 1); i >= 0; i--) {
        if (results[i].date > this.midnight) {
            this.historyListItemsToday.push(results[i]);
        } else if (results[i].date > this.lastMidnight) {
            this.historyListItemsYesterday.push(results[i]);
        } else {
            this.historyListItemsOlder.push(results[i]);
        }
    }
    
    this.todayList.mojo.setLengthAndInvalidate(this.historyListItemsToday.length);
	this.todayList.mojo.revealItem(0, false);
    
    this.yesterdayList.mojo.setLengthAndInvalidate(this.historyListItemsYesterday.length);
	this.yesterdayList.mojo.revealItem(0, false);
    
    this.olderList.mojo.setLengthAndInvalidate(this.historyListItemsOlder.length);
	this.olderList.mojo.revealItem(0, false);
};

HistoryAssistant.prototype.activate = function(event)
{
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
    
    var historyUpdateCallback = this.historyUpdate.bind(this);
    
    Universe.getHistoryManager().getHistory(historyUpdateCallback);
};

HistoryAssistant.prototype.deactivate = function(event)
{
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
};

HistoryAssistant.prototype.cleanup = function(event)
{
    this.controller.stopListening("history-list-container", Mojo.Event.listTap, this.listTapHandler, false);
    this.controller.stopListening("history-list-container", Mojo.Event.tap, this.drawerTapHandler, false);
};

HistoryAssistant.prototype.handleCommand = function(event)
{

};

HistoryAssistant.Today = $L("Today");
HistoryAssistant.Yesterday = $L("Yesterday");
HistoryAssistant.Older = $L("Older");

