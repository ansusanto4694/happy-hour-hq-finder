
export interface HappyHourDeal {
  id: string;
  restaurant_id: number;
  deal_title: string;
  deal_description: string | null;
  active: boolean;
  display_order: number | null;
  created_at: string;
  updated_at: string;
  // Verification fields
  source_url: string | null;
  source_label: string | null;
  is_verified: boolean;
  verified_at: string | null;
  verified_by: string | null;
}

export interface DealFormData {
  deal_title: string;
  deal_description: string;
  active: boolean;
  // Verification fields (form uses empty strings when unset)
  source_url: string;
  source_label: string;
  is_verified: boolean;
}
