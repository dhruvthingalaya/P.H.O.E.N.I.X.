window.onload = loadMemory;

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

async function sendMessage() {
  let input = document.getElementById("userInput").value;
  let chatbox = document.getElementById("chatbox");

  if (input.trim() === "") return;

  chatbox.innerHTML += `<p><b>You:</b> ${input}</p>`;
  document.getElementById("userInput").value = "";

  chatbox.innerHTML += `<p><b>PHOENIX:</b> Thinking...</p>`;

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
  const apiKey = "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"; // Replace with your API Key
  const response = await fetch(
    "https://api-inference.huggingface.co/models/tiiuae/falcon-7b-instruct",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: message }),
    }
  );

  const data = await response.json();
  return data[0]?.generated_text || "Sorry, I couldn't understand that.";
}

function speak(text) {
  let speech = new SpeechSynthesisUtterance();
  speech.text = text;
  speech.lang = "en-US";
  speech.rate = 1; // Adjust speed if needed (1 = normal)
  speech.pitch = 1; // Adjust pitch if needed
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
