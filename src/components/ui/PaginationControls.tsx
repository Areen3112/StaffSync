'use client';

import React from 'react';
import styles from './PaginationControls.module.scss';

interface PaginationControlsProps {
  page: number;
  pages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function PaginationControls({ page, pages, total, onPageChange }: PaginationControlsProps) {
  return (
    <nav className={styles.controls} aria-label="Pagination">
      <span>{total} records · Page {page} of {pages || 1}</span>
      <div className={styles.buttons}>
        <button type="button" className="pill-btn-secondary" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
          Previous
        </button>
        <button type="button" className="pill-btn-secondary" onClick={() => onPageChange(page + 1)} disabled={pages === 0 || page >= pages}>
          Next
        </button>
      </div>
    </nav>
  );
}
