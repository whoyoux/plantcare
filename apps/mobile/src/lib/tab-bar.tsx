import { useFocusEffect } from 'expo-router';
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

const TabBarContext = createContext<(hidden: boolean) => void>(() => undefined);

/** Lets a tab screen hide the tab bar while it is shown (the camera). */
export function TabBarProvider({ children }: { children: (hidden: boolean) => ReactNode }) {
  const [hidden, setHidden] = useState(false);
  return <TabBarContext.Provider value={setHidden}>{children(hidden)}</TabBarContext.Provider>;
}

/** Hides the tab bar while the calling screen is focused. */
export function useHiddenTabBar() {
  const setHidden = useContext(TabBarContext);
  useFocusEffect(
    useCallback(() => {
      setHidden(true);
      return () => setHidden(false);
    }, [setHidden]),
  );
}
