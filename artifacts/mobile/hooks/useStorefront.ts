import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { DEMO_STOREFRONT } from "@/constants/demoCatalog";
export const defaultStorefront = DEMO_STOREFRONT;

export function useStorefront() {
  const data =
    useQuery({
      queryKey: ["storefront"],
      queryFn: () => api.storefront.get(),
      staleTime: 0,
      refetchInterval: 60000,
    }).data || defaultStorefront;
  if (!data.storeName || data.storeName.toLowerCase() === "griper") {
    return { ...data, storeName: "FLOMA" };
  }
  return data;
}
