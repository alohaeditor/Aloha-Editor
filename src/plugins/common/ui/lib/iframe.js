define([
    'jquery',
    'ui/component'
], function (
    $,
    Component
) {
    'use strict';

    var PARAM_FRAME_ID = 'aloha-iframe-id';

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
        _messageHandler: null,
        _currentOrigin: null,
        _urlToLoad: null,
        _frameId: null,

        init: function () {
            this.element = $('<div>', {
                class: 'ui-widget aloha-iframe-component',
            });

            var _this = this;
            var msgHandler = function (event) {
                // Ignore invalid messages from a different origin
                if (event.origin !== _this._currentOrigin) {
                    return;
                }

                // Validate it's even a message meant for this component
                if (event.data == null || typeof event.data !== 'object' || event.data.id !== _this._frameId) {
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
            };
            this._messageHandler = msgHandler;

            // Add event listeners for change
            window.addEventListener('message', msgHandler);

            this._setupUrl();
            this._recreateIframe();
        },

        _setupUrl: function () {
            // We need a random ID which we use as cache busting.
            // Otherwise changes may never be properly loaded.
            this._frameId = Math.random().toString(36).substring(2, 7);

            try {
                // Try to handle the URL nice and add the hash as param properly.
                const parsedUrl = new URL(this.url);
                this._currentOrigin = parsedUrl.origin;
                parsedUrl.searchParams.append(PARAM_FRAME_ID, this._frameId);
                this._urlToLoad = parsedUrl.toString();
            } catch (ignored) {
                this._urlToLoad = null;
                console.warn('Supplied IFrame URL could not be parsed, and is therefore ignored!', newUrl);
            }
        },

        _recreateIframe: function () {
            if (this._$iframeElement) {
                this._$iframeElement.remove();
                this._$iframeElement = null;
            }

            if (!this._urlToLoad) {
                return;
            }

            this._$iframeElement = $('<iframe>', {
                class: 'aloha-iframe-element',
                src: this._urlToLoad,
                attr: {
                    'data-frame-id': this._frameId,
                },
            }).appendTo(this.element);
            this._natIframe = this._$iframeElement[0];
            var _this = this;

            this._natIframe.addEventListener('load', function () {
                _this.onFrameLoad(_this._natIframe);

                // Initialize the component with all required data
                _this._sendMessage({
                    eventName: EVENT_INIT,
                    value: {
                        id: _this._frameId,
                        value: _this.value,
                        disabled: _this.disabled,
                        options: _this.options,
                        size: {
                            width: _this._$iframeElement.width(),
                            height: _this._$iframeElement.height(),
                        },
                    },
                });

                _this.onFrameInit(_this._natIframe);
            });
        },
        _sendMessage: function(msg) {
            if (this._natIframe) {
                this._natIframe.contentWindow.postMessage(msg, this._currentOrigin);
            }
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

        onFrameLoad: function (iframeElement) { },
        onFrameInit: function (iframeElement) { },

        destroy: function () {
            if (this._messageHandler != null) {
                window.removeEventListener('message', this._messageHandler);
                this._messageHandler = null;
            }
            this._super();
        },

        enable: function () {
            this._super();
            this._sendMessage({
                eventName: EVENT_DISABLED,
                id: this._frameId,
                value: this.disabled,
            });
        },
        disable: function () {
            this._super();
            this._sendMessage({
                eventName: EVENT_DISABLED,
                id: this._frameId,
                value: this.disabled,
            });
        },
        getValue: function () {
            return this.value;
        },
        setValue: function (value) {
            this.value = value;
            this._sendMessage({
                eventName: EVENT_UPDATE_VALUE,
                id: this._frameId,
                value: this.value,
            });
        },

        updateOptions: function (options) {
            this.options = options;
            this._sendMessage({
                eventName: EVENT_UPDATE_OPTIONS,
                id: this._frameId,
                value: this.options,
            });
        },
        updateUrl: function (url) {
            // No need to update the iframe url if it's the same.
            if (url === this.url) {
                return;
            }
            this.url = url;
            this._setupUrl();
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
