import { useLocation } from '@tanstack/react-router'

/**
 * '' on the homepage, '/' on every other route, so `#section`
 * links keep working everywhere (`#about` vs `/#about`).
 */
export function useHashPrefix(): string {
  const { pathname } = useLocation()
  return pathname === '/' ? '' : '/'
}
