"use client";
import { useMemo } from "react";

export function useSearchParams() {
    if (typeof window === "undefined") return new URLSearchParams();
    return useMemo(() => new URLSearchParams(window.location.search), []);
}
