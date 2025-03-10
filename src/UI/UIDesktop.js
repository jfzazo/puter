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

import path from "../lib/path.js"
import UIWindowClaimReferral from "./UIWindowClaimReferral.js"
import UIContextMenu from './UIContextMenu.js'
import UIItem from './UIItem.js'
import UIAlert from './UIAlert.js'
import UIWindow from './UIWindow.js'
import UIWindowSaveAccount from './UIWindowSaveAccount.js';
import UIWindowDesktopBGSettings from "./UIWindowDesktopBGSettings.js"
import UIWindowMyWebsites from "./UIWindowMyWebsites.js"
import UIWindowChangePassword from "./UIWindowChangePassword.js"
import UIWindowChangeUsername from "./UIWindowChangeUsername.js"
import UIWindowFeedback from "./UIWindowFeedback.js"
import UIWindowLogin from "./UIWindowLogin.js"
import UIWindowQR from "./UIWindowQR.js"
import UIWindowRefer from "./UIWindowRefer.js"
import UITaskbar from "./UITaskbar.js"
import new_context_menu_item from "../helpers/new_context_menu_item.js"
import ChangeLanguage from "../i18n/i18nChangeLanguage.js"

async function UIDesktop(options){
    let h = '';

    // connect socket.
    window.socket = io(gui_origin + '/', {
        query: {
            auth_token: auth_token
        }
    });

    window.socket.on('error', (error) => {
        console.error('GUI Socket Error:', error);
    });
      
    window.socket.on('connect', function(){
        console.log('GUI Socket: Connected', window.socket.id);
    });

    window.socket.on('reconnect', function(){
        console.log('GUI Socket: Reconnected', window.socket.id);
    });

    window.socket.on('disconnect', () => {
        console.log('GUI Socket: Disconnected');
    });

    window.socket.on('reconnect', (attempt) => {
        console.log('GUI Socket: Reconnection', attempt);
    });

    window.socket.on('reconnect_attempt', (attempt) => {
        console.log('GUI Socket: Reconnection Attemps', attempt);
    });

    window.socket.on('reconnect_error', (error) => {
        console.log('GUI Socket: Reconnection Error', error);
    });

    window.socket.on('reconnect_failed', () => {
        console.log('GUI Socket: Reconnection Failed');
    });

    window.socket.on('error', (error) => {
        console.error('GUI Socket Error:', error);
    });

    socket.on('upload.progress', (msg) => {
        if(window.progress_tracker[msg.operation_id]){
            window.progress_tracker[msg.operation_id].cloud_uploaded += msg.loaded_diff
            if(window.progress_tracker[msg.operation_id][msg.item_upload_id]){
                window.progress_tracker[msg.operation_id][msg.item_upload_id].cloud_uploaded = msg.loaded;
            }
        }
    });

    socket.on('download.progress', (msg) => {
        if(window.progress_tracker[msg.operation_id]){
            if(window.progress_tracker[msg.operation_id][msg.item_upload_id]){
                window.progress_tracker[msg.operation_id][msg.item_upload_id].downloaded = msg.loaded;
                window.progress_tracker[msg.operation_id][msg.item_upload_id].total = msg.total;
            }
        }
    });

    socket.on('trash.is_empty', async (msg) => {
        $(`.item[data-path="${html_encode(trash_path)}" i]`).find('.item-icon > img').attr('src', msg.is_empty ? window.icons['trash.svg'] : window.icons['trash-full.svg']);
        $(`.window[data-path="${html_encode(trash_path)}" i]`).find('.window-head-icon').attr('src', msg.is_empty ? window.icons['trash.svg'] : window.icons['trash-full.svg']);
        // empty trash windows if needed
        if(msg.is_empty)
            $(`.window[data-path="${html_encode(trash_path)}" i]`).find('.item-container').empty();
    })

    socket.on('app.opened', async (app) => {
        // don't update if this is the original client that initiated the action
        if(app.original_client_socket_id === window.socket.id)
            return;
        
        // add the app to the beginning of the array
        launch_apps.recent.unshift(app);

        // dedupe the array by uuid, uid, and id
        launch_apps.recent = _.uniqBy(launch_apps.recent, 'name');

        // limit to 5
        launch_apps.recent = launch_apps.recent.slice(0, window.launch_recent_apps_count);  
    })

    socket.on('item.removed', async (item) => {
        // don't update if this is the original client that initiated the action
        if(item.original_client_socket_id === window.socket.id)
            return;

        // don't remove items if this was a descendants_only operation
        if(item.descendants_only)
            return;

        // hide all UIItems with matching uids 
        $(`.item[data-path='${item.path}']`).fadeOut(150, function(){
            // close all windows with matching uids
            // $('.window-' + item.uid).close();
            // close all windows that belong to a descendant of this item
            // todo this has to be case-insensitive but the `i` selector doesn't work on ^=
            $(`.window[data-path^="${item.path}/"]`).close();
        });
    })

    socket.on('item.updated', async (item) => {
        // Don't update if this is the original client that initiated the action
        if(item.original_client_socket_id === window.socket.id)
            return;

        // Update matching items
        // set new item name
        $(`.item[data-uid='${html_encode(item.uid)}'] .item-name`).html(html_encode(truncate_filename(item.name, TRUNCATE_LENGTH)).replaceAll(' ', '&nbsp;'));

        // Set new icon
        const new_icon = (item.is_dir ? window.icons['folder.svg'] : (await item_icon(item)).image);
        $(`.item[data-uid='${item.uid}']`).find('.item-icon-thumb').attr('src', new_icon);
        $(`.item[data-uid='${item.uid}']`).find('.item-icon-icon').attr('src', new_icon);

        // Set new data-name
        $(`.item[data-uid='${item.uid}']`).attr('data-name', html_encode(item.name));
        $(`.window-${item.uid}`).attr('data-name', html_encode(item.name));

        // Set new title attribute
        $(`.item[data-uid='${item.uid}']`).attr('title', html_encode(item.name));
        $(`.window-${options.uid}`).attr('title', html_encode(item.name));

        // Set new value for item-name-editor
        $(`.item[data-uid='${item.uid}'] .item-name-editor`).val(html_encode(item.name));
        $(`.item[data-uid='${item.uid}'] .item-name`).attr('title', html_encode(item.name));

        // Set new data-path
        const new_path = item.path;
        $(`.item[data-uid='${item.uid}']`).attr('data-path', new_path);
        $(`.window-${item.uid}`).attr('data-path', new_path);

        // Update all elements that have matching paths
        $(`[data-path="${html_encode(item.old_path)}" i]`).each(function(){            
            $(this).attr('data-path', new_path)
            if($(this).hasClass('window-navbar-path-dirname'))
                $(this).text(item.name);
        });

        // Update all elements whose paths start with old_path
        $(`[data-path^="${html_encode(item.old_path) + '/'}"]`).each(function(){    
            const new_el_path = _.replace($(this).attr('data-path'), item.old_path + '/', new_path+'/');
            $(this).attr('data-path', new_el_path);
        });

        // Update all exact-matching windows
        $(`.window-${item.uid}`).each(function(){
            update_window_path(this, new_path);
        })
        // Set new name for matching open windows
        $(`.window-${item.uid} .window-head-title`).text(item.name);

        // Re-sort all matching item containers
        $(`.item[data-uid='${item.uid}']`).parent('.item-container').each(function(){
            sort_items(this, $(this).closest('.item-container').attr('data-sort_by'), $(this).closest('.item-container').attr('data-sort_order'));
        })
    })
    
    socket.on('item.moved', async (resp) => {
        let fsentry = resp;
        // Notify all apps that are watching this item
        sendItemChangeEventToWatchingApps(fsentry.uid, {
            event: 'moved',
            uid: fsentry.uid,
            name: fsentry.name,
        })

        // don't update if this is the original client that initiated the action
        if(resp.original_client_socket_id === window.socket.id)
            return;

        let dest_path = path.dirname(fsentry.path);
        let metadata = fsentry.metadata;

        // path must use the real name from DB
        fsentry.path =  fsentry.path;

        // update all shortcut_to_path
        $(`.item[data-shortcut_to_path="${html_encode(resp.old_path)}" i]`).attr(`data-shortcut_to_path`, html_encode(fsentry.path));
        
        // remove all items with matching uids
        $(`.item[data-uid='${fsentry.uid}']`).fadeOut(150, function(){
            // find all parent windows that contain this item
            let parent_windows = $(`.item[data-uid='${fsentry.uid}']`).closest('.window');
            // remove this item
            $(this).removeItems();
            // update parent windows' item counts
            $(parent_windows).each(function(index){
                update_explorer_footer_item_count(this);
                update_explorer_footer_selected_items_count(this)
            });
        })

        // if trashing, close windows of trashed items and its descendants
        if(dest_path === trash_path){
            $(`.window[data-path="${html_encode(resp.old_path)}" i]`).close();
            // todo this has to be case-insensitive but the `i` selector doesn't work on ^=
            $(`.window[data-path^="${html_encode(resp.old_path)}/"]`).close();
        }

        // update all paths of its and its descendants' open windows
        else{
            // todo this has to be case-insensitive but the `i` selector doesn't work on ^=
            $(`.window[data-path^="${html_encode(resp.old_path)}/"], .window[data-path="${html_encode(resp.old_path)}" i]`).each(function(){
                update_window_path(this, $(this).attr('data-path').replace(resp.old_path, fsentry.path));
            })
        }

        if(dest_path === trash_path){
            $(`.item[data-uid="${fsentry.uid}"]`).find('.item-is-shared').fadeOut(300);

            // if trashing dir... 
            if(fsentry.is_dir){
                // remove website badge
                $(`.mywebsites-dir-path[data-uuid="${fsentry.uid}"]`).remove();
                // remove the website badge from all instances of the dir
                $(`.item[data-uid="${fsentry.uid}"]`).find('.item-has-website-badge').fadeOut(300);

                // remove File Rrequest Token
                // todo, some client-side check to see if this dir has an FR associated with it before sending a whole ajax req
            }
        }
        // if replacing an existing item, remove the old item that was just replaced
        if(fsentry.overwritten_uid !== undefined)
            $(`.item[data-uid=${fsentry.overwritten_uid}]`).removeItems();

        // if this is trash, get original name from item metadata
        fsentry.name = (metadata && metadata.original_name) ? metadata.original_name : fsentry.name;

        // create new item on matching containers
        UIItem({
            appendTo: $(`.item-container[data-path='${html_encode(dest_path)}' i]`),
            immutable: fsentry.immutable,
            uid: fsentry.uid,
            path: fsentry.path,
            icon: await item_icon(fsentry),
            name: (dest_path === trash_path) ? metadata.original_name : fsentry.name,
            is_dir: fsentry.is_dir,
            size: fsentry.size,
            type: fsentry.type,
            modified: fsentry.modified,
            is_selected: false,
            is_shared: (dest_path === trash_path) ? false : fsentry.is_shared,
            is_shortcut: fsentry.is_shortcut,
            shortcut_to: fsentry.shortcut_to,
            shortcut_to_path: fsentry.shortcut_to_path,
            // has_website: $(el_item).attr('data-has_website') === '1',
            metadata: JSON.stringify(fsentry.metadata) ?? '',
        });

        if(fsentry.parent_dirs_created && fsentry.parent_dirs_created.length > 0){
            // this operation may have created some missing directories, 
            // see if any of the directories in the path of this file is new AND
            // if these new path have any open parents that need to be updated
                
            fsentry.parent_dirs_created.forEach(async dir => {
                let item_container = $(`.item-container[data-path='${html_encode(path.dirname(dir.path))}' i]`);
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
                    });                                                    
                }                                    
                sort_items(item_container, $(item_container).attr('data-sort_by'), $(item_container).attr('data-sort_order'));
            }); 
        }
        //sort each container
        $(`.item-container[data-path='${html_encode(dest_path)}' i]`).each(function(){
            sort_items(this, $(this).attr('data-sort_by'), $(this).attr('data-sort_order'))
        })
    });
    
    socket.on('user.email_confirmed', (msg) => {
        // don't update if this is the original client that initiated the action
        if(msg.original_client_socket_id === window.socket.id)
            return;

        refresh_user_data(window.auth_token);
    });

    socket.on('item.renamed', async (item) => {
        // Notify all apps that are watching this item
        sendItemChangeEventToWatchingApps(item.uid, {
            event: 'rename',
            uid: item.uid,
            // path: item.path,
            new_name: item.name,
            // old_path: item.old_path,
        })

        // Don't update if this is the original client that initiated the action
        if(item.original_client_socket_id === window.socket.id)
            return;

        // Update matching items
        // Set new item name
        $(`.item[data-uid='${html_encode(item.uid)}'] .item-name`).html(html_encode(truncate_filename(item.name, TRUNCATE_LENGTH)).replaceAll(' ', '&nbsp;'));

        // Set new icon
        const new_icon = (item.is_dir ? window.icons['folder.svg'] : (await item_icon(item)).image);
        $(`.item[data-uid='${item.uid}']`).find('.item-icon-icon').attr('src', new_icon);

        // Set new data-name
        $(`.item[data-uid='${item.uid}']`).attr('data-name', html_encode(item.name));
        $(`.window-${item.uid}`).attr('data-name', html_encode(item.name));

        // Set new title attribute
        $(`.item[data-uid='${item.uid}']`).attr('title', html_encode(item.name));
        $(`.window-${options.uid}`).attr('title', html_encode(item.name));

        // Set new value for item-name-editor
        $(`.item[data-uid='${item.uid}'] .item-name-editor`).val(html_encode(item.name));
        $(`.item[data-uid='${item.uid}'] .item-name`).attr('title', html_encode(item.name));

        // Set new data-path
        const new_path = item.path;
        $(`.item[data-uid='${item.uid}']`).attr('data-path', new_path);
        $(`.window-${item.uid}`).attr('data-path', new_path);

        // Update all elements that have matching paths
        $(`[data-path="${html_encode(item.old_path)}" i]`).each(function(){            
            $(this).attr('data-path', new_path)
            if($(this).hasClass('window-navbar-path-dirname'))
                $(this).text(item.name);
        });

        // Update all elements whose paths start with old_path
        $(`[data-path^="${html_encode(item.old_path) + '/'}"]`).each(function(){    
            const new_el_path = _.replace($(this).attr('data-path'), item.old_path + '/', new_path+'/');
            $(this).attr('data-path', new_el_path);
        });

        // Update all exact-matching windows
        $(`.window-${item.uid}`).each(function(){
            update_window_path(this, new_path);
        })
        // Set new name for matching open windows
        $(`.window-${item.uid} .window-head-title`).text(item.name);

        // Re-sort all matching item containers
        $(`.item[data-uid='${item.uid}']`).parent('.item-container').each(function(){
            sort_items(this, $(this).closest('.item-container').attr('data-sort_by'), $(this).closest('.item-container').attr('data-sort_order'));
        })
    });

    socket.on('item.added', async (item) => {
        // if item is empty, don't proceed
        if(_.isEmpty(item))
            return;

        // Notify all apps that are watching this item
        sendItemChangeEventToWatchingApps(item.uid, {
            event: 'write',
            uid: item.uid,
            // path: item.path,
            new_size: item.size,
            modified: item.modified,
            // old_path: item.old_path,
        });

        // Don't update if this is the original client that initiated the action
        if(item.original_client_socket_id === window.socket.id)
            return;

        // Update replaced items with matching uids
        if(item.overwritten_uid){
            $(`.item[data-uid='${item.overwritten_uid}']`).attr({
                'data-immutable': item.immutable,
                'data-path': item.path,
                'data-name': item.name,
                'data-size': item.size,
                'data-modified': item.modified,
                'data-is_shared': item.is_shared,
                'data-type': item.type,
            })
            // set new icon
            const new_icon = (item.is_dir ? window.icons['folder.svg'] : (await item_icon(item)).image);
            $(`.item[data-uid="${item.overwritten_uid}"]`).find('.item-icon > img').attr('src', new_icon);
            
            //sort each window
            $(`.item-container[data-path='${html_encode(item.dirpath)}' i]`).each(function(){
                sort_items(this, $(this).attr('data-sort_by'), $(this).attr('data-sort_order'))
            })            
        }
        else{
            UIItem({
                appendTo: $(`.item-container[data-path='${html_encode(item.dirpath)}' i]`),
                uid: item.uid,
                immutable: item.immutable,
                associated_app_name: item.associated_app?.name,
                path: item.path,
                icon: await item_icon(item),
                name: item.name,
                size: item.size,
                type: item.type,
                modified: item.modified,
                is_dir: item.is_dir,
                is_shared: item.is_shared,
                is_shortcut: item.is_shortcut,
                associated_app_name: item.associated_app?.name,
                shortcut_to: item.shortcut_to,
                shortcut_to_path: item.shortcut_to_path,
            });

            //sort each window
            $(`.item-container[data-path='${html_encode(item.dirpath)}' i]`).each(function(){
                sort_items(this, $(this).attr('data-sort_by'), $(this).attr('data-sort_order'))
            })
        }
    });

    // Hidden file dialog
    h += `<form name="upload-form" id="upload-form" style="display:hidden;">
            <input type="hidden" name="name" id="upload-filename" value="">
            <input type="hidden" name="path" id="upload-target-path" value="">
            <input type="file" name="file" id="upload-file-dialog" style="display: none;" multiple="multiple">
        </form>`;
    
    h += `<div class="window-container"></div>`;
    
    // Desktop
    // If desktop is not in fullpage/embedded mode, we hide it until files and directories are loaded and then fade in the UI
    // This gives a calm and smooth experience for the user
    h += `<div class="desktop item-container disable-user-select" 
                data-uid="${options.desktop_fsentry.uid}" 
                data-sort_by="${!options.desktop_fsentry.sort_by ? 'name' : options.desktop_fsentry.sort_by}" 
                data-sort_order="${!options.desktop_fsentry.sort_order ? 'asc' : options.desktop_fsentry.sort_order}" 
                data-path="${html_encode(desktop_path)}"
            >`;
    h += `</div>`;

    // Get window sidebar width
    getItem({
        key: "window_sidebar_width",
        success: async function(res){
            let value = parseInt(res.value);
            // if value is a valid number
            if(!isNaN(value) && value > 0){
                window.window_sidebar_width = value;
            }
        }
    })

    // Remove `?ref=...` from navbar URL
    if(url_query_params.has('ref')){
        window.history.pushState(null, document.title, '/');    
    }

    // update local user preferences
    const user_preferences = {
        show_hidden_files: (await puter.kv.get('user_preferences.show_hidden_files')) === 'true',
    };
    update_user_preferences(user_preferences);

    // Append to <body>
    $('body').append(h);

    // Set desktop height based on taskbar height
    $('.desktop').css('height', `calc(100vh - ${window.taskbar_height + window.toolbar_height}px)`)

    // ---------------------------------------------------------------
    // Taskbar
    // ---------------------------------------------------------------
    UITaskbar();

    const el_desktop = document.querySelector('.desktop');

    window.active_element = el_desktop;
    window.active_item_container = el_desktop;
    // --------------------------------------------------------
    // Dragster
    // Allow dragging of local files onto desktop.
    // --------------------------------------------------------
    $(el_desktop).dragster({
        enter: function (dragsterEvent, event) {
            $('.context-menu').remove();
        },
        leave: function (dragsterEvent, event) {
        },
        drop: async function (dragsterEvent, event) {
            const e = event.originalEvent;
            // no drop on item
            if($(event.target).hasClass('item') || $(event.target).parent('.item').length > 0)
                return false;
            // recursively create directories and upload files
            if(e.dataTransfer?.items?.length>0){
                upload_items(e.dataTransfer.items, desktop_path);
            }

            e.stopPropagation();
            e.preventDefault();
            return false;
        }
    });

    // --------------------------------------------------------
    // Droppable
    // --------------------------------------------------------
    $(el_desktop).droppable({
        accept: '.item',
        tolerance: "intersect",
        drop: function( event, ui ) {
            // Check if item was actually dropped on desktop and not a window
            if(mouseover_window !== undefined)
                return;
    
            // Can't drop anything but UIItems on desktop
            if(!$(ui.draggable).hasClass('item'))
                return;
    
            // Don't move an item to its current directory
            if( path.dirname($(ui.draggable).attr('data-path')) === desktop_path && !event.ctrlKey)
                return;
            
            // If ctrl is pressed and source is Trashed, cancel whole operation
            if(event.ctrlKey && path.dirname($(ui.draggable).attr('data-path')) === window.trash_path)
                return;

            // Unselect previously selected items
            $(el_desktop).children('.item-selected').removeClass('item-selected');

            const items_to_move = []
            // first item
            items_to_move.push(ui.draggable);

            // all subsequent items
            const cloned_items = document.getElementsByClassName('item-selected-clone');
            for(let i =0; i<cloned_items.length; i++){
                const source_item = document.getElementById('item-' + $(cloned_items[i]).attr('data-id'));
                if(source_item !== null)
                    items_to_move.push(source_item);
            }

            // if ctrl key is down, copy items
            if(event.ctrlKey){
                // unless source is Trash
                if(path.dirname($(ui.draggable).attr('data-path')) === window.trash_path)
                    return;

                copy_items(items_to_move, desktop_path)
            }
            // otherwise, move items
            else{
                move_items(items_to_move, desktop_path);
            }
        }
    });

    //--------------------------------------------------
    // ContextMenu
    //--------------------------------------------------
    $(el_desktop).bind("contextmenu taphold", function (event) {
        // dismiss taphold on regular devices
        if(event.type==='taphold' && !isMobile.phone && !isMobile.tablet)
            return;

        const $target = $(event.target);

        // elements that should retain native ctxmenu
        if($target.is('input') || $target.is('textarea'))
            return true

        // custom ctxmenu for all other elements
        if(event.target === el_desktop){
            event.preventDefault();
            UIContextMenu({
                items: [
                    // -------------------------------------------
                    // Sort by
                    // -------------------------------------------
                    {
                        html: i18n('sort_by'),
                        items: [
                            {
                                html: i18n('name'),
                                icon: $(el_desktop).attr('data-sort_by') === 'name' ? '✓' : '',
                                onClick: async function(){
                                    sort_items(el_desktop, 'name', $(el_desktop).attr('data-sort_order'));
                                    set_sort_by(options.desktop_fsentry.uid, 'name', $(el_desktop).attr('data-sort_order'))
                                }
                            },
                            {
                                html: i18n('date_modified'),
                                icon: $(el_desktop).attr('data-sort_by') === 'modified' ? '✓' : '',
                                onClick: async function(){
                                    sort_items(el_desktop, 'modified', $(el_desktop).attr('data-sort_order'));
                                    set_sort_by(options.desktop_fsentry.uid, 'modified', $(el_desktop).attr('data-sort_order'))
                                }
                            },
                            {
                                html: i18n('type'),
                                icon: $(el_desktop).attr('data-sort_by') === 'type' ? '✓' : '',
                                onClick: async function(){
                                    sort_items(el_desktop, 'type', $(el_desktop).attr('data-sort_order'));
                                    set_sort_by(options.desktop_fsentry.uid, 'type', $(el_desktop).attr('data-sort_order'))
                                }
                            },
                            {
                                html: i18n('size'),
                                icon: $(el_desktop).attr('data-sort_by') === 'size' ? '✓' : '',
                                onClick: async function(){
                                    sort_items(el_desktop, 'size', $(el_desktop).attr('data-sort_order'));
                                    set_sort_by(options.desktop_fsentry.uid, 'size', $(el_desktop).attr('data-sort_order'))
                                }
                            },
                            // -------------------------------------------
                            // -
                            // -------------------------------------------
                            '-',
                            {
                                html: i18n('ascending'),
                                icon: $(el_desktop).attr('data-sort_order') === 'asc' ? '✓' : '',
                                onClick: async function(){
                                    const sort_by = $(el_desktop).attr('data-sort_by')
                                    sort_items(el_desktop, sort_by, 'asc');
                                    set_sort_by(options.desktop_fsentry.uid, sort_by, 'asc')
                                }
                            },
                            {
                                html: i18n('descending'),
                                icon: $(el_desktop).attr('data-sort_order') === 'desc' ? '✓' : '',
                                onClick: async function(){
                                    const sort_by = $(el_desktop).attr('data-sort_by')
                                    sort_items(el_desktop, sort_by, 'desc');
                                    set_sort_by(options.desktop_fsentry.uid, sort_by, 'desc')
                                }
                            },
                        ]
                    },
                    // -------------------------------------------
                    // Refresh
                    // -------------------------------------------
                    {
                        html: i18n('refresh'),
                        onClick: function(){
                            refresh_item_container(el_desktop);
                        }
                    },
                    // -------------------------------------------
                    // Show/Hide hidden files
                    // -------------------------------------------
                    {
                        html: i18n('show_hidden'),
                        icon: window.user_preferences.show_hidden_files ? '✓' : '',
                        onClick: function(){
                            window.mutate_user_preferences({
                                show_hidden_files : !window.user_preferences.show_hidden_files,
                            });
                            window.show_or_hide_files(document.querySelectorAll('.item-container'));
                        }
                    },
                    // -------------------------------------------
                    // -
                    // -------------------------------------------
                    '-',
                    // -------------------------------------------
                    // New File
                    // -------------------------------------------
                    new_context_menu_item(desktop_path, el_desktop),
                    // -------------------------------------------
                    // -
                    // -------------------------------------------
                    '-',
                    // -------------------------------------------
                    // Paste
                    // -------------------------------------------
                    {
                        html: i18n('paste'),
                        disabled: clipboard.length > 0 ? false : true,
                        onClick: function(){
                            if(clipboard_op === 'copy')
                                copy_clipboard_items(desktop_path, el_desktop);
                            else if(clipboard_op === 'move')
                                move_clipboard_items(el_desktop)
                        }
                    },
                    // -------------------------------------------
                    // Undo
                    // -------------------------------------------
                    {
                        html: i18n('undo'),
                        disabled: actions_history.length > 0 ? false : true,
                        onClick: function(){
                            undo_last_action();
                        }
                    },
                    // -------------------------------------------
                    // Upload Here
                    // -------------------------------------------
                    {
                        html: i18n('upload_here'),
                        onClick: function(){
                            init_upload_using_dialog(el_desktop);
                        }
                    },
                    // -------------------------------------------
                    // -
                    // -------------------------------------------
                    '-',
                    // -------------------------------------------
                    // Change Desktop Background…
                    // -------------------------------------------
                    {
                        html: i18n('change_desktop_background'),
                        onClick: function(){
                            UIWindowDesktopBGSettings();
                        }
                    },

                ]
            });
        }
    });

    //-------------------------------------------
    // Desktop Files/Folders
    // we don't need to get the desktop items if we're in embedded or fullpage mode
    // because the items aren't visible anyway and we don't need to waste bandwidth/server resources
    //-------------------------------------------
    if(!is_embedded && !window.is_fullpage_mode){
        refresh_item_container(el_desktop, {fadeInItems: true})
        window.launch_download_from_url();
    }

    // -------------------------------------------
    // Selectable
    // Only for desktop
    // -------------------------------------------
    if(!isMobile.phone && !isMobile.tablet){
        let selected_ctrl_items = [];
        const selection = new SelectionArea({
            selectionContainerClass: '.selection-area-container',
            container: '.desktop',
            selectables: ['.desktop.item-container > .item'],
            startareas: ['.desktop'],
            boundaries: ['.desktop'],
            behaviour: {
                overlap: 'drop',
                intersect: 'touch',
                startThreshold: 10,
                scrolling: {
                    speedDivider: 10,
                    manualSpeed: 750,
                    startScrollMargins: {x: 0, y: 0}
                }
            },
            features: {
                touch: true,
                range: true,
                singleTap: {
                    allow: true,
                    intersect: 'native'
                }
            }
        });
    
        selection.on('beforestart', ({event}) => {
            selected_ctrl_items = [];
            // Returning false prevents a selection
            return $(event.target).hasClass('item-container');
        })
        .on('beforedrag', evt => {
        })
        .on('start', ({store, event}) => {
            if (!event.ctrlKey && !event.metaKey) {
                for (const el of store.stored) {
                    el.classList.remove('item-selected');
                }
        
                selection.clearSelection();
            }
        })
        .on('move', ({store: {changed: {added, removed}}, event}) => {
            for (const el of added) {
                // if ctrl or meta key is pressed and the item is already selected, then unselect it
                if((event.ctrlKey || event.metaKey) && $(el).hasClass('item-selected')){
                    el.classList.remove('item-selected');
                    selected_ctrl_items.push(el);
                }
                // otherwise select it
                else{
                    el.classList.add('item-selected');
                }
            }
        
            for (const el of removed) {
                el.classList.remove('item-selected');
                // in case this item was selected by ctrl+click before, then reselect it again
                if(selected_ctrl_items.includes(el))
                    $(el).not('.item-disabled').addClass('item-selected');
            }
        })
        .on('stop', evt => {
        });
    }
    // ----------------------------------------------------
    // User options
    // ----------------------------------------------------
    let ht = '';
    ht += `<div class="toolbar"  style="height:${window.toolbar_height}px;">`;
        // logo
        ht += `<div class="toolbar-btn toolbar-puter-logo" title="Puter" style="margin-left: 10px; margin-right: auto;"><img src="${window.icons['logo-white.svg']}" draggable="false" style="display:block; width:17px; height:17px"></div>`;
        // create account button
        ht += `<div class="toolbar-btn user-options-create-account-btn ${window.user.is_temp ? '' : 'hidden' }" style="padding:0; opacity:1;" title="Save Account">`;
            ht += `<svg style="width: 17px; height: 17px;" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="48px" height="48px" viewBox="0 0 48 48"><g transform="translate(0, 0)"><path d="M45.521,39.04L27.527,5.134c-1.021-1.948-3.427-2.699-5.375-1.679-.717,.376-1.303,.961-1.679,1.679L2.479,39.04c-.676,1.264-.635,2.791,.108,4.017,.716,1.207,2.017,1.946,3.42,1.943H41.993c1.403,.003,2.704-.736,3.42-1.943,.743-1.226,.784-2.753,.108-4.017ZM23.032,15h1.937c.565,0,1.017,.467,1,1.031l-.438,14c-.017,.54-.459,.969-1,.969h-1.062c-.54,0-.983-.429-1-.969l-.438-14c-.018-.564,.435-1.031,1-1.031Zm.968,25c-1.657,0-3-1.343-3-3s1.343-3,3-3,3,1.343,3,3-1.343,3-3,3Z" fill="#ffbb00"></path></g></svg>`;
        ht += `</div>`;

        // 'show desktop'
        if(window.is_fullpage_mode){
            ht += `<a href="/" class="show-desktop-btn toolbar-btn antialiased" target="_blank" title="Open Desktop">Open Desktop</a>`;
        }

        // refer
        if(user.referral_code){
            ht += `<div class="toolbar-btn refer-btn" title="Refer" style="background-image:url(${window.icons['gift.svg']});"></div>`;
        }

        // do not show the fullscreen button on mobile devices since it's broken
        if(!isMobile.phone){
            // fullscreen button
            ht += `<div class="toolbar-btn fullscreen-btn" title="Enter Full Screen" style="background-image:url(${window.icons['fullscreen.svg']})"></div>`;
        }

        // qr code button -- only show if not embedded
        if(!is_embedded)
            ht += `<div class="toolbar-btn qr-btn" title="QR code" style="background-image:url(${window.icons['qr.svg']})"></div>`;
        
        // user options menu
        ht += `<div class="toolbar-btn user-options-menu-btn" style="background-image:url(${window.icons['profile.svg']})">`;
            h += `<span class="user-options-menu-username">${window.user.username}</span>`;
        ht += `</div>`;
    ht += `</div>`;

    // prepend toolbar to desktop
    $(ht).insertBefore(el_desktop);

    // adjust window container to take into account the toolbar height
    $('.window-container').css('top', window.toolbar_height);

    // ---------------------------------------------
    // Run apps from insta-login URL
    // ---------------------------------------------
    if(url_query_params.has('app')){
        let url_app_name = url_query_params.get('app');
        if(url_app_name === 'explorer'){
            let predefined_path = home_path;
            if(url_query_params.has('path'))
                predefined_path =url_query_params.get('path') 
            // launch explorer
            UIWindow({
                path: predefined_path,
                title: path.basename(predefined_path),
                icon: await item_icon({is_dir: true, path: predefined_path}),
                // todo
                // uid: $(el_item).attr('data-uid'),
                is_dir: true,
                // todo
                // sort_by: $(el_item).attr('data-sort_by'),
                app: 'explorer',
            });
        }
    }
    // ---------------------------------------------
    // load from direct app URLs: /app/app-name
    // ---------------------------------------------
    else if(window.app_launched_from_url){
        let qparams = new URLSearchParams(window.location.search);      
        if(!qparams.has('c')){
            launch_app({ 
                name: app_launched_from_url,
                readURL: qparams.get('readURL'),
                maximized: qparams.get('maximized'),
                params: app_query_params ?? [],
                is_fullpage: window.is_fullpage_mode,
                window_options: {
                    stay_on_top: false,
                }
            });
        }
    }

    $(el_desktop).on('mousedown touchstart', function(e){
        // dimiss touchstart on regular devices
        if(e.type==='taphold' && !isMobile.phone && !isMobile.tablet)
            return;

        // disable pointer-events for all app iframes, this is to make sure selectable works
        $('.window-app-iframe').css('pointer-events', 'none');
        $('.window').find('.item-selected').addClass('item-blurred');
        $('.desktop').find('.item-blurred').removeClass('item-blurred');
    })

    $(el_desktop).on('click', function(e){
        // blur all windows
        $('.window-active').removeClass('window-active');
    })  

    function display_ct() {
        var x = new Date()
        var ampm = x.getHours( ) >= 12 ? ' PM' : ' AM';
        let hours = x.getHours( ) % 12;
        hours = hours ? hours : 12;
        hours=hours.toString().length==1? 0+hours.toString() : hours;
        
        var minutes=x.getMinutes().toString()
        minutes=minutes.length==1 ? 0+minutes : minutes;
        
        var seconds=x.getSeconds().toString()
        seconds=seconds.length==1 ? 0+seconds : seconds;
        
        var month=(x.getMonth() +1).toString();
        month=month.length==1 ? 0+month : month;
        
        var dt=x.getDate().toString();
        dt=dt.length==1 ? 0+dt : dt;
        
        var x1=month + "/" + dt + "/" + x.getFullYear(); 
        x1 = x1 + " - " +  hours + ":" +  minutes + ":" +  seconds + " " + ampm;
        $('#clock').html(x1);
        $('#clock').css('line-height', taskbar_height + 'px');
    }

    setInterval(display_ct, 1000);

    // show referral notice window
    if(window.show_referral_notice && !user.email_confirmed){
        getItem({
            key: "shown_referral_notice",
            success: async function(res){
                if(!res){
                    setTimeout(() => {
                        UIWindowClaimReferral();
                    }, 1000);
                    setItem({
                        key: "shown_referral_notice",
                        value: true,
                    })
                }
            }
        })
    }

}

