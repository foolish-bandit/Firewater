
import { GoogleGenAI, Type } from "@google/genai";
import { Bourbon } from "../bourbonTypes";

function getAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  return new GoogleGenAI({ apiKey });
}

export async function generateBourbonData(userInput: string): Promise<Partial<Bourbon>> {
  const prompt = `
You are a bourbon whiskey database assistant. Given partial information about a bourbon, fill in ALL of the following fields with accurate data. If you are not confident about a field, provide your best estimate and mark it with an asterisk. Return ONLY valid JSON, no markdown, no explanation.

Required fields:
- name (string)
- distillery (string)
- region (string, city and state)
- proof (number)
- age (string, use 'NAS' if no age statement)
- mash_bill (string, general type like 'High Rye', 'Wheated', 'Standard Rye')
- mash_bill_detail (string, grain composition)
- price_range (string, format '$XX-XX')
- average_price (number, estimated average MSRP or market price)
- category (string, e.g. 'Straight Bourbon', 'Single Barrel Bourbon', 'Barrel Proof Bourbon')
- description (string, 2-3 sentences covering tasting notes, character, and drinking experience)
- flavors (object with integer scores 1-10 for: sweetness, spice, oak, caramel, vanilla, fruit, nutty, floral, smoky, leather, heat, complexity)

User-provided info about this bourbon: "${userInput}"
`;

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
            mash_bill: { type: Type.STRING },
            mash_bill_detail: { type: Type.STRING },
            price_range: { type: Type.STRING },
            average_price: { type: Type.NUMBER },
            category: { type: Type.STRING },
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
          required: ["name", "distillery", "region", "proof", "age", "mash_bill", "mash_bill_detail", "price_range", "average_price", "category", "description", "flavors"],
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
      mashBill: `${data.mash_bill} (${data.mash_bill_detail})`,
      mashBillDetail: data.mash_bill_detail,
      price: data.average_price,
      priceRange: data.price_range,
      type: data.category,
      description: data.description,
      flavorProfile: data.flavors,
      source: 'community',
      submissionCount: 1,
    };
  } catch (error) {
    console.error("Error generating bourbon data:", error);
    throw error;
  }
}
