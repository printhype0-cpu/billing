import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GeminiModel } from '../types.ts';

let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is missing. Gemini features will be unavailable.");
    }
    aiInstance = new GoogleGenAI({ apiKey: apiKey || '' });
  }
  return aiInstance;
};

/**
 * Generates a professional job description based on role and requirements.
 */
export const generateJobDescription = async (role: string, requirements: string): Promise<string> => {
  try {
    const ai = getAI();
    const prompt = `Write a professional and concise job description for a "${role}". Key requirements: ${requirements}. Format it with sections: Role Overview, Key Responsibilities, and Qualifications. Use Markdown.`;
    
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GeminiModel.FLASH,
      contents: prompt,
    });
    
    return response.text || "No content generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Failed to generate job description. Please check your API configuration.";
  }
};

/**
 * Analyzes attendance data and provides insights and recommendations.
 */
export const analyzeAttendance = async (attendanceContext: string): Promise<string> => {
  try {
    const ai = getAI();
    const prompt = `You are an HR Analyst. Review the following attendance data and provide 3 key observations and 1 recommendation to improve punctuality or staff engagement. Keep it concise. Data: ${attendanceContext}`;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GeminiModel.FLASH,
      contents: prompt,
    });

    return response.text || "No analysis available.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Analysis failed. Please check your API configuration.";
  }
};

/**
 * Analyzes sales data and provides business insights and recommendations.
 */
export const analyzeSalesData = async (dataContext: string): Promise<string> => {
  try {
    const ai = getAI();
    const prompt = `You are a CRM business analyst. Analyze the following sales summary data and provide 3 key insights and 1 actionable recommendation in a concise bulleted list. Data: ${dataContext}`;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GeminiModel.FLASH,
      contents: prompt,
    });

    return response.text || "No analysis available.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Analysis failed. Please check your API configuration.";
  }
};

/**
 * Drafts a professional email for restock requests to vendors.
 */
export const draftVendorEmail = async (vendorName: string, item: string, quantity: number): Promise<string> => {
  try {
    const ai = getAI();
    const prompt = `Draft a formal and professional business email to vendor "${vendorName}" requesting an urgent restock of "${item}". Required Quantity: ${quantity}. The email should be concise, polite, and request a confirmation of the order and estimated delivery date.`;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GeminiModel.FLASH,
      contents: prompt,
    });

    return response.text || "No draft generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Drafting failed. Please check your API configuration.";
  }
};

/**
 * Drafts a professional bulk restock email for multiple items to a single vendor.
 */
export const draftBulkRestockEmail = async (vendorName: string, items: { name: string, quantity: number }[]): Promise<string> => {
  try {
    const ai = getAI();
    const itemsList = items.map(i => `- ${i.name}: ${i.quantity} units`).join('\n');
    const prompt = `Draft a formal and professional business email to vendor "${vendorName}" requesting a bulk restock for the following items:\n${itemsList}\n\nThe email should be concise, polite, request a confirmation of the order, and ask for an estimated delivery date for the entire shipment.`;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GeminiModel.FLASH,
      contents: prompt,
    });

    return response.text || "No draft generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Drafting failed. Please check your API configuration.";
  }
};