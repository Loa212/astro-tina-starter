import { AbstractIterator, AbstractKeyIterator, AbstractValueIterator } from 'abstract-level';
import { SqliteLevel } from 'sqlite-level';

/**
 * Variante di `sqlite-level` con iteratori "eager".
 *
 * `sqlite-level` usa `stmt.iterate()`: finché l'iteratore non è esaurito o chiuso, better-sqlite3
 * rifiuta qualsiasi altra query sulla stessa connessione ("This database connection is busy").
 * Tina apre iteratori che non chiude (es. `keys({ limit: 1 }).next()` per la collection utenti) e
 * alterna letture e scritture in modo asincrono: con dati già presenti nel DB la re-indicizzazione
 * si blocca. Qui ogni iteratore legge subito tutte le righe (`stmt.all()`) e le serve dalla memoria.
 * Il dataset è di poche decine di documenti: il costo è trascurabile.
 */

type Row = { key: string; value: string };
type RangeOptions = {
  gt?: string;
  gte?: string;
  lt?: string;
  lte?: string;
  reverse?: boolean;
  limit?: number;
};

function queryFromOptions(options: RangeOptions) {
  let query = 'SELECT key, value FROM kv';
  const params: unknown[] = [];
  const conditions: string[] = [];
  if (options.gt != null) {
    conditions.push('key > ?');
    params.push(options.gt);
  } else if (options.gte != null) {
    conditions.push('key >= ?');
    params.push(options.gte);
  }
  if (options.lt != null) {
    conditions.push('key < ?');
    params.push(options.lt);
  } else if (options.lte != null) {
    conditions.push('key <= ?');
    params.push(options.lte);
  }
  if (conditions.length > 0) query += ` WHERE ${conditions.join(' AND ')}`;
  query += options.reverse ? ' ORDER BY key DESC' : ' ORDER BY key ASC';
  if (options.limit != null && options.limit >= 0) {
    query += ' LIMIT ?';
    params.push(options.limit);
  }
  return { query, params };
}

// biome-ignore lint/suspicious/noExplicitAny: better-sqlite3 Database, tipizzato come in sqlite-level
function readAll(client: any, options: RangeOptions): Row[] {
  const { query, params } = queryFromOptions(options);
  return client.prepare(query).all(...params) as Row[];
}

// biome-ignore lint/suspicious/noExplicitAny: i tipi generici di abstract-level sono poco pratici qui
type AnyLevel = any;

class EagerIterator extends AbstractIterator<AnyLevel, string, string> {
  private rows: Row[];
  private index = 0;
  constructor(db: AnyLevel, options: RangeOptions, rows: Row[]) {
    super(db, options);
    this.rows = rows;
  }
  _next(callback: (err: Error | null, key?: string, value?: string) => void) {
    const row = this.rows[this.index++];
    this.db.nextTick(callback, null, row?.key, row?.value);
  }
}

class EagerKeyIterator extends AbstractKeyIterator<AnyLevel, string> {
  private rows: Row[];
  private index = 0;
  constructor(db: AnyLevel, options: RangeOptions, rows: Row[]) {
    super(db, options);
    this.rows = rows;
  }
  _next(callback: (err: Error | null, key?: string) => void) {
    const row = this.rows[this.index++];
    this.db.nextTick(callback, null, row?.key);
  }
}

class EagerValueIterator extends AbstractValueIterator<AnyLevel, string, string> {
  private rows: Row[];
  private index = 0;
  constructor(db: AnyLevel, options: RangeOptions, rows: Row[]) {
    super(db, options);
    this.rows = rows;
  }
  _next(callback: (err: Error | null, value?: string) => void) {
    const row = this.rows[this.index++];
    this.db.nextTick(callback, null, row?.value);
  }
}

type IterOpts<K, V> = Parameters<SqliteLevel<K, V>['_iterator']>[0];

export class EagerSqliteLevel<K = string, V = string> extends SqliteLevel<K, V> {
  _iterator(options: IterOpts<K, V>) {
    const range = options as unknown as RangeOptions;
    return new EagerIterator(this, range, readAll(this.db, range)) as unknown as ReturnType<
      SqliteLevel<K, V>['_iterator']
    >;
  }
  _keys(options: IterOpts<K, V>) {
    const range = options as unknown as RangeOptions;
    return new EagerKeyIterator(this, range, readAll(this.db, range)) as unknown as ReturnType<
      SqliteLevel<K, V>['_keys']
    >;
  }
  _values(options: IterOpts<K, V>) {
    const range = options as unknown as RangeOptions;
    return new EagerValueIterator(this, range, readAll(this.db, range)) as unknown as ReturnType<
      SqliteLevel<K, V>['_values']
    >;
  }
}
