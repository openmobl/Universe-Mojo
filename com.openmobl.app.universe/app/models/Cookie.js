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

function Cookie(name)
{
    this.cookie = new Mojo.Model.Cookie(name);
	this.cookieStore = this.cookie.get();
}

Cookie.prototype.set = function(key, value)
{
    try {
        if (value) { /* TODO: Bleh... */
            this.cookieStore[key] = value;
            this.cookie.put(this.cookieStore);
        } else {
            this.cookie.put(key);
            this.cookieStore = this.cookie.get();
        }
    } catch (e) {
        Mojo.Log.logException(e, "Cookie#set");
    }
}

Cookie.prototype.get = function(key)
{
    try {
        if (key) {
            return this.cookieStore[key];
        } else {
            return this.cookieStore;
        }
    } catch (e) {
        Mojo.Log.logException(e, "Cookie#get");
    }
}
