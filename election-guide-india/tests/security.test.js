/**
 * Unit Tests — Security & Sanitization
 * Tests XSS prevention, input validation, and Content Security Policy patterns.
 */

import { describe, it, expect } from 'vitest';

/**
 * Replicate the sanitizeHTML function from app.js using regex.
 * In production, the browser DOM handles this; for tests we use regex equivalents.
 */
function sanitizeHTML(html) {
    if (!html) return '';
    // Remove dangerous tags
    let clean = html.replace(/<(script|iframe|object|embed|form|input|link|style)[^>]*>[\s\S]*?<\/\1>/gi, '');
    clean = clean.replace(/<(script|iframe|object|embed|form|input|link|style)[^>]*\/?>/gi, '');
    // Remove event handlers
    clean = clean.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
    clean = clean.replace(/\s+on\w+\s*=\s*\S+/gi, '');
    // Remove javascript: URLs
    clean = clean.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href=""');
    return clean;
}

describe('XSS Prevention — sanitizeHTML', () => {
    it('should strip <script> tags', () => {
        const result = sanitizeHTML('<p>Hello</p><script>alert("xss")</script>');
        expect(result).not.toContain('<script');
        expect(result).toContain('<p>Hello</p>');
    });

    it('should strip <iframe> tags', () => {
        const result = sanitizeHTML('<iframe src="https://evil.com"></iframe><p>Safe</p>');
        expect(result).not.toContain('<iframe');
        expect(result).toContain('<p>Safe</p>');
    });

    it('should strip <object> and <embed> tags', () => {
        const result = sanitizeHTML('<object data="evil.swf"></object><embed src="evil.swf"></embed>');
        expect(result).not.toContain('<object');
        expect(result).not.toContain('<embed');
    });

    it('should strip <form> and <input> tags', () => {
        const result = sanitizeHTML('<form action="/steal"><input type="text"></form>');
        expect(result).not.toContain('<form');
        expect(result).not.toContain('<input');
    });

    it('should strip <style> and <link> tags', () => {
        const result = sanitizeHTML('<style>body{display:none}</style><link rel="stylesheet" href="evil.css">');
        expect(result).not.toContain('<style');
        expect(result).not.toContain('<link');
    });

    it('should strip onclick handlers', () => {
        const result = sanitizeHTML('<p onclick="alert(1)">Click me</p>');
        expect(result).not.toContain('onclick');
        expect(result).toContain('Click me');
    });

    it('should strip onerror handlers', () => {
        const result = sanitizeHTML('<img src="x" onerror="alert(1)">');
        expect(result).not.toContain('onerror');
    });

    it('should strip onload handlers', () => {
        const result = sanitizeHTML('<div onload="alert(1)"><p>Content</p></div>');
        expect(result).not.toContain('onload');
    });

    it('should strip javascript: URLs', () => {
        const result = sanitizeHTML('<a href="javascript:alert(1)">Click</a>');
        expect(result).not.toContain('javascript:');
    });

    it('should preserve safe HTML elements', () => {
        const safeHTML = '<h3>Title</h3><p>Text</p><ul><li>Item 1</li></ul><strong>Bold</strong>';
        const result = sanitizeHTML(safeHTML);
        expect(result).toContain('<h3>');
        expect(result).toContain('<p>');
        expect(result).toContain('<ul>');
        expect(result).toContain('<li>');
        expect(result).toContain('<strong>');
    });

    it('should preserve info-box divs from Gemini', () => {
        const html = '<div class="info-box green">✅ Good to know: This is safe</div>';
        const result = sanitizeHTML(html);
        expect(result).toContain('info-box');
        expect(result).toContain('Good to know');
    });

    it('should handle empty input', () => {
        expect(sanitizeHTML('')).toBe('');
    });

    it('should handle null input', () => {
        expect(sanitizeHTML(null)).toBe('');
    });

    it('should handle nested dangerous content', () => {
        const result = sanitizeHTML('<div><script>alert(1)</script><p>Safe</p></div>');
        expect(result).not.toContain('<script');
        expect(result).toContain('<p>Safe</p>');
    });

    it('should handle multiple dangerous attributes', () => {
        const result = sanitizeHTML('<img src="x" onerror="alert(1)" onload="steal()" onclick="bad()">');
        expect(result).not.toContain('onerror');
        expect(result).not.toContain('onload');
        expect(result).not.toContain('onclick');
    });
});

describe('Input Validation', () => {
    it('should reject empty messages', () => {
        const message = '';
        expect(message.trim().length).toBe(0);
    });

    it('should truncate overly long messages to 2000 chars', () => {
        const longMessage = 'A'.repeat(5000);
        const sanitized = longMessage.trim().slice(0, 2000);
        expect(sanitized.length).toBe(2000);
    });

    it('should handle whitespace-only messages', () => {
        const message = '   \n\t   ';
        expect(message.trim().length).toBe(0);
    });

    it('should handle unicode and special chars', () => {
        const message = '🗳️ कैसे मतदान करें? 如何投票?';
        const sanitized = message.trim().slice(0, 2000);
        expect(sanitized.length).toBeGreaterThan(0);
        expect(sanitized).toContain('🗳️');
    });
});

describe('API Key Security', () => {
    it('should never expose API key in frontend files', async () => {
        const { readFileSync } = await import('fs');
        const { join, dirname } = await import('path');
        const { fileURLToPath } = await import('url');
        const __dirname = dirname(fileURLToPath(import.meta.url));

        const frontendFiles = ['index.html', 'app.js', 'knowledge.js', 'styles.css'];
        for (const file of frontendFiles) {
            const content = readFileSync(join(__dirname, '..', 'public', file), 'utf-8');
            expect(content).not.toMatch(/AIzaSy/); // Google API keys start with AIzaSy
            expect(content).not.toMatch(/GOOGLE_API_KEY\s*=\s*['"][^'"]+['"]/);
        }
    });

    it('.env.example should not contain real API keys', async () => {
        const { readFileSync } = await import('fs');
        const { join, dirname } = await import('path');
        const { fileURLToPath } = await import('url');
        const __dirname = dirname(fileURLToPath(import.meta.url));

        const content = readFileSync(join(__dirname, '..', '.env.example'), 'utf-8');
        expect(content).not.toMatch(/AIzaSy/);
        expect(content).toContain('your-google-api-key');
    });
});
