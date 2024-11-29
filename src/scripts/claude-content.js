// runs in the context of a web page, can interact with DOM
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

    const response = await session.prompt(promptText);

    if (!response) {
      throw new Error(response.error);
    }

    promptElement.textContent = response; // update text if successful API call
    
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