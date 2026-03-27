import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = process.env.GEMINI_API_KEY || "";

export const analyzeBidDocument = async (text: string) => {
  if (!API_KEY) {
    throw new Error("Gemini API key is missing. Please add it to your secrets.");
  }

  const genAI = new GoogleGenAI({ apiKey: API_KEY });
  const model = "gemini-3-flash-preview";

  const prompt = `
    You are an expert in Indian Government Tendering and GeM (Government e-Marketplace) bids.
    Analyze the following text extracted from a bid/tender document and identify the following key details:
    1. Required Documents for participation.
    2. Earnest Money Deposit (EMD) amount and details.
    3. Technical Bid Submission Deadline.
    4. Price Bid Submission Deadline.
    5. Additional Dos (specific instructions or actions required from the bidder) mentioned in the ATC (Additional Terms and Conditions) section.

    Format the response as a structured JSON object.

    Bid Document Text:
    ${text.substring(0, 20000)}
  `;

  try {
    const response = await genAI.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            requiredDocuments: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  document: { type: Type.STRING },
                  reason: { type: Type.STRING }
                },
                required: ["document", "reason"]
              }
            },
            emdDetails: {
              type: Type.STRING,
              description: "Amount and details of Earnest Money Deposit"
            },
            technicalDeadline: {
              type: Type.STRING,
              description: "Technical Bid Submission Deadline"
            },
            priceDeadline: {
              type: Type.STRING,
              description: "Price Bid Submission Deadline"
            },
            summary: {
              type: Type.STRING,
              description: "A brief summary of the bid requirements"
            },
            additionalDos: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  instruction: { type: Type.STRING },
                  reason: { type: Type.STRING }
                },
                required: ["instruction", "reason"]
              },
              description: "Additional Dos or specific instructions from the ATC section"
            }
          },
          required: ["requiredDocuments", "emdDetails", "technicalDeadline", "priceDeadline", "summary", "additionalDos"]
        }
      }
    });
    
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error analyzing bid:", error);
    throw error;
  }
};
