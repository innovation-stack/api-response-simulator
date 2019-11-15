(function () {

    function buildScriptTag(id) {
        const xhrScript = document.createElement('script');
        xhrScript.id = id;
        xhrScript.type = 'text/javascript';
        return xhrScript;
    }

    function buildRestoreXMLHttpRequestScript() {
        return `
        (function () {
            delete window.entries;
            window.XMLHttpRequest = window.oldXMLHttpRequest;
            window.XMLHttpRequest.prototype.open = originalOpen;
        })();
        `;
    }

    function buildRequestInterceptor(entries) {
        return `
        (function() {
            const oldXMLHttpRequest = XMLHttpRequest;
            const originalOpen = oldXMLHttpRequest.prototype.open;
            const getters = [
                'readyState',
                'responseXML',
                'upload'
            ];
            const totalGetters = getters.length;
            const gettersSetters = [
                'responseType',
                'method',
                'ontimeout',
                'timeout',
                'withCredentials',
                'onload',
                'onerror',
                'onprogress'
            ];
            const totalGettersSetters = gettersSetters.length;
            const passThroughMethods = [
                'addEventListener',
                'open',
                'send',
                'abort',
                'getAllResponseHeaders',
                'getResponseHeader',
                'overrideMimeType',
                'setRequestHeader',
                'setMethod'
            ];
            const totalPassThroughMethods = passThroughMethods.length;

            window.entries = ${JSON.stringify(entries)};
            window.oldXMLHttpRequest = oldXMLHttpRequest;
            window.originalOpen = originalOpen;
            const entriesKeys = Object.keys(window.entries);

            function getMatchedEntry(xhr) {
                let matchedEntry;

                if (xhr.responseURL && window.entries) {
                    let entry = window.entries[xhr.responseURL];
                    if (entry && entry.verb.toLowerCase() === xhr.method.toLowerCase()) {
                        matchedEntry = entry;
                    } else {
                        const queryStringIndex = xhr.responseURL.indexOf('?');
                        if (queryStringIndex >= 0) {
                            const url = xhr.responseURL.substring(0, queryStringIndex);
                            entry = window.entries[url];
                            if (entry && entry.verb.toLowerCase() === xhr.method.toLowerCase() && entry.partialUrlMatch) {
                                matchedEntry = entry;
                            }
                        }
                    }
                }
                return matchedEntry;
            }

            oldXMLHttpRequest.prototype.open = function () {
                this.setMethod(arguments[0]);
                return originalOpen.apply(this, arguments);
            };

            XMLHttpRequest = function() {
                const actual = new oldXMLHttpRequest();
                const self = this;

                actual.onreadystatechange = function() {
                    if (this.readyState === 4) {
                        const matchedEntry = getMatchedEntry(this);
                        if (matchedEntry) {
                            self.statusText = actual.statusText;
                            self.status = +matchedEntry.errorCode;
                            self.response = actual.response;
                            self.responseText = matchedEntry.errorResponse;
                        } else {
                            self.statusText = actual.statusText;
                            self.status = actual.status;
                            self.response = actual.response;
                            self.responseText = actual.responseText;
                        }
                    }
                    if (self.onreadystatechange) {
                        return self.onreadystatechange();
                    }
                };
                for (let index = 0; index < totalGetters; index++) {
                    const item = getters[index];
                    Object.defineProperty(self, item, {
                        get: function() {return actual[item];}
                    });
                }

                for (let index = 0; index < totalGettersSetters; index++) {
                    const item = gettersSetters[index];
                    Object.defineProperty(self, item, {
                        get: function() {
                            return actual[item];
                        },
                        set: function(val) {
                            actual[item] = val;
                        }
                    });
                }

                for (let index = 0; index < totalPassThroughMethods; index++) {
                    const item = passThroughMethods[index];
                    Object.defineProperty(self, item, {
                        value: function() {
                            return actual[item].apply(actual, arguments);
                        }
                    });
                }
            };

            oldXMLHttpRequest.prototype.setMethod = function (method) {
                this.method = method;
            };
        })();
        `;
    }

    function prepareDOM() {
        if (document.head && document.body) {
            chrome.storage.sync.get(['entries'], function (result) {
                const xhrScript = buildScriptTag('api-errors-simulator');
                result.entries = result.entries || [];
                const mappedEntries = result.entries.reduce(function (acc, entry) {
                    acc[entry.url] = entry;
                    return acc;
                }, {});
                xhrScript.innerHTML = buildRequestInterceptor(mappedEntries);
                document.head.prepend(xhrScript);
            });
        } else {
            requestIdleCallback(prepareDOM);
        }
    }

    function destroyDOM() {
        let xhrScript = document.querySelector('#api-errors-simulator');
        if (xhrScript) {
            xhrScript.remove();
            xhrScript = buildScriptTag('api-errors-simulator-destroy');
            xhrScript.innerHTML = buildRestoreXMLHttpRequestScript();
            document.head.prepend(xhrScript);
            setTimeout(function () {
                xhrScript.remove();
            }, 50);
        }
    }

    chrome.storage.sync.get(['enabled'], function (result) {
        if (result.enabled === '1') {
            requestIdleCallback(prepareDOM);
        }
    });

    chrome.storage.onChanged.addListener(function(changes) {
        if (changes.enabled && changes.enabled.newValue === '0') {
            destroyDOM();
        }else if ((changes.enabled && changes.enabled.newValue === '1') ||
            (changes.entries && changes.entries.newValue)) {
            destroyDOM();
            prepareDOM();
        }
    });
}());
