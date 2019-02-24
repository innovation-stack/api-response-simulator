(function () {

    function buildScriptTag() {
        const xhrScript = document.createElement('script');
        xhrScript.type = 'text/javascript';
        return xhrScript;
    }

    function buildRequestInterceptor(entries) {
        return `
        (function() {
            const oldXMLHttpRequest = XMLHttpRequest;
            const originalOpen = oldXMLHttpRequest.prototype.open;
            const entries = ${JSON.stringify(entries)};
            const getters = [
                'responseType',
                'readyState',
                'responseXML',
                'upload'
            ];
            const totalGetters = getters.length;
            const gettersSetters = [
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

            function getMatchedEntry(xhr) {
                let matchedEntry;
                if (xhr.responseURL &&
                    entries[xhr.responseURL] &&
                    entries[xhr.responseURL].verb.toLowerCase() === xhr.method.toLowerCase()) {
                    matchedEntry = entries[xhr.responseURL];
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
                            self.statusText = 'Error thrown by Backend Simulator Chrome Extension';
                            self.status = +matchedEntry.errorCode;
                            self.response = {error: true};
                            self.responseText = JSON.stringify({error: true});
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
                        get: function() {return actual[item];},
                        set: function(val) {actual[item] = val;}
                    });
                }

                for (let index = 0; index < totalPassThroughMethods; index++) {
                    const item = passThroughMethods[index];
                    Object.defineProperty(self, item, {
                        value: function() {return actual[item].apply(actual, arguments);}
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
                const xhrScript = buildScriptTag();
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

    chrome.storage.sync.get(['enabled'], function (result) {
        if (result.enabled === '1') {
            requestIdleCallback(prepareDOM);
        }
    });
}());
