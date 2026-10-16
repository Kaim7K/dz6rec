import React from 'react';

// Media owns the frame; metadata belongs to the page rather than a second card.
export default function CatalogTile({ children, className = '', id = undefined }) {
  return <article id={id} className={`dz-catalog-tile group relative min-w-0 scroll-mt-24 ${className}`}>{children}</article>;
}
