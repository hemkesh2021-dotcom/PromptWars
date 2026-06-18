/**
 * Election Guide India — Frontend Application Logic
 *
 * Architecture:
 *   BackendClient   — Calls the Express API endpoints (Gemini, Translate, Search)
 *   MatchingEngine  — Local fallback when backend is unavailable
 *   MessageRenderer — Safe DOM builder (no raw innerHTML on user content)
 *   UserContext     — Tracks personalization state (age, registration, location)
 *   App            — Orchestrator binding UI events
 *
 * Security:
 *   - User input always set via textContent (never innerHTML)
 *   - Assistant HTML is sanitized before rendering
 *   - All API calls go through the secure backend (no API keys in frontend)
 */

document.addEventListener('DOMContentLoaded', () => {

    // ===================================================================
    // CONSTANTS
    // ===================================================================

    const API_BASE = window.location.origin;

    // ===================================================================
    // SANITIZATION UTILITY
    // ===================================================================

    function sanitizeHTML(html) {
        const temp = document.createElement('div');
        temp.innerHTML = html;
        const dangerous = temp.querySelectorAll('script, iframe, object, embed, form, input, link, style');
        dangerous.forEach(el => el.remove());
        temp.querySelectorAll('*').forEach(el => {
            for (const attr of [...el.attributes]) {
                if (attr.name.startsWith('on') || (attr.name === 'href' && attr.value.startsWith('javascript:'))) {
                    el.removeAttribute(attr.name);
                }
            }
        });
        return temp.innerHTML;
    }

    // ===================================================================
    // BACKEND CLIENT — Calls the secure server APIs
    // ===================================================================

    class BackendClient {
        constructor(baseUrl) {
            this.baseUrl = baseUrl;
            this.sessionId = null;
            this.available = true;
        }

        /**
         * Send a chat message to the Gemini-powered backend.
         * @param {string} message - User's message
         * @returns {Promise<{reply: string, sessionId: string}|null>}
         */
        async chat(message) {
            try {
                const res = await fetch(`${this.baseUrl}/api/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message,
                        sessionId: this.sessionId,
                    }),
                });

                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.error || `HTTP ${res.status}`);
                }

                const data = await res.json();
                this.sessionId = data.sessionId;
                this.available = true;
                return data;

            } catch (error) {
                console.warn('[BackendClient] Chat failed:', error.message);
                this.available = false;
                return null;
            }
        }

        /**
         * Translate text via the backend.
         * @param {string} text
         * @param {string} targetLang - ISO language code (e.g., 'hi', 'ta', 'bn')
         * @returns {Promise<{translatedText: string}|null>}
         */
        async translate(text, targetLang) {
            try {
                const res = await fetch(`${this.baseUrl}/api/translate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text, targetLang }),
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return await res.json();
            } catch (error) {
                console.warn('[BackendClient] Translation failed:', error.message);
                return null;
            }
        }

        /**
         * Search for real-time election info.
         * @param {string} query
         * @returns {Promise<{results: Array}|null>}
         */
        async search(query) {
            try {
                const res = await fetch(`${this.baseUrl}/api/search?q=${encodeURIComponent(query)}`);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return await res.json();
            } catch (error) {
                console.warn('[BackendClient] Search failed:', error.message);
                return null;
            }
        }

        /** Reset session for new conversation */
        resetSession() {
            this.sessionId = null;
        }
    }

    // ===================================================================
    // LOCAL MATCHING ENGINE — Fallback when backend is down
    // ===================================================================

    class MatchingEngine {
        constructor(knowledge) {
            this.index = new Map();
            this.knowledge = knowledge;
            for (const [key, topic] of Object.entries(knowledge)) {
                if (key === 'fallback' || !topic.keywords) continue;
                for (const kw of topic.keywords) {
                    const lower = kw.toLowerCase();
                    if (!this.index.has(lower)) this.index.set(lower, []);
                    this.index.get(lower).push({ key, topic, weight: kw.length });
                }
            }
        }

        match(query) {
            const q = query.toLowerCase().trim();
            if (!q) return this.knowledge.fallback.response;
            const scores = new Map();
            for (const [keyword, entries] of this.index) {
                if (q.includes(keyword)) {
                    for (const { key, topic, weight } of entries) {
                        if (!scores.has(key)) scores.set(key, { topic, score: 0 });
                        scores.get(key).score += weight;
                    }
                }
            }
            let best = null, bestScore = 0;
            for (const { topic, score } of scores.values()) {
                if (score > bestScore) { bestScore = score; best = topic; }
            }
            return best ? best.response : this.knowledge.fallback.response;
        }
    }

    // ===================================================================
    // MESSAGE RENDERER
    // ===================================================================

    class MessageRenderer {
        static createMessage(content, role) {
            const msgDiv = document.createElement('div');
            msgDiv.className = `message ${role}`;
            msgDiv.setAttribute('role', 'article');
            msgDiv.setAttribute('aria-label', `${role === 'user' ? 'You' : 'Assistant'} said`);

            const avatar = document.createElement('div');
            avatar.className = 'message-avatar';
            avatar.setAttribute('aria-hidden', 'true');
            avatar.textContent = role === 'user' ? '👤' : '🏛️';

            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';

            const bubble = document.createElement('div');
            bubble.className = 'message-bubble';

            if (role === 'user') {
                bubble.textContent = content;
            } else {
                bubble.innerHTML = sanitizeHTML(content);
            }

            const timeDiv = document.createElement('div');
            timeDiv.className = 'message-time';
            timeDiv.setAttribute('aria-hidden', 'true');
            timeDiv.textContent = new Date().toLocaleTimeString('en-IN', {
                hour: '2-digit', minute: '2-digit', hour12: true,
            });

            contentDiv.appendChild(bubble);
            contentDiv.appendChild(timeDiv);
            msgDiv.appendChild(avatar);
            msgDiv.appendChild(contentDiv);
            return msgDiv;
        }

        static createTypingIndicator() {
            const msgDiv = document.createElement('div');
            msgDiv.className = 'message assistant';
            msgDiv.setAttribute('role', 'status');
            msgDiv.setAttribute('aria-label', 'Assistant is typing');

            const avatar = document.createElement('div');
            avatar.className = 'message-avatar';
            avatar.setAttribute('aria-hidden', 'true');
            avatar.textContent = '🏛️';

            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';

            const bubble = document.createElement('div');
            bubble.className = 'message-bubble';

            const typing = document.createElement('div');
            typing.className = 'typing-indicator';
            for (let i = 0; i < 3; i++) {
                const dot = document.createElement('div');
                dot.className = 'typing-dot';
                typing.appendChild(dot);
            }

            bubble.appendChild(typing);
            contentDiv.appendChild(bubble);
            msgDiv.appendChild(avatar);
            msgDiv.appendChild(contentDiv);
            return msgDiv;
        }

        /** Create a connection status banner */
        static createStatusBanner(isOnline) {
            const banner = document.createElement('div');
            banner.className = `connection-banner ${isOnline ? 'online' : 'offline'}`;
            banner.innerHTML = isOnline
                ? '🟢 Connected to AI — powered by Google Gemini'
                : '🟡 AI unavailable — using offline knowledge base';
            return banner;
        }
    }

    // ===================================================================
    // RESPONSE FORMATTER (for local fallback)
    // ===================================================================

    function formatResponse(data) {
        const parts = [];
        if (data.title) parts.push(`<h3>${data.title}</h3>`);
        for (const section of data.sections) {
            if (section.infoBox) {
                const boxClass = section.type === 'green' ? 'green' : section.type === 'blue' ? 'blue' : '';
                parts.push(`<div class="info-box ${boxClass}">${section.content}</div>`);
                continue;
            }
            if (section.heading) parts.push(`<h4>${section.heading}</h4>`);
            if (section.content) parts.push(`<p>${section.content}</p>`);
            if (section.list) {
                parts.push(`<ul>${section.list.map(i => `<li>${i}</li>`).join('')}</ul>`);
            }
        }
        return parts.join('');
    }

    // ===================================================================
    // APP — Main Orchestrator
    // ===================================================================

    const messagesScroll = document.getElementById('messagesScroll');
    const welcomeCard = document.getElementById('welcomeCard');
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const clearBtn = document.getElementById('clearBtn');
    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.getElementById('menuBtn');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const particlesContainer = document.getElementById('particles');
    const langSelect = document.getElementById('langSelect');

    let conversationActive = false;
    let pendingTimeout = null;
    let isSending = false;

    const backend = new BackendClient(API_BASE);
    const localEngine = new MatchingEngine(ElectionKnowledge);
    let selectedLang = 'en'; // Default language

    // ===== PARTICLES =====
    function createParticles() {
        const colors = ['rgba(255,153,51,0.25)', 'rgba(19,136,8,0.2)', 'rgba(99,102,241,0.2)'];
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < 20; i++) {
            const p = document.createElement('div');
            p.className = 'particle';
            p.style.left = Math.random() * 100 + '%';
            p.style.animationDuration = (12 + Math.random() * 18) + 's';
            p.style.animationDelay = Math.random() * 10 + 's';
            const size = (2 + Math.random() * 3) + 'px';
            p.style.width = size;
            p.style.height = size;
            p.style.background = colors[Math.floor(Math.random() * colors.length)];
            fragment.appendChild(p);
        }
        particlesContainer.appendChild(fragment);
    }

    document.addEventListener('visibilitychange', () => {
        const state = document.hidden ? 'paused' : 'running';
        particlesContainer.querySelectorAll('.particle').forEach(p => {
            p.style.animationPlayState = state;
        });
    });

    createParticles();

    // ===== LANGUAGE SELECTOR =====
    if (langSelect) {
        langSelect.addEventListener('change', (e) => {
            selectedLang = e.target.value;
        });
    }

    // ===== INPUT HANDLING =====
    let inputDebounce = null;
    messageInput.addEventListener('input', () => {
        sendBtn.disabled = !messageInput.value.trim() || isSending;
        clearTimeout(inputDebounce);
        inputDebounce = setTimeout(() => {
            messageInput.style.height = 'auto';
            messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
        }, 50);
    });

    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (messageInput.value.trim() && !isSending) handleSend();
        }
    });

    sendBtn.addEventListener('click', () => {
        if (!isSending) handleSend();
    });

    // ===== SUGGESTION CHIPS & QUICK TOPICS =====
    document.addEventListener('click', (e) => {
        const chip = e.target.closest('.suggestion-chip, .topic-btn');
        if (chip && !isSending) {
            const query = chip.dataset.query;
            if (query) {
                messageInput.value = query;
                handleSend();
                closeSidebar();
            }
        }
    });

    // ===== SIDEBAR =====
    menuBtn.addEventListener('click', () => {
        sidebar.classList.add('open');
        sidebarOverlay.classList.add('active');
    });

    sidebarOverlay.addEventListener('click', closeSidebar);
    sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('collapsed'));

    function closeSidebar() {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');
    }

    // ===== CLEAR =====
    clearBtn.addEventListener('click', () => {
        if (pendingTimeout) {
            clearTimeout(pendingTimeout);
            pendingTimeout = null;
        }

        conversationActive = false;
        isSending = false;

        while (messagesScroll.firstChild) {
            messagesScroll.removeChild(messagesScroll.firstChild);
        }
        messagesScroll.appendChild(welcomeCard);
        welcomeCard.style.display = '';
        welcomeCard.style.animation = 'fadeInUp 0.5s ease-out';

        // Reset backend session for fresh conversation
        backend.resetSession();
    });

    // ===== SEND MESSAGE =====
    async function handleSend() {
        const text = messageInput.value.trim();
        if (!text || isSending) return;

        isSending = true;
        sendBtn.disabled = true;

        // Hide welcome card on first message
        if (!conversationActive) {
            welcomeCard.style.display = 'none';
            conversationActive = true;
        }

        // Render user message
        messagesScroll.appendChild(MessageRenderer.createMessage(text, 'user'));
        scrollToBottom();

        // Reset input
        messageInput.value = '';
        messageInput.style.height = 'auto';

        // Show typing indicator
        const typingEl = MessageRenderer.createTypingIndicator();
        messagesScroll.appendChild(typingEl);
        scrollToBottom();

        let responseHTML = '';

        try {
            // Try backend (Gemini) first
            const result = await backend.chat(text);

            if (result && result.reply) {
                responseHTML = result.reply;

                // If user selected a non-English language, translate the response
                if (selectedLang !== 'en') {
                    const translated = await backend.translate(result.reply, selectedLang);
                    if (translated && translated.translatedText) {
                        responseHTML = translated.translatedText;
                    }
                }
            } else {
                // Fallback to local knowledge base
                const fallbackData = localEngine.match(text);
                responseHTML = formatResponse(fallbackData);
                responseHTML += '<div class="info-box">📡 <strong>Note:</strong> This response is from the offline knowledge base. Reconnecting to AI...</div>';
            }
        } catch (error) {
            console.error('[handleSend] Error:', error);
            const fallbackData = localEngine.match(text);
            responseHTML = formatResponse(fallbackData);
            responseHTML += '<div class="info-box">📡 <strong>Note:</strong> AI is temporarily unavailable. Showing cached response.</div>';
        }

        // Remove typing indicator and show response
        typingEl.remove();
        messagesScroll.appendChild(MessageRenderer.createMessage(responseHTML, 'assistant'));
        scrollToBottom();

        isSending = false;
        sendBtn.disabled = !messageInput.value.trim();
    }

    function scrollToBottom() {
        requestAnimationFrame(() => {
            messagesScroll.scrollTop = messagesScroll.scrollHeight;
        });
    }

    // ===== TIMELINE STEP CLICK =====
    document.querySelectorAll('.timeline-step').forEach(step => {
        step.setAttribute('role', 'button');
        step.setAttribute('tabindex', '0');
        step.addEventListener('click', () => {
            if (!isSending) {
                messageInput.value = 'Explain the election timeline';
                handleSend();
                closeSidebar();
            }
        });
        step.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                step.click();
            }
        });
    });

    // ===== INITIAL HEALTH CHECK =====
    (async () => {
        try {
            const res = await fetch(`${API_BASE}/health`);
            if (res.ok) {
                console.log('✅ Backend connected — Gemini AI active');
            }
        } catch {
            console.warn('⚠️ Backend not available — using offline mode');
        }
    })();
});
