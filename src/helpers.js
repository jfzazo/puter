/**
 * Copyright (C) 2024 Puter Technologies Inc.
 *
 * This file is part of Puter.
 *
 * Puter is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import path from "./lib/path.js"
import mime from "./lib/mime.js";
import UIAlert from './UI/UIAlert.js'
import UIItem from './UI/UIItem.js'
import UIWindow from './UI/UIWindow.js'
import UIWindowLogin from './UI/UIWindowLogin.js';
import UIWindowSaveAccount from './UI/UIWindowSaveAccount.js';
import UIWindowConfirmDownload from './UI/UIWindowConfirmDownload.js';
import UIWindowCopyProgress from './UI/UIWindowCopyProgress.js';
import UIWindowMoveProgress from './UI/UIWindowMoveProgress.js';
import UIWindowNewFolderProgress from './UI/UIWindowNewFolderProgress.js';
import UIWindowDownloadProgress from './UI/UIWindowDownloadProgress.js';
import UIWindowUploadProgress from './UI/UIWindowUploadProgress.js';
import UIWindowProgressEmptyTrash from './UI/UIWindowProgressEmptyTrash.js';
import download from './helpers/download.js';
import update_username_in_gui from './helpers/update_username_in_gui.js';
import update_title_based_on_uploads from './helpers/update_title_based_on_uploads.js';
import content_type_to_icon from './helpers/content_type_to_icon.js';
import UIWindowDownloadDirProg from './UI/UIWindowDownloadDirProg.js';

window.is_auth = ()=>{
    if(localStorage.getItem("auth_token") === null || auth_token === null)
        return false;
    else
        return true;
}

window.suggest_apps_for_fsentry = async (options)=>{
    let res = await $.ajax({
        url: api_origin + "/suggest_apps",
        type: 'POST',
        contentType: "application/json",
        data: JSON.stringify({
            uid: options.uid ?? undefined,
            path: options.path ?? undefined,
        }),
        headers: {
            "Authorization": "Bearer "+auth_token
        },
        statusCode: {
            401: function () {
                logout();
            },
        },     
        success: function (res){
            if(options.onSuccess && typeof options.onSuccess == "function")
                options.onSuccess(res);
        }
    });

    return res;
}

/**
 * Formats a binary-byte integer into the human-readable form with units.
 * 
 * @param {integer} bytes 
 * @returns 
 */
window.byte_format = (bytes)=>{
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
	if (bytes === 0) return '0 Byte';
	const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
	return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
};

/**
 * A function that generates a UUID (Universally Unique Identifier) using the version 4 format, 
 * which are random UUIDs. It uses the cryptographic number generator available in modern browsers.
 *
 * The generated UUID is a 36 character string (32 alphanumeric characters separated by 4 hyphens). 
 * It follows the pattern: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx, where x is any hexadecimal digit 
 * and y is one of 8, 9, A, or B.
 *
 * @returns {string} Returns a new UUID v4 string.
 *
 * @example
 * 
 * let id = window.uuidv4(); // Generate a new UUID
 * 
 */
