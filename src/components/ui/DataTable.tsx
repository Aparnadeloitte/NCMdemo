"use client";

import type { ReactNode } from "react";

export type Column<T> = { key: string; header: string; render: (row: T) => ReactNode };

export function DataTable<T>({ columns, rows, rowKey }: { columns: Column<T>[]; rows: T[]; rowKey: (row: T) => string }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{columns.map((column) => <th key={column.key} scope="col">{column.header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((column) => <td key={column.key}>{column.render(row)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pagination({ page, pageSize, total, onPage }: { page: number; pageSize: number; total: number; onPage: (page: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const firstVisiblePage = Math.min(Math.max(1, page - 2), Math.max(1, pages - 4));
  const visiblePages = Array.from(
    { length: Math.min(5, pages) },
    (_, index) => firstVisiblePage + index,
  );
  return (
    <div className="pager">
      <p>Showing {from}–{to} of {total}</p>
      <div className="pager-pages">
        <button className="pager-nav" type="button" onClick={() => onPage(page - 1)} disabled={page <= 1}>
          <span aria-hidden="true">‹</span> Back
        </button>
        {visiblePages.map((pageNumber) => (
          <button
            key={pageNumber}
            className="pager-number"
            type="button"
            aria-current={pageNumber === page ? "page" : undefined}
            onClick={() => onPage(pageNumber)}
          >
            {pageNumber}
          </button>
        ))}
        <button className="pager-nav" type="button" onClick={() => onPage(page + 1)} disabled={page >= pages}>
          Next <span aria-hidden="true">›</span>
        </button>
      </div>
    </div>
  );
}
