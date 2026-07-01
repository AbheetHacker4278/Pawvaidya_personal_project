import fs from 'fs';

const logPath = 'C:\\Users\\Abheet seth\\.gemini\\antigravity\\brain\\fc9a9f21-b9ed-4c05-b683-cff7d76c2df0\\.system_generated\\logs\\overview.txt';
const content = fs.readFileSync(logPath, 'utf8');
const lines = content.split('\n');
console.log("Total lines:", lines.length);

const targetLine = lines[225]; // 0-based index for line 226
if (targetLine) {
    try {
        const parsed = JSON.parse(targetLine);
        console.log("Parsed content successfully:");
        console.log(parsed.content);
    } catch (e) {
        console.log("JSON parse error:", e);
        console.log("Raw line substring:", targetLine.substring(0, 1000));
    }
} else {
    console.log("Line 226 not found.");
}
