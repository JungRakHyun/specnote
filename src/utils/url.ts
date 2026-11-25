/**
 * Base path를 안전하게 결합하는 URL 헬퍼.
 * GitHub Pages 서브경로(/techpick-blog/)와 커스텀 도메인 루트(/) 양쪽 모두에서 깨지지 않습니다.
 */
export function withBase(path: string): string {
  if (!path) return import.meta.env.BASE_URL;
  if (/^https?:\/\//i.test(path) || path.startsWith('mailto:') || path.startsWith('#')) {
    return path;
  }
  const base = import.meta.env.BASE_URL.replace(/\/+$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

export function absoluteUrl(path: string, site?: URL | string): string {
  const baseOrigin = site ? String(site).replace(/\/+$/, '') : '';
  const rel = withBase(path);
  if (/^https?:\/\//i.test(rel)) return rel;
  return `${baseOrigin}${rel}`;
}
