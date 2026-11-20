import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/services/api";
export const defaultStorefront = {
  storeName: "FLOMA",
  announcement: "Curated fashion, lifestyle & everyday essentials · Use DEMO10 for 10% OFF",
  supportEmail: "rememberfrxst@gmail.com",
  deliveryFee: 40,
  freeShippingThreshold: 999,
  downloadUrl: "",
  returnsHeadline: "Easy returns & exchanges",
  returnsPolicy:
    "Contact customer care with your order number for return or exchange eligibility and assistance.",
  shippingPolicy:
    "Delivery charges are shown at checkout. Contact customer care for help with your delivery.",
  privacyPolicy:
    "For questions about your account data or a deletion request, contact customer care.",
  termsOfService:
    "Prices, product availability and delivery charges are confirmed at checkout. Contact customer care for questions about your order.",
  aboutStore:
    "FLOMA brings together curated fashion, footwear, beauty and modern lifestyle essentials with effortless discovery.",
};

export function useStorefront() {
  const data =
    useQuery({
      queryKey: ["storefront"],
      queryFn: () =>
        apiRequest<typeof defaultStorefront>("/storefront", { auth: false }),
      staleTime: 0,
      refetchInterval: 60000,
    }).data || defaultStorefront;
  if (!data.storeName || data.storeName.toLowerCase() === "griper") {
    return { ...data, storeName: "FLOMA" };
  }
  return data;
}
