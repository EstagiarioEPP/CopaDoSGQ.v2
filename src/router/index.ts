import { useState, useEffect } from 'react';

export type AppRoute = 'game' | 'admin';

function getRouteFromLocation(): AppRoute {
  if (typeof window === 'undefined') return 'game';

  const pathname = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const search = window.location.search.toLowerCase();

  if (
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    hash === '#/admin' ||
    hash.startsWith('#/admin') ||
    search.includes('admin=true') ||
    search.includes('page=admin')
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
    const targetPath = to === 'admin' ? '/admin' : '/';
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
    // Also clear hash if needed
    if (window.location.hash.includes('admin') && to === 'game') {
      window.location.hash = '';
    }
    setRoute(getRouteFromLocation());
  };

  return {
    route,
    isAdmin: route === 'admin',
    navigate,
  };
}
