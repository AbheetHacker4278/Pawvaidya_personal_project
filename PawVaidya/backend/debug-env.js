import 'dotenv/config';
console.log("Checking NVIDIA_NIM_API_KEY...");
const key = process.env.NVIDIA_NIM_API_KEY;
if (key) {
    console.log("✅ Key found!");
    console.log("Key length:", key.length);
    console.log("Key starts with:", key.substring(0, 10));
} else {
    console.log("❌ Key NOT found in environment! Check .env formatting.");
}
