export async function analyzeMeterImage(base64Image: string, knownSerialNumbers: string[] = []) {
  const cleaned = base64Image.replace(/^data:image\/\w+;base64,/, '');

  const response = await fetch("http://localhost:5000/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base64Image: cleaned, knownSerialNumbers })
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error || "AI analysis failed");
  }

  return data;
}
