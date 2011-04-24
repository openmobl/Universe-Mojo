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

var Utils = {
    normalizeNumber: function(url) {
        var distance = 4;
        if (url.indexOf("://") != -1) {
            distance += 2;
        }
        
        var newURL = UrlUtil.decode(url.substr(distance));
        
        return newURL;
    },
    
    normalizeTitle: function(title) {
        return title.replace(/\n/g, ' ').strip();
    },
    
    toBool: function(string) {
        if (string === "1" || string === "true") {
            return true;
        } else {
            return false;
        }
    },
    
    toNumber: function(string) {
        return parseInt(string);
    },
    
    subLaunchWithInstall: function(controller, appID, appName, appDesc, appParams) {
        try {
            controller.serviceRequest("palm://com.palm.applicationManager", {
                    method: "launch",
                    parameters: {
                        id: appID,
                        params: appParams
                    },
                    onFailure: function() {
                        controller.showAlertDialog({
                                onChoose: function(value) {
                                    if (value === "yes") {
                                        controller.serviceRequest("palm://com.palm.applicationManager", {
                                                method: "launch",
                                                parameters: { target: "http://developer.palm.com/appredirect/?packageid=" + appID }
                                            });
                                    }
                                },
                                preventCancel: false,
                                title: $L(appName + " Not Installed"),
                                message: $L(appName + ", " + appDesc + ", is currently not installed on your device. Would you like to install it?"),
                                choices: [
                                    { label: $L("Yes, Install"), value: "yes", type: "affirmative" },
                                    { label: $L("No, Do Not Install"), value: "no", type: "negative" }
                                ]
                            });
                    }
                });
        } catch (e) {
            Mojo.Log.error("PageAssistant#subLaunchWithInstall(" + e + ")");
        }
    },

    subLaunchMultipleWithInstall: function(controller, appIDArray, appName, appDesc, appParams) {
        try {
            var index = 0;
            
            function makeCall() {
                if (index < appIDArray.length) {
                    controller.serviceRequest("palm://com.palm.applicationManager", {
                            method: "launch",
                            parameters: {
                                id: appIDArray[index],
                                params: appParams
                            },
                            onFailure: function() {
                                index++;
                                makeCall();
                            }
                        });
                } else {
                    controller.showAlertDialog({
                            onChoose: function(value) {
                                if (value === "yes") {
                                    controller.serviceRequest("palm://com.palm.applicationManager", {
                                            method: "open",
                                            parameters: { target: "http://developer.palm.com/appredirect/?packageid=" + appIDArray[0] }
                                        });
                                }
                            },
                            preventCancel: false,
                            title: $L(appName + " Not Installed"),
                            message: $L(appName + ", " + appDesc + ", is currently not installed on your device. Would you like to install it?"),
                            choices: [
                                { label: $L("Yes, Install"), value: "yes", type: "affirmative" },
                                { label: $L("No, Do Not Install"), value: "no", type: "negative" }
                            ]
                        });
                }
            }
            
            makeCall();
        } catch (e) {
            Mojo.Log.error("PageAssistant#subLaunchWithInstall(" + e + ")");
        }
    },
    
    launchDefaultHandler: function(url, mimeType) {
        var params = {
					target: url
				};
                
        if (mimeType) {
            params.mime = mimeType;
        }
        
        var request = new Mojo.Service.Request("palm://com.palm.applicationManager", {
        		method: "open",
				parameters: params
            });
    },
    
	contactPromptToAdd: function(sceneController, number) {
			sceneController.showAlertDialog({
                title: "Save to Contacts",
            	onChoose: this.doHandleContactSave.bind(this, number),
            	choices: [
					{ label: $L("Save as new"), value: "new" },
                    { label: $L("Add to existing"), value: "existing" },
                    { label: $L("Cancel"), type: "dismiss", value: "cancel" }
				]
        });
	},
    
    doHandleContactSave: function(number, choice) {
		var launchType ="";
		switch (choice) {
			case "existing":
				launchType = "addToExisting";
				break;
			case "new":
				launchType = "newContact";	
				break;
			default:
				return;
			
		}
		
		var contact = {
			phoneNumbers:[{value:number}]
		}
		
		var request = new Mojo.Service.Request("palm://com.palm.applicationManager", {
        		method: "open",
				parameters: {
					id: "com.palm.app.contacts",
					params: { "contact": contact, "launchType": launchType }
				}
            });
     },
     
     eventHasMetaKey: function(event) {
        var hasMeta = false;
        
        if (event.metaKey) {
            Mojo.Log.info("event has meta key");
            hasMeta = true;
        } else if (event.originalEvent) {
            Mojo.Log.info("event has originalEvent");
            if (event.originalEvent.metaKey) {
                Mojo.Log.info("event has originalEvent AND meta key");
                hasMeta = true;
            }
        }
        
        return hasMeta;
     },
     
     cmdMenuNameToPos: function(name) {
        var pos = -1;
        
        switch (name) {
            case "navButton1":
                pos = 0;
                break;
            case "navButton2":
                pos = 1;
                break;
            case "navButton3":
                pos = 3;
                break;
            case "navButton4":
                pos = 4;
                break;
            case "navButton5":
                pos = 5;
                break;
        }
        
        return pos;
     },
     
     cmdMenuPosToName: function(pos) {
        var name = "navButton0";
        
        switch (name) {
            case 0:
                name = "navButton1";
                break;
            case 1:
                name = "navButton2";
                break;
            case 2:
                break;
            case 3:
                name = "navButton3";
                break;
            case 4:
                name = "navButton4";
                break;
            case 5:
                name = "navButton5";
                break;
        }
        
        return name;
    },
     
    cmdMenuLookupItem: function(name) {
        var item = null;
        
        switch (name) {
            case MenuAssistant.Back.pref:
                item = Object.clone(MenuAssistant.Back.menu);
                break;
            case MenuAssistant.Forward.pref:
                item = Object.clone(MenuAssistant.Forward.menu);
                break;
            case MenuAssistant.History.pref:
                item = Object.clone(MenuAssistant.History.menu);
                break;
            case MenuAssistant.Bookmarks.pref:
                item = Object.clone(MenuAssistant.Bookmarks.menu);
                break;
            case MenuAssistant.Home.pref:
                item = Object.clone(MenuAssistant.Home.menu);
                break;
            case MenuAssistant.TopSites.pref:
                item = Object.clone(MenuAssistant.TopSites.menu);
                break;
            case MenuAssistant.OrientationLock.pref:
                item = Object.clone(MenuAssistant.OrientationLock.menu);
                break;
        }
        
        return item;
    },
    
    parseOutFile: function(fullFileAndPath) {
        var chunks = fullFileAndPath.split("/");
        
        if (chunks && chunks.length) {
            return chunks[chunks.length - 1];
        }
        
        return fullFileAndPath;
    }
};