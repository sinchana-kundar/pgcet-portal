import { useEffect } from 'react';

/**
 * Custom hook to update document title and meta description dynamically
 * for SEO and browser tab identification.
 */
export function usePageMeta(title, description) {
  useEffect(() => {
    const prevTitle = document.title;
    if (title) {
      document.title = `${title} | Karnataka PGCET Portal`;
    }

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    const prevDesc = metaDesc.getAttribute('content') || '';
    if (description) {
      metaDesc.setAttribute('content', description);
    }

    return () => {
      document.title = prevTitle;
      if (prevDesc) {
        metaDesc.setAttribute('content', prevDesc);
      }
    };
  }, [title, description]);
}

export default usePageMeta;
