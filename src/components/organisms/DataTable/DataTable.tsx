import React, { useState, useMemo } from 'react'
import styles from './DataTable.module.css'

export interface Column<T> {
  key: keyof T & string
  label: string
  sortable?: boolean
  render?: (value: T[keyof T], row: T) => React.ReactNode
}

export interface DataTableProps<T extends Record<string, unknown>> {
  columns: Column<T>[]
  data: T[]
  selectable?: boolean
  pageSize?: number
  onRowSelect?: (selectedIds: string[]) => void
}

export function DataTable<T extends Record<string, unknown> & { id: string }>({
  columns,
  data,
  selectable = false,
  pageSize = 5,
  onRowSelect,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(0)

  const sorted = useMemo(() => {
    if (!sortKey) return data
    return [...data].sort((a, b) => {
      const aVal = String(a[sortKey as keyof T] ?? '')
      const bVal = String(b[sortKey as keyof T] ?? '')
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    })
  }, [data, sortKey, sortDir])

  const totalPages = Math.ceil(sorted.length / pageSize)
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize)

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const toggleRow = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
    onRowSelect?.(Array.from(next))
  }

  const toggleAll = () => {
    if (selectedIds.size === paged.length) {
      setSelectedIds(new Set())
      onRowSelect?.([])
    } else {
      const all = new Set(paged.map((r) => r.id))
      setSelectedIds(all)
      onRowSelect?.(Array.from(all))
    }
  }

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead className={styles.thead}>
          <tr>
            {selectable && (
              <th className={styles.th} style={{ width: 40 }}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={paged.length > 0 && selectedIds.size === paged.length}
                  onChange={toggleAll}
                />
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                className={styles.th}
                onClick={() => col.sortable && handleSort(col.key)}
              >
                {col.label}
                {col.sortable && (
                  <span className={`${styles.sortIcon} ${sortKey === col.key ? styles.active : ''}`}>
                    {sortKey === col.key ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paged.map((row) => (
            <tr
              key={row.id}
              className={`${styles.tr} ${selectedIds.has(row.id) ? styles.selected : ''}`}
            >
              {selectable && (
                <td className={styles.td}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={selectedIds.has(row.id)}
                    onChange={() => toggleRow(row.id)}
                  />
                </td>
              )}
              {columns.map((col) => (
                <td key={col.key} className={styles.td}>
                  {col.render
                    ? col.render(row[col.key], row)
                    : String(row[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <span className={styles.pageInfo}>
            Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, sorted.length)} of {sorted.length}
          </span>
          <div className={styles.pageButtons}>
            <button
              className={styles.pageBtn}
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
              type="button"
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                className={`${styles.pageBtn} ${page === i ? styles.active : ''}`}
                onClick={() => setPage(i)}
                type="button"
              >
                {i + 1}
              </button>
            ))}
            <button
              className={styles.pageBtn}
              disabled={page === totalPages - 1}
              onClick={() => setPage(page + 1)}
              type="button"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
