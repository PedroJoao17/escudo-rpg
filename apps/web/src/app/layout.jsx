import './globals.css';
import './layout-overrides.css';
import './forms-overrides.css';

export const metadata = { title: 'Escudo RPG · Seu lado da aventura', description: 'Ficha, habilidades, inventário e memórias de campanha em um escudo pessoal para jogadores.' };
export default function RootLayout({ children }) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