$(document).on('contextmenu taphold', '.taskbar', function(event){
    // dismiss taphold on regular devices
    if(event.type==='taphold' && !isMobile.phone && !isMobile.tablet)
        return;

    event.preventDefault();
    event.stopPropagation();
    UIContextMenu({
        parent_element: $('.taskbar'),
        items: [
            //--------------------------------------------------
            // Show open windows
            //--------------------------------------------------
            {
                html: "Show open windows",
                onClick: function(){
                    $(`.window`).showWindow();
                }
            },
            //--------------------------------------------------
            // Show the desktop
            //--------------------------------------------------
            {
                html: "Show the desktop",
                onClick: function(){
                    $(`.window`).hideWindow();
                }
            }
        ]
    });
    return false;
})

$(document).on('click', '.qr-btn', async function (e) {
    UIWindowQR();
})

$(document).on('click', '.user-options-menu-btn', async function(e){
    const pos = this.getBoundingClientRect();
    if($('.context-menu[data-id="user-options-menu"]').length > 0)
        return;

    let items = [];
    let parent_element = this;
    //--------------------------------------------------
    // Save Session
    //--------------------------------------------------
    if(window.user.is_temp){
        items.push(            
            {
                html: i18n('save_session'),
                icon: `<svg style="margin-bottom: -4px; width: 16px; height: 16px;" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="48px" height="48px" viewBox="0 0 48 48"><g transform="translate(0, 0)"><path d="M45.521,39.04L27.527,5.134c-1.021-1.948-3.427-2.699-5.375-1.679-.717,.376-1.303,.961-1.679,1.679L2.479,39.04c-.676,1.264-.635,2.791,.108,4.017,.716,1.207,2.017,1.946,3.42,1.943H41.993c1.403,.003,2.704-.736,3.42-1.943,.743-1.226,.784-2.753,.108-4.017ZM23.032,15h1.937c.565,0,1.017,.467,1,1.031l-.438,14c-.017,.54-.459,.969-1,.969h-1.062c-.54,0-.983-.429-1-.969l-.438-14c-.018-.564,.435-1.031,1-1.031Zm.968,25c-1.657,0-3-1.343-3-3s1.343-3,3-3,3,1.343,3,3-1.343,3-3,3Z" fill="#ffbb00"></path></g></svg>`,
                icon_active: `<svg style="margin-bottom: -4px; width: 16px; height: 16px;" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="48px" height="48px" viewBox="0 0 48 48"><g transform="translate(0, 0)"><path d="M45.521,39.04L27.527,5.134c-1.021-1.948-3.427-2.699-5.375-1.679-.717,.376-1.303,.961-1.679,1.679L2.479,39.04c-.676,1.264-.635,2.791,.108,4.017,.716,1.207,2.017,1.946,3.42,1.943H41.993c1.403,.003,2.704-.736,3.42-1.943,.743-1.226,.784-2.753,.108-4.017ZM23.032,15h1.937c.565,0,1.017,.467,1,1.031l-.438,14c-.017,.54-.459,.969-1,.969h-1.062c-.54,0-.983-.429-1-.969l-.438-14c-.018-.564,.435-1.031,1-1.031Zm.968,25c-1.657,0-3-1.343-3-3s1.343-3,3-3,3,1.343,3,3-1.343,3-3,3Z" fill="#ffbb00"></path></g></svg>`,
                onClick: async function(){
                    UIWindowSaveAccount({
                        send_confirmation_code: false,
                        default_username: window.user.username
                    });
                }
            },
        )
        // -------------------------------------------
        // -
        // -------------------------------------------
        items.push('-')
    }

    // -------------------------------------------
    // Logged in users
    // -------------------------------------------
    if(window.logged_in_users.length > 0){
        let users_arr = window.logged_in_users;

        // bring logged in user's item to top
        users_arr.sort(function(x,y){ return x.uuid === window.user.uuid ? -1 : y.uuid == window.user.uuid ? 1 : 0; });

        // create menu items
        users_arr.forEach(l_user => {
            items.push(            
                {
                    html: l_user.username,
                    icon: l_user.username === user.username ? '✓' : '',
                    onClick: async function(val){
                        // don't reload everything if clicked on already-logged-in user
                        if(l_user.username === user.username)
                            return;
                        // update auth data
                        update_auth_data(l_user.auth_token, l_user);
                        // refresh
                        location.reload();
                    }
    
                },
            )
        });
        // -------------------------------------------
        // -
        // -------------------------------------------
        items.push('-')

        items.push(            
            {
                html: i18n('add_existing_account'),
                // icon: l_user.username === user.username ? '✓' : '',
                onClick: async function(val){
                    await UIWindowLogin({
                        reload_on_success: true,
                        send_confirmation_code: false,
                        window_options:{
                            has_head: true
                        }
                    });
                }
            },
        )                

        // -------------------------------------------
        // -
        // -------------------------------------------
        items.push('-')

    }

    // -------------------------------------------
    // Load avaialble languages
    // -------------------------------------------
    const supoprtedLanguagesItems = ListSupportedLanugages().map(lang => {
        return {
            html: lang.name,
            icon: window.locale === lang.code ? '✓' : '',
            onClick: async function(){
                ChangeLanguage(lang.code);
            }
        }
    });

    UIContextMenu({
        id: 'user-options-menu',
        parent_element: parent_element,
        position: {top: pos.top + 28, left: pos.left + pos.width - 15},
        items: [
            ...items,
            //--------------------------------------------------
            // My Websites
            //--------------------------------------------------
            {
                html: i18n('my_websites'),
                onClick: async function(){
                    UIWindowMyWebsites();
                }
            },
            //--------------------------------------------------
            // Change Username
            //--------------------------------------------------
            {
                html: i18n('change_username'),
                onClick: async function(){
                    UIWindowChangeUsername();
                }
            },

            //--------------------------------------------------
            // Change Password
            //--------------------------------------------------
            {
                html: i18n('change_password'),
                onClick: async function(){
                    UIWindowChangePassword();
                }
            },

            //--------------------------------------------------
            // Change Language
            //--------------------------------------------------
            {
                html: i18n('change_language'),
                items: supoprtedLanguagesItems
            },
            //--------------------------------------------------
            // Contact Us
            //--------------------------------------------------
            {
                html: i18n('contact_us'),
                onClick: async function(){
                    UIWindowFeedback();
                }
            },
            // -------------------------------------------
            // -
            // -------------------------------------------
            '-',

            //--------------------------------------------------
            // Log Out
            //--------------------------------------------------
            {
                html: i18n('log_out'),
                onClick: async function(){
                    // see if there are any open windows, if yes notify user
                    if($('.window-app').length > 0){
                        const alert_resp = await UIAlert({
                            message: `<p>You have open apps. Are you sure you want to log out?</p>`,
                            buttons:[
                                {
                                    label: 'Close Windows and Log Out',
                                    type: 'primary',
                                },
                                {
                                    label: 'Cancel'
                                },
                            ]
                        })
                        if(alert_resp === 'Close Windows and Log Out')
                            logout();
                    }
                    // no open windows
                    else
                        logout();
                }
            },
        ]
    });    
})

