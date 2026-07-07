import { useEffect, useRef } from "react";
import { useKotPrint } from "./usePrintDoc";
import { signalRService } from "../api/signalrService";

export function useAutoPrintKot(enabled: boolean) {
  const { ref, data, print } = useKotPrint();
  const printed = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled) return;

    const onNew = (p: { orderId: string; id?: string }) => {
      const oId = p.orderId || p.id;
      if (!oId) return;

      if (printed.current.has(oId)) return;   // dedupe reconnect/replay
      printed.current.add(oId);
      print(oId);
    };

    const unsubscribe = signalRService.onNewOrder(onNew);
    return () => {
      unsubscribe();
    };
  }, [enabled, print]);

  return { ref, data };
}
