import dotenv from 'dotenv';
dotenv.config();

const key = process.env.GEMINI_API_KEY;
console.log('Key tersedia:', key ? `Ya (${key.substring(0, 10)}...)` : 'TIDAK ADA - cek .env');

if (!key) process.exit(1);

const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: 'Balas hanya dengan kata: OK' }] }],
            generationConfig: { temperature: 0, maxOutputTokens: 10 }
        })
    }
);

const data = await response.json();
console.log('Status HTTP:', response.status);
console.log('Response:', JSON.stringify(data, null, 2));
