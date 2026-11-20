import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { DEMO_OFFERS } from "@/constants/demoCatalog";
export interface StoreOffer {
  id: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: string;
  minOrderValue: string | null;
  maxDiscount: string | null;
  validUntil: string | null;
}
export function useOffers() {
  return (
    useQuery({
      queryKey: ["offers"],
      queryFn: () => api.storefront.offers(),
      staleTime: 30000,
    }).data || DEMO_OFFERS
  );
}
export function offerPrice(price: number, offer: StoreOffer) {
  const discount =
    offer.discountType === "percentage"
      ? (price * Number(offer.discountValue)) / 100
      : Number(offer.discountValue);
  return Math.max(
    0,
    Math.round(
      (price -
        Math.min(
          discount,
          offer.maxDiscount === null ? Infinity : Number(offer.maxDiscount),
        )) *
        100,
    ) / 100,
  );
}
export function bestOffer(price: number, offers: StoreOffer[]) {
  return offers.reduce<StoreOffer | undefined>(
    (best, o) =>
      !best || offerPrice(price, o) < offerPrice(price, best) ? o : best,
    undefined,
  );
}