$(document).on('click', '.fullscreen-btn', async function (e) {
    if(!is_fullscreen()) {
        var elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) { /* Safari */
            elem.webkitRequestFullscreen();
        } else if (elem.mozRequestFullScreen) { /* moz */
            elem.mozRequestFullScreen();
        } else if (elem.msRequestFullscreen) { /* IE11 */
            elem.msRequestFullscreen();
        }
    }
    else{
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }  
    }    
})

$(document).on('click', '.close-launch-popover', function(){
    $(".launch-popover").closest('.popover').fadeOut(200, function(){
        $(".launch-popover").closest('.popover').remove();
    });
});

$(document).on('click', '.toolbar-puter-logo', function(){
    // launch the about app
    launch_app({name: 'about', window_options:{
        single_instance: true,
    }});
})

$(document).on('click', '.user-options-create-account-btn', async function(e){
    UIWindowSaveAccount({
        send_confirmation_code: false,
        default_username: window.user.username,
    });
})

$(document).on('click', '.refer-btn', async function(e){
    UIWindowRefer();
})

$(document).on('click', '.start-app', async function(e){
    launch_app({
        name: $(this).attr('data-app-name')
    })
    // close popovers
    $(".popover").fadeOut(200, function(){
        $(".popover").remove();
    });
})