window.uuidv4 = ()=>{
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

/**
 * Checks if the provided string is a valid email format.
 *
 * @function
 * @global
 * @param {string} email - The email string to be validated.
 * @returns {boolean} `true` if the email is valid, otherwise `false`.
 * @example
 * window.is_email("test@example.com");     // true
 * window.is_email("invalid-email");        // false
 */
window.is_email = (email) => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

/**
 * A function that truncates a file name if it exceeds a certain length, while preserving the file extension. 
 * An ellipsis character '…' is added to indicate the truncation. If the original filename is short enough, 
 * it is returned unchanged.
 *
 * @param {string} input - The original filename to be potentially truncated.
 * @param {number} max_length - The maximum length for the filename. If the original filename (excluding the extension) exceeds this length, it will be truncated.
 *
 * @returns {string} The truncated filename with preserved extension if original filename is too long; otherwise, the original filename.
 *
 * @example
 *
 * let truncatedFilename = window.truncate_filename('really_long_filename.txt', 10); 
 * // truncatedFilename would be something like 'really_lo…me.txt'
 *
 */
window.truncate_filename = (input, max_length)=>{
    const extname = path.extname('/' + input);

    if ((input.length - 15)  > max_length){
        if(extname !== '')
            return input.substring(0, max_length) + '…' + input.slice(-1 * (extname.length + 2));
        else
            return input.substring(0, max_length) + '…';
    }
    return input;
};

/**
 * A function that scrolls the parent element so that the child element is in view. 
 * If the child element is already in view, no scrolling occurs. 
 * The function decides the best scroll direction based on which requires the smaller adjustment.
 *
 * @param {HTMLElement} parent - The parent HTML element that might be scrolled.
 * @param {HTMLElement} child - The child HTML element that should be made viewable.
 * 
 * @returns {void}
 *
 * @example
 *
 * let parentElem = document.querySelector('#parent');
 * let childElem = document.querySelector('#child');
 * window.scrollParentToChild(parentElem, childElem); 
 * // Scrolls parentElem so that childElem is in view
 *
 */
window.scrollParentToChild = (parent, child)=>{
    // Where is the parent on page
    var parentRect = parent.getBoundingClientRect();

    // What can you see?
    var parentViewableArea = {
      height: parent.clientHeight,
      width: parent.clientWidth
    };
  
    // Where is the child
    var childRect = child.getBoundingClientRect();
    // Is the child viewable?
    var isViewable = (childRect.top >= parentRect.top) && (childRect.bottom <= parentRect.top + parentViewableArea.height);
  
    // if you can't see the child try to scroll parent
    if (!isViewable) {
          // Should we scroll using top or bottom? Find the smaller ABS adjustment
          const scrollTop = childRect.top - parentRect.top;
          const scrollBot = childRect.bottom - parentRect.bottom;
          if (Math.abs(scrollTop) < Math.abs(scrollBot)) {
              // we're near the top of the list
              parent.scrollTop += (scrollTop + 80);
          } else {
              // we're near the bottom of the list
              parent.scrollTop += (scrollBot + 80);
          }
    }
}

window.getItem = async function(options){
    return $.ajax({
        url: api_origin + "/getItem",
        type: 'POST',
        data: JSON.stringify({ 
            key: options.key,
            app: options.app_uid,
        }),
        async: true,
        contentType: "application/json",
        headers: {
            "Authorization": "Bearer "+auth_token
        },
        statusCode: {
            401: function () {
                logout();
            },
        },        
        success: function (result){
            if(options.success && typeof(options.success) === "function")
                options.success(result);
        }  
    })
}

window.setItem = async function(options){
    return $.ajax({
        url: api_origin + "/setItem",
        type: 'POST',
        data: JSON.stringify({ 
            app: options.app_uid,
            key: options.key,
            value: options.value,
        }),
        async: true,
        contentType: "application/json",
        headers: {
            "Authorization": "Bearer "+auth_token
        },
        statusCode: {
            401: function () {
                logout();
            },
        },        
        success: function (fsentry){
            if(options.success && typeof(options.success) === "function")
                options.success(fsentry)
        }  
    })
}

/**
 * Converts a glob pattern to a regular expression, with optional extended or globstar matching.
 *
 * @param {string} glob - The glob pattern to convert.
 * @param {Object} [opts] - Optional options for the conversion.
 * @param {boolean} [opts.extended=false] - If true, enables extended matching with single character matching, character ranges, group matching, etc.
 * @param {boolean} [opts.globstar=false] - If true, uses globstar matching, where '*' matches zero or more path segments.
 * @param {string} [opts.flags] - Regular expression flags to include (e.g., 'i' for case-insensitive).
 * @returns {RegExp} The generated regular expression.
 * @throws {TypeError} If the provided glob pattern is not a string.
 */
window.globToRegExp = function (glob, opts) {
    if (typeof glob !== 'string') {
        throw new TypeError('Expected a string');
    }

    var str = String(glob);

    // The regexp we are building, as a string.
    var reStr = "";

    // Whether we are matching so called "extended" globs (like bash) and should
    // support single character matching, matching ranges of characters, group
    // matching, etc.
    var extended = opts ? !!opts.extended : false;

    // When globstar is _false_ (default), '/foo/*' is translated a regexp like
    // '^\/foo\/.*$' which will match any string beginning with '/foo/'
    // When globstar is _true_, '/foo/*' is translated to regexp like
    // '^\/foo\/[^/]*$' which will match any string beginning with '/foo/' BUT
    // which does not have a '/' to the right of it.
    // E.g. with '/foo/*' these will match: '/foo/bar', '/foo/bar.txt' but
    // these will not '/foo/bar/baz', '/foo/bar/baz.txt'
    // Lastely, when globstar is _true_, '/foo/**' is equivelant to '/foo/*' when
    // globstar is _false_
    var globstar = opts ? !!opts.globstar : false;

    // If we are doing extended matching, this boolean is true when we are inside
    // a group (eg {*.html,*.js}), and false otherwise.
    var inGroup = false;

    // RegExp flags (eg "i" ) to pass in to RegExp constructor.
    var flags = opts && typeof (opts.flags) === "string" ? opts.flags : "";

    var c;
    for (var i = 0, len = str.length; i < len; i++) {
        c = str[i];

        switch (c) {
            case "/":
            case "$":
            case "^":
            case "+":
            case ".":
            case "(":
            case ")":
            case "=":
            case "!":
            case "|":
                reStr += "\\" + c;
                break;

            case "?":
                if (extended) {
                    reStr += ".";
                    break;
                }

            case "[":
            case "]":
                if (extended) {
                    reStr += c;
                    break;
                }

            case "{":
                if (extended) {
                    inGroup = true;
                    reStr += "(";
                    break;
                }

            case "}":
                if (extended) {
                    inGroup = false;
                    reStr += ")";
                    break;
                }

            case ",":
                if (inGroup) {
                    reStr += "|";
                    break;
                }
                reStr += "\\" + c;
                break;

            case "*":
                // Move over all consecutive "*"'s.
                // Also store the previous and next characters
                var prevChar = str[i - 1];
                var starCount = 1;
                while (str[i + 1] === "*") {
                    starCount++;
                    i++;
                }
                var nextChar = str[i + 1];

                if (!globstar) {
                    // globstar is disabled, so treat any number of "*" as one
                    reStr += ".*";
                } else {
                    // globstar is enabled, so determine if this is a globstar segment
                    var isGlobstar = starCount > 1                      // multiple "*"'s
                        && (prevChar === "/" || prevChar === undefined)   // from the start of the segment
                        && (nextChar === "/" || nextChar === undefined)   // to the end of the segment

                    if (isGlobstar) {
                        // it's a globstar, so match zero or more path segments
                        reStr += "((?:[^/]*(?:\/|$))*)";
                        i++; // move over the "/"
                    } else {
                        // it's not a globstar, so only match one path segment
                        reStr += "([^/]*)";
                    }
                }
                break;

            default:
                reStr += c;
        }
    }

    // When regexp 'g' flag is specified don't
    // constrain the regular expression with ^ & $
    if (!flags || !~flags.indexOf('g')) {
        reStr = "^" + reStr + "$";
    }

    return new RegExp(reStr, flags);
};
  
/**
 * Validates the provided file system entry name.
 *
 * @function validate_fsentry_name
 * @memberof window
 * @param {string} name - The name of the file system entry to validate.
 * @returns {boolean} Returns true if the name is valid.
 * @throws {Object} Throws an object with a `message` property indicating the specific validation error.
 * 
 * @description
 * This function checks the provided name against a set of rules to determine its validity as a file system entry name:
 * 1. Name cannot be empty.
 * 2. Name must be a string.
 * 3. Name cannot contain the '/' character.
 * 4. Name cannot be the '.' character.
 * 5. Name cannot be the '..' character.
 * 6. Name cannot exceed the maximum allowed length (as defined in window.max_item_name_length).
 */
window.validate_fsentry_name = function(name){
    if(!name)
        throw {message: i18n('name_cannot_be_empty')}
    else if(!isString(name))
        throw {message: i18n('name_must_be_string')}
    else if(name.includes('/'))
        throw {message: i18n('name_cannot_contain_slash')}
    else if(name === '.')
        throw {message: i18n('name_cannot_contain_period')};
    else if(name === '..')
        throw {message: i18n('name_cannot_contain_double_period')};
    else if(name.length > window.max_item_name_length)
        throw {message: i18n('name_too_long', config.max_item_name_length)}
    else
        return true
}

/**
 * A function that generates a unique identifier by combining a random adjective, a random noun, and a random number (between 0 and 9999).
 * The result is returned as a string with components separated by hyphens.
 * It is useful when you need to create unique identifiers that are also human-friendly.
 *
 * @returns {string} A unique, hyphen-separated string comprising of an adjective, a noun, and a number.
 *
 * @example
 *
 * let identifier = window.generate_identifier(); 
 * // identifier would be something like 'clever-idea-123'
 *
 */
window.generate_identifier = function(){
    const first_adj = ['helpful','sensible', 'loyal', 'honest', 'clever', 'capable','calm', 'smart', 'genius', 'bright', 'charming', 'creative', 'diligent', 'elegant', 'fancy', 
    'colorful', 'avid', 'active', 'gentle', 'happy', 'intelligent', 'jolly', 'kind', 'lively', 'merry', 'nice', 'optimistic', 'polite', 
    'quiet', 'relaxed', 'silly', 'victorious', 'witty', 'young', 'zealous', 'strong', 'brave', 'agile', 'bold'];

    const nouns = ['street', 'roof', 'floor', 'tv', 'idea', 'morning', 'game', 'wheel', 'shoe', 'bag', 'clock', 'pencil', 'pen', 
    'magnet', 'chair', 'table', 'house', 'dog', 'room', 'book', 'car', 'cat', 'tree', 
    'flower', 'bird', 'fish', 'sun', 'moon', 'star', 'cloud', 'rain', 'snow', 'wind', 'mountain', 
    'river', 'lake', 'sea', 'ocean', 'island', 'bridge', 'road', 'train', 'plane', 'ship', 'bicycle', 
    'horse', 'elephant', 'lion', 'tiger', 'bear', 'zebra', 'giraffe', 'monkey', 'snake', 'rabbit', 'duck', 
    'goose', 'penguin', 'frog', 'crab', 'shrimp', 'whale', 'octopus', 'spider', 'ant', 'bee', 'butterfly', 'dragonfly', 
    'ladybug', 'snail', 'camel', 'kangaroo', 'koala', 'panda', 'piglet', 'sheep', 'wolf', 'fox', 'deer', 'mouse', 'seal',
    'chicken', 'cow', 'dinosaur', 'puppy', 'kitten', 'circle', 'square', 'garden', 'otter', 'bunny', 'meerkat', 'harp']

    // return a random combination of first_adj + noun + number (between 0 and 9999)
    // e.g. clever-idea-123
    return first_adj[Math.floor(Math.random() * first_adj.length)] + '-' + nouns[Math.floor(Math.random() * nouns.length)] + '-' + Math.floor(Math.random() * 10000);
}

/**
 * Checks if the provided variable is a string or an instance of the String object.
 *
 * @param {*} variable - The variable to check.
 * @returns {boolean} True if the variable is a string or an instance of the String object, false otherwise.
 */
window.isString =  function (variable) {
    return typeof variable === 'string' || variable instanceof String;
}

/**
 * A function that checks whether a file system entry (fsentry) matches a list of allowed file types.
 * It handles both file extensions (like '.jpg') and MIME types (like 'text/plain').
 * If the allowed file types string is empty or not provided, the function always returns true.
 * It checks the file types only if the fsentry is a file, not a directory.
 *
 * @param {Object} fsentry - The file system entry to check. It must be an object with properties: 'is_dir', 'name', 'type'.
 * @param {string} allowed_file_types_string - The list of allowed file types, separated by commas. Can include extensions and MIME types.
 * 
 * @returns {boolean} True if the fsentry matches one of the allowed file types, or if the allowed_file_types_string is empty or not provided. False otherwise.
 *
 * @example
 *
 * let fsentry = {is_dir: false, name: 'example.jpg', type: 'image/jpeg'};
 * let allowedTypes = '.jpg, text/plain, image/*';
 * let result = window.check_fsentry_against_allowed_file_types_string(fsentry, allowedTypes); 
 * // result would be true, as 'example.jpg' matches the '.jpg' in allowedTypes
 *
 */

window.check_fsentry_against_allowed_file_types_string =function (fsentry, allowed_file_types_string) {
    // simple cases that are always a pass
    if(!allowed_file_types_string || allowed_file_types_string.trim() === '')
        return  true;

    // parse allowed_file_types into an array of extensions and types
    let allowed_file_types = allowed_file_types_string.split(',');
    if(allowed_file_types.length > 0){
        // trim every entry
        for (let index = 0; index < allowed_file_types.length; index++) {
            allowed_file_types[index] = allowed_file_types[index].trim();
        }
    }    

    let passes_allowed_file_type_filter = true;
    // check types, only if this fsentry is a file and not a directory
    if(!fsentry.is_dir && allowed_file_types.length > 0){
        passes_allowed_file_type_filter = false;
        for (let index = 0; index < allowed_file_types.length; index++) {
            const allowed_file_type = allowed_file_types[index].toLowerCase();

            // if type is not already set, try to set it based on the file name
            if(!fsentry.type)
                fsentry.type = mime.getType(fsentry.name);

            // extensions (e.g. .jpg)
            if(allowed_file_type.startsWith('.') && fsentry.name.toLowerCase().endsWith(allowed_file_type)){
                passes_allowed_file_type_filter = true;
                break;
            }

            // MIME types (e.g. text/plain)
            else if(globToRegExp(allowed_file_type).test(fsentry.type?.toLowerCase())){
                passes_allowed_file_type_filter = true;
                break;
            }
        }
    }

    return passes_allowed_file_type_filter;
}

// @author Rich Adams <rich@richadams.me>

// Implements a tap and hold functionality. If you click/tap and release, it will trigger a normal
// click event. But if you click/tap and hold for 1s (default), it will trigger a taphold event instead.

;(function($)
{
    // Default options
    var defaults = {
        duration: 500, // ms
        clickHandler: null
    }

    // When start of a taphold event is triggered.
    function startHandler(event)
    {
        var $elem = jQuery(this);

        // Merge the defaults and any user defined settings.
        let settings = jQuery.extend({}, defaults, event.data);

        // If object also has click handler, store it and unbind. Taphold will trigger the
        // click itself, rather than normal propagation.
        if (typeof $elem.data("events") != "undefined"
            && typeof $elem.data("events").click != "undefined")
        {
            // Find the one without a namespace defined.
            for (var c in $elem.data("events").click)
            {
                if ($elem.data("events").click[c].namespace == "")
                {
                    var handler = $elem.data("events").click[c].handler
                    $elem.data("taphold_click_handler", handler);
                    $elem.unbind("click", handler);
                    break;
                }
            }
        }
        // Otherwise, if a custom click handler was explicitly defined, then store it instead.
        else if (typeof settings.clickHandler == "function")
        {
            $elem.data("taphold_click_handler", settings.clickHandler);
        }

        // Reset the flags
        $elem.data("taphold_triggered", false); // If a hold was triggered
        $elem.data("taphold_clicked",   false); // If a click was triggered
        $elem.data("taphold_cancelled", false); // If event has been cancelled.

        // Set the timer for the hold event.
        $elem.data("taphold_timer",
            setTimeout(function()
            {
                // If event hasn't been cancelled/clicked already, then go ahead and trigger the hold.
                if (!$elem.data("taphold_cancelled")
                    && !$elem.data("taphold_clicked"))
                {
                    // Trigger the hold event, and set the flag to say it's been triggered.
                    $elem.trigger(jQuery.extend(event, jQuery.Event("taphold")));
                    $elem.data("taphold_triggered", true);
                }
            }, settings.duration));
    }

    // When user ends a tap or click, decide what we should do.
    function stopHandler(event)
    {
        var $elem = jQuery(this);

        // If taphold has been cancelled, then we're done.
        if ($elem.data("taphold_cancelled")) { return; }

        // Clear the hold timer. If it hasn't already triggered, then it's too late anyway.
        clearTimeout($elem.data("taphold_timer"));

        // If hold wasn't triggered and not already clicked, then was a click event.
        if (!$elem.data("taphold_triggered")
            && !$elem.data("taphold_clicked"))
        {
            // If click handler, trigger it.
            if (typeof $elem.data("taphold_click_handler") == "function")
            {
                $elem.data("taphold_click_handler")(jQuery.extend(event, jQuery.Event("click")));
            }

            // Set flag to say we've triggered the click event.
            $elem.data("taphold_clicked", true);
        }
    }

    // If a user prematurely leaves the boundary of the object we're working on.
    function leaveHandler(event)
    {
        // Cancel the event.
        $(this).data("taphold_cancelled", true);
    }

    // Determine if touch events are supported.
    var touchSupported = ("ontouchstart" in window) // Most browsers
                         || ("onmsgesturechange" in window); // Microsoft

    var taphold = $.event.special.taphold =
    {
        setup: function(data)
        {
            $(this).bind((touchSupported ? "touchstart"            : "mousedown"),  data, startHandler)
                   .bind((touchSupported ? "touchend"              : "mouseup"),    stopHandler)
                   .bind((touchSupported ? "touchmove touchcancel" : "mouseleave"), leaveHandler);
        },
        teardown: function(namespaces)
        {
            $(this).unbind((touchSupported ? "touchstart"            : "mousedown"),  startHandler)
                   .unbind((touchSupported ? "touchend"              : "mouseup"),    stopHandler)
                   .unbind((touchSupported ? "touchmove touchcancel" : "mouseleave"), leaveHandler);
        }
    };
})(jQuery);

window.refresh_user_data = async (auth_token)=>{
    let whoami
    try{
        whoami = await puter.os.user();
    }catch(e){
        
    }
    // update local user data
    if(whoami){
        update_auth_data(auth_token, whoami)
    }
}

window.update_auth_data = (auth_token, user)=>{
    window.auth_token = auth_token;
    localStorage.setItem('auth_token', auth_token);

    // Has username changed?
    if(window.user?.username !== user.username)
        update_username_in_gui(user.username);

    // update this session's user data
    window.user = user;
    localStorage.setItem('user', JSON.stringify(window.user));

    // re-initialize the Puter.js objects with the new auth token
    puter.setAuthToken(auth_token, api_origin)

    //update the logged_in_users array entry for this user
    if(window.user){
        let logged_in_users_updated = false;
        for (let i = 0; i < window.logged_in_users.length && !logged_in_users_updated; i++) {
            if(window.logged_in_users[i].uuid === window.user.uuid){
                window.logged_in_users[i] = window.user;
                window.logged_in_users[i].auth_token = window.auth_token;
                logged_in_users_updated = true;
            }
        }

        // no matching array elements, add one
        if(!logged_in_users_updated){
            let userobj = window.user;
            userobj.auth_token = window.auth_token;
            window.logged_in_users.push(userobj);
        }
        // update local storage
        localStorage.setItem('logged_in_users', JSON.stringify(window.logged_in_users));
    }

    window.desktop_path = '/' + window.user.username + '/Desktop';
    window.trash_path = '/' + window.user.username + '/Trash';
    window.appdata_path = '/' + window.user.username + '/AppData';
    window.docs_path = '/' + window.user.username + '/Documents';
    window.pictures_path = '/' + window.user.username + '/Pictures';
    window.videos_path = '/' + window.user.username + '/Videos';
    window.desktop_path = '/' + window.user.username + '/Desktop';
    window.home_path = '/' + window.user.username;

    if(window.user !== null && !window.user.is_temp){
        $('.user-options-login-btn, .user-options-create-account-btn').hide();
        $('.user-options-menu-btn').show();
    }
}

window.mutate_user_preferences = function(user_preferences_delta) {
    for (const [key, value] of Object.entries(user_preferences_delta)) {
        // Don't wait for set to be done for better efficiency
        puter.kv.set(`user_preferences.${key}`, String(value));
    }
    // There may be syncing issues across multiple devices
    update_user_preferences({ ...window.user_preferences, ...user_preferences_delta });
}

window.update_user_preferences = function(user_preferences) {
    window.user_preferences = user_preferences;
    localStorage.setItem('user_preferences', JSON.stringify(user_preferences));
}

window.sendWindowWillCloseMsg = function(iframe_element) {
    return new Promise(function(resolve){
        const msg_id = uuidv4();
        iframe_element.contentWindow.postMessage({
            msg: "windowWillClose",
            msg_id: msg_id
        }, '*');
        //register callback
        appCallbackFunctions[msg_id] = resolve;
    })
}

window.logout = ()=>{
    document.dispatchEvent(new Event("logout", { bubbles: true}));    
}

/**
 * Checks if the current document is in fullscreen mode.
 *
 * @function is_fullscreen
 * @memberof window
 * @returns {boolean} Returns true if the document is in fullscreen mode, otherwise false.
 *
 * @example
 * // Checks if the document is currently in fullscreen mode
 * const inFullscreen = window.is_fullscreen();
 * 
 * @description
 * This function checks various browser-specific properties to determine if the document 
 * is currently being displayed in fullscreen mode. It covers standard as well as 
 * some vendor-prefixed properties to ensure compatibility across different browsers.
 */
window.is_fullscreen = ()=>{
    return (document.fullscreenElement && document.fullscreenElement !== null) ||
    (document.webkitIsFullScreen && document.webkitIsFullScreen !== null) ||
    (document.webkitFullscreenElement && document.webkitFullscreenElement !== null) ||
    (document.mozFullScreenElement && document.mozFullScreenElement !== null) ||
    (document.msFullscreenElement && document.msFullscreenElement !== null);
}

window.get_apps = async (app_names, callback)=>{
    if(Array.isArray(app_names))
        app_names = app_names.join('|');

    // 'explorer' is a special app, no metadata should be returned
    if(app_names === 'explorer')
        return [];

    let res = await $.ajax({
        url: api_origin + "/apps/"+app_names,
        type: 'GET',
        async: true,
        contentType: "application/json",
        headers: {
            "Authorization": "Bearer "+auth_token
        },
        success: function (res){ 
        }
    });

    if(res.length === 1)
        res = res[0];

    if(callback && typeof callback === 'function')
        callback(res);
    else
        return res;
}

/**
 * Sends an "itemChanged" event to all watching applications associated with a specific item.
 *
 * @function sendItemChangeEventToWatchingApps
 * @memberof window
 * @param {string} item_uid - Unique identifier of the item that experienced the change.
 * @param {Object} event_data - Additional data about the event to be passed to the watching applications.
 * 
 * @description
 * This function sends an "itemChanged" message to all applications that are currently watching 
 * the specified item. If an application's iframe is not found or no longer valid, 
 * it is removed from the list of watchers.
 * 
 * The function expects that `window.watchItems` contains a mapping of item UIDs to arrays of app instance IDs.
 * 
 * @example
 * // Example usage to send a change event to watching applications of an item with UID "item123".
 * window.sendItemChangeEventToWatchingApps('item123', { property: 'value' });
 */
window.sendItemChangeEventToWatchingApps = function(item_uid, event_data){
    if(window.watchItems[item_uid]){
        window.watchItems[item_uid].forEach(app_instance_id => {
            const iframe = $(`.window[data-element_uuid="${app_instance_id}"]`).find('.window-app-iframe')
            if(iframe && iframe.length > 0){
                iframe.get(0)?.contentWindow
                    .postMessage({
                        msg: 'itemChanged',
                        data: event_data,
                    }, '*');
            }else{
                window.watchItems[item_uid].splice(window.watchItems[item_uid].indexOf(app_instance_id), 1);
            }
        });
    }
}

/**
 * Assigns an icon to a filesystem entry based on its properties such as name, type, 
 * and whether it's a directory, app, trashed, or specific file type.
 * 
 * @function item_icon
 * @global
 * @async
 * @param {Object} fsentry - A filesystem entry object. It may contain various properties 
 * like name, type, path, associated_app, thumbnail, is_dir, and metadata, depending on 
 * the type of filesystem entry.
 */

window.item_icon = async (fsentry)=>{
    // --------------------------------------------------
    // If this file is Trashed then set the name to the original name of the file before it was trashed
    // --------------------------------------------------
    if(fsentry.path?.startsWith(trash_path + '/')){
        if(fsentry.metadata){
            try{
                let metadata = JSON.parse(fsentry.metadata);
                fsentry.name = (metadata && metadata.original_name) ? metadata.original_name : fsentry.name
            }
            catch(e){
            }
        }
    }
    // --------------------------------------------------
    // thumbnail
    // --------------------------------------------------
    if(fsentry.thumbnail){
        return {image: fsentry.thumbnail, type: 'thumb'};
    }
    // --------------------------------------------------
    // app icon
    // --------------------------------------------------
    else if(fsentry.associated_app && fsentry.associated_app?.name){
        if(fsentry.associated_app.icon)
            return {image: fsentry.associated_app.icon, type: 'icon'};
        else
            return {image: window.icons['app.svg'], type: 'icon'};
    }
    // --------------------------------------------------
    // Trash
    // --------------------------------------------------
    else if(fsentry.shortcut_to_path && fsentry.shortcut_to_path === trash_path){
        // get trash image, this is needed to get the correct empty vs full trash icon
        let trash_img = $(`.item[data-path="${html_encode(trash_path)}" i] .item-icon-icon`).attr('src')
        // if trash_img is undefined that's probably because trash wasn't added anywhere, do a direct lookup to see if trash is empty or no
        if(!trash_img){
            let trashstat = await puter.fs.stat(trash_path);
            if(trashstat.is_empty !== undefined && trashstat.is_empty === true)
                trash_img = window.icons['trash.svg'];
            else
                trash_img = window.icons['trash-full.svg'];
        }
        return {image: trash_img, type: 'icon'};
    }
    // --------------------------------------------------
    // Directories
    // --------------------------------------------------
    else if(fsentry.is_dir){
        // System Directories
        if(fsentry.path === docs_path)
            return {image: window.icons['folder-documents.svg'], type: 'icon'};
        else if (fsentry.path === pictures_path)
            return { image: window.icons['folder-pictures.svg'], type: 'icon' };
        else if (fsentry.path === home_path)
            return { image: window.icons['folder-home.svg'], type: 'icon' };
        else if (fsentry.path === videos_path)
            return { image: window.icons['folder-videos.svg'], type: 'icon' };
        else if (fsentry.path === desktop_path)
            return { image: window.icons['folder-desktop.svg'], type: 'icon' };
        // regular directories
        else
            return {image: window.icons['folder.svg'], type: 'icon'};
    }
    // --------------------------------------------------
    // Match icon by file extension
    // --------------------------------------------------
    // *.doc
    else if(fsentry.name.toLowerCase().endsWith('.doc')){
        return {image: window.icons['file-doc.svg'], type: 'icon'};
    }
    // *.docx
    else if(fsentry.name.toLowerCase().endsWith('.docx')){
        return {image: window.icons['file-docx.svg'], type: 'icon'};
    }
    // *.exe
    else if(fsentry.name.toLowerCase().endsWith('.exe')){
        return {image: window.icons['file-exe.svg'], type: 'icon'};
    }
    // *.gz
    else if(fsentry.name.toLowerCase().endsWith('.gz')){
        return {image: window.icons['file-gzip.svg'], type: 'icon'};
    }
    // *.jar
    else if(fsentry.name.toLowerCase().endsWith('.jar')){
        return {image: window.icons['file-jar.svg'], type: 'icon'};
    }
    // *.java
    else if(fsentry.name.toLowerCase().endsWith('.java')){
        return {image: window.icons['file-java.svg'], type: 'icon'};
    }
    // *.jsp
    else if(fsentry.name.toLowerCase().endsWith('.jsp')){
        return {image: window.icons['file-jsp.svg'], type: 'icon'};
    }
    // *.log
    else if(fsentry.name.toLowerCase().endsWith('.log')){
        return {image: window.icons['file-log.svg'], type: 'icon'};
    }
    // *.mp3
    else if(fsentry.name.toLowerCase().endsWith('.mp3')){
        return {image: window.icons['file-mp3.svg'], type: 'icon'};
    }
    // *.rb
    else if(fsentry.name.toLowerCase().endsWith('.rb')){
        return {image: window.icons['file-ruby.svg'], type: 'icon'};
    }
    // *.rss
    else if(fsentry.name.toLowerCase().endsWith('.rss')){
        return {image: window.icons['file-rss.svg'], type: 'icon'};
    }
    // *.rtf
    else if(fsentry.name.toLowerCase().endsWith('.rtf')){
        return {image: window.icons['file-rtf.svg'], type: 'icon'};
    }
    // *.sketch
    else if(fsentry.name.toLowerCase().endsWith('.sketch')){
        return {image: window.icons['file-sketch.svg'], type: 'icon'};
    }
    // *.sql
    else if(fsentry.name.toLowerCase().endsWith('.sql')){
        return {image: window.icons['file-sql.svg'], type: 'icon'};
    }
    // *.tif
    else if(fsentry.name.toLowerCase().endsWith('.tif')){
        return {image: window.icons['file-tif.svg'], type: 'icon'};
    }
    // *.tiff
    else if(fsentry.name.toLowerCase().endsWith('.tiff')){
        return {image: window.icons['file-tiff.svg'], type: 'icon'};
    }
    // *.wav
    else if(fsentry.name.toLowerCase().endsWith('.wav')){
        return {image: window.icons['file-wav.svg'], type: 'icon'};
    }
    // *.cpp
    else if(fsentry.name.toLowerCase().endsWith('.cpp')){
        return {image: window.icons['file-cpp.svg'], type: 'icon'};
    }
    // *.pptx
    else if(fsentry.name.toLowerCase().endsWith('.pptx')){
        return {image: window.icons['file-pptx.svg'], type: 'icon'};
    }
    // *.psd
    else if(fsentry.name.toLowerCase().endsWith('.psd')){
        return {image: window.icons['file-psd.svg'], type: 'icon'};
    }
    // *.xlsx
    else if(fsentry.name.toLowerCase().endsWith('.xlsx')){
        return {image: window.icons['file-xlsx.svg'], type: 'icon'};
    }
    // --------------------------------------------------
    // Determine icon by set or derived mime type
    // --------------------------------------------------
    else if(fsentry.type){
        return {image: content_type_to_icon(fsentry.type), type: 'icon'};
    }
    else{
        return {image: content_type_to_icon(mime.getType(fsentry.name)), type: 'icon'};
    }
}

/**
 * Asynchronously checks if a save account notice should be shown to the user, and if needed, displays the notice.
 *
 * This function first retrieves a key value pair from the cloud key-value storage to determine if the notice has been shown before.
 * If the notice hasn't been shown and the user is using a temporary session, the notice is then displayed. After the notice is shown,
 * the function updates the key-value storage indicating that the notice has been shown. The user can choose to save the session,
 * remind later or log in to an existing account.
 *
 * @param {string} [message] - The custom message to be displayed in the notice. If not provided, a default message will be used.
 * @global
 * @function window.show_save_account_notice_if_needed
 */

window.show_save_account_notice_if_needed = function(message){
    getItem({
        key: "save_account_notice_shown",
        success: async function(value){
            if(!value && window.user?.is_temp){
                setItem({key: "save_account_notice_shown", value: true});

                // Show the notice
                setTimeout(async () => {
                    const alert_resp = await UIAlert({
                        message: message ?? `<strong>Congrats on storing data!</strong><p>Don't forget to save your session! You are in a temporary session. Save session to avoid accidentally losing your work.</p>`,
                        body_icon: window.icons['reminder.svg'],
                        buttons:[
                            {
                                label: 'Save session',
                                value: 'save-session',
                                type: 'primary',
                            },
                            // {
                            //     label: 'Log into an existing account',
                            //     value: 'login',
                            // },
                            {
                                label: `I'll do it later`,
                                value: 'remind-later',
                            },
                        ],
                        window_options: {
                            backdrop: true,
                            close_on_backdrop_click: false,
                        }
        
                    })   
                    
                    if(alert_resp === 'remind-later'){
                    }
                    if(alert_resp === 'save-session'){
                        let saved = await UIWindowSaveAccount({
                            send_confirmation_code: false,
                        });

                    }else if (alert_resp === 'login'){
                        let login_result = await UIWindowLogin({
                            show_signup_button: false, 
                            reload_on_success: true,
                            send_confirmation_code: false,
                            window_options: {
                                show_in_taskbar: false,
                                backdrop: true,
                                close_on_backdrop_click: false,
                            }
                        });
                        if(!login_result)
                            $('.toolbar').prepend(ht);
                    }
                }, desktop_loading_fade_delay + 1000);
            }
        }
    })
}

window.launch_download_from_url = async function(){
    // get url query params
    const url_query_params = new URLSearchParams(window.location.search);

    // is this download?
    if(url_query_params.has('download')){
        let url = url_query_params.get('download');
        let name = url_query_params.get('name');
        let is_dir = url_query_params.get('is_dir');
        let url_obj;

        // if url doesn't have a protocol, add http://
        if(!url.startsWith('http://') && !url.startsWith('https://')){
            url = 'http://' + url;
        }

        // parse url
        try{
            url_obj = new URL(url);
        }catch(e){
            UIAlert("Invalid download URL.");
            return;
        }

        // get hostname from url
        let hostname = url_obj.hostname;

        // name
        if(!name)
            name = url.split('/').pop().split('#')[0].split('?')[0];

        // determine file type from url
        let file_type = mime.getType(name);

        // confirm download
        if(await UIWindowConfirmDownload({url: url, name: name, source: hostname, type: file_type, is_dir: is_dir})){
            // download progress tracker
            let dl_op_id = operation_id++;

            // upload progress tracker defaults
            window.progress_tracker[dl_op_id] = [];
            window.progress_tracker[dl_op_id][0] = {};
            window.progress_tracker[dl_op_id][0].total = 0;
            window.progress_tracker[dl_op_id][0].ajax_uploaded = 0;
            window.progress_tracker[dl_op_id][0].cloud_uploaded = 0;

            const progress_window = await UIWindowDownloadProgress({operation_id: dl_op_id, item_name: name});

            const res = await download({
                url: url, 
                name: name,
                dest_path: desktop_path, 
                auth_token: auth_token, 
                api_origin: api_origin,
                dedupe_name: true,
                overwrite: false,
                operation_id: dl_op_id,
                item_upload_id: 0,
                success: function(res){
                    $(progress_window).close();
                },
                error: function(err){
                    UIAlert(err && err.message ? err.message : "Download failed.");
                    $(progress_window).close();
                }
            });

            // clear window URL
            window.history.pushState(null, document.title, '/');
        }
        
    }
}

window.refresh_item_container = function(el_item_container, options){
    options = options || {};

    let container_path =  $(el_item_container).attr('data-path');
    let el_window = $(el_item_container).closest('.window');
    let el_window_head_icon = $(el_window).find('.window-head-icon');
    const loading_spinner = $(el_item_container).find('.explorer-loading-spinner');

    if(options.fadeInItems)
        $(el_item_container).css('opacity', '0')

    // Hide the 'This folder is empty' message to avoid the flickering effect
    // if the folder is not empty.
    $(el_item_container).find('.explorer-empty-message').hide();

    // Hide the loading spinner to avoid the flickering effect if the folder
    // is already loaded.
    $(loading_spinner).hide();

    // current timestamp in milliseconds
    let start_ts = new Date().getTime();

    // A timeout that will show the loading spinner if the folder is not loaded
    // after 1000ms
    let loading_timeout = setTimeout(function(){
        // make sure the same folder is still loading
        if($(loading_spinner).closest('.item-container').attr('data-path') !== container_path)
            return;

        // show the loading spinner
        $(loading_spinner).show();
        setTimeout(function(){
            $(loading_spinner).find('.explorer-loading-spinner-msg').html('Taking a little longer than usual. Please wait...');
        }, 3000)
    }, 1000);

    // --------------------------------------------------------
    // Folder's configs and properties
    // --------------------------------------------------------
    puter.fs.stat(container_path, function(fsentry){
        if(el_window){
            $(el_window).attr('data-uid', fsentry.id);
            $(el_window).attr('data-sort_by', fsentry.sort_by ?? 'name');
            $(el_window).attr('data-sort_order', fsentry.sort_order ?? 'asc');
            $(el_window).attr('data-layout', fsentry.layout ?? 'icons');
            // data-name
            $(el_window).attr('data-name', html_encode(fsentry.name));
            // data-path
            $(el_window).attr('data-path', html_encode(container_path));
            $(el_window).find('.window-navbar-path-input').val(container_path);
            $(el_window).find('.window-navbar-path-input').attr('data-path', container_path);
        }
        $(el_item_container).attr('data-sort_by', fsentry.sort_by ?? 'name');
        $(el_item_container).attr('data-sort_order', fsentry.sort_order ?? 'asc');
        // update layout
        if(el_window && el_window.length > 0)
            update_window_layout(el_window, fsentry.layout);
        //
        if(fsentry.layout === 'details'){
            update_details_layout_sort_visuals(el_window, fsentry.sort_by, fsentry.sort_order);
        }
    });

    // is_directoryPicker
    let is_directoryPicker = $(el_window).attr('data-is_directoryPicker');
    is_directoryPicker = (is_directoryPicker === 'true' || is_directoryPicker === '1') ? true : false;

    // allowed_file_types
    let allowed_file_types = $(el_window).attr('data-allowed_file_types');

    // is_directoryPicker
    let is_openFileDialog = $(el_window).attr('data-is_openFileDialog');
    is_openFileDialog = (is_openFileDialog === 'true' || is_openFileDialog === '1') ? true : false;

    // remove all existing items
    $(el_item_container).find('.item').removeItems()

    // get items
    puter.fs.readdir(container_path).then((fsentries)=>{
        // Check if the same folder is still loading since el_item_container's
        // data-path might have changed by other operations while waiting for the response to this `readdir`.
        if($(el_item_container).attr('data-path') !== container_path)
            return;

        setTimeout(async function(){
            // clear loading timeout
            clearTimeout(loading_timeout);

            // hide loading spinner
            $(loading_spinner).hide();

            // if no items, show empty folder message
            if(fsentries.length === 0){
                $(el_item_container).find('.explorer-empty-message').show();
            }

            // trash icon
            if(container_path === trash_path && el_window_head_icon){
                if(fsentries.length > 0){
                    $(el_window_head_icon).attr('src', window.icons['trash-full.svg']);
                }else{
                    $(el_window_head_icon).attr('src', window.icons['trash.svg']);
                }
            }

            // add each item to window
            for (let index = 0; index < fsentries.length; index++) {
                const fsentry = fsentries[index];
                let is_disabled = false;

                // disable files if this is a showDirectoryPicker() window
                if(is_directoryPicker && !fsentry.is_dir)
                    is_disabled = true;

                // if this item is not allowed because of filetype restrictions, disable it
                if(!window.check_fsentry_against_allowed_file_types_string(fsentry, allowed_file_types))
                    is_disabled = true;

                // set visibility based on user preferences and whether file is hidden by default
                const is_hidden_file = fsentry.name.startsWith('.');
                let visible;
                if (!is_hidden_file){
                    visible = 'visible';
                }else if (window.user_preferences.show_hidden_files) {
                    visible = 'revealed';
                }else{
                    visible = 'hidden';
                }

                // metadata
                let metadata;
                if(fsentry.metadata !== ''){
                    try{
                        metadata = JSON.parse(fsentry.metadata);
                    }
                    catch(e){
                    }
                }

                const item_path = fsentry.path ?? path.join($(el_window).attr('data-path'), fsentry.name);
                // render any item but Trash/AppData
                if(item_path !== trash_path && item_path !== appdata_path){
                    // if this is trash, get original name from item metadata
                    fsentry.name = (metadata && metadata.original_name !== undefined) ? metadata.original_name : fsentry.name;
                    UIItem({
                        appendTo: el_item_container,
                        uid: fsentry.uid,
                        immutable: fsentry.immutable,
                        associated_app_name: fsentry.associated_app?.name,
                        path: item_path,
                        icon: await item_icon(fsentry),
                        name: (metadata && metadata.original_name !== undefined) ? metadata.original_name : fsentry.name,
                        is_dir: fsentry.is_dir,
                        multiselectable: !is_openFileDialog,
                        has_website: fsentry.has_website,
                        is_shared: fsentry.is_shared,
                        metadata: fsentry.metadata,
                        is_shortcut: fsentry.is_shortcut,
                        shortcut_to: fsentry.shortcut_to,
                        shortcut_to_path: fsentry.shortcut_to_path,
                        size: fsentry.size,
                        type: fsentry.type,
                        modified: fsentry.modified,
                        suggested_apps: fsentry.suggested_apps,
                        disabled: is_disabled,
                        visible: visible,
                    });
                }
            }

            // if this is desktop, add Trash
            if($(el_item_container).hasClass('desktop')){
                try{
                    const trash = await puter.fs.stat(window.trash_path);
                    UIItem({
                        appendTo: el_item_container,
                        uid: trash.id,
                        immutable: trash.immutable,
                        path: trash_path,
                        icon: {image: (trash.is_empty ? window.icons['trash.svg'] : window.icons['trash-full.svg']), type: 'icon'},
                        name: trash.name,
                        is_dir: trash.is_dir,
                        sort_by: trash.sort_by,
                        type: trash.type,
                        is_trash: true,
                        sortable: false,
                    });
                    sort_items(el_item_container, $(el_item_container).attr('data-sort_by'), $(el_item_container).attr('data-sort_order'));
                }catch(e){
            
                }            
            }
            // sort items
            sort_items(
                el_item_container, 
                $(el_item_container).attr('data-sort_by'), 
                $(el_item_container).attr('data-sort_order')
            );

            if(options.fadeInItems)
                $(el_item_container).animate({'opacity': '1'});

            // update footer item count if this is an explorer window
            if(el_window)
                update_explorer_footer_item_count(el_window);
        },
        // This makes sure the loading spinner shows up if the request takes longer than 1 second 
        // and stay there for at least 1 second since the flickering is annoying
        (Date.now() - start_ts) > 1000 ? 1000 : 1)
    });
}    

window.onpopstate = (event) => {
    if(event.state !== null && event.state.window_id !== null){
        $(`.window[data-id="${event.state.window_id}"]`).focusWindow();
    }
}

window.sort_items = (item_container, sort_by, sort_order)=>{
    if(sort_order !== 'asc' && sort_order !== 'desc')
        sort_order = 'asc';

    $(item_container).find(`.item[data-sortable="true"]`).detach().sort(function(a,b) {
        // Name
        if(!sort_by || sort_by === 'name'){
            if(a.dataset.name.toLowerCase() < b.dataset.name.toLowerCase()) { return (sort_order === 'asc' ? -1 : 1); }
            if(a.dataset.name.toLowerCase() > b.dataset.name.toLowerCase()) { return (sort_order === 'asc' ? 1 : -1); }
            return 0;
        }
        // Size
        else if(sort_by === 'size'){
            if( parseInt(a.dataset.size) < parseInt(b.dataset.size)) { return (sort_order === 'asc' ? -1 : 1); }
            if( parseInt(a.dataset.size) > parseInt(b.dataset.size)) { return (sort_order === 'asc' ? 1 : -1); }
            return 0;
        }
        // Modified
        else if(sort_by === 'modified'){
            if( parseInt(a.dataset.modified) < parseInt(b.dataset.modified)) { return (sort_order === 'asc' ? -1 : 1); }
            if( parseInt(a.dataset.modified) > parseInt(b.dataset.modified)) { return (sort_order === 'asc' ? 1 : -1); }
            return 0;
        }
        // Type
        else if(sort_by === 'type'){
            if(path.extname(a.dataset.name.toLowerCase()) < path.extname(b.dataset.name.toLowerCase())) { return (sort_order === 'asc' ? -1 : 1); }
            if(path.extname(a.dataset.name.toLowerCase()) > path.extname(b.dataset.name.toLowerCase())) { return (sort_order === 'asc' ? 1 : -1); }
            return 0;
        }

    }).appendTo(item_container);
}

window.show_or_hide_files = (item_containers) => {
    const show_hidden_files = window.user_preferences.show_hidden_files;
    const class_to_add = show_hidden_files ? 'item-revealed' : 'item-hidden';
    const class_to_remove = show_hidden_files ? 'item-hidden' : 'item-revealed';
    $(item_containers)
        .find('.item')
        .filter((_, item) => item.dataset.name.startsWith('.'))
        .removeClass(class_to_remove).addClass(class_to_add);
}

window.create_folder = async(basedir, appendto_element)=>{
	let dirname = basedir;
    let folder_name = 'New Folder';

    let newfolder_op_id = operation_id++;
    operation_cancelled[newfolder_op_id] = false;
    let newfolder_progress_window_init_ts = Date.now();
    let progwin;

    // only show progress window if it takes longer than 500ms to create folder
    let progwin_timeout = setTimeout(async () => {
        progwin = await UIWindowNewFolderProgress({operation_id: newfolder_op_id});
    }, 500);

    // create folder
    try{
        await puter.fs.mkdir({
            path: dirname + '/'+folder_name,
            rename: true,
            overwrite: false,
            success: function (data){
                const el_created_dir = $(appendto_element).find('.item[data-path="'+html_encode(dirname)+'/'+html_encode(data.name)+'"]');
                if(el_created_dir.length > 0){
                    activate_item_name_editor(el_created_dir);

                    // Add action to actions_history for undo ability
                    actions_history.push({
                        operation: 'create_folder',
                        data: el_created_dir
                    });
                }
                clearTimeout(progwin_timeout);

                // done
                let newfolder_duration = (Date.now() - newfolder_progress_window_init_ts);
                if( progwin && newfolder_duration >= copy_progress_hide_delay){
                    $(progwin).close();   
                }else if(progwin){
                    setTimeout(() => {
                        setTimeout(() => {
                            $(progwin).close();   
                        }, Math.abs(copy_progress_hide_delay - newfolder_duration));
                    })
                }
            }
        });
    }catch(err){
        clearTimeout(progwin_timeout);
    }
}

window.create_file = async(options)=>{
    // args
    let dirname = options.dirname;
    let appendto_element = options.append_to_element;
    let filename = options.name;
    let content = options.content ? [options.content] : [];

    // create file
    try{
        puter.fs.upload(new File(content, filename),  dirname,
        {
            success: async function (data){
                const created_file = $(appendto_element).find('.item[data-path="'+html_encode(dirname)+'/'+html_encode(data.name)+'"]');
                if(created_file.length > 0){
                    activate_item_name_editor(created_file);

                    // Add action to actions_history for undo ability
                    actions_history.push({
                        operation: 'create_file',
                        data: created_file
                    });
                }
            }
        });
    }catch(err){
        console.log(err);
    }
}

window.create_shortcut = async(filename, is_dir, basedir, appendto_element, shortcut_to, shortcut_to_path)=>{
    let dirname = basedir;
    const extname = path.extname(filename);
    const basename = path.basename(filename, extname) + ' - Shortcut';
    filename = basename + extname;

    // create file shortcut
    try{
        await puter.fs.upload(new File([], filename), dirname, {
            overwrite: false,
            shortcutTo: shortcut_to_path ?? shortcut_to,
            dedupeName: true,
        });
    }catch(err){
        console.log(err)
    }
}

window.copy_clipboard_items = async function(dest_path, dest_container_element){
    let copy_op_id = operation_id++;
    operation_cancelled[copy_op_id] = false;
    // unselect previously selected items in the target container
    $(dest_container_element).children('.item-selected').removeClass('item-selected');
    update_explorer_footer_selected_items_count($(dest_container_element).closest('.window'));

    let overwrite_all = false;
    (async()=>{
        let copy_progress_window_init_ts = Date.now();

        // only show progress window if it takes longer than 2s to copy
        let progwin;
        let progwin_timeout = setTimeout(async () => {
            progwin = await UIWindowCopyProgress({operation_id: copy_op_id});
        }, 2000);

        const copied_item_paths = []

        for(let i=0; i<clipboard.length; i++){
            let copy_path = clipboard[i].path;
            let item_with_same_name_already_exists = true;
            let overwrite = overwrite_all;
            $(progwin).find('.copy-from').html(copy_path);
            do{
                if(overwrite)
                    item_with_same_name_already_exists = false;

                // cancelled?
                if(operation_cancelled[copy_op_id])
                    return;

                // perform copy
                try{
                    let resp = await puter.fs.copy({
                            source: copy_path,
                            destination: dest_path,
                            overwrite: overwrite || overwrite_all,
                            // if user is copying an item to where its source is, change the name so there is no conflict
                            dedupeName: dest_path === path.dirname(copy_path),
                    });

                    // copy new path for undo copy
                    copied_item_paths.push(resp[0].path);

                    // skips next loop iteration
                    break;
                }catch(err){
                    if(err.code==='item_with_same_name_exists'){
                        const alert_resp = await UIAlert({
                            message: `<strong>${html_encode(err.entry_name)}</strong> already exists.`,
                            buttons:[
                                {label: 'Replace', type: 'primary'},
                                ... (clipboard.length > 1) ? [{label: 'Replace all'}] : [],
                                ... (clipboard.length > 1) ? [{label: 'Skip'}] : [{label: 'Cancel'}],
                            ]
                        })
                        if(alert_resp === 'Replace'){
                            overwrite = true;
                        }else if (alert_resp === 'Replace all'){
                            overwrite = true;
                            overwrite_all = true;
                        }else if(alert_resp === 'Skip' || alert_resp === 'Cancel'){
                            item_with_same_name_already_exists = false;
                        }
                    }
                    else{
                        if(err.message){
                            UIAlert(err.message)
                        }
                        item_with_same_name_already_exists = false;
                    }
                }
            }while(item_with_same_name_already_exists)
        }

        // done
        // Add action to actions_history for undo ability
        actions_history.push({
            operation: 'copy',
            data: copied_item_paths
        });

        clearTimeout(progwin_timeout);

        let copy_duration = (Date.now() - copy_progress_window_init_ts);
        if(progwin && copy_duration >= copy_progress_hide_delay){
            $(progwin).close();   
        }else if(progwin){
            setTimeout(() => {
                setTimeout(() => {
                    $(progwin).close();   
                }, Math.abs(copy_progress_hide_delay - copy_duration));
            })
        }
    })();
}

/**
 * Copies the given items to the destination path.
 * 
 * @param {HTMLElement[]} el_items - HTML elements representing the items to copy
 * @param {string} dest_path - Destination path to copy items to
 */
window.copy_items = function(el_items, dest_path){
    let copy_op_id = operation_id++;
    let overwrite_all = false;
    (async()=>{
        let copy_progress_window_init_ts = Date.now();

        // only show progress window if it takes longer than 2s to copy
        let progwin;
        let progwin_timeout = setTimeout(async () => {
            progwin = await UIWindowCopyProgress({operation_id: copy_op_id});
        }, 2000);

        const copied_item_paths = []

        for(let i=0; i < el_items.length; i++){
            let copy_path = $(el_items[i]).attr('data-path');
            let item_with_same_name_already_exists = true;
            let overwrite = overwrite_all;
            $(progwin).find('.copy-from').html(copy_path);

            do{
                if(overwrite)
                    item_with_same_name_already_exists = false;
                // cancelled?
                if(operation_cancelled[copy_op_id])
                    return;
                try{
                    let resp = await puter.fs.copy({
                            source: copy_path,
                            destination: dest_path,
                            overwrite: overwrite || overwrite_all,
                            // if user is copying an item to where the source is, automatically change the name so there is no conflict
                            dedupeName: dest_path === path.dirname(copy_path),
                    })

                    // copy new path for undo copy
                    copied_item_paths.push(resp[0].path);

                    // skips next loop iteration
                    item_with_same_name_already_exists = false;
                }catch(err){
                    if(err.code === 'item_with_same_name_exists'){
                        const alert_resp = await UIAlert({
                            message: `<strong>${html_encode(err.entry_name)}</strong> already exists.`,
                            buttons:[
                                { label: 'Replace', type: 'primary' },
                                ... (el_items.length > 1) ? [{label: 'Replace all'}] : [],
                                ... (el_items.length > 1) ? [{label: 'Skip'}] : [{label: 'Cancel'}],
                            ]
                        })
                        if(alert_resp === 'Replace'){
                            overwrite = true;
                        }else if (alert_resp === 'Replace all'){
                            overwrite = true;
                            overwrite_all = true;
                        }else if(alert_resp === 'Skip' || alert_resp === 'Cancel'){
                            item_with_same_name_already_exists = false;
                        }
                    }
                    else{
                        if(err.message){
                            UIAlert(err.message)
                        }
                        else if(err){
                            UIAlert(err)
                        }
                        item_with_same_name_already_exists = false;
                    }
                }
            }while(item_with_same_name_already_exists)
        }

        // done
        // Add action to actions_history for undo ability
        actions_history.push({
            operation: 'copy',
            data: copied_item_paths
        });

        clearTimeout(progwin_timeout);

        let copy_duration = (Date.now() - copy_progress_window_init_ts);
        if(progwin && copy_duration >= copy_progress_hide_delay){
            $(progwin).close();   
        }else if(progwin){
            setTimeout(() => {
                setTimeout(() => {
                    $(progwin).close();   
                }, Math.abs(copy_progress_hide_delay - copy_duration));
            })
        }
    })()
}

/**
 * Deletes the given item.
 * 
 * @param {HTMLElement} el_item - HTML element representing the item to delete 
 * @param {boolean} [descendants_only=false] - If true, only deletes descendant items under the given item
 * @returns {Promise<void>}
 */
window.delete_item = async function(el_item, descendants_only = false){
    if($(el_item).attr('data-immutable') === '1')
        return;

    // hide all UIItems with matching uids 
    $(`.item[data-uid='${$(el_item).attr('data-uid')}']`).fadeOut(150, function(){
        // close all windows with matching uids
        $('.window-' + $(el_item).attr('data-uid')).close();
        // close all windows that belong to a descendant of this item
        // todo this has to be case-insensitive but the `i` selector doesn't work on ^=
        $(`.window[data-path^="${$(el_item).attr('data-path')}/"]`).close();
    });

    try{
        await puter.fs.delete({
            paths: $(el_item).attr('data-path'),
            descendantsOnly: descendants_only,
            recursive: true,
        });
        // fade out item 
        $(`.item[data-uid='${$(el_item).attr('data-uid')}']`).fadeOut(150, function(){
            // find all parent windows that contain this item
            let parent_windows = $(`.item[data-uid='${$(el_item).attr('data-uid')}']`).closest('.window');
            // remove item from DOM
            $(`.item[data-uid='${$(el_item).attr('data-uid')}']`).removeItems();
            // update parent windows' item counts
            $(parent_windows).each(function(index){
                update_explorer_footer_item_count(this);
                update_explorer_footer_selected_items_count(this);
            });
            // update all shortcuts to this item
            $(`.item[data-shortcut_to_path="${html_encode($(el_item).attr('data-path'))}" i]`).attr(`data-shortcut_to_path`, '');
        });
    }catch(err){
        UIAlert(err.responseText);
    }
}

window.move_clipboard_items = function (el_target_container, target_path){
    let dest_path = target_path === undefined ? $(el_target_container).attr('data-path') : target_path;
    let el_items = [];
    if(clipboard.length > 0){
        for(let i=0; i<clipboard.length; i++){
            el_items.push($(`.item[data-path="${html_encode(clipboard[i])}" i]`));
        }
        if(el_items.length > 0)
            move_items(el_items, dest_path);
    }

    clipboard = [];
}

/**
 * Initiates a download for multiple files provided as an array of paths.
 *
 * This function triggers the download of files from given paths. It constructs the
 * download URLs using an API base URL and the given paths, along with an authentication token.
 * Each file is then fetched and prompted to the user for download using the `saveAs` function.
 * 
 * Global dependencies:
 * - `api_origin`: The base URL for the download API endpoint.
 * - `auth_token`: The authentication token required for the download API.
 * - `saveAs`: Function to save the fetched blob as a file.
 * - `path.basename()`: Function to extract the filename from the provided path.
 * 
 * @global
 * @function trigger_download
 * @param {string[]} paths - An array of file paths that are to be downloaded.
 * 
 * @example
 * let filePaths = ['/path/to/file1.txt', '/path/to/file2.png'];
 * window.trigger_download(filePaths);
 */

window.trigger_download = (paths)=>{
    let urls = [];
    for (let index = 0; index < paths.length; index++) {
        urls.push({
            download: api_origin + "/down?path=" + paths[index] + "&auth_token=" + auth_token,
            filename: path.basename(paths[index]),
        });
    }

    urls.forEach(function (e) {                
        fetch(e.download)                  
            .then(res => res.blob())                  
            .then(blob => {                    
                saveAs(blob, e.filename);                
            });            
    });
}

/**
 * 
 * @param {*} options 
 */
window.launch_app = async (options)=>{
    const uuid = uuidv4();
    let icon, title, file_signature;
    const window_options = options.window_options ?? {};

    // try to get 3rd-party app info
    let app_info = options.app_obj ?? await get_apps(options.name);

    //-----------------------------------
    // icon
    //-----------------------------------
    if(app_info.icon)
        icon = app_info.icon;
    else if(app_info.icon)
        icon = window.icons['app.svg'];
    else if(options.name === 'explorer')
        icon = window.icons['folder.svg'];
    else
        icon = window.icons['app-icon-'+options.name+'.svg']

    //-----------------------------------
    // title
    //-----------------------------------
    if(app_info.title)
        title = app_info.title;
    else if(options.window_title)
        title = options.window_title;
    else if(options.name)
        title = options.name;

    //-----------------------------------
    // maximize on start
    //-----------------------------------
    if(app_info.maximize_on_start && app_info.maximize_on_start === 1)
        options.maximized = 1;

    //-----------------------------------
    // if opened a file, sign it
    //-----------------------------------
    if(options.file_signature)
        file_signature = options.file_signature;
    else if(options.file_uid){
        file_signature = await puter.fs.sign(app_info.uuid, {uid: options.file_uid, action: 'write'});
        // add token to options
        options.token = file_signature.token;
        // add file_signature to options
        file_signature = file_signature.items;
    }
    //------------------------------------
    // Explorer
    //------------------------------------
    if(options.name === 'explorer'){
        if(options.path === window.home_path){
            title = 'Home';
            icon = window.icons['folder-home.svg'];
        }
        else if(options.path === window.trash_path){
            title = 'Trash';
        }
        else if(!options.path)
            title = root_dirname;
        else
            title = path.dirname(options.path);

        // open window
        UIWindow({
            element_uuid: uuid,
            icon: icon,
            path: options.path ?? window.home_path,
            title: title,
            uid: null,
            is_dir: true,
            app: 'explorer',
            ...window_options,
            is_maximized: options.maximized,
        });
    }
    //------------------------------------
    // All other apps
    //------------------------------------
    else{
        //-----------------------------------
        // iframe_url
        //-----------------------------------
        let iframe_url;
        if(!app_info.index_url){
            iframe_url = new URL('https://'+options.name+'.' + window.app_domain + `/index.html`);
        }else{
            iframe_url = new URL(app_info.index_url);
        }

        // add app_instance_id to URL
        iframe_url.searchParams.append('puter.app_instance_id', uuid);

        // add app_id to URL
        iframe_url.searchParams.append('puter.app.id', app_info.uuid);

        if(file_signature){
            iframe_url.searchParams.append('puter.item.uid', file_signature.uid);
            iframe_url.searchParams.append('puter.item.path', options.file_path ? `~/` + options.file_path.split('/').slice(1).join('/') : file_signature.path);
            iframe_url.searchParams.append('puter.item.name', file_signature.fsentry_name);
            iframe_url.searchParams.append('puter.item.read_url', file_signature.read_url);
            iframe_url.searchParams.append('puter.item.write_url', file_signature.write_url);
            iframe_url.searchParams.append('puter.item.metadata_url', file_signature.metadata_url);
            iframe_url.searchParams.append('puter.item.size', file_signature.fsentry_size);
            iframe_url.searchParams.append('puter.item.accessed', file_signature.fsentry_accessed);
            iframe_url.searchParams.append('puter.item.modified', file_signature.fsentry_modified);
            iframe_url.searchParams.append('puter.item.created', file_signature.fsentry_created);
            iframe_url.searchParams.append('puter.domain', app_domain);
        }
        else if(options.readURL){
            iframe_url.searchParams.append('puter.item.name', options.filename);
            iframe_url.searchParams.append('puter.item.path', options.file_path ? `~/` + options.file_path.split('/').slice(1).join('/') : undefined);
            iframe_url.searchParams.append('puter.item.read_url', options.readURL);
            // iframe_url.searchParams.append('puter.item.write_url', file_signature.write_url);
            iframe_url.searchParams.append('puter.domain', window.app_domain);
        }

        // Add auth_token to GODMODE apps
        if(app_info.godmode && app_info.godmode === 1){
            iframe_url.searchParams.append('puter.auth.token', auth_token);
            iframe_url.searchParams.append('puter.auth.username', window.user.username);
            iframe_url.searchParams.append('puter.domain', window.app_domain);
        }
        // App token. Only add token if it's not a GODMODE app since GODMODE apps already have the super token
        // that has access to everything.
        else if(options.token){
            iframe_url.searchParams.append('puter.auth.token', options.token);
        }

        // Try to acquire app token from the server
        else{
            let response = await fetch(window.api_origin + "/auth/get-user-app-token", {
                "headers": {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer "+ auth_token,
                },
                "body": JSON.stringify({app_uid: app_info.uid ?? app_info.uuid}),
                "method": "POST",
                });
            let res = await response.json();
            if(res.token){
                iframe_url.searchParams.append('puter.auth.token', res.token);
            }
        }

        // Add options.params to URL
        if(options.params){
            iframe_url.searchParams.append('puter.domain', window.app_domain);
            for (const property in options.params) {
                iframe_url.searchParams.append(property, options.params[property]);
            }
        }

        // Add options.args to URL
        iframe_url.searchParams.append('puter.args', JSON.stringify(options.args ?? {}));

        // ...and finally append urm_source=puter.com to the URL
        iframe_url.searchParams.append('urm_source', 'puter.com');

        UIWindow({
            element_uuid: uuid,
            title: title,
            iframe_url: iframe_url.href,
            icon: icon,
            window_class: 'window-app',
            update_window_url: true,
            app_uuid: app_info.uuid ?? app_info.uid,
            top: options.maximized ? 0 : undefined,
            left: options.maximized ? 0 : undefined,
            height: options.maximized ? `calc(100% - ${window.taskbar_height + window.toolbar_height + 1}px)` : undefined,
            width: options.maximized ? `100%` : undefined,
            app: options.name,
            is_maximized: options.maximized,
            is_fullpage: options.is_fullpage,
            ...window_options,
        }); 

        // send post request to /rao to record app open
        if(options.name !== 'explorer'){
            // add the app to the beginning of the array
            launch_apps.recent.unshift(app_info);

            // dedupe the array by uuid, uid, and id
            launch_apps.recent = _.uniqBy(launch_apps.recent, 'name');

            // limit to window.launch_recent_apps_count
            launch_apps.recent = launch_apps.recent.slice(0, window.launch_recent_apps_count);  

            // send post request to /rao to record app open
            $.ajax({
                url: api_origin + "/rao",
                type: 'POST',
                data: JSON.stringify({ 
                    original_client_socket_id: window.socket?.id,
                    app_uid: app_info.uid ?? app_info.uuid,
                }),
                async: true,
                contentType: "application/json",
                headers: {
                    "Authorization": "Bearer "+auth_token
                },
            })
        }
    }
}

window.open_item = async function(options){
    let el_item = options.item;
    const $el_parent_window = $(el_item).closest('.window');
    const parent_win_id = $($el_parent_window).attr('data-id');
    const is_dir = $(el_item).attr('data-is_dir') === '1' ? true : false;
    const uid = $(el_item).attr('data-shortcut_to') === '' ? $(el_item).attr('data-uid') : $(el_item).attr('data-shortcut_to');
    const item_path = $(el_item).attr('data-shortcut_to_path') === '' ? $(el_item).attr('data-path') : $(el_item).attr('data-shortcut_to_path');
    const is_shortcut = $(el_item).attr('data-is_shortcut') === '1';
    const shortcut_to_path = $(el_item).attr('data-shortcut_to_path');
    const associated_app_name = $(el_item).attr('data-associated_app_name');
    //----------------------------------------------------------------
    // Is this a shortcut whose source is perma-deleted?
    //----------------------------------------------------------------
    if(is_shortcut && shortcut_to_path === ''){
        UIAlert(`This shortcut can't be opened because its source has been deleted.`)
    }
    //----------------------------------------------------------------
    // Is this a shortcut whose source is trashed?
    //----------------------------------------------------------------
    else if(is_shortcut && shortcut_to_path.startsWith(trash_path + '/')){
        UIAlert(`This shortcut can't be opened because its source has been deleted.`)
    }
    //----------------------------------------------------------------
    // Is this a trashed file?
    //----------------------------------------------------------------
    else if(item_path.startsWith(trash_path + '/')){
        UIAlert(`This item can't be opened because it's in the trash. To use this item, first drag it out of the Trash.`)
    }
    //----------------------------------------------------------------
    // Is this a file (no dir) on a SaveFileDialog?
    //----------------------------------------------------------------
    else if($el_parent_window.attr('data-is_saveFileDialog') === 'true' && !is_dir){
        $el_parent_window.find('.savefiledialog-filename').val($(el_item).attr('data-name'));
        $el_parent_window.find('.savefiledialog-save-btn').trigger('click');
    }
    //----------------------------------------------------------------
    // Is this a file (no dir) on an OpenFileDialog?
    //----------------------------------------------------------------
    else if($el_parent_window.attr('data-is_openFileDialog') === 'true' && !is_dir){
        $el_parent_window.find('.window-disable-mask, .busy-indicator').show();
        let busy_init_ts = Date.now();
        try{    
            let filedialog_parent_uid = $el_parent_window.attr('data-parent_uuid');
            let $filedialog_parent_app_window = $(`.window[data-element_uuid="${filedialog_parent_uid}"]`);
            let parent_window_app_uid = $filedialog_parent_app_window.attr('data-app_uuid');
            const initiating_app_uuid = $el_parent_window.attr('data-initiating_app_uuid');

            let res = await puter.fs.sign(window.host_app_uid ?? parent_window_app_uid, {uid: uid, action: 'write'});
            res = res.items;
            // todo split is buggy because there might be a slash in the filename
            res.path = `~/` + item_path.split('/').slice(2).join('/');
            const parent_uuid = $el_parent_window.attr('data-parent_uuid');
            const return_to_parent_window = $el_parent_window.attr('data-return_to_parent_window') === 'true';
            if(return_to_parent_window){
                window.opener.postMessage({
                    msg: "fileOpenPicked", 
                    original_msg_id: $el_parent_window.attr('data-iframe_msg_uid'), 
                    items: Array.isArray(res) ? [...res] : [res],
                    // LEGACY SUPPORT, remove this in the future when Polotno uses the new SDK
                    // this is literally put in here to support Polotno's legacy code
                    ...(!Array.isArray(res) && res)    
                }, '*');

                window.close();
            }
            else if(parent_uuid){
                // send event to iframe
                const target_iframe = $(`.window[data-element_uuid="${parent_uuid}"]`).find('.window-app-iframe').get(0);
                if(target_iframe){
                    let retobj = {
                        msg: "fileOpenPicked", 
                        original_msg_id: $el_parent_window.attr('data-iframe_msg_uid'), 
                        items: Array.isArray(res) ? [...res] : [res],
                        // LEGACY SUPPORT, remove this in the future when Polotno uses the new SDK
                        // this is literally put in here to support Polotno's legacy code
                        ...(!Array.isArray(res) && res)    
                    };
                    target_iframe.contentWindow.postMessage(retobj, '*');
                }

                // focus iframe
                $(target_iframe).get(0)?.focus({preventScroll:true});
              
                // send file_opened event
                const file_opened_event = new CustomEvent('file_opened', {detail: res});

                // dispatch event to parent window
                $(`.window[data-element_uuid="${parent_uuid}"]`).get(0)?.dispatchEvent(file_opened_event);
            }
        }catch(e){
            console.log(e);
        }
        // done
        let busy_duration = (Date.now() - busy_init_ts);
        if( busy_duration >= busy_indicator_hide_delay){
            $el_parent_window.close();   
        }else{
            setTimeout(() => {
                // close this dialog
                $el_parent_window.close();  
            }, Math.abs(busy_indicator_hide_delay - busy_duration));
        }
    }
    //----------------------------------------------------------------
    // Is there an app associated with this item?
    //----------------------------------------------------------------
    else if(associated_app_name !== ''){
        launch_app({
            name: associated_app_name,
        })
    }
    //----------------------------------------------------------------
    // Dir with no open windows: create a new window
    //----------------------------------------------------------------
    else if(is_dir && ($el_parent_window.length === 0 || options.new_window)){
        UIWindow({
            path: item_path,
            title: path.basename(item_path),
            icon: await item_icon({is_dir: true, path: item_path}),
            uid: $(el_item).attr('data-uid'),
            is_dir: is_dir,
            app: 'explorer',
            top: options.maximized ? 0 : undefined,
            left: options.maximized ? 0 : undefined,
            height: options.maximized ? `calc(100% - ${window.taskbar_height + window.toolbar_height + 1}px)` : undefined,
            width: options.maximized ? `100%` : undefined,
        });
    }
    //----------------------------------------------------------------
    // Dir with an open window: change the path of the open window
    //----------------------------------------------------------------
    else if($el_parent_window.length > 0 && is_dir){
        window_nav_history[parent_win_id] = window_nav_history[parent_win_id].slice(0, window_nav_history_current_position[parent_win_id]+1);
        window_nav_history[parent_win_id].push(item_path);
        window_nav_history_current_position[parent_win_id]++;

        update_window_path($el_parent_window, item_path);
    }
    //----------------------------------------------------------------
    // all other cases: try to open using an app
    //----------------------------------------------------------------
    else{
        const fspath = item_path.toLowerCase();
        const fsuid = uid.toLowerCase();
        let open_item_meta;

        // get all info needed to open an item
        try{
            open_item_meta = await $.ajax({
                url: api_origin + "/open_item",
                type: 'POST',
                contentType: "application/json",
                data: JSON.stringify({
                    uid: fsuid ?? undefined,
                    path: fspath ?? undefined,
                }),
                headers: {
                    "Authorization": "Bearer "+auth_token
                },
                statusCode: {
                    401: function () {
                        logout();
                    },
                },
            });
        }catch(err){
        }

        // get a list of suggested apps for this file type.
        let suggested_apps = open_item_meta?.suggested_apps ?? await suggest_apps_for_fsentry({uid: fsuid, path: fspath});
        
        //---------------------------------------------
        // No suitable apps, ask if user would like to
        // download
        //---------------------------------------------
        if(suggested_apps.length === 0){
            //---------------------------------------------
            // If .zip file, unzip it
            //---------------------------------------------
            if(path.extname(item_path) === '.zip'){
                unzipItem(item_path);
                return;
            }
            const alert_resp = await UIAlert(
                    'Found no suitable apps to open this file with. Would you like to download it instead?',
                    [
                    {
                        label: 'Download File',
                        type: 'primary',

                    },
                    {
                        label: 'Cancel'
                    }
                ])
            if(alert_resp === 'Download File'){
                trigger_download([item_path]);
            }
            return;
        }
        //---------------------------------------------
        // First suggested app is default app to open this item
        //---------------------------------------------
        else{
            launch_app({ 
                name: suggested_apps[0].name, 
                token: open_item_meta.token,
                file_path: item_path,
                app_obj: suggested_apps[0],
                window_title: path.basename(item_path),
                file_uid: fsuid,
                maximized: options.maximized,
                file_signature: open_item_meta.signature,
            });
        }
    }    
}

/**
 * Moves the given items to the destination path. 
 * 
 * @param {HTMLElement[]} el_items - jQuery elements representing the items to move
 * @param {string} dest_path - The destination path to move the items to
 * @returns {Promise<void>} 
 */
window.move_items = async function(el_items, dest_path, is_undo = false){
    let move_op_id = operation_id++;
    operation_cancelled[move_op_id] = false;

    // --------------------------------------------------------
    // Optimization: in case all items being moved 
    // are immutable do not proceed
    // --------------------------------------------------------
    let all_items_are_immutable = true;
    for(let i=0; i<el_items.length; i++){
        if($(el_items[i]).attr('data-immutable') === '0'){
            all_items_are_immutable = false;
            break;
        }
    }
    if(all_items_are_immutable)
        return;

    // --------------------------------------------------------
    // good to go, proceed
    // --------------------------------------------------------
    
    // overwrite all items? default is false unless in a conflict case user asks for it 
    let overwrite_all = false; 
    
    // when did this operation start
    let move_init_ts = Date.now();

    // only show progress window if it takes longer than 2s to move
    let progwin;
    let progwin_timeout = setTimeout(async () => {
        progwin = await UIWindowMoveProgress({operation_id: move_op_id});
    }, 2000);

    // storing moved items for undo ability
    const moved_items = []

    // Go through each item and try to move it
    for(let i=0; i<el_items.length; i++){
        // get current item
        let el_item = el_items[i];

        // if operation cancelled by user, stop
        if(operation_cancelled[move_op_id])
            return;

        // cannot move an immutable item, skip it
        if($(el_item).attr('data-immutable') === '1')
            continue;

        // cannot move item to its own path, skip it
        if(path.dirname($(el_item).attr('data-path')) === dest_path){
            await UIAlert(`<p>Moving <strong>${html_encode($(el_item).attr('data-name'))}</strong></p>Cannot move item to its current location.`)

            continue;
        }

        // if an item with the same name already exists in the destination path
        let item_with_same_name_already_exists = false;
        let overwrite = overwrite_all;
        let untrashed_at_least_one_item = false;

        // --------------------------------------------------------
        // Keep trying to move the item until it succeeds or is cancelled
        // or user decides to overwrite or skip
        // --------------------------------------------------------
        do{
            try{
                let path_to_show_on_progwin = $(el_item).attr('data-path');

                // parse metadata if any
                let metadata = $(el_item).attr('data-metadata');

                // no metadata?
                if(metadata === '' || metadata === 'null' || metadata === null)
                    metadata = {}
                // try to parse metadata as JSON
                else{
                    try{
                        metadata = JSON.parse(metadata)
                    }catch(e){
                    }
                }

                let new_name;

                // user cancelled?
                if(operation_cancelled[move_op_id])
                    return;

                // indicates whether this is a recycling operation
                let recycling = false;

                // --------------------------------------------------------
                // Trashing
                // --------------------------------------------------------
                if(dest_path === trash_path){
                    new_name = $(el_item).attr('data-uid');
                    metadata = {
                        original_name: $(el_item).attr('data-name'),
                        original_path: $(el_item).attr('data-path'),
                        trashed_ts: Math.round(Date.now() / 1000),
                    };

                    // update other clients
                    if(window.socket)
                        window.socket.emit('trash.is_empty', {is_empty: false});

                    // change trash icons to 'trash-full.svg'
                    $(`[data-app="trash"]`).find('.taskbar-icon > img').attr('src', window.icons['trash-full.svg']);
                    $(`.item[data-path="${html_encode(trash_path)}" i], .item[data-shortcut_to_path="${html_encode(trash_path)}" i]`).find('.item-icon > img').attr('src', window.icons['trash-full.svg']);
                    $(`.window[data-path="${html_encode(trash_path)}" i]`).find('.window-head-icon').attr('src', window.icons['trash-full.svg']);
                }

                // moving an item into a trashed directory? deny.
                else if(dest_path.startsWith(trash_path)){
                    $(progwin).close();
                    UIAlert('Cannot move items into a deleted folder.');
                    return;
                }

                // --------------------------------------------------------
                // If recycling an item, restore its original name
                // --------------------------------------------------------
                else if(metadata.trashed_ts !== undefined){
                    recycling = true;
                    new_name = metadata.original_name;
                    metadata = {};
                    untrashed_at_least_one_item = true;
                    path_to_show_on_progwin = trash_path + '/' + new_name;
                }

                // --------------------------------------------------------
                // update progress window with current item being moved
                // --------------------------------------------------------
                $(progwin).find('.move-from').html(path_to_show_on_progwin);

                // execute move
                let resp = await puter.fs.move({
                    source: $(el_item).attr('data-uid'),
                    destination: dest_path,
                    overwrite: overwrite || overwrite_all,
                    newName: new_name,
                    // recycling requires making all missing dirs
                    createMissingParents: recycling,
                    newMetadata: metadata,
                    excludeSocketID: window.socket?.id,
                });

                let fsentry = resp.moved;

                // path must use the real name from DB
                fsentry.path =  path.join(dest_path, fsentry.name);

                // skip next loop iteration because this iteration was successful
                item_with_same_name_already_exists = false;

                // update all shortcut_to_path
                $(`.item[data-shortcut_to_path="${html_encode($(el_item).attr('data-path'))}" i]`).attr(`data-shortcut_to_path`, fsentry.path);

                // Remove all items with matching uids
                $(`.item[data-uid='${$(el_item).attr('data-uid')}']`).fadeOut(150, function(){
                    // find all parent windows that contain this item
                    let parent_windows = $(`.item[data-uid='${$(el_item).attr('data-uid')}']`).closest('.window');
                    // remove this item
                    $(this).removeItems();
                    // update parent windows' item counts and selected item counts in their footers
                    $(parent_windows).each(function(){
                        update_explorer_footer_item_count(this);
                        update_explorer_footer_selected_items_count(this)
                    });
                })

                // if trashing, close windows of trashed items and its descendants
                if(dest_path === trash_path){
                    $(`.window[data-path="${html_encode($(el_item).attr('data-path'))}" i]`).close();
                    // todo this has to be case-insensitive but the `i` selector doesn't work on ^=
                    $(`.window[data-path^="${html_encode($(el_item).attr('data-path'))}/"]`).close();
                }

                // update all paths of its and its descendants' open windows
                else{
                    // todo this has to be case-insensitive but the `i` selector doesn't work on ^=
                    $(`.window[data-path^="${html_encode($(el_item).attr('data-path'))}/"], .window[data-path="${html_encode($(el_item).attr('data-path'))}" i]`).each(function(){
                        update_window_path(this, $(this).attr('data-path').replace($(el_item).attr('data-path'), path.join(dest_path, fsentry.name)));
                    })
                }

                if(dest_path === trash_path){
                    // remove Public Token
                    // todo, some client-side check to see if this dir has an FR associated with it before sending a whole ajax req
                    $.ajax({
                        url: api_origin + "/removepubtok",
                        type: 'POST',
                        data: JSON.stringify({ 
                            uid: $(el_item).attr('data-uid'),
                        }),
                        async: true,
                        contentType: "application/json",
                        headers: {
                            "Authorization": "Bearer "+auth_token
                        },
                        statusCode: {
                            401: function () {
                                logout();
                            },
                        },        
                        success: function (){ 
                        }  
                    })
                    // remove all associated permissions
                    // todo, some client-side check to see if this dir has an FR associated with it before sending a whole ajax req
                    $.ajax({
                        url: api_origin + "/remove-item-perms",
                        type: 'POST',
                        data: JSON.stringify({ 
                            uid: $(el_item).attr('data-uid'),
                        }),
                        async: true,
                        contentType: "application/json",
                        headers: {
                            "Authorization": "Bearer "+auth_token
                        },
                        statusCode: {
                            401: function () {
                                logout();
                            },
                        },        
                        success: function (){ 
                        }  
                    })
                    $(`.item[data-uid="${$(el_item).attr('data-uid')}"]`).find('.item-is-shared').fadeOut(300);

                    // if trashing dir... 
                    if($(el_item).attr('data-is_dir') === '1'){
                        // disassociate all its websites
                        // todo, some client-side check to see if this dir has at least one associated website before sending ajax request
                        puter.hosting.delete(dir_uuid)

                        $(`.mywebsites-dir-path[data-uuid="${$(el_item).attr('data-uid')}"]`).remove();
                        // remove the website badge from all instances of the dir
                        $(`.item[data-uid="${$(el_item).attr('data-uid')}"]`).find('.item-has-website-badge').fadeOut(300);

                        // remove File Rrequest Token
                        // todo, some client-side check to see if this dir has an FR associated with it before sending a whole ajax req
                        $.ajax({
                            url: api_origin + "/removefr",
                            type: 'POST',
                            data: JSON.stringify({ 
                                dir_uid: $(el_item).attr('data-uid'),
                            }),
                            async: true,
                            contentType: "application/json",
                            headers: {
                                "Authorization": "Bearer "+auth_token
                            },
                            statusCode: {
                                401: function () {
                                    logout();
                                },
                            },        
                            success: function (){ 
                            }  
                        })
                    }
                }

                // if replacing an existing item, remove the old item that was just replaced
                if(resp.overwritten?.id){
                    $(`.item[data-uid=${resp.overwritten.id}]`).removeItems();
                }

                // if this is trash, get original name from item metadata
                fsentry.name = metadata?.original_name || fsentry.name;

                // create new item on matching containers
                const options = {
                    appendTo: $(`.item-container[data-path="${html_encode(dest_path)}" i]`),
                    immutable: fsentry.immutable,
                    associated_app_name: fsentry.associated_app?.name,
                    uid: fsentry.uid,
                    path: fsentry.path,
                    icon: await item_icon(fsentry),
                    name: (dest_path === trash_path) ? $(el_item).attr('data-name') : fsentry.name,
                    is_dir: fsentry.is_dir,
                    size: fsentry.size,
                    type: fsentry.type,
                    modified: fsentry.modified,
                    is_selected: false,
                    is_shared: (dest_path === trash_path) ? false : fsentry.is_shared,
                    is_shortcut: fsentry.is_shortcut,
                    shortcut_to: fsentry.shortcut_to,
                    shortcut_to_path: fsentry.shortcut_to_path,
                    has_website: $(el_item).attr('data-has_website') === '1',
                    metadata: fsentry.metadata ?? '',
                    suggested_apps: fsentry.suggested_apps,
                }
                UIItem(options);
                moved_items.push({'options': options, 'original_path': $(el_item).attr('data-path')});

                // this operation may have created some missing directories, 
                // see if any of the directories in the path of this file is new AND
                // if these new path have any open parents that need to be updated
                resp.parent_dirs_created?.forEach(async dir => {
                    let item_container = $(`.item-container[data-path="${html_encode(path.dirname(dir.path))}" i]`);
                    if(item_container.length > 0 && $(`.item[data-path="${html_encode(dir.path)}" i]`).length === 0){
                        UIItem({
                            appendTo: item_container,
                            immutable: false,
                            uid: dir.uid,
                            path: dir.path,
                            icon: await item_icon(dir),
                            name: dir.name,
                            size: dir.size,
                            type: dir.type,
                            modified: dir.modified,
                            is_dir: true,
                            is_selected: false,
                            is_shared: dir.is_shared,
                            has_website: false,
                            suggested_apps: dir.suggested_apps,
                        });
                    }
                    sort_items(item_container);
                }); 

                //sort each container
                $(`.item-container[data-path="${html_encode(dest_path)}" i]`).each(function(){
                    sort_items(this, $(this).attr('data-sort_by'), $(this).attr('data-sort_order'))
                })
            }catch(err){
                // -----------------------------------------------------------------------
                // if item with same name already exists, ask user if they want to overwrite
                // -----------------------------------------------------------------------
                if(err.code==='item_with_same_name_exists'){
                    item_with_same_name_already_exists = true;

                    const alert_resp = await UIAlert({
                        message: `<strong>${html_encode(err.entry_name)}</strong> already exists.`,
                        buttons:[
                            { label: 'Replace', type: 'primary',},
                            ... (el_items.length > 1) ? [{label: 'Replace all'}] : [],
                            ... (el_items.length > 1) ? [{label: 'Skip'}] : [{label: 'Cancel'}],
                        ]
                    })
                    if(alert_resp === 'Replace'){
                        overwrite = true;
                    }else if (alert_resp === 'Replace all'){
                        overwrite = true;
                        overwrite_all = true;
                    }else if(alert_resp === 'Skip' || alert_resp === 'Cancel'){
                        item_with_same_name_already_exists = false;
                    }
                }
                // -----------------------------------------------------------------------
                // all other errors
                // -----------------------------------------------------------------------
                else{
                    item_with_same_name_already_exists = false;
                    // error message after source item has reappeared
                    $(el_item).show(0, function(){
                        UIAlert(`<p>Moving <strong>${html_encode($(el_item).attr('data-name'))}</strong></p>${err.message ?? ''}`)
                    });

                    break;
                }
            }
        }while(item_with_same_name_already_exists);

        // check if trash is empty
        if(untrashed_at_least_one_item){
            const trash = await puter.fs.stat(trash_path);
            if(window.socket){
                window.socket.emit('trash.is_empty', {is_empty: trash.is_empty});
            }
            if(trash.is_empty){
                $(`[data-app="trash"]`).find('.taskbar-icon > img').attr('src', window.icons['trash.svg']);
                $(`.item[data-path="${html_encode(trash_path)}" i]`).find('.item-icon > img').attr('src', window.icons['trash.svg']);
                $(`.window[data-path="${html_encode(trash_path)}" i]`).find('.window-head-icon').attr('src', window.icons['trash.svg']);
            }
        }
    }

    clearTimeout(progwin_timeout);

    // log stats to console
    let move_duration = (Date.now() - move_init_ts);
    console.log(`moved ${el_items.length} item${el_items.length > 1 ? 's':''} in ${move_duration}ms`);

    // -----------------------------------------------------------------------
    // DONE! close progress window with delay to allow user to see 100% progress
    // -----------------------------------------------------------------------
    // Add action to actions_history for undo ability
    if(!is_undo && dest_path !== trash_path){
        actions_history.push({
            operation: 'move',
            data: moved_items,
        });
    }else if(!is_undo && dest_path === trash_path){
        actions_history.push({
            operation: 'delete',
            data: moved_items,
        });
    }

    if(progwin){
        setTimeout(() => {
            $(progwin).close();   
        }, copy_progress_hide_delay);
    }
}

/**
 * Generates sharing URLs for various social media platforms and services based on the provided arguments.
 *
 * @global
 * @function
 * @param {Object} args - Configuration object for generating share URLs.
 * @param {string} [args.url] - The URL to share.
 * @param {string} [args.title] - The title or headline of the content to share.
 * @param {string} [args.image] - Image URL associated with the content.
 * @param {string} [args.desc] - A description of the content.
 * @param {string} [args.appid] - App ID for certain platforms that require it.
 * @param {string} [args.redirecturl] - Redirect URL for certain platforms.
 * @param {string} [args.via] - Attribution source, e.g., a Twitter username.
 * @param {string} [args.hashtags] - Comma-separated list of hashtags without '#'.
 * @param {string} [args.provider] - Content provider.
 * @param {string} [args.language] - Content's language.
 * @param {string} [args.userid] - User ID for certain platforms.
 * @param {string} [args.category] - Content's category.
 * @param {string} [args.phonenumber] - Phone number for platforms like SMS or Telegram.
 * @param {string} [args.emailaddress] - Email address to share content to.
 * @param {string} [args.ccemailaddress] - CC email address for sharing content.
 * @param {string} [args.bccemailaddress] - BCC email address for sharing content.
 * @returns {Object} - An object containing key-value pairs where keys are platform names and values are constructed sharing URLs.
 * 
 * @example
 * const shareConfig = {
 *     url: 'https://example.com',
 *     title: 'Check this out!',
 *     desc: 'This is an amazing article on example.com',
 *     via: 'exampleUser'
 * };
 * const shareLinks = window.socialLink(shareConfig);
 * console.log(shareLinks.twitter);  // Outputs the constructed Twitter share link
 */
window.socialLink = function (args) {
    const validargs = [
        'url',
        'title',
        'image',
        'desc',
        'appid',
        'redirecturl',
        'via',
        'hashtags',
        'provider',
        'language',
        'userid',
        'category',
        'phonenumber',
        'emailaddress',
        'cemailaddress',
        'bccemailaddress',
    ];
    
    for(var i = 0; i < validargs.length; i++) {
        const validarg = validargs[i];
        if(!args[validarg]) {
            args[validarg] = '';
        }
    }
    
    const url = fixedEncodeURIComponent(args.url);
    const title = fixedEncodeURIComponent(args.title);
    const image = fixedEncodeURIComponent(args.image);
    const desc = fixedEncodeURIComponent(args.desc);
    const via = fixedEncodeURIComponent(args.via);
    const hash_tags = fixedEncodeURIComponent(args.hashtags);
    const language = fixedEncodeURIComponent(args.language);
    const user_id = fixedEncodeURIComponent(args.userid);
    const category = fixedEncodeURIComponent(args.category);
    const phone_number = fixedEncodeURIComponent(args.phonenumber);
    const email_address = fixedEncodeURIComponent(args.emailaddress);
    const cc_email_address = fixedEncodeURIComponent(args.ccemailaddress);
    const bcc_email_address = fixedEncodeURIComponent(args.bccemailaddress);
    
    var text = title;
    
    if(desc) {
        text += '%20%3A%20';	// This is just this, " : "
        text += desc;
    }
    
    return {
        'add.this':'http://www.addthis.com/bookmark.php?url=' + url,
        'blogger':'https://www.blogger.com/blog-this.g?u=' + url + '&n=' + title + '&t=' + desc,
        'buffer':'https://buffer.com/add?text=' + text + '&url=' + url,
        'diaspora':'https://share.diasporafoundation.org/?title=' + title + '&url=' + url,
        'douban':'http://www.douban.com/recommend/?url=' + url + '&title=' + text,
        'email':'mailto:' + email_address + '?subject=' + title + '&body=' + desc,
        'evernote':'https://www.evernote.com/clip.action?url=' + url + '&title=' + text,
        'getpocket':'https://getpocket.com/edit?url=' + url,
        'facebook':'http://www.facebook.com/sharer.php?u=' + url,
        'flattr':'https://flattr.com/submit/auto?user_id=' + user_id + '&url=' + url + '&title=' + title + '&description=' + text + '&language=' + language + '&tags=' + hash_tags + '&hidden=HIDDEN&category=' + category,
        'flipboard':'https://share.flipboard.com/bookmarklet/popout?v=2&title=' + text + '&url=' + url, 
        'gmail':'https://mail.google.com/mail/?view=cm&to=' + email_address + '&su=' + title + '&body=' + url + '&bcc=' + bcc_email_address + '&cc=' + cc_email_address,
        'google.bookmarks':'https://www.google.com/bookmarks/mark?op=edit&bkmk=' + url + '&title=' + title + '&annotation=' + text + '&labels=' + hash_tags + '',
        'instapaper':'http://www.instapaper.com/edit?url=' + url + '&title=' + title + '&description=' + desc,
        'line.me':'https://lineit.line.me/share/ui?url=' + url + '&text=' + text,
        'linkedin':'https://www.linkedin.com/sharing/share-offsite/?url=' + url,
        'livejournal':'http://www.livejournal.com/update.bml?subject=' + text + '&event=' + url,
        'hacker.news':'https://news.ycombinator.com/submitlink?u=' + url + '&t=' + title,
        'ok.ru':'https://connect.ok.ru/dk?st.cmd=WidgetSharePreview&st.shareUrl=' + url,
        'pinterest':'http://pinterest.com/pin/create/button/?url=' + url ,
        'qzone':'http://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url=' + url,
        'reddit':'https://reddit.com/submit?url=' + url + '&title=' + title,
        'renren':'http://widget.renren.com/dialog/share?resourceUrl=' + url + '&srcUrl=' + url + '&title=' + text + '&description=' + desc,
        'skype':'https://web.skype.com/share?url=' + url + '&text=' + text,
        'sms':'sms:' + phone_number + '?body=' + text,
        'surfingbird.ru':'http://surfingbird.ru/share?url=' + url + '&description=' + desc + '&screenshot=' + image + '&title=' + title,
        'telegram.me':'https://t.me/share/url?url=' + url + '&text=' + text + '&to=' + phone_number,
        'threema':'threema://compose?text=' + text + '&id=' + user_id,
        'tumblr':'https://www.tumblr.com/widgets/share/tool?canonicalUrl=' + url + '&title=' + title + '&caption=' + desc + '&tags=' + hash_tags,
        'twitter':'https://twitter.com/intent/tweet?url=' + url + '&text=' + text + '&via=' + via + '&hashtags=' + hash_tags,
        'vk':'http://vk.com/share.php?url=' + url + '&title=' + title + '&comment=' + desc,
        'weibo':'http://service.weibo.com/share/share.php?url=' + url + '&appkey=&title=' + title + '&pic=&ralateUid=',
        'whatsapp':'https://api.whatsapp.com/send?text=' + text + '%20' + url,
        'xing':'https://www.xing.com/spi/shares/new?url=' + url,
        'yahoo':'http://compose.mail.yahoo.com/?to=' + email_address + '&subject=' + title + '&body=' + text,
    };
}

/**
 * Encodes a URI component with enhanced safety by replacing characters 
 * that are not typically encoded by the standard encodeURIComponent.
 *
 * @param {string} str - The string to be URI encoded.
 * @returns {string} - Returns the URI encoded string.
 *
 * @example
 * const str = "Hello, world!";
 * const encodedStr = fixedEncodeURIComponent(str);
 * console.log(encodedStr);  // Expected output: "Hello%2C%20world%21"
 */
function fixedEncodeURIComponent(str) {
    return encodeURIComponent(str).replace(/[!'()*]/g, function(c) {
        return '%' + c.charCodeAt(0).toString(16);
    });
}

/**
 * Refreshes the desktop background based on the user's settings.
 * If the user has set a custom desktop background URL or color, it will use that.
 * If not, it defaults to a specific wallpaper image.
 *
 * @global
 * @function
 * @fires set_desktop_background - Calls this global function to set the desktop background.
 * 
 * @example
 * // This will refresh the desktop background according to the user's preference or defaults.
 * window.refresh_desktop_background();
 */
window.refresh_desktop_background = function(){
    if(window.user && (window.user.desktop_bg_url !== null || window.user.desktop_bg_color !== null)){
        window.set_desktop_background({
            url: window.user.desktop_bg_url,
            fit: window.user.desktop_bg_fit,
            color: window.user.desktop_bg_color,
        })
    }
    // default background
    else{
        let wallpaper = (window.gui_env === 'prod') ? '/dist/images/wallpaper.webp' :  '/images/wallpaper.webp';
        window.set_desktop_background({
            url: wallpaper,
            fit: 'cover',
        });
    }
}

window.determine_website_url = function(fsentry_path){
    // search window.sites and if any site has `dir_path` set and the fsentry_path starts with that dir_path + '/', return the site's url + path
    for(let i=0; i<window.sites.length; i++){
        if(window.sites[i].dir_path && fsentry_path.startsWith(window.sites[i].dir_path + '/')){
            return window.sites[i].address + fsentry_path.replace(window.sites[i].dir_path, '');
        }
    }

    return null;
}

window.update_sites_cache = function(){
    return puter.hosting.list((sites)=>{
        if(sites && sites.length > 0){
            window.sites = sites;
        }else{
            window.sites = [];
        }
    })
}

/**
 * 
 * @param {*} el_target_container 
 * @param {*} target_path 
 */

window.init_upload_using_dialog = function(el_target_container, target_path = null){
    $("#upload-file-dialog").unbind('onchange');
    $("#upload-file-dialog").unbind('change');
    $("#upload-file-dialog").unbind('onChange');

    target_path = target_path === null ? $(el_target_container).attr('data-path') : path.resolve(target_path);
    $('#upload-file-dialog').trigger('click');
    $("#upload-file-dialog").on('change', async function(e){        
        if($("#upload-file-dialog").val() !== ''){            
            const files = $('#upload-file-dialog')[0].files;
            if(files.length > 0){
                try{
                    upload_items(files, target_path);
                }
                catch(err){
                    UIAlert(err.message ?? err)
                }
                $('#upload-file-dialog').val('');
            }
        }
        else{
            return
        }
    })
}

window.upload_items = async function(items, dest_path){
    let upload_progress_window;
    let opid;

    if(dest_path == trash_path){
        UIAlert('Uploading to trash is not allowed!');
        return;
    }

    puter.fs.upload(
        // what to upload
        items, 
        // where to upload
        dest_path,
        // options
        {
            // init
            init: async(operation_id, xhr)=>{
                opid = operation_id;
                // create upload progress window
                upload_progress_window = await UIWindowUploadProgress({operation_id: operation_id});
                // cancel btn
                $(upload_progress_window).find('.upload-cancel-btn').on('click', function(e){
                    $(upload_progress_window).close();
                    show_save_account_notice_if_needed();
                    xhr.abort();
                })
                // add to active_uploads
                active_uploads[opid] = 0;
            },
            // start
            start: async function(){
                // change upload progress window message to uploading
                $(upload_progress_window).find('.upload-progress-msg').html(`Uploading (<span class="upload-progress-percent">0%</span>)`);
            },
            // progress
            progress: async function(operation_id, op_progress){
                $(`[data-upload-operation-id="${operation_id}"]`).find('.upload-progress-bar').css( 'width', op_progress+'%');
                $(`[data-upload-operation-id="${operation_id}"]`).find('.upload-progress-percent').html(op_progress+'%');
                // update active_uploads
                active_uploads[opid] = op_progress;
                // update title if window is not visible
                if(document.visibilityState !== "visible"){
                    update_title_based_on_uploads();
                }
            },
            // success
            success: async function(items){
                // DONE
                // Add action to actions_history for undo ability
                const files = []
                if(typeof items[Symbol.iterator] === 'function'){
                    for(const item of items){
                        files.push(item.path)
                    }
                }else{
                    files.push(items.path)
                }

                actions_history.push({
                    operation: 'upload',
                    data: files
                });
                // close progress window after a bit of delay for a better UX
                setTimeout(() => {
                    setTimeout(() => {
                        $(upload_progress_window).close();  
                        show_save_account_notice_if_needed();
                    }, Math.abs(upload_progress_hide_delay));
                })
                // remove from active_uploads
                delete active_uploads[opid];
            },
            // error
            error: async function(err){
                $(upload_progress_window).close();  
                // UIAlert(err?.message ?? 'An error occurred while uploading.');
                // remove from active_uploads
                delete active_uploads[opid];
            },
            // abort
            abort: async function(operation_id){
                // console.log('upload aborted');
                // remove from active_uploads
                delete active_uploads[opid];
            }
        }
    );
}

window.empty_trash = async function(){
    const alert_resp = await UIAlert({
        message: `Are you sure you want to permanently delete the items in Trash?`,
        buttons:[
            {
                label: 'Yes',
                value: 'yes',
                type: 'primary',
            },
            {
                label: 'No',
                value: 'no',
            },
        ]
    })
    if(alert_resp === 'no')
        return;

    // only show progress window if it takes longer than 500ms to create folder
    let init_ts = Date.now();
    let progwin;
    let op_id = uuidv4();
    let progwin_timeout = setTimeout(async () => {
        progwin = await UIWindowProgressEmptyTrash({operation_id: op_id});
    }, 500);

    await puter.fs.delete({
        paths: trash_path,
        descendantsOnly: true,
        recursive: true,
        success: async function (resp){
            // update other clients
            if(window.socket){
                window.socket.emit('trash.is_empty', {is_empty: true});
            }
            // use the 'empty trash' icon for Trash
            $(`[data-app="trash"]`).find('.taskbar-icon > img').attr('src', window.icons['trash.svg']);
            $(`.item[data-path="${html_encode(trash_path)}" i], .item[data-shortcut_to_path="${html_encode(trash_path)}" i]`).find('.item-icon > img').attr('src', window.icons['trash.svg']); 
            $(`.window[data-path="${trash_path}"]`).find('.window-head-icon').attr('src', window.icons['trash.svg']);
            // remove all items with trash paths
            // todo this has to be case-insensitive but the `i` selector doesn't work on ^=
            $(`.item[data-path^="${trash_path}/"]`).removeItems();
            // update the footer item count for Trash
            update_explorer_footer_item_count($(`.window[data-path="${trash_path}"]`))
            // close progress window
            clearTimeout(progwin_timeout);
            setTimeout(() => {
                $(progwin).close();   
            }, Math.max(0, copy_progress_hide_delay - (Date.now() - init_ts)));
        },
        error: async function (err){
            clearTimeout(progwin_timeout);
            setTimeout(() => {
                $(progwin).close();   
            }, Math.max(0, copy_progress_hide_delay - (Date.now() - init_ts)));
        }
    });
}

window.copy_to_clipboard = async function(text){
    if (navigator.clipboard) {
        // copy text to clipboard
        await navigator.clipboard.writeText(text);
    }
    else{
        document.execCommand('copy');
    }
}

window.getUsage = () => {
    return fetch(api_origin + "/drivers/usage", {
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + auth_token
        },
        method: "GET"
    })
    .then(response => {
        // Check if the response is ok (status code in the range 200-299)
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json(); // Parse the response as JSON
    })
    .then(data => {
        // Handle the JSON data
        return data;
    })
    .catch(error => {
        // Handle any errors
        console.error('There has been a problem with your fetch operation:', error);
    });

}  

