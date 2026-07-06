/**
 * Aneri AI Chat Widget
 * Drop this file into your portfolio project and call initChatWidget()
 * Replace BACKEND_URL with your actual Render deployment URL.
 */

// ─── CONFIG ────────────────────────────────────────────────────────────────
const BACKEND_URL = "https://aneri-ai-chat.onrender.com"; // ← update after Render deploys
const API_ENDPOINT = `${BACKEND_URL}/api/chat`;

// ─── TYPES ─────────────────────────────────────────────────────────────────
interface Message {
  text: string;
  isUser: boolean;
}

// ─── STYLES ────────────────────────────────────────────────────────────────
const WIDGET_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

  #aneri-chat-widget * {
    box-sizing: border-box;
    font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
  }

  /* Floating trigger button */
  #aneri-chat-trigger {
    position: fixed;
    bottom: 28px;
    right: 28px;
    z-index: 9998;
    width: 58px;
    height: 58px;
    border-radius: 50%;
    background: linear-gradient(135deg, #60728c 0%, #3d5068 100%);
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 20px rgba(60, 80, 104, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
    color: white;
  }
  #aneri-chat-trigger:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 28px rgba(60, 80, 104, 0.6);
  }
  #aneri-chat-trigger svg { pointer-events: none; }

  /* Notification dot */
  #aneri-chat-trigger::after {
    content: '';
    position: absolute;
    top: 4px;
    right: 4px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #4ade80;
    border: 2px solid white;
    animation: aneri-pulse 2s infinite;
  }
  @keyframes aneri-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.7; transform: scale(1.2); }
  }

  /* Chat panel */
  #aneri-chat-panel {
    position: fixed;
    bottom: 100px;
    right: 28px;
    z-index: 9999;
    width: 380px;
    max-height: 560px;
    border-radius: 20px;
    background: #ffffff;
    border: 1px solid rgba(96, 114, 140, 0.15);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15), 0 4px 20px rgba(0, 0, 0, 0.08);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transform-origin: bottom right;
    transform: scale(0.85) translateY(12px);
    opacity: 0;
    pointer-events: none;
    transition: transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.22s ease;
  }
  #aneri-chat-panel.aneri-open {
    transform: scale(1) translateY(0);
    opacity: 1;
    pointer-events: all;
  }

  /* Header */
  #aneri-chat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 18px;
    background: linear-gradient(135deg, #60728c 0%, #3d5068 100%);
    color: white;
    flex-shrink: 0;
  }
  .aneri-header-info { display: flex; align-items: center; gap: 10px; }
  .aneri-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(255,255,255,0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.5px;
    flex-shrink: 0;
  }
  .aneri-header-name { font-size: 14px; font-weight: 600; line-height: 1.3; }
  .aneri-header-sub  { font-size: 11px; opacity: 0.8; margin-top: 1px; }
  .aneri-status-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: #4ade80;
    display: inline-block;
    margin-right: 4px;
    animation: aneri-pulse 2s infinite;
  }

  #aneri-close-btn {
    background: none;
    border: none;
    color: rgba(255,255,255,0.8);
    cursor: pointer;
    padding: 4px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    transition: color 0.15s, background 0.15s;
  }
  #aneri-close-btn:hover { color: white; background: rgba(255,255,255,0.15); }

  /* Messages */
  #aneri-messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    scroll-behavior: smooth;
    background: #f8f9fb;
  }
  #aneri-messages::-webkit-scrollbar { width: 4px; }
  #aneri-messages::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 2px; }

  .aneri-msg-row { display: flex; align-items: flex-end; gap: 6px; }
  .aneri-msg-row.user  { justify-content: flex-end; }
  .aneri-msg-row.bot   { justify-content: flex-start; }

  .aneri-bubble {
    max-width: 82%;
    padding: 10px 14px;
    border-radius: 18px;
    font-size: 13.5px;
    line-height: 1.55;
    word-break: break-word;
  }
  .aneri-bubble.user {
    background: linear-gradient(135deg, #60728c, #3d5068);
    color: white;
    border-bottom-right-radius: 4px;
  }
  .aneri-bubble.bot {
    background: white;
    color: #1e293b;
    border: 1px solid #e2e8f0;
    border-bottom-left-radius: 4px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  }
  /* Markdown inside bot bubble */
  .aneri-bubble.bot ul  { list-style: disc; margin-left: 1.2rem; margin-bottom: 6px; }
  .aneri-bubble.bot ol  { list-style: decimal; margin-left: 1.2rem; margin-bottom: 6px; }
  .aneri-bubble.bot p   { margin-bottom: 4px; }
  .aneri-bubble.bot strong { font-weight: 600; }

  /* Typing indicator */
  .aneri-typing { display: flex; gap: 4px; padding: 4px 2px; }
  .aneri-typing span {
    width: 7px; height: 7px;
    border-radius: 50%;
    background: #94a3b8;
    animation: aneri-bounce 1.2s infinite ease-in-out;
  }
  .aneri-typing span:nth-child(2) { animation-delay: 0.2s; }
  .aneri-typing span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes aneri-bounce {
    0%, 80%, 100% { transform: translateY(0); }
    40%           { transform: translateY(-6px); }
  }

  /* Quick suggestions */
  #aneri-suggestions {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 8px 14px 4px;
    background: #f8f9fb;
    border-top: 1px solid #f1f5f9;
    flex-shrink: 0;
  }
  .aneri-chip {
    padding: 5px 12px;
    border-radius: 20px;
    font-size: 11.5px;
    background: white;
    border: 1px solid #e2e8f0;
    color: #475569;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.15s, border-color 0.15s, color 0.15s;
  }
  .aneri-chip:hover {
    background: #60728c;
    border-color: #60728c;
    color: white;
  }

  /* Input area */
  #aneri-input-area {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    background: white;
    border-top: 1px solid #e2e8f0;
    flex-shrink: 0;
  }
  #aneri-input {
    flex: 1;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 9px 14px;
    font-size: 13.5px;
    color: #1e293b;
    background: #f8f9fb;
    outline: none;
    transition: border-color 0.2s, background 0.2s;
  }
  #aneri-input:focus { border-color: #60728c; background: white; }
  #aneri-input::placeholder { color: #94a3b8; }

  #aneri-send-btn {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: linear-gradient(135deg, #60728c, #3d5068);
    border: none;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: transform 0.15s, box-shadow 0.15s;
  }
  #aneri-send-btn:hover { transform: scale(1.05); box-shadow: 0 3px 10px rgba(60,80,104,0.4); }
  #aneri-send-btn:active { transform: scale(0.97); }

  /* Footer note */
  #aneri-footer-note {
    text-align: center;
    font-size: 10.5px;
    color: #94a3b8;
    padding: 6px 12px 10px;
    background: white;
    border-top: 1px solid #f1f5f9;
    line-height: 1.4;
    flex-shrink: 0;
  }

  /* Responsive: full-screen on mobile */
  @media (max-width: 480px) {
    #aneri-chat-panel {
      width: calc(100vw - 16px);
      right: 8px;
      bottom: 90px;
      max-height: 70vh;
    }
    #aneri-chat-trigger { right: 16px; bottom: 16px; }
  }
