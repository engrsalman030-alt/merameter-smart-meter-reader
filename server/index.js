import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

app.post('/api/analyze', async (req, res) => {
  try {
    const { base64Image, knownSerialNumbers = [] } = req.body;
    if (!base64Image) return res.status(400).json({ error: "No image provided" });

    // Strip the "data:image/...;base64," prefix if present
    const rawData = base64Image.includes(",") ? base64Image.split(",")[1] : base64Image;

    const knownSerialsText = knownSerialNumbers.length > 0
      ? `\nKnown valid serial numbers: ${knownSerialNumbers.join(', ')}.`
      : '';

    // Use gemini-flash-latest as it often has better availability/stability in some regions
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const prompt = `You are an expert utility meter inspector in Pakistan. 
Carefully analyze the image of the electricity/utility meter to extract accurate information.

GUIDELINES:
1. **Model & Type**: Identify if the meter is Digital (LCD) or Mechanical (Analog).
2. **Serial Number**: Search for the meter's unique serial number. It is usually printed on the housing, often near a barcode or the utility logo (LESCO, K-Electric, etc.).
3. **Current Reading (kWh)**:
   - For **Mechanical** meters: The last digit is often in a **RED BOX** or has a decimal line. This is a decimal (e.g., if you see 1234[5], the reading is 1234.5).
   - For **Digital** meters: Look for the number followed by "kWh". If there is a decimal point on the LCD, include it.
4. **Consumed Units**: Some digital meters show a "Units" or "Cons" value on a specific screen (often for monthly consumption). If visible, extract it. Otherwise, return null.

OUTPUT FORMAT:
Return ONLY a JSON object with these keys:
{
  "serialNumber": "string",
  "readingValue": number,
  "consumedUnits": number | null,
  "confidence": number (0.0 to 1.0),
  "explanation": "string (briefly explain where you found the serial and how you interpreted the reading digits)"
}

${knownSerialsText}`;

    const result = await model.generateContent([
      { inlineData: { mimeType: "image/jpeg", data: rawData } },
      { text: prompt }
    ]);

    const resultResponse = await result.response;
    let text = resultResponse.text().trim();

    // The model might still wrap JSON in markdown blocks even with responseMimeType
    if (text.startsWith("```")) {
      const match = text.match(/```(?:json)?\s*([\s\S]+?)```/i);
      if (match) text = match[1];
    }

    const parsedResult = JSON.parse(text);
    res.json(parsedResult);

  } catch (err) {
    console.error("Server AI Error:", err);
    res.status(500).json({ error: 'AI analysis failed', details: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));