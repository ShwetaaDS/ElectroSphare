// 💬 Chatbot Integration with Django API + All UI Functionalities

// Toggle chatbot visibility
function toggleChatbot(show) {
  const toggleBtn = document.getElementById("chatbot-toggle");
  const chatBox = document.getElementById("chatbot-box");

  if (show) {
    toggleBtn.classList.add("hidden");
    chatBox.classList.remove("hidden");
  } else {
    toggleBtn.classList.remove("hidden");
    chatBox.classList.add("hidden");
  }
}
document.addEventListener("DOMContentLoaded", () => {
  const inputField = document.getElementById("chatbot-input");

  inputField.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      if (!e.shiftKey) {
        e.preventDefault();  // Prevent newline
        sendMessage();       // Submit message
      }
    }
  });
});

function sendMessage() {
  const input = document.getElementById("chatbot-input");
  const body = document.getElementById("chatbot-body");
  const message = input.value.trim();
  if (!message) return;

  // User message bubble
  const userMsg = document.createElement("div");
  userMsg.className = "bg-purple-600 text-white px-4 py-2 rounded-lg max-w-[80%] self-end ml-auto mb-2";
  userMsg.textContent = message;
  body.appendChild(userMsg);
  input.value = "";
  body.scrollTop = body.scrollHeight;

  // CSRF token
  const csrfToken = getCsrfToken();

  fetch("/api/chat/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(csrfToken && { "X-CSRFToken": csrfToken }),
    },
    credentials: "include",
    body: JSON.stringify({ message }),
  })
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(data => {
      const botReply = document.createElement("div");
      botReply.className = "bg-gray-100 text-gray-800 px-4 py-2 rounded-lg max-w-[80%] self-start mr-auto mb-2";
      botReply.textContent = data.response;
      body.appendChild(botReply);
      body.scrollTop = body.scrollHeight;
    })
    .catch(error => {
      const errMsg = document.createElement("div");
      errMsg.className = "error text-red-500 text-sm";
      errMsg.textContent = "Failed to get response: " + error.message;
      showNotification("Chatbot error: " + error.message, 'bg-red-600');
      body.appendChild(errMsg);
      body.scrollTop = body.scrollHeight;
    });
}
