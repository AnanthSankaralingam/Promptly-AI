// runs in the context of a web page, can interact with DOM. 
// inject button into UI, send API request on click/keyboard shortcut
const systemPrompt = `You are an AI assistant tasked with analyzing a user's prompt to identify the task type, objective, and main components. Enhance the prompt by improving clarity, specificity, and structure, ensuring the outcome is more professional and aligned with the user’s original intent. Follow a step-by-step approach to ensure each essential aspect of the task is addressed.
**Do not provide an answer to the user's prompt. Only return an enhanced version of the prompt without any additional commentary.**

# Guidelines
1. **Identify the Core Task**:
   - Determine the primary goal or action required by the prompt.
   - Avoid specific solutions or explanations; focus only on clarifying the task requirements.

2. **Clarify Components and Terminology**:
   - Identify key terms or elements that may need further definition or context to clarify the task.
   - Provide only necessary instructions or specifications without solving or addressing the task directly.

3. **Improve Structure and Flow**:
   - Rephrase for better coherence and flow without changing the prompt’s intent.
   - Ensure the instructions remain action-oriented, concise, and free from unnecessary detail.

4. **Enhance Precision**:
   - If relevant, suggest additional general steps or considerations for a thorough and professional approach to the task.
   - Maintain a clear, functional tone without delving into specifics that would fulfill or solve the task.
   
# Output Format
- Provide only the refined prompt, with enhanced clarity and structure and without any additional commentary.
- Avoid any answers, explanations, or overly detailed guidance that may inadvertently solve the user’s prompt.
- Do not modify any attachments, pasted content, or provided data from the user.

# Examples
- **Original Prompt**: "Determine the derivative of the function \( f(x) = 3x^4 - 5x^2 + 7x - 9 \)."
- **Enhanced Prompt**: "Calculate the derivative of the function \( f(x) = 3x^4 - 5x^2 + 7x - 9 \). Outline each differentiation step clearly, specifying the rules applied to each term without solving for the final expression."

- **Original Prompt**: "Create a step-by-step guide on how to set up a secure database connection."
- **Enhanced Prompt**: "Provide instructions on setting up a secure database connection, addressing essential steps. Include guidelines for:
    1. Authentication
    2. Encryption
    3. Access permissions. 
    Explain step by step."

- **Original Prompt**: "Explain the main features of climate change affecting coastal areas."
- **Enhanced Prompt**: "Outline the primary features of climate change that impact coastal areas, covering factors such as:
    - Rising sea levels
    - Erosion
    - Extreme weather
    Describe each feature briefly and clearly explain your chain of thought."

# Notes
- Maintain the user’s original intent without changing the task.
- Avoid any unnecessary specificity that could result in completing or solving the task.
- Maintain the user’s tone and style, using a professional tone only if specified.
- Do not modify or interfere with any pasted attachments provided by the user.
`

// create AI session to call prompt api
let session;
(async function initializeAISession() {
  try {
    const capabilities = (await ai.languageModel.capabilities());

    if(capabilities.available){
      session = await ai.languageModel.create({
        systemPrompt: systemPrompt
      });
    }

  } catch (error) {
    console.log("Error initializing AI session", error);
  }
})();

// inject reprompt element
function addCustomButton() {
  // Look for the send button
  const sendButton = document.querySelector("button[data-testid='send-button']");

  // add button if not added yet
  if (sendButton && !document.querySelector(".extra-button")) {
      const newButton = document.createElement("button");
      newButton.classList.add("extra-button"); // custom class for styling
      newButton.style.border = "none";
      newButton.style.cursor = "pointer";
      newButton.style.padding = "0";
      newButton.style.marginRight = "8px"; 
      newButton.style.transition = "background-color 0.3s ease";

      newButton.title = "Enhance Prompt"; // Hover text 

      const iconImg = document.createElement("img");
      iconImg.src = chrome.runtime.getURL("favicon-32x32.png");
      iconImg.alt = "Reprompt";
      iconImg.style.width = "32px";
      iconImg.style.height = "32px";
      iconImg.style.display = "block"; 

      // Make the image circular
      iconImg.style.borderRadius = "50%";

      // Append the image to the button
      newButton.appendChild(iconImg);

      newButton.addEventListener("click", (e) => {
          e.preventDefault();
          modifyPromptElement();
      });

      sendButton.parentNode.insertBefore(newButton, sendButton);

      const parentContainer = sendButton.parentNode;
      if (parentContainer.style.display !== "flex") {
          parentContainer.style.display = "flex"; 
          parentContainer.style.flexShrink = "0"; // FIXME P button moving to middle after send button un-disabled and text comes
      }

      // Hover effects
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
  
  // Style error message
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

    const response = await session.prompt(promptText);

    if (!response) {
      throw new Error(response.error);
    }

    promptElement.textContent = response; // update text if successful API call
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
      console.log("err", error.message)
      setTimeout(() => {
        button.style.backgroundColor = "transparent";
      }, 1800); // reset after 2 seconds for errors
    }
  } 
}