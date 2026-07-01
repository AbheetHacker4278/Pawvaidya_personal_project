import fs from 'fs';
const logPath = 'C:\\\\Users\\\\Abheet seth\\\\.gemini\\\\antigravity\\\\brain\\\\fc9a9f21-b9ed-4c05-b683-cff7d76c2df0\\\\.system_generated\\\\logs\\\\overview.txt';
const data = fs.readFileSync(logPath, 'utf8');
const lines = data.split('\n');
for (const line of lines) {
    if (line.includes('8716')) {
        try {
            const parsed = JSON.parse(line);
            console.log("=== FULL USER REQUEST AND METADATA ===");
            console.log(parsed.content);
            if (parsed.additional_metadata) {
                console.log(JSON.stringify(parsed.additional_metadata, null, 2));
            } else {
                // If it's stored inside content or another field
                console.log(JSON.stringify(parsed, null, 2));
            }
        } catch (e) {
            console.log("Error parsing line:", e.message);
            console.log(line);
        }
    }
}
