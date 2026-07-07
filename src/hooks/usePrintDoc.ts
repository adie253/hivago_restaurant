import { useReactToPrint } from "react-to-print";
import { useRef, useState } from "react";
import client from "../api/client";
import { useToast } from "../context/ToastContext";
import { KitchenTicketDto, OrderLabelDto } from "../types/api";

const PAGE_STYLE = `@page { size: 80mm auto; margin: 3mm; }`;

export function usePrintDoc<T>(fetchUrl: (id: string) => string) {
  const ref = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<T | null>(null);
  const { showToast } = useToast();

  const doPrint = useReactToPrint({
    contentRef: ref,
    pageStyle: PAGE_STYLE,
  });

  async function print(orderId: string) {
    try {
      // Defensive url cleaning to support absolute/relative/leading-slash variants
      const rawUrl = fetchUrl(orderId);
      const cleanUrl = rawUrl.startsWith("/api") ? rawUrl.substring(4) : rawUrl;
      
      const response = await client.get<T>(cleanUrl);
      setData(response.data);

      // Give React time to render the hidden DOM element
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          doPrint();
        });
      });
    } catch (error) {
      showToast("Couldn't load print — order not found or not yours.", "error");
    }
  }

  return { ref, data, print };
}

export const useKotPrint   = () => usePrintDoc<KitchenTicketDto>(id => `/api/orders/${id}/kot`);
export const useLabelPrint = () => usePrintDoc<OrderLabelDto>(id => `/api/orders/${id}/label`);
