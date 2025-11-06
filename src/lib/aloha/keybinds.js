/* keybinds.js is part of the Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor. 
 * Copyright (c) 2010-2012 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php 
 * 
 * Aloha Editor is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or any later version.
 *
 * Aloha Editor is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA.
 * 
 * As an additional permission to the GNU GPL version 2, you may distribute
 * non-source (e.g., minimized or compacted) forms of the Aloha-Editor
 * source code without the copy of the GNU GPL normally required,
 * provided you include this license notice and a URL through which
 * recipients can access the Corresponding Source.
 */
/**
 * A simple keybind object, which groups modifiers and a keys together.
 * All modifiers and keys have to be pressed at the same time to be valid.
 * @typedef {object} Keybind
 * @property {Set.<string>} modifiers The modifier-keys required for this keybind.
 * @property {Set.<string>} keys The keys required for this keybind
 */
define(['jquery',], /** @param {JQueryStatic} $ */ function ($) {
    'use strict';

    /*
     * Supported default modifier keys
     * https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values
     */
    var MOD_ALT = 'Alt';
    var MOD_ALT_GRAPH = 'AltGraph';
    var MOD_CONTROL = 'Control';
    var MOD_META = 'Meta';
    var MOD_SHIFT = 'Shift';
    var MOD_HYPER = 'Hyper';
    var MOD_SUPER = 'Super';
    /*
     * Technically supported, but shouldn't be used modifier keys
     */
    var MOD_CAPS_LOCK = 'CapsLock';
    var MOD_FN = 'Fn';
    var MOD_FN_LOCK = 'FnLock';
    var MOD_NUM_LOCK = 'NumLock';
    var MOD_SCROLL_LOCK = 'ScrollLock';
    var MOD_SYMBOL = 'Symbol';
    var MOD_SYMBOL_LOCK = 'SymbolLock';
    /*
     * Special modifiers for convenience
     */
    var MOD_CONTROL_SHORT = 'Ctrl';
    var MOD_CONTROL_OR_META = 'ControlOrMeta';
    var MOD_CONTROL_SHORT_OR_META = 'CtrlOrMeta';
    /*
     * Special keys which always need a mapping, as the one from the spec/event are
     * not properly specifyable from a keybind-string.
     */
    var KEY_SPACE = 'Space';
    /**
     * Mapping of lowercased modifiers to the actual modifier
     * @type {Object.<string, string>}
     */
    var MOD_MAP = {};
    var MOD_SET = new Set([
        MOD_ALT,
        MOD_ALT_GRAPH,
        MOD_CONTROL,
        MOD_META,
        MOD_SHIFT,
        MOD_HYPER,
        MOD_SUPER,
        MOD_CAPS_LOCK,
        MOD_FN,
        MOD_FN_LOCK,
        MOD_NUM_LOCK,
        MOD_SCROLL_LOCK,
        MOD_SYMBOL,
        MOD_SYMBOL_LOCK,
    ]);

    // Maps have to be filled like this, because of require-js build
    MOD_MAP[MOD_ALT.toLowerCase()] = MOD_ALT;
    MOD_MAP[MOD_ALT_GRAPH.toLowerCase()] = MOD_ALT_GRAPH;
    MOD_MAP[MOD_CONTROL.toLowerCase()] = MOD_CONTROL;
    MOD_MAP[MOD_META.toLowerCase()] = MOD_META;
    MOD_MAP[MOD_SHIFT.toLowerCase()] = MOD_SHIFT;
    MOD_MAP[MOD_HYPER.toLowerCase()] = MOD_HYPER;
    MOD_MAP[MOD_SUPER.toLowerCase()] = MOD_SUPER;
    MOD_MAP[MOD_CONTROL_SHORT.toLowerCase()] = MOD_CONTROL;
    MOD_MAP[MOD_CONTROL_OR_META.toLowerCase()] = MOD_CONTROL_OR_META;
    MOD_MAP[MOD_CONTROL_SHORT_OR_META.toLowerCase()] = MOD_CONTROL_OR_META;
    MOD_MAP[MOD_CAPS_LOCK.toLowerCase()] = MOD_CAPS_LOCK;
    MOD_MAP[MOD_FN.toLowerCase()] = MOD_FN;
    MOD_MAP[MOD_FN_LOCK.toLowerCase()] = MOD_FN_LOCK;
    MOD_MAP[MOD_NUM_LOCK.toLowerCase()] = MOD_NUM_LOCK;
    MOD_MAP[MOD_SCROLL_LOCK.toLowerCase()] = MOD_SCROLL_LOCK;
    MOD_MAP[MOD_SYMBOL.toLowerCase()] = MOD_SYMBOL;
    MOD_MAP[MOD_SYMBOL_LOCK.toLowerCase()] = MOD_SYMBOL_LOCK;

    var KEY_MAP = {};
    // Lowercase all chars A-Z -> a-z
    for (let i = 'a'.charCodeAt(0); i < 'z'.charCodeAt(0); i++) {
        KEY_MAP[String.fromCharCode(i - 32)] = String.fromCharCode(i);
    }
    KEY_MAP[' '] = 'space'; // Has to be in lower-case, since we do all checks in it

    /**
     * Helper function to create a keybind object directly from an array.
     * Usually used instead of the {@link parseKeybinds} function.
     * 
     * @example
     * // Both are the same, but the latter one uses the modifier as constant
     * Keybinds.parseKeybinds('CtrlOrMeta+f');
     * Keybinds.asKeybind([Keybinds.MOD_CONTROL_OR_META, 'f']);
     * 
     * @param {Array.<string>} keys Combination of Modifiers and keys to be pressed for a keybind
     * @returns {Keybind} A keybind object which properly splits modifiers and regular keys.
     */
    function asKeybind(keys) {
        /** @type {Keybind} */
        const kb = {
            modifiers: new Set(),
            keys: new Set(),
        };

        for (let idx = 0; idx < keys.length; idx++) {
            const lc = keys[idx].toLowerCase().trim();
            const mod = MOD_MAP[lc];

            if (mod) {
                kb.modifiers.add(mod);
            } else {
                kb.keys.add(keys[idx].trim());
            }
        }

        return kb;
    }

    /**
     * Parses a keybind-string into keybind objects.
     * Note that sequences are not supported, and expects all
     * entries to be pressed at the same time.
     * If a sequence were to be passed, it'd return the sequence as a single key.
     * 
     * Modifiers are always normalized to the Keys specified in the Spec:
     * https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values
     * 
     * Keys are being left as is, and require to be accurate to work properly.
     * This "parser" will not validate the validity of your keys!
     * 
     * @example <caption>Simple keybinds</caption>
     * parseKeybinds("Ctrl+B")
     * // > [{ modifiers: ["Control"], keys: ["B"] }]
     * parseKeybinds("Alt+Shift+J+K")
     * // > [{ modifiers: ["Alt", "Shift"], keys: ["J", "K"] }]
     * 
     * @example <caption>Multiple keybinds</caption>
     * parseKeybinds("Ctrl+1, Ctrl+2")
     * // > [{ modifiers: ["Control"], keys: "1" }, { modifiers: ["Control"], keys: ["2"] }]
     * 
     * @example <caption>Invalid keybinds</caption>
     * parseKeybinds("Ctrl+1 A")
     * // > [{ modifiers: ["Control"], keys: ["1 A"] }]
     * // You need to specify both a modifier and a key
     * parseKeybinds("A") // > false
     * parseKeybinds("Shift") // > false
     * // And you need to specify at least one keybind
     * parseKeybinds("") // > false
     *
     * @param {string} keybindStr The keybind-string.
     * @returns {Array.<Keybind>|false} An array of keybinds, or false if the string is invalid.
     * @see {@link asKeybind}
     */
    function parseKeybinds(keybindStr) {
        const entries = keybindStr.split(',');
        const out = [];

        for (let i = 0; i < entries.length; i++) {
            const kb = asKeybind(entries[i].split(/\s*[+]\s*/));

            // Only allow keybinds which actually have a key and a modifier.
            if (kb.keys.size > 0 && kb.modifiers.size > 0) {
                out.push(kb);
            }
        }

        return out.length > 0 ? out : false;
    }

    /**
     * A map which keeps track of which key index a keybind is.
     * Only needed for multi key keybinds.
     * @type {Map.<string, Set.<string>>}
     */
    var BINDING_STATE = new Map();
    var BINDING_SPACE = 'aloha.keybind';
    var BINDING_COUNTER = 0;

    /**
     * @param {Event} event The event to cancel
     */
    function cancelEvent(event) {
        if (typeof event.stopImmediatePropagation === 'function') {
            event.stopImmediatePropagation();
        }
        if (typeof event.stopPropagation === 'function') {
            event.stopPropagation();
        }
        if (typeof event.preventDefault === 'function') {
            event.preventDefault();
        }
    }

    /**
     * Binds one or more keybind to the element to trigger a callback function.
     *
     * @param {JQuery|Window|DocumentHTMLElement} element The element to bind the keybind to.
     * @param {string} name The name/id of the keybind, as you can bind multiple keybinds to a element.
     * @param {Keybind | Array.<Keybind>} keybinds The bindings to listen for.
     * @param {function(KeyboardEvent)} callback The function to call when one of the keybinds has been triggered.
     * @returns {function():void} A function to remove the bindings from the element again.
     */
    function bind(element, name, keybinds, callback) {
        const eventNamespace = BINDING_SPACE + '.' + name;
        const stateNamespace = BINDING_COUNTER + '.' + name;
        BINDING_COUNTER++;

        if (!Array.isArray(keybinds)) {
            keybinds = [keybinds];
        }

        $(element).on('keydown.' + eventNamespace, /** @param {JQuery.Event} jqEvent */ function (jqEvent) {
            /** @type {KeyboardEvent} */
            const event = jqEvent.originalEvent;

            if (event.defaultPrevented) {
                return;
            }

            const key = KEY_MAP[event.key] || event.key;

            // Ignore events for single modifier keys
            if (MOD_SET.has(key)) {
                return;
            }

            /** @type {Keybind} */
            let singleKeybind;
            /** @type {string} */
            let kbId;

            for (let i = 0; i < keybinds.length; i++) {
                singleKeybind = keybinds[i];
                kbId = stateNamespace + '.' + i;

                let state = BINDING_STATE.get(kbId);
                if (state == null) {
                    state = new Set();
                    BINDING_STATE.set(kbId, state);
                }

                // Check for all modifiers first. Changing modifiers inbetween
                // calls will not reset the state.
                let modifiersValid = true;

                for (const mod of singleKeybind.modifiers) {
                    if (mod === MOD_CONTROL_OR_META) {
                        if (!event.getModifierState(MOD_CONTROL) && !event.getModifierState(MOD_META)) {
                            modifiersValid = false;
                            break;
                        }
                    } else if (!event.getModifierState(mod)) {
                        modifiersValid = false;
                        break;
                    }
                }

                if (!modifiersValid) {
                    continue;
                }

                // If the incorrect key is pressed, reset state
                if (!singleKeybind.keys.has(key)) {
                    continue;
                }

                // If the correct key is pressed, then we have to cancel the event,
                // as to not trigger any other keybinds.
                cancelEvent(event);

                // Ignore repeating events
                if (event.repeat) {
                    continue;
                }

                // Add the key top the state
                state.add(key);

                // If this is the last key to be pressed
                if (state.size === singleKeybind.keys.size) {
                    state.clear();
                    callback(event);
                    break
                }
            }
        });

        $(element).on('keyup.' + eventNamespace, /** @param {JQuery.Event} jqEvent */ function (jqEvent) {
            /** @type {KeyboardEvent} */
            const event = jqEvent.originalEvent;
            const key = KEY_MAP[event.key] || event.key;

            if (MOD_SET.has(key)) {
                return;
            }

            /** @type {string} */
            let kbId;

            for (let i = 0; i < keybinds.length; i++) {
                kbId = stateNamespace + '.' + i;

                const state = BINDING_STATE.get(kbId);
                if (state == null) {
                    continue;
                }

                state.delete(key);
            }
        });

        return function () {
            $(element).off('keydown.' + eventNamespace);
            $(element).off('keyup.' + eventNamespace);

            for (let i = 0; i < keybinds.length; i++) {
                BINDING_STATE.delete(stateNamespace + '.' + i);
            }
        }
    }

    return {
        // Constants
        MOD_ALT: MOD_ALT,
        MOD_ALT_GRAPH: MOD_ALT_GRAPH,
        MOD_CONTROL: MOD_CONTROL,
        MOD_META: MOD_META,
        MOD_SHIFT: MOD_SHIFT,
        MOD_HYPER: MOD_HYPER,
        MOD_SUPER: MOD_SUPER,
        MOD_CONTROL_SHORT: MOD_CONTROL_SHORT,
        MOD_CONTROL_OR_META: MOD_CONTROL_OR_META,
        MOD_CONTROL_SHORT_OR_META: MOD_CONTROL_SHORT_OR_META,
        MOD_CAPS_LOCK: MOD_CAPS_LOCK,
        MOD_FN: MOD_FN,
        MOD_FN_LOCK: MOD_FN_LOCK,
        MOD_NUM_LOCK: MOD_NUM_LOCK,
        MOD_SCROLL_LOCK: MOD_SCROLL_LOCK,
        MOD_SYMBOL: MOD_SYMBOL,
        MOD_SYMBOL_LOCK: MOD_SYMBOL_LOCK,

        MOD_MAP: MOD_MAP,
        KEY_SPACE: KEY_SPACE,

        // Functions
        parseKeybinds: parseKeybinds,
        bind: bind,
        asKeybind: asKeybind,
    };
});