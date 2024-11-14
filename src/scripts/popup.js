"use strict";

document.addEventListener('DOMContentLoaded', function() {
    const repromptButton = document.getElementById('reprompt-button');
    const checkmarkElement = document.getElementById('checkmark');
    const loadingElement = document.getElementById('loading');
    const errorMessageElement = document.getElementById('error-message');

    repromptButton.addEventListener('click', function() {
        repromptButton.disabled = true;
        hideAllStatusElements();
        loadingElement.classList.remove('hidden');
    
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {action: "modifyPrompt"}, function(response) {
                loadingElement.classList.add('hidden');
                
                if (chrome.runtime.lastError) {
                    handleError("Error: More than one ChatGPT/Claude/Perplexity tab open or no relevant tab found");
                } else if (!response) {
                    handleError("Error: No response from content script");
                } else if (!response.success) {
                    handleContentScriptError(response.error);
                } else {
                    showSuccess();
                }
            });
        });
    });

    function handleContentScriptError(error) {
        let errorMsg;
        switch(error) {
            case "Prompt textarea not found":
                errorMsg = "Prompt textarea not found";
                break;
            case "Prompt too small / big":
                errorMsg = "Prompt length is invalid (6-2500 chars)";
                break;
            case "No data returned from API":
                errorMsg = "No data returned from our side :(";
                break;
            default:
                if (error.startsWith("Error from API:")) {
                    errorMsg = "Error on our side :(";
                } else {
                    errorMsg = "Unknown error occurred";
                }
        }
        handleError(errorMsg);
    }

    function handleError(message) {
        errorMessageElement.textContent = message;
        errorMessageElement.classList.remove('hidden');
        repromptButton.disabled = false;
        setTimeout(hideError, 3000);
    }

    function hideError() {
        errorMessageElement.classList.add('hidden');
    }

    function showSuccess() {
        checkmarkElement.classList.remove('hidden');
        setTimeout(() => {
            checkmarkElement.classList.add('hidden');
            repromptButton.disabled = false;
        }, 2000);
    }

    function hideAllStatusElements() {
        loadingElement.classList.add('hidden');
        checkmarkElement.classList.add('hidden');
        errorMessageElement.classList.add('hidden');
    }
});