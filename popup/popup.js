(function () {
    'use strict';

    const toggleFeature = document.querySelector('#toggle-feature');
    const optionsButton = document.querySelector('#options');

    function controlsExists() {
        return toggleFeature !== null &&
            optionsButton !== null;
    }

    function updateUI(isEnabled) {
        if (isEnabled) {
            toggleFeature.checked = true;
        } else {
            toggleFeature.checked = false;
        }
    }

    function updateFeatureState() {
        chrome.storage.sync.get(['enabled'], function (result) {
            if (result.enabled === '1') {
                chrome.storage.sync.set({enabled: '0'}, function () {
                    chrome.runtime.sendMessage({
                        type: 'feature.enabled',
                        payload: '0'
                    });
                    updateUI(false);
                });
            } else {
                chrome.storage.sync.set({'enabled': '1'}, function () {
                    chrome.runtime.sendMessage({
                        type: 'feature.enabled',
                        payload: '1'
                    });
                    updateUI(true);
                });
            }
        });
    }

    function loadFeatureState() {
        chrome.storage.sync.get(['enabled'], function (result) {
            if (result.enabled === '1') {
                updateUI(true);
            } else {
                updateUI(false);
            }
        });
    }

    function loadOptionsPage(event) {
        event.preventDefault();
        chrome.runtime.openOptionsPage();
    }

    function addListeners() {
        if (controlsExists()) {
            toggleFeature.addEventListener('click', updateFeatureState, false);
            optionsButton.addEventListener('click', loadOptionsPage, false);
        }
    }

    function initialize() {
        addListeners();
        loadFeatureState();
    }

    initialize();
}());