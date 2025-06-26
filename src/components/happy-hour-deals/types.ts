
export interface HappyHourDeal {
  id: string;
  restaurant_id: number;
  deal_title: string;
  deal_description: string | null;
  active: boolean;
  display_order: number | null;
  created_at: string;
  updated_at: string;
}

export interface DealFormData {
  deal_title: string;
  deal_description: string;
  active: boolean;
}
