window.onload = loadMemory;

window.onload = function () {
  startWakeWordDetection();
};


const funReplies = {
  "how are you": [
    "I'm an AI, so I don't have feelings... but let's pretend I'm fantastic!",
    "I'm great! Just calculating the meaning of life... again.",
    "I'm like WiFi—sometimes strong, sometimes weak, but always here!"
  ],
  "who are you": [
    "I am P.H.O.E.N.I.X, your AI overlord... I mean, assistant.",
    "Just your friendly neighborhood AI. No world domination plans. Yet.",
    "I am P.H.O.E.N.I.X, built to assist you and maybe roast you a little."
  ],
  "tell me a joke": [
    "Why did the AI break up with the calculator? It felt too used.",
    "I told a chemistry joke, but there was no reaction.",
    "Parallel lines have so much in common. It's a shame they'll never meet."
  ]
};

// Check if user’s message matches fun responses
function checkFunResponses(message) {
  let lowerMessage = message.toLowerCase();
  for (let key in funReplies) {
    if (lowerMessage.includes(key)) {
      let responses = funReplies[key];
      return responses[Math.floor(Math.random() * responses.length)];
    }
  }
  return null;
}

// Modify sendMessage() to use fun responses
async function sendMessage() {
  let input = document.getElementById("userInput").value;
  let chatbox = document.getElementById("chatbox");

  if (input.trim() === "") return;

  chatbox.innerHTML += `<p><b>You:</b> ${input}</p>`;
  document.getElementById("userInput").value = "";

  chatbox.innerHTML += `<p><b>PHOENIX:</b> Thinking...</p>`;

  // 🔹 Check if we have a fun response
  let funResponse = checkFunResponses(input);
  let response = funResponse ? funResponse : await getAIResponse(input);

  chatbox.innerHTML += `<p><b>PHOENIX:</b> ${response}</p>`;
  chatbox.scrollTop = chatbox.scrollHeight;

  speak(response); // Make AI speak

  // Store message in memory
  let chatMemory = JSON.parse(localStorage.getItem("chatMemory")) || [];
  chatMemory.push({ user: input, ai: response });
  localStorage.setItem("chatMemory", JSON.stringify(chatMemory));
}



function startListening() {
  let recognition = new (window.SpeechRecognition ||
    window.webkitSpeechRecognition)();
  recognition.lang = "en-US";
  recognition.start();

  recognition.onresult = function (event) {
    let transcript = event.results[0][0].transcript;
    document.getElementById("userInput").value = transcript; // Fill input box with recognized text
    sendMessage(); // Send it to AI
  };

  recognition.onerror = function (event) {
    console.log("Speech recognition error:", event.error);
  };
}

function startWakeWordDetection() {
  let recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = "en-US";
  recognition.continuous = true; // Keep listening in the background
  recognition.interimResults = true; // Detect speech in real time

  recognition.onstart = function () {
    console.log("Listening for wake word...");
  };

  recognition.onresult = function (event) {
    let transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
    console.log("Heard:", transcript);

    // If wake word detected, start normal voice recognition
    if (transcript.includes("hey phoenix")) {
      console.log("Wake word detected!");
      speak("Yes? How can I assist?");
      startVoiceCommandRecognition(); // Start full speech-to-text
    }
  };

  recognition.onerror = function (event) {
    console.log("Error:", event.error);
    recognition.start(); // Restart listening on error
  };

  recognition.onend = function () {
    console.log("Restarting wake word detection...");
    recognition.start(); // Restart when it stops
  };

  recognition.start();
}

function startVoiceCommandRecognition() {
  let recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = "en-US";

  recognition.onstart = function () {
    console.log("Listening for a command...");
  };

  recognition.onresult = function (event) {
    let command = event.results[0][0].transcript;
    console.log("User said:", command);

    document.getElementById("userInput").value = command; // Fill input box
    sendMessage(); // Process as normal chat
  };

  recognition.onerror = function (event) {
    console.log("Error:", event.error);
  };

  recognition.start();
}

