import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BOARDS } from '@/constants/game';

// ─── Types ────────────────────────────────────────────────────────────────────
interface PlayerState {
  crystals: number;
  highScore: number;
  totalRuns: number;
  unlockedBoards: string[];
  selectedBoardId: string;
  hapticsEnabled: boolean;
  soundEnabled: boolean;
  lastWorld: number;
}

interface PlayerContextValue extends PlayerState {
  addCrystals: (amount: number) => void;
  spendCrystals: (amount: number) => boolean;
  purchaseBoard: (boardId: string) => boolean;
  selectBoard: (boardId: string) => void;
  updateHighScore: (score: number) => void;
  incrementRuns: () => void;
  toggleHaptics: () => void;
  toggleSound: () => void;
  setLastWorld: (index: number) => void;
  isBoardUnlocked: (boardId: string) => boolean;
  isLoaded: boolean;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────
const DEFAULT_STATE: PlayerState = {
  crystals: 0,
  highScore: 0,
  totalRuns: 0,
  unlockedBoards: ['starter'],
  selectedBoardId: 'starter',
  hapticsEnabled: true,
  soundEnabled: true,
  lastWorld: 0,
};

const STORAGE_KEY = '@zyrix_player_v1';

// ─── Context ──────────────────────────────────────────────────────────────────
const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerContextProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PlayerState>(DEFAULT_STATE);
  const [isLoaded, setIsLoaded] = useState(false);
  const pendingSave = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load from storage on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const parsed: Partial<PlayerState> = JSON.parse(raw);
          setState((prev) => ({ ...prev, ...parsed }));
        }
      })
      .catch(() => {})
      .finally(() => setIsLoaded(true));
  }, []);

  // Debounced save whenever state changes
  const saveState = useCallback((nextState: PlayerState) => {
    if (pendingSave.current) clearTimeout(pendingSave.current);
    pendingSave.current = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextState)).catch(() => {});
    }, 500);
  }, []);

  const update = useCallback(
    (updater: (prev: PlayerState) => PlayerState) => {
      setState((prev) => {
        const next = updater(prev);
        saveState(next);
        return next;
      });
    },
    [saveState]
  );

  // ─── Actions ────────────────────────────────────────────────────────────────
  const addCrystals = useCallback(
    (amount: number) => {
      update((p) => ({ ...p, crystals: p.crystals + amount }));
    },
    [update]
  );

  const spendCrystals = useCallback(
    (amount: number): boolean => {
      let success = false;
      update((p) => {
        if (p.crystals >= amount) {
          success = true;
          return { ...p, crystals: p.crystals - amount };
        }
        return p;
      });
      return success;
    },
    [update]
  );

  const purchaseBoard = useCallback(
    (boardId: string): boolean => {
      const board = BOARDS.find((b) => b.id === boardId);
      if (!board) return false;
      let success = false;
      update((p) => {
        if (p.unlockedBoards.includes(boardId)) {
          success = true;
          return { ...p, selectedBoardId: boardId };
        }
        if (p.crystals >= board.price) {
          success = true;
          return {
            ...p,
            crystals: p.crystals - board.price,
            unlockedBoards: [...p.unlockedBoards, boardId],
            selectedBoardId: boardId,
          };
        }
        return p;
      });
      return success;
    },
    [update]
  );

  const selectBoard = useCallback(
    (boardId: string) => {
      update((p) =>
        p.unlockedBoards.includes(boardId) ? { ...p, selectedBoardId: boardId } : p
      );
    },
    [update]
  );

  const updateHighScore = useCallback(
    (score: number) => {
      update((p) => (score > p.highScore ? { ...p, highScore: score } : p));
    },
    [update]
  );

  const incrementRuns = useCallback(
    () => update((p) => ({ ...p, totalRuns: p.totalRuns + 1 })),
    [update]
  );

  const toggleHaptics = useCallback(
    () => update((p) => ({ ...p, hapticsEnabled: !p.hapticsEnabled })),
    [update]
  );

  const toggleSound = useCallback(
    () => update((p) => ({ ...p, soundEnabled: !p.soundEnabled })),
    [update]
  );

  const setLastWorld = useCallback(
    (index: number) => update((p) => ({ ...p, lastWorld: index })),
    [update]
  );

  const isBoardUnlocked = useCallback(
    (boardId: string) => state.unlockedBoards.includes(boardId),
    [state.unlockedBoards]
  );

  return (
    <PlayerContext.Provider
      value={{
        ...state,
        addCrystals,
        spendCrystals,
        purchaseBoard,
        selectBoard,
        updateHighScore,
        incrementRuns,
        toggleHaptics,
        toggleSound,
        setLastWorld,
        isBoardUnlocked,
        isLoaded,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerContextProvider');
  return ctx;
}