`;

// ─── HTML TEMPLATE ──────────────────────────────────────────────────────────
const WIDGET_HTML = `
  <div id="aneri-chat-widget">
    <!-- Floating trigger button -->
    <button id="aneri-chat-trigger" aria-label="Chat with Aneri's AI">
      <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    </button>

    <!-- Chat panel -->
    <div id="aneri-chat-panel" role="dialog" aria-label="Aneri AI Chat">
      <!-- Header -->
      <div id="aneri-chat-header">
        <div class="aneri-header-info">
          <div class="aneri-avatar">AB</div>
          <div>
            <div class="aneri-header-name">Aneri's AI Assistant</div>
            <div class="aneri-header-sub">
              <span class="aneri-status-dot"></span>Online · Ask me anything
            </div>
          </div>
        </div>
        <button id="aneri-close-btn" aria-label="Close chat">
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"
               stroke-linecap="round" viewBox="0 0 24 24">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <!-- Messages -->
      <div id="aneri-messages">
        <div class="aneri-msg-row bot">
          <div class="aneri-bubble bot">
            Hi! 👋 I'm Aneri's AI persona. Ask me about her skills, experience, projects, or anything professional!
          </div>
        </div>
      </div>

      <!-- Quick chips -->
      <div id="aneri-suggestions">
        <button class="aneri-chip" data-msg="What's your experience?">Experience</button>
        <button class="aneri-chip" data-msg="What are your core skills?">Skills</button>
        <button class="aneri-chip" data-msg="Tell me about your projects">Projects</button>
        <button class="aneri-chip" data-msg="What is your notice period?">Notice Period</button>
      </div>

      <!-- Input -->
      <div id="aneri-input-area">
        <input id="aneri-input" type="text" placeholder="Ask something..." autocomplete="off" maxlength="300" />
        <button id="aneri-send-btn" aria-label="Send message">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"
               stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>

      <!-- Footer -->
      <div id="aneri-footer-note">
        Powered by LangChain &amp; Groq · May occasionally make mistakes
      </div>
    </div>
  </div>
