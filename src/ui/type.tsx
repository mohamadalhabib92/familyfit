import { createContext, useContext, type ReactNode } from 'react';
import { theme } from './theme';

const Ctx = createContext(1);

/** Mode « texte large » (grands-parents). Le Dynamic Type système reste actif, plafonné à 200 %. */
export function TypeScale({ large, children }: { large: boolean; children: ReactNode }) {
  return <Ctx.Provider value={large ? theme.largeTextScale : 1}>{children}</Ctx.Provider>;
}

export function useTypeScale(): number {
  return useContext(Ctx);
}
