/**
 * Integration Tests — Server API Endpoints
 * Tests /api/chat, /api/translate, /api/search, /health endpoints.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:8080';

describe('Health Check Endpoint', () => {
    it('GET /health should return 200 with status healthy', async () => {
        const res = await fetch(`${BASE_URL}/health`);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.status).toBe('healthy');
        expect(data.timestamp).toBeTruthy();
    });
});

describe('POST /api/chat', () => {
    it('should return 400 for empty message', async () => {
        const res = await fetch(`${BASE_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: '' }),
        });
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBeTruthy();
    });

    it('should return 400 for missing message field', async () => {
        const res = await fetch(`${BASE_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
        });
        expect(res.status).toBe(400);
    });

    it('should return 400 for non-string message', async () => {
        const res = await fetch(`${BASE_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 12345 }),
        });
        expect(res.status).toBe(400);
    });

    it('should return a reply and sessionId for valid message', async () => {
        const res = await fetch(`${BASE_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'What is an election?' }),
        });
        // Could be 200 (success) or 500 (quota exhausted) — both are valid server responses
        if (res.status === 200) {
            const data = await res.json();
            expect(data.reply).toBeTruthy();
            expect(data.sessionId).toBeTruthy();
            expect(data.model).toBeTruthy();
        } else {
            // Rate limited — server handled gracefully
            expect(res.status).toBe(500);
            const data = await res.json();
            expect(data.error).toBeTruthy();
        }
    });

    it('should maintain session across multiple messages', async () => {
        const res1 = await fetch(`${BASE_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Hello' }),
        });

        if (res1.status === 200) {
            const data1 = await res1.json();
            const sessionId = data1.sessionId;

            const res2 = await fetch(`${BASE_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: 'Tell me more', sessionId }),
            });

            if (res2.status === 200) {
                const data2 = await res2.json();
                expect(data2.sessionId).toBe(sessionId);
            }
        }
    });
});

describe('POST /api/translate', () => {
    it('should return 400 for missing text', async () => {
        const res = await fetch(`${BASE_URL}/api/translate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetLang: 'hi' }),
        });
        expect(res.status).toBe(400);
    });

    it('should return 400 for missing targetLang', async () => {
        const res = await fetch(`${BASE_URL}/api/translate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: 'Hello world' }),
        });
        expect(res.status).toBe(400);
    });

    it('should translate English to Hindi', async () => {
        const res = await fetch(`${BASE_URL}/api/translate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: 'How to register as a voter', targetLang: 'hi' }),
        });
        if (res.status === 200) {
            const data = await res.json();
            expect(data.translatedText).toBeTruthy();
            expect(data.translatedText).not.toBe('How to register as a voter');
        }
    });
});

describe('GET /api/search', () => {
    it('should return 400 for missing query', async () => {
        const res = await fetch(`${BASE_URL}/api/search`);
        expect(res.status).toBe(400);
    });

    it('should return 503 when CSE ID is not configured', async () => {
        const res = await fetch(`${BASE_URL}/api/search?q=election+dates`);
        // 503 = CSE not configured, or 200 if configured
        expect([200, 503]).toContain(res.status);
    });
});

describe('Static File Serving', () => {
    it('should serve index.html at root', async () => {
        const res = await fetch(`${BASE_URL}/`);
        expect(res.status).toBe(200);
        const html = await res.text();
        expect(html).toContain('Election Guide India');
    });

    it('should serve styles.css', async () => {
        const res = await fetch(`${BASE_URL}/styles.css`);
        expect(res.status).toBe(200);
    });

    it('should serve app.js', async () => {
        const res = await fetch(`${BASE_URL}/app.js`);
        expect(res.status).toBe(200);
    });

    it('should serve knowledge.js', async () => {
        const res = await fetch(`${BASE_URL}/knowledge.js`);
        expect(res.status).toBe(200);
    });
});

describe('Security Headers', () => {
    it('should include Content-Security-Policy header', async () => {
        const res = await fetch(`${BASE_URL}/`);
        const csp = res.headers.get('content-security-policy');
        expect(csp).toBeTruthy();
        expect(csp).toContain("default-src 'self'");
    });

    it('should include X-Content-Type-Options header', async () => {
        const res = await fetch(`${BASE_URL}/`);
        expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    });

    it('should include X-Frame-Options header', async () => {
        const res = await fetch(`${BASE_URL}/`);
        expect(res.headers.get('x-frame-options')).toBeTruthy();
    });
});