`;

// ─── SIMPLE MARKDOWN RENDERER (no external lib needed) ──────────────────────
function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^### (.+)$/gm, "<h3 style='font-size:13px;font-weight:600;margin:6px 0 2px'>$1</h3>")
    .replace(/^## (.+)$/gm,  "<h2 style='font-size:14px;font-weight:600;margin:6px 0 2px'>$1</h2>")
    .replace(/^- (.+)$/gm,   "<li>$1</li>")
    .replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>")
    .replace(/\n{2,}/g, "</p><p>")
    .replace(/\n/g, "<br>")
    .replace(/^(.+)$/, "<p>$1</p>");
}

// ─── MAIN INIT FUNCTION ─────────────────────────────────────────────────────
export function initChatWidget(): void {
  // Inject CSS
  const style = document.createElement("style");
  style.textContent = WIDGET_CSS;
  document.head.appendChild(style);

  // Inject HTML
  const wrapper = document.createElement("div");
  wrapper.innerHTML = WIDGET_HTML;
  document.body.appendChild(wrapper);

  // Element refs
  const trigger   = document.getElementById("aneri-chat-trigger")!;
  const panel     = document.getElementById("aneri-chat-panel")!;
  const closeBtn  = document.getElementById("aneri-close-btn")!;
  const messages  = document.getElementById("aneri-messages")!;
  const input     = document.getElementById("aneri-input") as HTMLInputElement;
  const sendBtn   = document.getElementById("aneri-send-btn")!;
  const chips     = document.querySelectorAll<HTMLButtonElement>(".aneri-chip");

  // Toggle panel
  function openPanel(): void  { panel.classList.add("aneri-open"); input.focus(); }
  function closePanel(): void { panel.classList.remove("aneri-open"); }

  trigger.addEventListener("click", () =>
    panel.classList.contains("aneri-open") ? closePanel() : openPanel()
  );
  closeBtn.addEventListener("click", closePanel);

  // Append a message bubble
  function addMessage(text: string, isUser: boolean): void {
    const row = document.createElement("div");
    row.className = `aneri-msg-row ${isUser ? "user" : "bot"}`;
    const bubble = document.createElement("div");
    bubble.className = `aneri-bubble ${isUser ? "user" : "bot"}`;
    bubble.innerHTML = isUser ? escapeHtml(text) : renderMarkdown(text);
    row.appendChild(bubble);
    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;
  }

  function escapeHtml(s: string): string {
    return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  }

  // Typing indicator
  function showTyping(): HTMLElement {
    const row = document.createElement("div");
    row.className = "aneri-msg-row bot";
    row.id = "aneri-typing-row";
    row.innerHTML = `
      <div class="aneri-bubble bot">
        <div class="aneri-typing">
          <span></span><span></span><span></span>
        </div>
      </div>`;
    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;
    return row;
  }
  function hideTyping(): void {
    document.getElementById("aneri-typing-row")?.remove();
  }

  // Send a message
  async function sendMessage(text: string): Promise<void> {
    const trimmed = text.trim();
    if (!trimmed) return;

    addMessage(trimmed, true);
    input.value = "";
    input.disabled = true;
    sendBtn.setAttribute("disabled", "true");

    const typingRow = showTyping();

    try {
      const res = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      hideTyping();
      if (res.ok) {
        const data = await res.json() as { response: string };
        addMessage(data.response, false);
      } else {
        addMessage("Hmm, something went wrong on my end. Please try again shortly!", false);
      }
    } catch {
      hideTyping();
      addMessage("Couldn't reach the AI backend. Please check your connection.", false);
    } finally {
      input.disabled = false;
      sendBtn.removeAttribute("disabled");
      input.focus();
    }
  }

  // Events
  sendBtn.addEventListener("click", () => sendMessage(input.value));
  input.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input.value);
    }
  });
  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const msg = chip.dataset.msg ?? "";
      openPanel();
      sendMessage(msg);
    });
  });
}
