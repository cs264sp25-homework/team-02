import { persistentAtom } from "@nanostores/persistent";

export const $pdfScaleStore = persistentAtom<number>("pdfScale", 1, {
  encode: JSON.stringify,
  decode: JSON.parse,
});
