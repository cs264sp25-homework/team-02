// src/lib/convex.ts
import { ConvexReactClient } from "convex/react";


export const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);