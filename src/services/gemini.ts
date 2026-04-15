import { GoogleGenAI, Type } from "@google/genai";

const getApiKey = () => {
  const savedKey = localStorage.getItem('ad_pro_gemini_key');
  return savedKey || process.env.GEMINI_API_KEY || "";
};

export const analyzeBidRate = async (
  scopeOfWork: string, 
  estimatedValue: string,
  materialCost: string,
  laborCost: string,
  profitMargin: string,
  competitionLevel: string,
  projectDuration: string,
  providedApiKey?: string
) => {
  const apiKey = providedApiKey || getApiKey();
  if (!apiKey) {
    throw new Error("Gemini API key is missing. Please add it in the Admin Dashboard or contact support.");
  }

  const genAI = new GoogleGenAI({ apiKey });
  const model = "gemini-3-flash-preview"; // Use flash model to avoid free tier quota limits

  const prompt = `
    You are an expert in Indian Government Tendering, GeM (Government e-Marketplace) bids, and cost estimation.
    Analyze the following project details to suggest a highly specific, accurate, and competitive bidding rate strategy.
    
    Project Details:
    - Scope of Work: ${scopeOfWork}
    - Estimated Bid Value: ${estimatedValue}
    - Estimated Material Cost: ${materialCost || 'Not provided'}
    - Estimated Labor Cost: ${laborCost || 'Not provided'}
    - Target Profit Margin: ${profitMargin || 'Not provided'}
    - Competition Level: ${competitionLevel || 'Medium'}
    - Project Duration: ${projectDuration || 'Not provided'}

    Calculate a detailed breakdown and provide a specific recommended bid value. 
    Consider inflation, typical hidden costs, compliance costs, and the level of competition.
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
            recommendedBidValue: {
              type: Type.STRING,
              description: "The exact recommended bid value in ₹ (e.g., '₹ 45,50,000')"
            },
            costBreakdown: {
              type: Type.OBJECT,
              properties: {
                materials: { type: Type.STRING },
                labor: { type: Type.STRING },
                overheadsAndCompliance: { type: Type.STRING },
                profit: { type: Type.STRING }
              },
              required: ["materials", "labor", "overheadsAndCompliance", "profit"]
            },
            reasoning: {
              type: Type.STRING,
              description: "Detailed reasoning for the suggestion based on the scope of work and costs"
            },
            competitiveStrategy: {
              type: Type.STRING,
              description: "Advice on how to position the bid against competitors"
            },
            riskFactors: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Potential risk factors and hidden costs to consider when quoting"
            }
          },
          required: ["suggestion", "percentageRange", "recommendedBidValue", "costBreakdown", "reasoning", "competitiveStrategy", "riskFactors"]
        }
      }
    });
    
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error analyzing bid rate:", error);
    throw error;
  }
};

export const analyzeBidDocument = async (text: string, providedApiKey?: string) => {
  const apiKey = providedApiKey || getApiKey();
  if (!apiKey) {
    throw new Error("Gemini API key is missing. Please add it in the Admin Dashboard or contact support.");
  }

  const genAI = new GoogleGenAI({ apiKey });
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