$(document).on('click', '.user-options-login-btn', async function(e){
    const alert_resp = await UIAlert({
        message: `<strong>Save session before exiting!</strong><p>You are in a temporary session and logging into another account will erase all data in your current session.</p>`,
        buttons:[
            {
                label: 'Save session',
                value: 'save-session',
                type: 'primary',
            },
            {
                label: 'Log into another account anyway',
                value: 'login',
            },
            {
                label: 'Cancel'
            },
        ]
    })
    
    if(alert_resp === 'save-session'){
        let saved = await UIWindowSaveAccount({
            send_confirmation_code: false,
        });
        if(saved)
            UIWindowLogin({show_signup_button: false, reload_on_success: true});
    }else if (alert_resp === 'login'){
        UIWindowLogin({
            show_signup_button: false, 
            reload_on_success: true,
            window_options: {
                backdrop: true,
                close_on_backdrop_click: false,
            }
        });
    }
})

$(document).on('click mousedown', '.launch-search, .launch-popover', function(e){
    $(this).focus();
    e.stopPropagation();
    e.preventDefault();
    // don't let click bubble up to window
    e.stopImmediatePropagation();
})

$(document).on('focus', '.launch-search', function(e){
    // remove all selected items in start menu
    $('.launch-app-selected').removeClass('launch-app-selected');
    // scroll popover to top
    $('.launch-popover').scrollTop(0);
})

