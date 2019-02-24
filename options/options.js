(function () {
  'use strict';

  const resultTable = document.querySelector('#result-table');
  const resultTableBody = document.querySelector('#result-table-body');
  const saveEntryButton = document.querySelector('#save-entry');
  const resetEntryButton = document.querySelector('#reset');
  const entryRefTemplate = document.querySelector('#entryRef');
  const urlInput = document.querySelector('#url');
  const verbInput = document.querySelector('#verb');
  const errorCodeInput = document.querySelector('#error-code');
  const clearTableButton = document.querySelector('#clear-table');
  const noDataContainer = document.querySelector('#no-data-container');
  let entries = [];
  let isInEditMode = false;

  function areControlsValid() {
    return resultTable !== null &&
      resultTableBody !== null &&
      saveEntryButton !== null &&
      resetEntryButton !== null &&
      clearTableButton !== null &&
      entryRefTemplate !== null &&
      urlInput !== null &&
      errorCodeInput !== null &&
      verbInput !== null &&
      noDataContainer !== null;
  }

  function clearControls() {
    urlInput.value = '';
    verbInput.value = '';
    errorCodeInput.value = '';
    urlInput.focus();
  }

  function addEntry(url, verb, errorCode, id) {
    entries.push({
      id,
      url,
      verb,
      errorCode
    });
    chrome.storage.sync.set({entries}, function () {
      showTable();
    });
  }

  function updateEntry(url, verb, errorCode, id) {
    const newEntry = {
      id,
      url,
      verb: verb.toUpperCase(),
      errorCode
    };
    const entryIndex = entries.findIndex(function (entry) {
      return +entry.id === +id;
    });
    if (entryIndex !== -1) {
      entries[entryIndex] = newEntry;
    } else {
      entries.push(newEntry);
    }
    chrome.storage.sync.set({entries});
  }

  function renderRow(url, verb, errorCode, id) {
    const row = document.importNode(entryRefTemplate.content, true);
    row.querySelector('.url').textContent = url;
    row.querySelector('.verb').textContent = verb.toUpperCase();
    row.querySelector('.error-code').textContent = errorCode;
    row.querySelector('.delete').setAttribute('data-id', id);
    row.querySelector('.edit').setAttribute('data-id', id);
    resultTableBody.appendChild(row);
  }

  function updateRow(row, url, verb, errorCode) {
    row.querySelector('.url').textContent = url;
    row.querySelector('.verb').textContent = verb.toUpperCase();
    row.querySelector('.error-code').textContent = errorCode;
  }

  function saveEntry(event) {
    const url = urlInput.value;
    const errorCode = errorCodeInput.value;
    const verb = verbInput.value;
    const selectedRow = resultTableBody.querySelector('.result-row.selected');
    let id;

    if (url && verb && errorCode) {
      event.preventDefault();
      if (isInEditMode && entries.length > 0 && selectedRow) {
        id = selectedRow.querySelector('[data-id]').getAttribute('data-id');
        updateRow(selectedRow, url, verb, errorCode);
        updateEntry(url, verb, errorCode, id);
      } else {
        id = new Date().getTime()
        renderRow(url, verb, errorCode, id);
        addEntry(url, verb, errorCode, id);
      }
      isInEditMode = false;
      clearControls();
    }
  }

  function deleteEntry(element) {
    const id = element.getAttribute('data-id');
    if (entries && id) {
      const index = entries.findIndex(function (entry) {
        return +entry.id === +id;
      });
      if (index >= 0) {
        entries.splice(index, 1);
      }
    }
    element.closest('.result-row').remove();
    chrome.storage.sync.set({entries}, function () {
      if (entries.length === 0) {
        hideTable();
      }
    });
  }

  function editEntry(element) {
    const row = element.closest('.result-row');
    const url = row.querySelector('.url').textContent;
    const verb = row.querySelector('.verb').textContent;
    const errorCode = row.querySelector('.error-code').textContent;

    urlInput.value = url;
    verbInput.value = verb;
    errorCodeInput.value = errorCode;
    row.classList.add('selected');
    isInEditMode = true;
  }

  function performAction(event) {
    const element = event.target;
    if (element) {
      if (element.classList.contains('delete')) {
        deleteEntry(element);
      } else if (element.classList.contains('edit')) {
        editEntry(element);
      }
    }
  }

  function resetEntries() {
    resultTableBody.innerHTML = '';
    chrome.storage.sync.set({entries: []}, function () {
      hideTable();
    });
  }

  function bindListeners() {
    saveEntryButton.addEventListener('click', saveEntry, false);
    resultTable.addEventListener('click', performAction, false);
    resetEntryButton.addEventListener('click', clearControls, false);
    clearTableButton.addEventListener('click', resetEntries, false);
  }

  function renderEntries() {
    const totalEntries = entries.length;
    for (let index = 0; index < totalEntries; index++) {
      const entry = entries[index];
      renderRow(entry.url, entry.verb, entry.errorCode, entry.id);
    }
  }

  function showTable() {
    resultTable.classList.remove('hide');
    noDataContainer.classList.add('hide');
  }

  function hideTable() {
    resultTable.classList.add('hide');
    noDataContainer.classList.remove('hide');
  }

  function initialize() {
    if (areControlsValid()) {
      chrome.storage.sync.get(['entries'], function (result) {
        entries = result.entries || [];
        bindListeners();
        if (entries.length > 0) {
          renderEntries();
          showTable();
        } else {
          hideTable();
        }
      });
    }
  }

  initialize();
}());