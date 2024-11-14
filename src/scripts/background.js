// service worker script to run in background. listens to events and goes first
"use strict"

import { TEXT_API_URL } from './config.js';

// listener for content script to make call to lambda
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "makeApiCall") {

        fetch(TEXT_API_URL, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                promptText: request.promptText
            })
        })
        .then(response => response.json())
        .then(data => sendResponse({data: data}))
        .catch(error => sendResponse({error: error.message}));

        return true;
    }
});