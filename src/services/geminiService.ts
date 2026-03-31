
import { GoogleGenAI, Type } from "@google/genai";
import { Liquor } from "../liquorTypes";

function getAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  return new GoogleGenAI({ apiKey });
}

export async function generateLiquorData(userInput: string): Promise<Partial<Liquor>> {
  const prompt = `Liquor/Spirit: "${userInput}". Return JSON with: name, distillery, region(city+state or country), proof(num), age(str/NAS), mashBill(type + grain% if applicable, or "N/A"), price(avg USD num), type(e.g. Bourbon, Scotch, Vodka, Gin, Rum, Tequila, etc.), description(1-2 sentences), flavors({sweetness,spice,oak,caramel,vanilla,fruit,nutty,floral,smoky,leather,heat,complexity} 1-10)`;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            distillery: { type: Type.STRING },
            region: { type: Type.STRING },
            proof: { type: Type.NUMBER },
            age: { type: Type.STRING },
            mashBill: { type: Type.STRING },
            price: { type: Type.NUMBER },
            type: { type: Type.STRING },
            description: { type: Type.STRING },
            flavors: {
              type: Type.OBJECT,
              properties: {
                sweetness: { type: Type.INTEGER },
                spice: { type: Type.INTEGER },
                oak: { type: Type.INTEGER },
                caramel: { type: Type.INTEGER },
                vanilla: { type: Type.INTEGER },
                fruit: { type: Type.INTEGER },
                nutty: { type: Type.INTEGER },
                floral: { type: Type.INTEGER },
                smoky: { type: Type.INTEGER },
                leather: { type: Type.INTEGER },
                heat: { type: Type.INTEGER },
                complexity: { type: Type.INTEGER },
              },
              required: ["sweetness", "spice", "oak", "caramel", "vanilla", "fruit", "nutty", "floral", "smoky", "leather", "heat", "complexity"],
            },
          },
          required: ["name", "distillery", "region", "proof", "age", "mashBill", "price", "type", "description", "flavors"],
        },
      },
    });

    const data = JSON.parse(response.text || "{}");

    return {
      name: data.name,
      distillery: data.distillery,
      region: data.region,
      proof: data.proof,
      age: data.age,
      mashBill: data.mashBill,
      price: data.price,
      type: data.type,
      description: data.description,
      flavorProfile: data.flavors,
      source: 'community',
      submissionCount: 1,
    };
  } catch (error) {
    console.error("Error generating liquor data:", error);
    throw error;
  }
}
