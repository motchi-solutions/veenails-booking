/** Load every page; callers must provide a stable ordering for the range query. */
export async function fetchAllPages<T>(
    fetchPage: (from: number, to: number) => Promise<T[]>,
    pageSize = 100,
): Promise<T[]> {
    if (!Number.isInteger(pageSize) || pageSize < 1) {
        throw new Error("Page size must be a positive integer.");
    }
    const rows: T[] = [];
    for (let offset = 0; ; offset += pageSize) {
        const page = await fetchPage(offset, offset + pageSize - 1);
        rows.push(...page);
        if (page.length < pageSize) return rows;
    }
}
