import { useState, useEffect } from 'react';

export type AppRoute = 'game' | 'admin';

// Rota restrita da gestão (não divulgada aos jogadores)
export const GESTOR_ROUTE_PATH = '/gestao-acim-7x4';

function getRouteFromLocation(): AppRoute {
  if (typeof window === 'undefined') return 'game';

  const pathname = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const search = window.location.search.toLowerCase();

  // A rota /admin está explicitamente desativada e não abre o painel.
  // Apenas a rota restrita /gestao-acim-7x4 é reconhecida.
  if (
    pathname === GESTOR_ROUTE_PATH ||
    pathname.startsWith(`${GESTOR_ROUTE_PATH}/`) ||
    hash === `#${GESTOR_ROUTE_PATH}` ||
    hash === `#${GESTOR_ROUTE_PATH}/` ||
    hash === '#gestao-acim-7x4' ||
    search.includes('gestao-acim-7x4')
  ) {
    return 'admin';
  }

  return 'game';
}

export function useRouter() {
  const [route, setRoute] = useState<AppRoute>(getRouteFromLocation);

  useEffect(() => {
    const handleLocationChange = () => {
      setRoute(getRouteFromLocation());
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const navigate = (to: 'game' | 'admin' | string) => {
    const targetPath = to === 'admin' ? GESTOR_ROUTE_PATH : '/';
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
    if (to === 'game' && window.location.hash) {
      window.history.replaceState({}, '', '/');
    }
    setRoute(getRouteFromLocation());
  };

  return {
    route,
    isAdmin: route === 'admin',
    navigate,
  };
}
