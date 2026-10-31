// Exact counts detect server response caps and concurrent count changes.
export async function readComplete<T extends { id: string }>(query: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown; count: number | null }>): Promise<T[]> {
  const rows: T[] = [];
  const ids = new Set<string>();
  let count: number | null = null;
  do {
    const page = await query(rows.length, rows.length + 499);
    if (page.error || page.count === null || !page.data || (count !== null && page.count !== count)) throw new Error('Information could not be loaded completely. Please retry.');
    count = page.count;
    if (!page.data.length && rows.length < count) throw new Error('Information could not be loaded completely. Please retry.');
    for (const row of page.data) {
      if (ids.has(row.id)) throw new Error('Information changed while loading. Please retry.');
      ids.add(row.id); rows.push(row);
    }
    if (rows.length > count) throw new Error('Information changed while loading. Please retry.');
  } while (rows.length < count);
  return rows;
}
