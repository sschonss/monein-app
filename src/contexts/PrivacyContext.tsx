import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface PrivacyContextType {
  hidden: boolean;
  toggle: () => void;
  mask: (value: string) => string;
}

const PrivacyContext = createContext<PrivacyContextType>({
  hidden: false,
  toggle: () => {},
  mask: (v) => v,
});

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState(() => localStorage.getItem('monein_privacy') === '1');

  useEffect(() => {
    localStorage.setItem('monein_privacy', hidden ? '1' : '0');
  }, [hidden]);

  function toggle() {
    setHidden(h => !h);
  }

  function mask(value: string) {
    return hidden ? '•••••' : value;
  }

  return (
    <PrivacyContext.Provider value={{ hidden, toggle, mask }}>
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy() {
  return useContext(PrivacyContext);
}