$(document).on('change keyup keypress keydown paste', '.launch-search', function(e){
    // search launch_apps.recommended for query
    const query = $(this).val().toLowerCase();
    if(query === ''){
        $('.launch-search-clear').hide();
        $(`.start-app-card`).show();
        $('.launch-apps-recent').show();
        $('.start-section-heading').show();
    }else{
        $('.launch-apps-recent').hide();
        $('.start-section-heading').hide();
        $('.launch-search-clear').show();
        launch_apps.recommended.forEach((app)=>{
            if(app.title.toLowerCase().includes(query.toLowerCase())){
                $(`.start-app-card[data-name="${app.name}"]`).show();
            }else{
                $(`.start-app-card[data-name="${app.name}"]`).hide();
            }
        })
    }
})

$(document).on('click', '.launch-search-clear', function(e){
    $('.launch-search').val('');
    $('.launch-search').trigger('change');
    $('.launch-search').focus();
})

document.addEventListener('fullscreenchange', (event) => {
    // document.fullscreenElement will point to the element that
    // is in fullscreen mode if there is one. If there isn't one,
    // the value of the property is null.
    if (document.fullscreenElement) {
        $('.fullscreen-btn').css('background-image', `url(${window.icons['shrink.svg']})`);
        $('.fullscreen-btn').attr('title', 'Exit Full Screen');
        $('#clock').show();
    } else {
        $('.fullscreen-btn').css('background-image', `url(${window.icons['fullscreen.svg']})`);
        $('.fullscreen-btn').attr('title', 'Enter Full Screen');
        $('#clock').hide();
    }
})

