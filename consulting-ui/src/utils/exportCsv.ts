function escapeCsvValue(value: unknown): string {
  const str = value == null ? '' : String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

/** Exports an array of plain objects (keys become the header row) as a downloaded CSV file. */
export function exportRowsToCsv(rows: Record<string, unknown>[], filename: string): void {
  if (rows.length === 0) return;

  const headers = Object.keys(rows[0]!);
  const csv = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => escapeCsvValue(row[header])).join(',')),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
