// runs in the context of a web page, can interact with DOM
"use strict"

// inject reprompt element
function addCustomButton() {
  // Look for the send button container
  const sendButtonContainer = document.querySelector("div.mb-1.me-1");

  //add button if not added yet
  if (sendButtonContainer && !document.querySelector(".extra-button")) {
      // Create new button for ease of use
      const newButton = document.createElement("button");
      newButton.classList.add("extra-button"); // Add a custom class for styling
      newButton.style.border = "none";
      newButton.style.cursor = "pointer";
      newButton.style.padding = "0";
      newButton.style.marginRight = "7px"; 
      newButton.style.transition = "background-color 0.3s ease";

      newButton.title = "Enhance Prompt"; // Hover text for button

      // Create an img element to hold the icon
      const iconImg = document.createElement("img");
      iconImg.src = chrome.runtime.getURL("favicon-32x32.png");
      iconImg.alt = "Reprompt";
      iconImg.style.width = "32px";
      iconImg.style.height = "32px";
      iconImg.style.display = "block"; // Ensure it displays as a block element

      // Make the image circular
      iconImg.style.borderRadius = "50%";  

      // Append the image to the button
      newButton.appendChild(iconImg);

      // onclick
      newButton.addEventListener("click", (e) => {
        e.preventDefault();
        modifyPromptElement();
      });

      sendButtonContainer.parentNode.insertBefore(newButton, sendButtonContainer);

      // hover color
      newButton.addEventListener("mouseenter", () => {
        if (newButton.style.backgroundColor !== "red" && 
            newButton.style.backgroundColor !== "blue") {
          newButton.style.backgroundColor = "#e0e0e0";
        }
      });
      newButton.addEventListener("mouseleave", () => {
        if (newButton.style.backgroundColor !== "red" && 
            newButton.style.backgroundColor !== "blue") {
          newButton.style.backgroundColor = "transparent";
        }
      });

  }
}

// monitor changes in the document so we can add button
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
      if (mutation.addedNodes.length > 0) {
          addCustomButton();
      }
  });
});

// observ changes
observer.observe(document.body, { childList: true, subtree: true });

// Run once on initial load in case the button is already present
window.addEventListener("load", addCustomButton);

function showErrorMessage(button, errorText) {
  // create error message element
  const errorDiv = document.createElement('div');
  errorDiv.textContent = errorText;
  
  // Style the error message
  Object.assign(errorDiv.style, {
    position: 'absolute',
    bottom: '100%', // above the button
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#ff4444',
    color: 'white',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '14px',
    marginBottom: '8px',
    whiteSpace: 'nowrap',
    opacity: '0',
    transition: 'opacity 0.3s ease',
    zIndex: '1000',
    boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
  });

  // Add to DOM
  button.style.position = 'relative'; 
  button.appendChild(errorDiv);

  // Trigger fade in
  setTimeout(() => {
    errorDiv.style.opacity = '1';
  }, 10);

  setTimeout(() => {
    errorDiv.style.opacity = '0';
    setTimeout(() => errorDiv.remove(), 300); // Remove after fade out
  }, 2000);
}

// listen for button onclick
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "modifyPrompt") {
    modifyPromptElement().then(result => {
      sendResponse(result);
    }).catch(error => {
      sendResponse({success: false, error: error.message});
    });
    return true; // async
  } 
});

// keyboard shortcut to reprompt
document.addEventListener("keydown", function (event) {
  if (event.ctrlKey && event.key === "m") {
    event.preventDefault();
    modifyPromptElement();
  }
});

var promptText, promptElement;
const knownErrors = [
  "Prompt textarea not found", 
  "Prompt must be between 10-2000 characters", 
  "No data returned from our side :("
];

// modify prompt text as needed
async function modifyPromptElement() {
  const button = document.querySelector(".extra-button");
  try {
    // Set button to blue when starting
    if (button) {
      button.style.backgroundColor = "blue";
    }
    promptElement = document.getElementById('prompt-textarea'); // get text 
    
    if (!promptElement) {
      throw new Error("Prompt textarea not found");
    }

    const promptText = promptElement.textContent.trim();  
    
    // check if prompt is too short or too long 
    if (promptText.length < 10 || promptText.length > 2500) {
      throw new Error("Prompt must be between 10-2000 characters");;
    }

    // get modified prompt
    const response = await chrome.runtime.sendMessage({
      action: "makeApiCall",
      promptText: promptText
    });

    if (response.error) {
      throw new Error(response.error);
    }

    if (!response.data) {
      throw new Error("No data returned from our side :(");
    }

    promptElement.textContent = response.data; // update text if successful API call
    // reset button color after success 
    if (button) {
      setTimeout(() => {
        button.style.backgroundColor = "transparent";
      }, 800); 
    }

    return {success: true};
    
  } catch (error) {
    if (button) {
      button.style.backgroundColor = "red";
      let message = error.message;
      showErrorMessage(button, knownErrors.includes(message) ? message : "Unknown error occurred - try reloading");
      setTimeout(() => {
        button.style.backgroundColor = "transparent";
      }, 1800); // reset after 2 seconds for errors
    }
  } 
}