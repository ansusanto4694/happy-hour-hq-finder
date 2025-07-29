export interface MerchantOffer {
  id: string;
  store_id: number;
  offer_name: string;
  offer_description: string | null;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OfferModalData {
  offer: MerchantOffer;
  isOpen: boolean;
}