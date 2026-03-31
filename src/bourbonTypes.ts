export interface FlavorProfile {
  sweetness: number;
  spice: number;
  oak: number;
  caramel: number;
  vanilla: number;
  fruit: number;
  nutty: number;
  floral: number;
  smoky: number;
  leather: number;
  heat: number;
  complexity: number;
}

export interface Bourbon {
  id: string;
  name: string;
  distillery: string;
  region: string;
  proof: number;
  age: string;
  mashBill: string;
  price: number;
  priceRange?: string;
  description: string;
  flavorProfile: FlavorProfile;
  type: string;
  source?: 'curated' | 'community';
  submissionCount?: number;
  mashBillDetail?: string;
}
