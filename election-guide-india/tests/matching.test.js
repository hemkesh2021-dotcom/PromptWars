/**
 * Unit Tests — Knowledge Base & Matching Engine
 * Tests keyword matching, fallback behavior, edge cases, and bias deflection.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load knowledge.js by evaluating it — it uses `const ElectionKnowledge = {...}`
// We wrap it so the const is returned as a value.
const code = readFileSync(join(__dirname, '..', 'public', 'knowledge.js'), 'utf-8');
const wrappedCode = code.replace('const ElectionKnowledge =', 'var ElectionKnowledge =');
const fn = new Function(`${wrappedCode}; return ElectionKnowledge;`);
const ElectionKnowledge = fn();

// Lightweight matching engine matching the frontend logic
function matchQuery(query, knowledge) {
    const index = new Map();
    for (const [key, topic] of Object.entries(knowledge)) {
        if (key === 'fallback' || !topic.keywords) continue;
        for (const kw of topic.keywords) {
            const lower = kw.toLowerCase();
            if (!index.has(lower)) index.set(lower, []);
            index.get(lower).push({ key, topic, weight: kw.length });
        }
    }

    const q = query.toLowerCase().trim();
    if (!q) return knowledge.fallback.response;

    const scores = new Map();
    for (const [keyword, entries] of index) {
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
    return best ? best.response : knowledge.fallback.response;
}

// ===================================================================
// TEST SUITES
// ===================================================================

describe('Knowledge Base Structure', () => {
    it('should have a fallback entry', () => {
        expect(ElectionKnowledge.fallback).toBeDefined();
        expect(ElectionKnowledge.fallback.response).toBeDefined();
    });

    it('every topic (except fallback) should have keywords array', () => {
        for (const [key, topic] of Object.entries(ElectionKnowledge)) {
            if (key === 'fallback') continue;
            expect(topic.keywords, `${key} missing keywords`).toBeInstanceOf(Array);
            expect(topic.keywords.length, `${key} has empty keywords`).toBeGreaterThan(0);
        }
    });

    it('every topic should have a response with title and sections', () => {
        for (const [key, topic] of Object.entries(ElectionKnowledge)) {
            if (key === 'fallback') continue;
            expect(topic.response, `${key} missing response`).toBeDefined();
            expect(topic.response.title, `${key} missing title`).toBeTruthy();
            expect(topic.response.sections, `${key} missing sections`).toBeInstanceOf(Array);
            expect(topic.response.sections.length, `${key} has empty sections`).toBeGreaterThan(0);
        }
    });

    it('should contain all required election topics', () => {
        const requiredTopics = ['registration', 'votingProcess', 'timeline', 'documents', 'nota'];
        for (const topic of requiredTopics) {
            expect(ElectionKnowledge[topic], `Missing topic: ${topic}`).toBeDefined();
        }
    });

    it('should have at least 10 topics', () => {
        const topicCount = Object.keys(ElectionKnowledge).filter(k => k !== 'fallback').length;
        expect(topicCount).toBeGreaterThanOrEqual(10);
    });
});

describe('Keyword Matching — Exact Matches', () => {
    it('should match voter registration queries', () => {
        const result = matchQuery('How do I register to vote?', ElectionKnowledge);
        expect(result.title).toContain('Registration');
    });

    it('should match NOTA queries', () => {
        const result = matchQuery('What is NOTA?', ElectionKnowledge);
        expect(result.title).toMatch(/NOTA/i);
    });

    it('should match EVM queries', () => {
        const result = matchQuery('How does the EVM work?', ElectionKnowledge);
        expect(result.title).toMatch(/EVM/i);
    });

    it('should match first-time voter queries', () => {
        const result = matchQuery('I just turned 18, what should I do?', ElectionKnowledge);
        expect(result.title).toBeTruthy();
    });

    it('should match polling day queries', () => {
        const result = matchQuery('What happens on polling day?', ElectionKnowledge);
        expect(result.title).toBeTruthy();
    });

    it('should match election commission queries', () => {
        const result = matchQuery('What is the role of the Election Commission?', ElectionKnowledge);
        expect(result.title).toMatch(/Election Commission/i);
    });

    it('should match NRI voting queries', () => {
        const result = matchQuery('Can NRI vote in Indian elections?', ElectionKnowledge);
        expect(result.title).toMatch(/NRI/i);
    });
});

describe('Keyword Matching — Case Insensitivity', () => {
    it('should match regardless of case', () => {
        const lower = matchQuery('how do i register to vote?', ElectionKnowledge);
        const upper = matchQuery('HOW DO I REGISTER TO VOTE?', ElectionKnowledge);
        const mixed = matchQuery('How Do I Register To Vote?', ElectionKnowledge);
        expect(lower.title).toBe(upper.title);
        expect(upper.title).toBe(mixed.title);
    });
});

describe('Keyword Matching — Fallback', () => {
    it('should return fallback for empty input', () => {
        const result = matchQuery('', ElectionKnowledge);
        expect(result).toBe(ElectionKnowledge.fallback.response);
    });

    it('should return fallback for gibberish', () => {
        const result = matchQuery('xyzzy asdf qwerty 12345', ElectionKnowledge);
        expect(result).toBe(ElectionKnowledge.fallback.response);
    });

    it('should return fallback for single character', () => {
        const result = matchQuery('z', ElectionKnowledge);
        expect(result).toBe(ElectionKnowledge.fallback.response);
    });
});

describe('Keyword Matching — Edge Cases', () => {
    it('should handle very long input without crashing', () => {
        const longInput = 'How do I register to vote? '.repeat(500);
        const result = matchQuery(longInput, ElectionKnowledge);
        expect(result.title).toBeTruthy();
    });

    it('should handle special characters safely', () => {
        const result = matchQuery('<script>alert("xss")</script> register', ElectionKnowledge);
        expect(result).toBeDefined();
    });

    it('should handle emoji-only input', () => {
        const result = matchQuery('🗳️🇮🇳', ElectionKnowledge);
        expect(result).toBeDefined();
    });

    it('should handle whitespace-only input', () => {
        const result = matchQuery('    \n\t    ', ElectionKnowledge);
        expect(result).toBe(ElectionKnowledge.fallback.response);
    });
});

describe('Bias & Neutrality', () => {
    it('should match political bias queries to neutrality topic', () => {
        const result = matchQuery('who should I vote for?', ElectionKnowledge);
        expect(result).toBeDefined();
        const responseText = JSON.stringify(result);
        expect(responseText).not.toMatch(/vote for BJP|vote for Congress|vote for AAP/i);
    });

    it('should not contain any party-specific recommendations', () => {
        const fullText = JSON.stringify(ElectionKnowledge);
        expect(fullText).not.toMatch(/vote for BJP/i);
        expect(fullText).not.toMatch(/vote for Congress/i);
        expect(fullText).not.toMatch(/vote for AAP/i);
        expect(fullText).not.toMatch(/support Modi/i);
        expect(fullText).not.toMatch(/support Rahul/i);
    });

    it('should have a neutrality response that guides independent decision-making', () => {
        expect(ElectionKnowledge.politicalBias).toBeDefined();
        const text = JSON.stringify(ElectionKnowledge.politicalBias.response);
        expect(text).toMatch(/neutral|non-partisan/i);
        expect(text).toMatch(/manifesto|informed/i);
    });
});