window.getAppUIDFromOrigin = async function(origin) {
    try {
        const response = await fetch(window.api_origin + "/auth/app-uid-from-origin", {
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + window.auth_token,
            },
            body: JSON.stringify({ origin: origin }),
            method: "POST",
        });

        const data = await response.json();

        // Assuming the app_uid is in the data object, return it
        return data.uid;
    } catch (err) {
        // Handle any errors here
        console.error(err);
        // You may choose to return something specific here in case of an error
        return null;
    }
}

window.getUserAppToken = async function(origin) {
    try {
        const response = await fetch(window.api_origin + "/auth/get-user-app-token", {
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + window.auth_token,
            },
            body: JSON.stringify({ origin: origin }),
            method: "POST",
        });

        const data = await response.json();

        // return
        return data;
    } catch (err) {
        // Handle any errors here
        console.error(err);
        // You may choose to return something specific here in case of an error
        return null;
    }
}

window.checkUserSiteRelationship = async function(origin) {
    try {
        const response = await fetch(window.api_origin + "/auth/check-app ", {
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + window.auth_token,
            },
            body: JSON.stringify({ origin: origin }),
            method: "POST",
        });

        const data = await response.json();

        // return
        return data;
    } catch (err) {
        // Handle any errors here
        console.error(err);
        // You may choose to return something specific here in case of an error
        return null;
    }
}


