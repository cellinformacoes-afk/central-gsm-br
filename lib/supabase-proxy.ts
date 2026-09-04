interface Filter {
  column: string;
  op: 'eq' | 'neq' | 'in' | 'lte' | 'gte' | 'like' | 'ilike' | 'is';
  value: any;
}

interface Order {
  column: string;
  ascending?: boolean;
}

interface QueryOptions {
  table: string;
  select?: string;
  filters?: Filter[];
  order?: Order;
  limit?: number;
  single?: boolean;
}

async function proxyQuery<T = any>(options: QueryOptions): Promise<T> {
  const res = await fetch('/api/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json.data;
}

async function proxyRpc<T = any>(fn: string, params?: Record<string, any>): Promise<T> {
  const res = await fetch('/api/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rpc: fn, rpcParams: params || {} }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json.data;
}

export const proxy = {
  from(table: string) {
    const filters: Filter[] = [];
    let selectCols = '*';
    let orderOption: Order | undefined;
    let limitVal: number | undefined;
    let singleVal = false;

    const builder = {
      select(cols: string = '*') { selectCols = cols; return builder; },
      eq(col: string, val: any) { filters.push({ column: col, op: 'eq', value: val }); return builder; },
      neq(col: string, val: any) { filters.push({ column: col, op: 'neq', value: val }); return builder; },
      in(col: string, val: any[]) { filters.push({ column: col, op: 'in', value: val }); return builder; },
      lte(col: string, val: any) { filters.push({ column: col, op: 'lte', value: val }); return builder; },
      gte(col: string, val: any) { filters.push({ column: col, op: 'gte', value: val }); return builder; },
      like(col: string, val: string) { filters.push({ column: col, op: 'like', value: val }); return builder; },
      ilike(col: string, val: string) { filters.push({ column: col, op: 'ilike', value: val }); return builder; },
      is(col: string, val: any) { filters.push({ column: col, op: 'is', value: val }); return builder; },
      order(col: string, opts?: { ascending?: boolean }) { orderOption = { column: col, ascending: opts?.ascending ?? false }; return builder; },
      limit(n: number) { limitVal = n; return builder; },
      single() { singleVal = true; return builder; },
      then(resolve: any, reject?: any) {
        return proxyQuery({
          table, select: selectCols, filters, order: orderOption, limit: limitVal, single: singleVal,
        }).then(resolve, reject);
      },
    };
    return builder;
  },
  rpc: proxyRpc,
};