async function sendMessage() {
  let input = document.getElementById("userInput").value;
  let chatbox = document.getElementById("chatbox");

  if (input.trim() === "") return;

  chatbox.innerHTML += `<p><b>You:</b> ${input}</p>`;
  document.getElementById("userInput").value = "";

  chatbox.innerHTML += `<p><b>PHOENIX:</b> ${response}</p>`;
  speak(response); // AI speaks the response

  let response = await getAIResponse(input);

  chatbox.innerHTML += `<p><b>PHOENIX:</b> ${response}</p>`;
  chatbox.scrollTop = chatbox.scrollHeight;

  speak(response); // Make AI speak

  // Store message in memory
  let chatMemory = JSON.parse(localStorage.getItem("chatMemory")) || [];
  chatMemory.push({ user: input, ai: response });
  localStorage.setItem("chatMemory", JSON.stringify(chatMemory));
}


async function getAIResponse(message) {
  const apiKey = "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";
  const searchApiKey = "68c9bcf23e4c49d816647d30b509516ebc7134d58d9f5679f8f6425dfd78495c";

  let chatMemory = JSON.parse(localStorage.getItem("chatMemory")) || [];
  let recentMemory = chatMemory.slice(-5).map(entry => `You: ${entry.user}\nPHOENIX: ${entry.ai}`).join("\n");

  // 🔥 Add Personality
  let personality = `Your name is P.H.O.E.N.I.X, a witty and slightly sarcastic AI assistant. 
  You make humorous comments, but always help the user. 
  If someone asks a dumb question, you respond with sarcasm.`;

  // Full prompt with context and personality
  let fullPrompt = `${personality}\n${recentMemory}\nYou: ${message}\nPHOENIX:`;

  const response = await fetch("https://api-inference.huggingface.co/models/tiiuae/falcon-7b-instruct", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ inputs: fullPrompt })
  });

  const data = await response.json();
  let aiResponse = data[0]?.generated_text || "Sorry, I couldn't understand that.";

  // 🔍 If AI doesn’t know, search the web
  if (aiResponse.includes("I don't know") || aiResponse.includes("I'm not sure")) {
    aiResponse = await getWebSearchResults(message, searchApiKey);
  }

  return aiResponse;
}


async function getWebSearchResults(query, searchApiKey) {
  const searchUrl = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${searchApiKey}`;

  try {
    const response = await fetch(searchUrl);
    const data = await response.json();

    if (data.organic_results && data.organic_results.length > 0) {
      let topResult = data.organic_results[0];
      return `🔍 I found this: ${topResult.title}\n${topResult.link}`;
    } else {
      return "Sorry, I couldn't find anything relevant.";
    }
  } catch (error) {
    console.error("Search error:", error);
    return "There was an error searching the web.";
  }
}


function speak(text) {
  let speech = new SpeechSynthesisUtterance();
  speech.text = text;
  speech.lang = "en-US"; // Set language
  speech.volume = 1; // Adjust volume (0 to 1)
  speech.rate = 1; // Speed of speech (0.5 to 2)
  speech.pitch = 1; // Pitch (0 to 2)

  window.speechSynthesis.speak(speech);
}


function loadMemory() {
  let chatbox = document.getElementById("chatbox");
  let chatMemory = JSON.parse(localStorage.getItem("chatMemory")) || [];

  chatMemory.forEach((entry) => {
    chatbox.innerHTML += `<p><b>You:</b> ${entry.user}</p>`;
    chatbox.innerHTML += `<p><b>PHOENIX:</b> ${entry.ai}</p>`;
  });

  chatbox.scrollTop = chatbox.scrollHeight;
}

function clearMemory() {
  localStorage.removeItem("chatMemory");
  document.getElementById("chatbox").innerHTML = "";
}
