import { useRef } from "react";
import { useKotPrint } from "./usePrintDoc";

export function useAutoPrintKot(enabled: boolean) {
  const { ref, data, print } = useKotPrint();
  const printed = useRef<Set<string>>(new Set());

  const printOnAccept = (orderId: string) => {
    if (!enabled) return;
    if (printed.current.has(orderId)) return;
    printed.current.add(orderId);
    print(orderId);
  };

  return { ref, data, printOnAccept };
}
