define([
    'jquery',
    'ui/component'
], function (
    $,
    Component
) {
    'use strict';

    var PARAM_CACHE_BUSTING = 'aloha-iframe-id';

    // Events sent from this frame to the other
    var EVENT_INIT = 'aloha.iframe-component.init';
    var EVENT_UPDATE_VALUE = 'aloha.iframe-component.update-value';
    var EVENT_UPDATE_OPTIONS = 'aloha.iframe-component.update-options';
    var EVENT_DISABLED = 'aloha.iframe-component.disabled';

    // Receivable events
    var EVENT_WINDOW_SIZE = 'aloha.iframe-component.size';
    var EVENT_CHANGE = 'aloha.iframe-component.change';
    var EVENT_TOUCH = 'aloha.iframe-component.touch';

    var IFrameComponent = Component.extend({
        /** @type {string} The URL to the IFrame which should be embedded. */
        url: '',

        /** @type {*} The current value of this control. */
        value: null,

        /** @type {*} The options which will be passed to the iframe init function. */
        options: null,

        // Internal

        _$iframeElement: null,
        _natIframe: null,

        init: function () {
            this.element = $('<div>', {
                class: 'ui-widget aloha-iframe-component',
            });
            this._recreateIframe();
        },

        _recreateIframe: function () {
            if (this._$iframeElement) {
                this._$iframeElement.remove();
                this._$iframeElement = null;
            }

            // We need a random ID which we use as cache busting.
            // Otherwise changes may never be properly loaded.
            const randomId = Math.random().toString(36).substring(2, 7);
            let urlToLoad;

            try {
                // Try to handle the URL nice and add the hash as param properly.
                const parsedUrl = new URL(this.url);
                parsedUrl.searchParams.append(PARAM_CACHE_BUSTING, randomId);
                urlToLoad = parsedUrl.toString();
            } catch (ignored) {
                // Hacky way to add it to the params
                urlToLoad = this.url;
                urlToLoad += urlToLoad.includes('?') ? '&' : '?';
                urlToLoad += PARAM_CACHE_BUSTING + '=' + randomId;
            }

            this._$iframeElement = $('<iframe>', {
                class: 'aloha-iframe-element',
                src: urlToLoad,
                attr: {
                    'data-frame-id': randomId,
                },
            }).appendTo(this.element);
            this._natIframe = this._$iframeElement[0];
            var _this = this;

            this._natIframe.addEventListener('load', function () {
                var iframeWindow = _this._natIframe.contentWindow;

                // Add event listeners for change
                iframeWindow.addEventListener('message', function (event) {
                    if (event.data == null || typeof event.data !== 'object') {
                        return;
                    }

                    switch (event.data.eventName) {
                        case EVENT_CHANGE:
                            _this._iframeChange(event.data.value);
                            break;
                        case EVENT_TOUCH:
                            _this._iframeTouch();
                            break
                        case EVENT_WINDOW_SIZE:
                            _this._iframeSize(event.data.value);
                            break;
                    }
                });

                // Initialize the component with all required data
                iframeWindow.postMessage({
                    eventName: EVENT_INIT,
                    value: {
                        value: _this.value,
                        disabled: _this.disabled,
                        options: _this.options,
                        size: {
                            width: _this._$iframeElement.width(),
                            height: _this._$iframeElement.height(),
                        },
                    },
                });
            });
        },

        _iframeTouch: function () {
            this.triggerTouchNotification();
        },
        _iframeChange: function (value) {
            this.value = value;
            this.triggerChangeNotification();
        },
        _iframeSize: function (value) {
            if (value == null || typeof value !== 'object') {
                return;
            }

            if (typeof value.width === 'number' && !Number.isNaN(value.width)) {
                this._$iframeElement.width(value.width);
            }
            if (typeof value.height === 'number' && !Number.isNaN(value.height)) {
                this._$iframeElement.height(value.height);
            }
        },

        enable: function () {
            this._super();
            if (this._natIframe) {
                this._natIframe.contentWindow.postMessage({
                    eventName: EVENT_DISABLED,
                    value: this.disabled,
                });
            }
        },
        disable: function () {
            this._super();
            if (this._natIframe) {
                this._natIframe.contentWindow.postMessage({
                    eventName: EVENT_DISABLED,
                    value: this.disabled,
                });
            }
        },
        getValue: function () {
            return this.value;
        },
        setValue: function (value) {
            this.value = value;
            if (this._natIframe) {
                this._natIframe.contentWindow.postMessage({
                    eventName: EVENT_UPDATE_VALUE,
                    value: this.value,
                });
            }
        },

        updateOptions: function (options) {
            this.options = options;
            if (this._natIframe) {
                this._natIframe.contentWindow.postMessage({
                    eventName: EVENT_UPDATE_OPTIONS,
                    value: this.options,
                });
            }
        },
        updateUrl: function (url) {
            // No need to update the iframe url if it's the same.
            if (url === this.url) {
                return;
            }
            this.url = url;
            this._recreateIframe();
        },
    });

    // Static properties
    Object.assign(IFrameComponent, {
        EVENT_INIT: EVENT_INIT,
        EVENT_UPDATE_VALUE: EVENT_UPDATE_VALUE,
        EVENT_UPDATE_OPTIONS: EVENT_UPDATE_OPTIONS,
        EVENT_DISABLED: EVENT_DISABLED,
        EVENT_WINDOW_SIZE: EVENT_WINDOW_SIZE,
        EVENT_CHANGE: EVENT_CHANGE,
        EVENT_TOUCH: EVENT_TOUCH,
    });

    return IFrameComponent;
});