window.zipItems = async function(el_items, targetDirPath, download = true) {
    const zip = new JSZip();

    // if single item, convert to array
    el_items = Array.isArray(el_items) ? el_items : [el_items];

    // create progress window
    let start_ts = Date.now();
    let progwin, progwin_timeout;
    // only show progress window if it takes longer than 500ms to download
    progwin_timeout = setTimeout(async () => {
        progwin = await UIWindowDownloadDirProg();
    }, 500);

    for (const el_item of el_items) {
        let targetPath = $(el_item).attr('data-path');
        // if directory, zip the directory
        if($(el_item).attr('data-is_dir') === '1'){
            $(progwin).find('.dir-dl-status').html(`Reading <strong>${html_encode(targetPath)}</strong>`);
            // Recursively read the directory
            let children = await readDirectoryRecursive(targetPath);

            // Add files to the zip
            for (const child of children) {
                let relativePath;
                if(el_items.length === 1)
                    relativePath = child.relativePath;
                else
                    relativePath = path.basename(targetPath) + '/' + child.relativePath;

                // update progress window
                $(progwin).find('.dir-dl-status').html(`Zipping <strong>${html_encode(relativePath)}</strong>`);
                
                // read file content
                let content = await puter.fs.read(child.path);
                try{
                    zip.file(relativePath, content, {binary: true});
                }catch(e){
                    console.error(e);
                }
            }

        }
        // if item is a file, zip the file
        else{
            let content = await puter.fs.read(targetPath);
            zip.file(path.basename(targetPath), content, {binary: true});
        }
    }

    // determine name of zip file
    let zipName;
    if(el_items.length === 1)
        zipName = path.basename($(el_items[0]).attr('data-path'));
    else
        zipName = 'Archive';

    // Generate the zip file
    zip.generateAsync({ type: "blob" })
        .then(async function (content) {
            // Trigger the download
            if(download){
                const url = URL.createObjectURL(content);
                const a = document.createElement("a");
                a.href = url;
                a.download = zipName;
                document.body.appendChild(a);
                a.click();

                // Cleanup
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
            // save
            else
                await puter.fs.write(targetDirPath + '/' + zipName + ".zip", content, {overwrite: false, dedupeName: true})

            // close progress window
            clearTimeout(progwin_timeout);
            setTimeout(() => {
                $(progwin).close();   
            }, Math.max(0, copy_progress_hide_delay - (Date.now() - start_ts)));
        })
        .catch(function (err) {
            // close progress window
            clearTimeout(progwin_timeout);
            setTimeout(() => {
                $(progwin).close();   
            }, Math.max(0, copy_progress_hide_delay - (Date.now() - start_ts)));

            // handle errors
            console.error("Error in zipping files: ", err);
        });
}

async function readDirectoryRecursive(path, baseDir = '') {
    let allFiles = [];

    // Read the directory
    const entries = await puter.fs.readdir(path);

    // Process each entry
    for (const entry of entries) {
        const fullPath = `${path}/${entry.name}`;
        if (entry.is_dir) {
            // If entry is a directory, recursively read it
            const subDirFiles = await readDirectoryRecursive(fullPath, `${baseDir}${entry.name}/`);
            allFiles = allFiles.concat(subDirFiles);
        } else {
            // If entry is a file, add it to the list
            allFiles.push({ path: fullPath, relativePath: `${baseDir}${entry.name}` });
        }
    }

    return allFiles;
}


window.extractSubdomain = function(url) {
    var subdomain = url.split('://')[1].split('.')[0];
    return subdomain;
}

window.sleep = function(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
}

window.unzipItem = async function(itemPath) {
    // create progress window
    let start_ts = Date.now();
    let progwin, progwin_timeout;
    // only show progress window if it takes longer than 500ms to download
    progwin_timeout = setTimeout(async () => {
        progwin = await UIWindowDownloadDirProg();
    }, 500);

    const zip = new JSZip();
    let filPath = itemPath;
    let file = puter.fs.read(filPath);

    zip.loadAsync(file).then(async function (zip) {
        const rootdir = await puter.fs.mkdir(path.dirname(filPath) + '/' + path.basename(filPath, '.zip'), {dedupeName: true});
        Object.keys(zip.files).forEach(async function (filename) {
            console.log(filename);
            if(filename.endsWith('/'))
                await puter.fs.mkdir(rootdir.path +'/' + filename, {createMissingParents: true});
            zip.files[filename].async('blob').then(async function (fileData) {
                await puter.fs.write(rootdir.path +'/' + filename, fileData);
            }).catch(function (e) {
                // UIAlert(e.message);
            })
        })
        // close progress window
        clearTimeout(progwin_timeout);
        setTimeout(() => {
            $(progwin).close();   
        }, Math.max(0, copy_progress_hide_delay - (Date.now() - start_ts)));

    }).catch(function (e) {
        // UIAlert(e.message);
        // close progress window
        clearTimeout(progwin_timeout);
        setTimeout(() => {
            $(progwin).close();   
        }, Math.max(0, copy_progress_hide_delay - (Date.now() - start_ts)));
    })
}

window.rename_file = async(options, new_name, old_name, old_path, el_item, el_item_name, el_item_icon, el_item_name_editor, website_url, is_undo = false)=>{
    puter.fs.rename({
        uid: options.uid === 'null' ? null : options.uid,
        new_name: new_name,
        excludeSocketID: window.socket.id,
        success: async (fsentry)=>{
            // Add action to actions_history for undo ability
            if (!is_undo)
                actions_history.push({
                    operation: 'rename',
                    data: {options, new_name, old_name, old_path, el_item, el_item_name, el_item_icon, el_item_name_editor, website_url}
                });
            
            // Has the extension changed? in that case update options.sugggested_apps
            const old_extension = path.extname(old_name); 
            const new_extension = path.extname(new_name);
            if(old_extension !== new_extension){
                suggest_apps_for_fsentry({
                    uid: options.uid,
                    onSuccess: function(suggested_apps){
                        options.suggested_apps = suggested_apps;
                    }
                });
            }

            // Set new item name
            $(`.item[data-uid='${$(el_item).attr('data-uid')}'] .item-name`).html(html_encode(truncate_filename(new_name, TRUNCATE_LENGTH)).replaceAll(' ', '&nbsp;'));
            $(el_item_name).show();

            // Hide item name editor
            $(el_item_name_editor).hide();

            // Set new icon
            const new_icon = (options.is_dir ? window.icons['folder.svg'] : (await item_icon(fsentry)).image);
            $(el_item_icon).find('.item-icon-icon').attr('src', new_icon);

            // Set new data-name
            options.name = new_name;
            $(el_item).attr('data-name', html_encode(new_name));
            $(`.item[data-uid='${$(el_item).attr('data-uid')}']`).attr('data-name', html_encode(new_name));
            $(`.window-${options.uid}`).attr('data-name', html_encode(new_name));

            // Set new title attribute
            $(`.item[data-uid='${$(el_item).attr('data-uid')}']`).attr('title', html_encode(new_name));
            $(`.window-${options.uid}`).attr('title', html_encode(new_name));

            // Set new value for item-name-editor
            $(`.item[data-uid='${$(el_item).attr('data-uid')}'] .item-name-editor`).val(html_encode(new_name));
            $(`.item[data-uid='${$(el_item).attr('data-uid')}'] .item-name`).attr('title', html_encode(new_name));

            // Set new data-path
            options.path = path.join( path.dirname(options.path), options.name);
            const new_path = options.path;
            $(el_item).attr('data-path', new_path);
            $(`.item[data-uid='${$(el_item).attr('data-uid')}']`).attr('data-path', new_path);
            $(`.window-${options.uid}`).attr('data-path', new_path);

            // Update all elements that have matching paths
            $(`[data-path="${html_encode(old_path)}" i]`).each(function(){
                $(this).attr('data-path', new_path)
                if($(this).hasClass('window-navbar-path-dirname'))
                    $(this).text(new_name);
            });

            // Update the paths of all elements whose paths start with old_path
            $(`[data-path^="${html_encode(old_path) + '/'}"]`).each(function(){
                const new_el_path = _.replace($(this).attr('data-path'), old_path + '/', new_path+'/');
                $(this).attr('data-path', new_el_path);
            });

            // Update the 'Sites Cache'
            if($(el_item).attr('data-has_website') === '1')
                await update_sites_cache();

            // Update website_url
            website_url = determine_website_url(new_path);
            $(el_item).attr('data-website_url', website_url);

            // Update all exact-matching windows
            $(`.window-${options.uid}`).each(function(){
                update_window_path(this, options.path);
            })

            // Set new name for corresponding open windows
            $(`.window-${options.uid} .window-head-title`).text(new_name);

            // Re-sort all matching item containers
            $(`.item[data-uid='${$(el_item).attr('data-uid')}']`).parent('.item-container').each(function(){
                sort_items(this, $(el_item).closest('.item-container').attr('data-sort_by'), $(el_item).closest('.item-container').attr('data-sort_order'));
            })
        },
        error: function (err){
            // reset to old name
            $(el_item_name).text(truncate_filename(options.name, TRUNCATE_LENGTH));
            $(el_item_name).show();

            // hide item name editor
            $(el_item_name_editor).hide();
            $(el_item_name_editor).val(html_encode($(el_item).attr('data-name')));

            //show error
            if(err.message){
                UIAlert(err.message)
            }
        },
    });
}

/**
 * Deletes the given item with path.
 * 
 * @param {string} path - path of the item to delete 
 * @returns {Promise<void>}
 */
window.delete_item_with_path = async function(path){
    try{
        await puter.fs.delete({
            paths: path,
            descendantsOnly: false,
            recursive: true,
        });
    }catch(err){
        UIAlert(err.responseText);
    }
}

window.undo_last_action = async()=>{
    if (actions_history.length > 0) {
        const last_action = actions_history.pop();

        // Undo the create file action
        if (last_action.operation === 'create_file' || last_action.operation === 'create_folder') {
            const lastCreatedItem = last_action.data;
            undo_create_file_or_folder(lastCreatedItem); 
        } else if(last_action.operation === 'rename') {
            const {options, new_name, old_name, old_path, el_item, el_item_name, el_item_icon, el_item_name_editor, website_url}  = last_action.data;
            rename_file(options, old_name, new_name, old_path, el_item, el_item_name, el_item_icon, el_item_name_editor, website_url, true); 
        } else if(last_action.operation === 'upload') {
            const files = last_action.data;
            undo_upload(files);
        } else if(last_action.operation === 'copy') {
            const files = last_action.data;
            undo_copy(files);
        } else if(last_action.operation === 'move') {
            const items = last_action.data;
            undo_move(items);
        } else if(last_action.operation === 'delete') {
            const items = last_action.data;
            undo_delete(items);
        }
    }
}

window.undo_create_file_or_folder = async(item)=>{
    await window.delete_item(item);
}

window.undo_upload = async(files)=>{
    for (const file of files) {
        await window.delete_item_with_path(file);
    }
}

window.undo_copy = async(files)=>{
    for (const file of files) {
        await window.delete_item_with_path(file);
    }
}

window.undo_move = async(items)=>{
    for (const item of items) {
        const el = await get_html_element_from_options(item.options);
        console.log(item.original_path)
        move_items([el], path.dirname(item.original_path), true);
    }
}

window.undo_delete = async(items)=>{
    for (const item of items) {
        const el = await get_html_element_from_options(item.options);
        let metadata = $(el).attr('data-metadata') === '' ? {} : JSON.parse($(el).attr('data-metadata'))
        move_items([el], path.dirname(metadata.original_path), true);
    }
}


window.get_html_element_from_options = async function(options){
    const item_id = global_element_id++;
    
    options.disabled = options.disabled ?? false;
    options.visible = options.visible ?? 'visible'; // one of 'visible', 'revealed', 'hidden'
    options.is_dir = options.is_dir ?? false;
    options.is_selected = options.is_selected ?? false;
    options.is_shared = options.is_shared ?? false;
    options.is_shortcut = options.is_shortcut ?? 0;
    options.is_trash = options.is_trash ?? false;
    options.metadata = options.metadata ?? '';
    options.multiselectable = options.multiselectable ?? true;
    options.shortcut_to = options.shortcut_to ?? '';
    options.shortcut_to_path = options.shortcut_to_path ?? '';
    options.immutable = (options.immutable === false || options.immutable === 0 || options.immutable === undefined ? 0 : 1);
    options.sort_container_after_append = (options.sort_container_after_append !== undefined ? options.sort_container_after_append : false);
    const is_shared_with_me = (options.path !== '/'+window.user.username && !options.path.startsWith('/'+window.user.username+'/'));

    let website_url = determine_website_url(options.path);

    // do a quick check to see if the target parent has any file type restrictions
    const appendto_allowed_file_types = $(options.appendTo).attr('data-allowed_file_types')
    if(!window.check_fsentry_against_allowed_file_types_string({is_dir: options.is_dir, name:options.name, type:options.type}, appendto_allowed_file_types))
        options.disabled = true;

    // --------------------------------------------------------
    // HTML for Item
    // --------------------------------------------------------
    let h = '';
    h += `<div  id="item-${item_id}" 
                class="item${options.is_selected ? ' item-selected':''} ${options.disabled ? 'item-disabled':''} item-${options.visible}" 
                data-id="${item_id}" 
                data-name="${html_encode(options.name)}" 
                data-metadata="${html_encode(options.metadata)}" 
                data-uid="${options.uid}" 
                data-is_dir="${options.is_dir ? 1 : 0}" 
                data-is_trash="${options.is_trash ? 1 : 0}"
                data-has_website="${options.has_website ? 1 : 0 }" 
                data-website_url = "${website_url ? html_encode(website_url) : ''}"
                data-immutable="${options.immutable}" 
                data-is_shortcut = "${options.is_shortcut}"
                data-shortcut_to = "${html_encode(options.shortcut_to)}"
                data-shortcut_to_path = "${html_encode(options.shortcut_to_path)}"
                data-sortable = "${options.sortable ?? 'true'}"
                data-sort_by = "${html_encode(options.sort_by) ?? 'name'}"
                data-size = "${options.size ?? ''}"
                data-type = "${html_encode(options.type) ?? ''}"
                data-modified = "${options.modified ?? ''}"
                data-associated_app_name = "${html_encode(options.associated_app_name) ?? ''}"
                data-path="${html_encode(options.path)}">`;

        // spinner
        h += `<div class="item-spinner">`;
        h += `</div>`;
        // modified
        h += `<div class="item-attr item-attr--modified">`;
            h += `<span>${options.modified === 0 ? '-' : timeago.format(options.modified*1000)}</span>`;
        h += `</div>`;
        // size
        h += `<div class="item-attr item-attr--size">`;
            h += `<span>${options.size ? byte_format(options.size) : '-'}</span>`;
        h += `</div>`;
        // type
        h += `<div class="item-attr item-attr--type">`;
            if(options.is_dir)
                h += `<span>Folder</span>`;
            else
                h += `<span>${options.type ? html_encode(options.type) : '-'}</span>`;
        h += `</div>`;


        // icon
        h += `<div class="item-icon">`;
            h += `<img src="${html_encode(options.icon.image)}" class="item-icon-${options.icon.type}" data-item-id="${item_id}">`;
        h += `</div>`;
        // badges
        h += `<div class="item-badges">`;
            // website badge
            h += `<img  class="item-badge item-has-website-badge long-hover" 
                        style="${options.has_website ? 'display:block;' : ''}" 
                        src="${html_encode(window.icons['world.svg'])}" 
                        data-item-id="${item_id}"
                    >`;
            // link badge
            h += `<img  class="item-badge item-has-website-url-badge" 
                        style="${website_url ? 'display:block;' : ''}" 
                        src="${html_encode(window.icons['link.svg'])}" 
                        data-item-id="${item_id}"
                    >`;

            // shared badge
            h += `<img  class="item-badge item-badge-has-permission" 
                        style="display: ${ is_shared_with_me ? 'block' : 'none'};
                            background-color: #ffffff;
                            padding: 2px;" src="${html_encode(window.icons['shared.svg'])}" 
                        data-item-id="${item_id}"
                        title="A user has shared this item with you.">`;
            // owner-shared badge
            h += `<img  class="item-badge item-is-shared" 
                        style="background-color: #ffffff; padding: 2px; ${!is_shared_with_me && options.is_shared ? 'display:block;' : ''}" 
                        src="${html_encode(window.icons['owner-shared.svg'])}" 
                        data-item-id="${item_id}"
                        data-item-uid="${options.uid}"
                        data-item-path="${html_encode(options.path)}"
                        title="You have shared this item with at least one other user."
                    >`;
            // shortcut badge
            h += `<img  class="item-badge item-shortcut" 
                        style="background-color: #ffffff; padding: 2px; ${options.is_shortcut !== 0 ? 'display:block;' : ''}" 
                        src="${html_encode(window.icons['shortcut.svg'])}" 
                        data-item-id="${item_id}"
                        title="Shortcut"
                    >`;

        h += `</div>`;

        // name
        h += `<span class="item-name" data-item-id="${item_id}" title="${html_encode(options.name)}">${html_encode(truncate_filename(options.name, TRUNCATE_LENGTH)).replaceAll(' ', '&nbsp;')}</span>`
        // name editor
        h += `<textarea class="item-name-editor hide-scrollbar" spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off" data-gramm_editor="false">${html_encode(options.name)}</textarea>`
    h += `</div>`;

    return h;
}