window.set_desktop_background = function(options){
    if(options.fit){
        let fit = options.fit;
        if(fit === 'cover' || fit === 'contain'){
            $('body').css('background-size', fit);
            $('body').css('background-repeat', `no-repeat`);
            $('body').css('background-position', `center center`);
        }
        else if(fit === 'center'){
            $('body').css('background-size', 'auto');
            $('body').css('background-repeat', `no-repeat`);
            $('body').css('background-position', `center center`);
        }

        else if( fit === 'repeat'){
            $('body').css('background-size', `auto`);
            $('body').css('background-repeat', `repeat`);
        }
        window.desktop_bg_fit = fit;
    }

    if(options.url){
        $('body').css('background-image', `url(${options.url})`);
        window.desktop_bg_url = options.url;
        window.desktop_bg_color = undefined;
    }
    else if(options.color){
        $('body').css({
            'background-image': `none`,
            'background-color': options.color,
        });
        window.desktop_bg_color = options.color;
        window.desktop_bg_url = undefined;
    }
}

window.update_taskbar = function(){
    let items = []
    $('.taskbar-item-sortable[data-keep-in-taskbar="true"]').each(function(index){
        items.push({
            name: $( this ).attr('data-app'),
            type: 'app',
        })
    })

    // update taskbar in the server-side
    $.ajax({
        url: api_origin + "/update-taskbar-items",
        type: 'POST',
        data: JSON.stringify({
            items: items,
        }),
        async: true,
        contentType: "application/json",
        headers: {
            "Authorization": "Bearer "+auth_token
        },
    })
}

