import fetch from "node-fetch";
import fs from "fs";

const base64 = fs.readFileSync("meter.txt", "utf-8").replace(/\n/g, "");

async function testAI() {
  try {
    const response = await fetch("http://localhost:5000/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base64Image: base64 }) // <-- send raw Base64 only
    });

    const data = await response.json();
    console.log("AI Result:", data);
  } catch (err) {
    console.error("Fetch Error:", err);
  }
}

testAI();
