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

function helpData()
{
}

helpData.get = function(lookup)
{
    if (helpData.lookup[lookup]) {
        return helpData.lookup[lookup];
    } else {
        return {
                title: lookup.replace(/_/g, " ").replace(/-/g, " "),
                data: $L("This section isn't setup.<br><br>Call a Programmer!<br>Tell Him: \"") + lookup + "\"."
            };
    }
    return false; // this shouldn't happen
}

helpData.lookup = 
{
	"homePage": { title: $L("Homepage"), data: $L("Set the default page that Universe will load on startup.")},
	"openOnStart": { title: $L("Open On Start"), data: $L("Set what Universe should open when it starts.")},
	"openOnNewCard": { title: $L("Open On New Card"), data: $L("Set what Universe should open when opening a new card.")},
	"searchProvider": { title: $L("Search Provider"), data: $L("Set the default search provider to use when performing searches from the Smart Menu.")},
	"phoneDialer": { title: $L("Phone Dialer"), data: $L("Select whether Universe should dial phone numbers through the default phone app, through another means or by prompting.")},
	"twitterClient": { title: $L("Twitter Client"), data: $L("Select which Twitter client Universe should use to share links.")},
    
    
	"privateBrowsing": { title: $L("Private Browsing"), data: $L("When enabled Universe will not store visited sites in its browsing history.")},
	"enableCache": { title: $L("Enable Cache"), data: $L("When enabled Universe will locally cache web pages for a faster browsing experience.")},
	"blockPopups": { title: $L("Block Pop Ups"), data: $L("Block websites from poping up annoying ads. This may cause some popup links to fail.")},
	"acceptCookies": { title: $L("Accept Cookies"), data: $L("Accept small bits of information from websites to enhance your browsing experience.<br/><br/>Cookies generally allow websites to know that you have logged in so that you can return to the site without re-entering your credentials.")},
	"enableJS": { title: $L("Enable JavaScript"), data: $L("Enable JavaScript to operate. Many websites require this feature to properly function.")},
    
    
	"hideIconsWhileBrowsing": { title: $L("Hide Icons While Browsing"), data: $L("Hide the navigation icons while browsing web pages. If enabled, the navigation icons will be displayed while a page is loading and remain hidden while you browser. You can bring them up any time by performing a meta-tap on the webpage.<br/><br/>A meta-tap can be performed by pressing one finger in the left of the gesture area and tapping on the screen at the same time.")},
	"autoRotate": { title: $L("Auto Rotate"), data: $L("Allow the screen to auto-rotate while you are browsing. This feature can be temporarily disabled with the rotate-lock navigation icon.<br/><br/>You can add the rotate lock navigation icon to your navigation menu by opening the \"View Options\" menu item from the main menu.")},
	"showBookmark": { title: $L("Show Bookmark"), data: $L("A small semi-transparent bookmark can be displayed in the upper left hand corner as you browse sites that you have previously bookmarked. This indicates that the website has already been bookmarked.")},
    
    
	"googleEmail": { title: $L("Google Email"), data: $L("This is your Google Email address that you use to log into Google Bookmarks.")},
	"googlePassword": { title: $L("Google Password"), data: $L("This is the password that you use to log into Google Bookmarks. This password is not stored on the device.")}
};