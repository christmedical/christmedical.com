"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { CommandPalette } from "@/components/command-palette/CommandPalette";

type CommandPaletteContextValue = {
  isOpen: boolean;
  openPalette: () => void;
  closePalette: () => void;
  searchTriggerRef: RefObject<HTMLButtonElement | null>;
};

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(
  null,
);

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const searchTriggerRef = useRef<HTMLButtonElement>(null);

  const openPalette = useCallback(() => setIsOpen(true), []);

  const closePalette = useCallback(() => {
    setIsOpen(false);
    searchTriggerRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.code !== "Space") return;
      e.preventDefault();
      setIsOpen((open) => {
        if (open) {
          searchTriggerRef.current?.focus();
        }
        return !open;
      });
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <CommandPaletteContext.Provider
      value={{ isOpen, openPalette, closePalette, searchTriggerRef }}
    >
      {children}
      <CommandPalette />
    </CommandPaletteContext.Provider>
  );
}

export function useCommandPalette(): CommandPaletteContextValue {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) {
    throw new Error("useCommandPalette must be used within CommandPaletteProvider");
  }
  return ctx;
}
