import {
  MUPDF_LOADED,
  type MupdfWorker,
} from "@/file_upload/workers/mupdf.worker";
import * as Comlink from "comlink";
import { Remote } from "comlink";
import { useCallback, useEffect, useRef, useState } from "react";

export function useMupdf() {
  const [isWorkerInitialized, setIsWorkerInitialized] = useState(false);
  const document = useRef<ArrayBuffer | null>(null);
  const mupdfWorker = useRef<Remote<MupdfWorker> | null>(null);

  useEffect(() => {
    const worker = new Worker(
      new URL("../workers/mupdf.worker.ts", import.meta.url),
      {
        type: "module",
      },
    );
    mupdfWorker.current = Comlink.wrap<MupdfWorker>(worker);

    worker.addEventListener("message", (event) => {
      if (event.data === MUPDF_LOADED) {
        setIsWorkerInitialized(true);
      }
    });

    return () => {
      worker.terminate();
    };
  }, []);

  const loadDocument = useCallback(async (arrayBuffer: ArrayBuffer) => {
    document.current = arrayBuffer;
    return await mupdfWorker.current!.loadDocument(arrayBuffer);
  }, []);

  const extractText = useCallback(async () => {
    if (!document.current) {
      throw new Error("Document not loaded");
    }

    return await mupdfWorker.current!.extractText();
  }, []);

  return {
    isWorkerInitialized,
    loadDocument,
    extractText,
  };
}
