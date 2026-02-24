
import Tesseract from 'tesseract.js';

export interface ScanResult {
    serialNumber: string;
    readingValue: number;
    consumedUnits: number;
    confidence: number;
    explanation: string;
}

class OfflineScanService {
    /**
     * Preprocesses the image to improve OCR accuracy.
     * This includes grayscale conversion and contrast enhancement.
     */
    private async preprocessImage(base64Image: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve(base64Image); // Fallback to original
                    return;
                }

                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;

                // Apply Grayscale and Contrast enhancement
                for (let i = 0; i < data.length; i += 4) {
                    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                    // Enhancing contrast: values further from 128 are pushed further
                    const enhanced = avg < 128 ? Math.max(0, avg - 40) : Math.min(255, avg + 40);
                    data[i] = data[i + 1] = data[i + 2] = enhanced;
                }

                ctx.putImageData(imageData, 0, 0);
                resolve(canvas.toDataURL('image/jpeg', 0.9));
            };
            img.onerror = reject;
            img.src = base64Image;
        });
    }

    async scan(base64Image: string, knownSerials: string[]): Promise<ScanResult> {
        try {
            // 1. Preprocess for accuracy
            const processedImage = await this.preprocessImage(base64Image);

            // 2. Perform OCR
            const { data: { text, confidence } } = await Tesseract.recognize(processedImage, 'eng', {
                logger: m => console.log(m),
            });

            console.log("Offline OCR Raw Text:", text);

            // 3. Extract data with patterns (Utility Meter specific)
            // Look for 5-8 digit numbers for readings and serials
            const numbers = text.match(/\d+/g) || [];

            let serialNumber = 'UNKNOWN';
            let readingValue = 0;

            // Try to find a known serial first
            for (const known of knownSerials) {
                if (text.includes(known)) {
                    serialNumber = known;
                    break;
                }
            }

            // If no known serial, take the first 4-8 digit number that isn't the reading
            const potentialNumbers = numbers.filter(n => n.length >= 4);
            if (serialNumber === 'UNKNOWN' && potentialNumbers.length > 0) {
                serialNumber = potentialNumbers[0];
            }

            // Find reading (usually the longest sequence or one following a keyword like 'kWh')
            const readingMatches = text.match(/(\d{3,})\s*(kWh|units)/i) || text.match(/kWh\s*:?\s*(\d{3,})/i);
            if (readingMatches) {
                readingValue = parseFloat(readingMatches[1]);
            } else if (potentialNumbers.length > 1) {
                readingValue = parseFloat(potentialNumbers[1]);
            }

            return {
                serialNumber,
                readingValue,
                consumedUnits: 0, // Calculated later in business logic
                confidence: confidence / 100,
                explanation: "Offline OCR extracted numerical sequences from image."
            };
        } catch (err) {
            console.error("Offline Scan Failed:", err);
            throw err;
        }
    }
}

export const offlineScanService = new OfflineScanService();
