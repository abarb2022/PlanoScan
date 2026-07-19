export interface PlanogramSection {
  position: string;
  productName: string;
  facings: number;
}

export interface PlanogramShelf {
  number: number;
  sections: PlanogramSection[];
}

export interface PlanogramLayoutSpec {
  shelves: PlanogramShelf[];
  totalShelves: number;
  notes?: string;
}

export interface Planogram {
  id: string;
  name: string;
  productCategory: string | null;
  referenceImageUrl: string | null;
  parsed: boolean;
  layoutSpec: PlanogramLayoutSpec | null;
  storeId: string | null;
  storeName: string | null;
  validFrom: string | null;
  validUntil: string | null;
  active: boolean;
  createdAt: string | null;
}

export interface PlanogramRequest {
  name: string;
  storeId: string;
  productCategory?: string;
  validFrom?: string;
  validUntil?: string;
}
