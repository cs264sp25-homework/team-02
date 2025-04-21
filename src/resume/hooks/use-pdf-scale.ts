import { useStore } from "@nanostores/react";
import { $pdfScaleStore } from "../stores/pdf-scale-store";

export const usePdfScale = () => {
  const scale = useStore($pdfScaleStore);
  const setScale = (fn: (scale: number) => number) => {
    $pdfScaleStore.set(fn(scale));
  };
  return { scale, setScale };
};
