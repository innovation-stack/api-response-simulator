(function () {
  'use strict';

  const resultTable = document.querySelector('#result-table');
  const resultTableBody = document.querySelector('#result-table-body');
  const saveEntryButton = document.querySelector('#save-entry');
  const resetEntryButton = document.querySelector('#reset');
  const entryRefTemplate = document.querySelector('#entryRef');
  const urlInput = document.querySelector('#url');
  const verbInput = document.querySelector('#verb');
  const responseCodeInput = document.querySelector('#response-code');
  const responseValueInput = document.querySelector('#response-value');
  const partialUrlMatchCheckbox = document.querySelector('#partial-url-match');
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
      responseCodeInput !== null &&
      responseValueInput !== null &&
      verbInput !== null &&
      noDataContainer !== null &&
      partialUrlMatchCheckbox !== null;
  }

  function clearControls() {
    urlInput.value = '';
    responseCodeInput.value = '';
    responseValueInput.value = '';
    partialUrlMatchCheckbox.checked = false;
    urlInput.focus();
  }

  function addEntry(url, verb, responseCode, responseValue, partialUrlMatch, id) {
    entries.push({
      id,
      url,
      verb,
      partialUrlMatch,
      responseCode,
      responseValue
    });
    chrome.storage.sync.set({entries}, function () {
      showTable();
    });
  }

  function updateEntry(url, verb, responseCode, responseValue, partialUrlMatch, id) {
    const newEntry = {
      id,
      url,
      verb: verb.toUpperCase(),
      partialUrlMatch,
      responseCode,
      responseValue
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

  function renderRow(url, verb, responseCode, responseValue, partialUrlMatch, id) {
    const row = document.importNode(entryRefTemplate.content, true);
    row.querySelector('.url>div').textContent = url;
    row.querySelector('.partial-url-match').textContent = partialUrlMatch;
    row.querySelector('.verb').textContent = verb.toUpperCase();
    row.querySelector('.response-code').textContent = responseCode;
    row.querySelector('.response-value').textContent = responseValue;
    row.querySelector('.delete').setAttribute('data-id', id);
    row.querySelector('.edit').setAttribute('data-id', id);
    resultTableBody.appendChild(row);
  }

  function updateRow(row, url, verb, responseCode, responseValue, partialUrlMatch) {
    row.querySelector('.url').textContent = url;
    row.querySelector('.partial-url-match').textContent = partialUrlMatch;
    row.querySelector('.verb').textContent = verb.toUpperCase();
    row.querySelector('.response-code').textContent = responseCode;
    row.querySelector('.response-value').textContent = responseValue;
  }

  function saveEntry(event) {
    const url = urlInput.value;
    const partialUrlMatch = partialUrlMatchCheckbox.checked;
    const responseCode = responseCodeInput.value;
    const responseValue = responseValueInput.value;
    const verb = verbInput.value;
    const selectedRow = resultTableBody.querySelector('.result-row.selected');
    let id;

    if (url && verb && responseCode && responseValue) {
      event.preventDefault();
      if (isInEditMode && entries.length > 0 && selectedRow) {
        id = selectedRow.querySelector('[data-id]').getAttribute('data-id');
        updateRow(selectedRow, url, verb, responseCode, responseValue, partialUrlMatch);
        updateEntry(url, verb, responseCode, responseValue, partialUrlMatch, id);
      } else {
        id = new Date().getTime();
        renderRow(url, verb, responseCode, responseValue, partialUrlMatch, id);
        addEntry(url, verb, responseCode, responseValue, partialUrlMatch, id);
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
    const partialUrlMatch = row.querySelector('.partial-url-match').textContent;
    const responseCode = row.querySelector('.response-code').textContent;
    const responseValue = row.querySelector('.response-value').textContent;

    urlInput.value = url;
    verbInput.value = verb;
    responseCodeInput.value = responseCode;
    responseValueInput.value = responseValue;
    partialUrlMatchCheckbox.checked = partialUrlMatch === 'true';
    row.classList.add('selected');
    isInEditMode = true;

    $(verbInput).material_select();

    setTimeout(function () {
      verbInput.focus();
      responseCodeInput.focus();
      responseValueInput.focus();
      partialUrlMatchCheckbox.focus();
      urlInput.focus();
    }, 0);
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
      renderRow(entry.url, entry.verb, entry.responseCode, entry.responseValue, entry.partialUrlMatch, entry.id);
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
      $(verbInput).material_select();
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

  document.addEventListener('DOMContentLoaded', function () {
    initialize();
  });
}());
