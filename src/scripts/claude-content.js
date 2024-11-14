// runs in the context of a web page, can interact with DOM
"use strict"

function addCustomButton() {
  // parent of upload button
  const buttonContainer = document.querySelector('div.gap-0.inline-flex');
  
  //add button if not added yet
  if (buttonContainer && !document.querySelector(".enhance-button") && !document.querySelector("promptly-logo")) {
      // new button matching Claude's style
      const newButton = document.createElement("button");
      newButton.classList.add("enhance-button", "inline-flex", "items-center", "justify-center", "relative", "shrink-0");
      
      // Match Claude's button styling
      Object.assign(newButton.style, {
        marginRight: '3px',
        padding: '2px',
        transition: 'background-color 0.3s ease',
        borderRadius: '6px',
        // position: 'fixed', // Make the button fixed
        // bottom: '16px', // Align it to the bottom of the screen
        // left: '16px' // Align it to the left side
      });

      newButton.classList.add(
        "ring-offset-2",
        "ring-offset-bg-300",
        "ring-accent-main-100",
        "focus-visible:outline-none",
        "focus-visible:ring-1",
        "hover:bg-bg-500/40"
      );

      newButton.title = "Enhance Prompt"; // hover text

      // add logo to button
      const iconImg = document.createElement("img");
      try {
        iconImg.src = chrome.runtime.getURL("promptly_logo_18.png");
        iconImg.classList.add("promptly-logo");
        iconImg.alt = "Enhance";
        iconImg.style.width = "18px";
        iconImg.style.height = "18px";
        iconImg.style.display = "block";
        newButton.appendChild(iconImg);
      } catch (error) {
        console.error("Failed to load icon image:", error.message);
      }
      

      // onclick handler
      newButton.addEventListener("click", (e) => {
        e.preventDefault();
        modifyPromptElement();
      });

      buttonContainer.insertBefore(newButton, buttonContainer.firstChild);

      // hover color
      newButton.addEventListener("mouseenter", () => {
        if (newButton.style.backgroundColor !== "red" && 
            newButton.style.backgroundColor !== "#2563eb") {
          newButton.style.backgroundColor = "#e0e0e0";
        }
      });
      newButton.addEventListener("mouseleave", () => {
        if (newButton.style.backgroundColor !== "red" && 
            newButton.style.backgroundColor !== "#2563eb") {
          newButton.style.backgroundColor = "transparent";
        }
      });
  }
}

// keyboard shortcut to reprompt
document.addEventListener("keydown", function (event) {
  if (event.ctrlKey && event.key === "m") {
    event.preventDefault();
    modifyPromptElement();
  }
});

function showErrorMessage(button, errorText) {
  const errorDiv = document.createElement('div');
  errorDiv.textContent = errorText;
  
  // Style to match Claude's aesthetic
  Object.assign(errorDiv.style, {
    position: 'absolute',
    bottom: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#dc2626', 
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

  button.style.position = 'relative';
  button.appendChild(errorDiv);

  setTimeout(() => {
    errorDiv.style.opacity = '1';
  }, 10);

  setTimeout(() => {
    errorDiv.style.opacity = '0';
    setTimeout(() => errorDiv.remove(), 300);
  }, 1800);
}

// monitor changes in the document so we can add button
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.addedNodes.length > 0) {
      addCustomButton();
    }
  });
});

// observe changes
observer.observe(document.body, { childList: true, subtree: true });

window.addEventListener("load", addCustomButton);

var promptText, promptElement;
const knownErrors = [
  "Prompt textarea not found", 
  "Prompt must be between 10-2000 characters", 
  "No data returned from our side :("
];

async function modifyPromptElement() {
  const button = document.querySelector(".enhance-button");
  try {
    if (button) {
      button.style.backgroundColor = "#2563eb"; 
    }

    promptElement = document.querySelector('div[contenteditable="true"]') ||
                   document.querySelector("textarea");

    if (!promptElement) {
      throw new Error("Prompt textarea not found");
    }

    const promptText = promptElement.textContent.trim();  
    
    if (promptText.length < 10 || promptText.length > 2500) {
      throw new Error("Prompt must be between 10-2000 characters");
    }

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

    promptElement.textContent = response.data;
    
    if (button) {
      setTimeout(() => {
        button.style.backgroundColor = "transparent";
      }, 1000);
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