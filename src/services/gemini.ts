import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = process.env.GEMINI_API_KEY || "";

export const analyzeBidRate = async (scopeOfWork: string, estimatedValue: string) => {
  if (!API_KEY) {
    throw new Error("Gemini API key is missing. Please add it to your secrets.");
  }

  const genAI = new GoogleGenAI({ apiKey: API_KEY });
  const model = "gemini-3-flash-preview";

  const prompt = `
    You are an expert in Indian Government Tendering, GeM (Government e-Marketplace) bids, and cost estimation.
    Analyze the following scope of work and estimated bid value to suggest a competitive bidding rate strategy.
    Determine if the bidder should quote below, at par, or above the estimated value, and suggest a percentage range.
    Provide a detailed reasoning based on the complexity, typical margins, and risks associated with the scope of work.

    Scope of Work:
    ${scopeOfWork}

    Estimated Bid Value:
    ${estimatedValue}
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
            suggestion: {
              type: Type.STRING,
              description: "The primary suggestion: 'Below', 'At Par', or 'Above'"
            },
            percentageRange: {
              type: Type.STRING,
              description: "Suggested percentage range (e.g., '5% to 10% below')"
            },
            reasoning: {
              type: Type.STRING,
              description: "Detailed reasoning for the suggestion based on the scope of work"
            },
            riskFactors: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Potential risk factors to consider when quoting"
            }
          },
          required: ["suggestion", "percentageRange", "reasoning", "riskFactors"]
        }
      }
    });
    
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error analyzing bid rate:", error);
    throw error;
  }
};

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
