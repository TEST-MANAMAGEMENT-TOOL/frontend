import { create } from "zustand";
import { persist } from "zustand/middleware";
import { BugBash } from "@/types/bug-bash";

interface BugBashState {
  bugBashes: BugBash[];
  addBugBash: (bugBash: BugBash) => void;
  updateBugBash: (id: string, bugBash: Partial<BugBash>) => void;
  deleteBugBash: (id: string) => void;
  getBugBash: (id: string) => BugBash | undefined;
}

const seed: BugBash[] = [];

export const useBugBashStore = create<BugBashState>()(
  persist(
    (set, get) => ({
      bugBashes: seed,
      
      addBugBash: (bugBash) => 
        set((state) => ({ 
          bugBashes: [...state.bugBashes, bugBash] 
        })),
      
      updateBugBash: (id, bugBash) =>
        set((state) => ({
          bugBashes: state.bugBashes.map((b) =>
            b.id === id ? { ...b, ...bugBash } : b
          )
        })),
      
      deleteBugBash: (id) =>
        set((state) => ({
          bugBashes: state.bugBashes.filter((b) => b.id !== id)
        })),
      
      getBugBash: (id) =>
        get().bugBashes.find((b) => b.id === id),
    }),
    { 
      name: "bug-bash-store",
      version: 1
    }
  )
);