window.remove_taskbar_item = function(item){
    $(item).find('*').fadeOut(100, function(){});

    $(item).animate({width: 0}, 200, function(){
        $(item).remove();
    })
}

window.enter_fullpage_mode = (el_window)=>{
    $('.taskbar').hide();
    $(el_window).find('.window-head').hide();
    $('body').addClass('fullpage-mode');
    $(el_window).css({
        width: '100%',
        height: '100%',
        top: toolbar_height + 'px',
        left: 0,
        'border-radius': 0,
    });
}

window.exit_fullpage_mode = (el_window)=>{
    $('body').removeClass('fullpage-mode');
    window.taskbar_height = window.default_taskbar_height;
    $('.taskbar').css('height', window.taskbar_height);
    $('.taskbar').show();
    refresh_item_container($('.desktop.item-container'), {fadeInItems: true});
    $(el_window).removeAttr('data-is_fullpage');
    if(el_window){
        reset_window_size_and_position(el_window)
        $(el_window).find('.window-head').show();
    }

    // reset dektop height to take into account the taskbar height
    $('.desktop').css('height', `calc(100vh - ${window.taskbar_height + window.toolbar_height}px)`);

    // hide the 'Show Desktop' button in toolbar
    $('.show-desktop-btn').hide();

    // refresh desktop background
    refresh_desktop_background();
}

window.reset_window_size_and_position = (el_window)=>{
    $(el_window).css({
        width: 680,
        height: 380,
        'border-radius': window_border_radius,
        top: 'calc(50% - 190px)',
        left: 'calc(50% - 340px)',
    });
}

export default UIDesktop;