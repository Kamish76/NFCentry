import { query } from '@/lib/db'

type FilterOp = {
  type: 'eq' | 'neq' | 'in' | 'or' | 'gte' | 'lte' | 'gt' | 'lt' | 'ilike'
  column?: string
  value?: any
  raw?: string
}

export type NeonDbError = Error & { code?: string }

export class NeonQueryBuilder<T = any> implements PromiseLike<{ data: any; error: NeonDbError | null; count?: number | null }> {
  private tableName: string
  private mode: 'select' | 'insert' | 'update' | 'delete' = 'select'
  private selectCols: string = '*'
  private selectOptions?: { count?: string; head?: boolean }
  private insertData: any = null
  private updateData: any = null
  private filters: FilterOp[] = []
  private orderByCol?: string
  private orderAsc: boolean = true
  private limitVal?: number
  private offsetVal?: number
  private isSingle: boolean = false
  private isMaybeSingle: boolean = false

  constructor(tableName: string) {
    this.tableName = tableName
  }

  select(columns: string = '*', options?: { count?: string; head?: boolean }): this {
    this.mode = 'select'
    this.selectCols = columns
    this.selectOptions = options
    return this
  }

  insert(values: any): this {
    this.mode = 'insert'
    this.insertData = values
    return this
  }

  update(values: any): this {
    this.mode = 'update'
    this.updateData = values
    return this
  }

  delete(): this {
    this.mode = 'delete'
    return this
  }

  eq(column: string, value: any): this {
    this.filters.push({ type: 'eq', column, value })
    return this
  }

  neq(column: string, value: any): this {
    this.filters.push({ type: 'neq', column, value })
    return this
  }

  gte(column: string, value: any): this {
    this.filters.push({ type: 'gte', column, value })
    return this
  }

  lte(column: string, value: any): this {
    this.filters.push({ type: 'lte', column, value })
    return this
  }

  gt(column: string, value: any): this {
    this.filters.push({ type: 'gt', column, value })
    return this
  }

  lt(column: string, value: any): this {
    this.filters.push({ type: 'lt', column, value })
    return this
  }

  ilike(column: string, pattern: string): this {
    this.filters.push({ type: 'ilike', column, value: pattern })
    return this
  }

  in(column: string, values: any[]): this {
    this.filters.push({ type: 'in', column, value: values })
    return this
  }

  not(column: string, operator: string, value: any): this {
    this.filters.push({ type: 'not', column, operator, value } as any)
    return this
  }

  or(filterString: string): this {
    this.filters.push({ type: 'or', raw: filterString })
    return this
  }

  order(column: string, options?: { ascending?: boolean }): this {
    this.orderByCol = column
    this.orderAsc = options?.ascending ?? true
    return this
  }

  limit(n: number): this {
    this.limitVal = n
    return this
  }

  range(from: number, to: number): this {
    this.offsetVal = from
    this.limitVal = to - from + 1
    return this
  }

  single(): Promise<{ data: any; error: NeonDbError | null }> {
    this.isSingle = true
    return this.execute() as Promise<{ data: any; error: NeonDbError | null }>
  }

  maybeSingle(): Promise<{ data: any; error: NeonDbError | null }> {
    this.isMaybeSingle = true
    return this.execute() as Promise<{ data: any; error: NeonDbError | null }>
  }

  async execute(): Promise<{ data: any; error: NeonDbError | null; count?: number | null }> {
    try {
      const params: any[] = []
      let sql = ''

      // Build WHERE clause
      const whereParts: string[] = []
      for (const f of this.filters) {
        if (f.type === 'eq') {
          params.push(f.value)
          whereParts.push(`"${f.column}" = $${params.length}`)
        } else if (f.type === 'neq') {
          params.push(f.value)
          whereParts.push(`"${f.column}" != $${params.length}`)
        } else if (f.type === 'gte') {
          params.push(f.value)
          whereParts.push(`"${f.column}" >= $${params.length}`)
        } else if (f.type === 'lte') {
          params.push(f.value)
          whereParts.push(`"${f.column}" <= $${params.length}`)
        } else if (f.type === 'gt') {
          params.push(f.value)
          whereParts.push(`"${f.column}" > $${params.length}`)
        } else if (f.type === 'lt') {
          params.push(f.value)
          whereParts.push(`"${f.column}" < $${params.length}`)
        } else if (f.type === 'ilike') {
          params.push(f.value)
          whereParts.push(`"${f.column}" ILIKE $${params.length}`)
        } else if (f.type === 'in' && Array.isArray(f.value)) {
          if (f.value.length === 0) {
            whereParts.push('FALSE')
          } else {
            const placeholders = f.value.map((v) => {
              params.push(v)
              return `$${params.length}`
            })
            whereParts.push(`"${f.column}" IN (${placeholders.join(', ')})`)
          }
        } else if (f.type === 'or' && f.raw) {
          const tokens = f.raw.split(',')
          const orClauses: string[] = []
          for (const token of tokens) {
            const parts = token.trim().split('.')
            if (parts.length >= 3 && parts[1] === 'eq') {
              const col = parts[0]
              const val = parts.slice(2).join('.')
              params.push(val)
              orClauses.push(`"${col}" = $${params.length}`)
            }
          }
          if (orClauses.length > 0) {
            whereParts.push(`(${orClauses.join(' OR ')})`)
          }
        } else if ((f as any).type === 'not') {
          if ((f as any).operator === 'in') {
            let items: string[] = []
            if (typeof f.value === 'string' && f.value.startsWith('(') && f.value.endsWith(')')) {
              items = f.value.slice(1, -1).split(',').filter(Boolean)
            } else if (Array.isArray(f.value)) {
              items = f.value
            }
            if (items.length > 0) {
              const placeholders = items.map((v) => {
                params.push(v)
                return `$${params.length}`
              })
              whereParts.push(`"${f.column}" NOT IN (${placeholders.join(', ')})`)
            }
          }
        }
      }

      const whereClause = whereParts.length > 0 ? ` WHERE ${whereParts.join(' AND ')}` : ''

      if (this.mode === 'select') {
        let cols = this.selectCols
        if (cols.includes('count()') || cols === 'count' || this.selectOptions?.head) {
          cols = 'COUNT(*) as count'
        }
        sql = `SELECT ${cols === '*' ? '*' : cols} FROM public."${this.tableName}"${whereClause}`

        if (this.orderByCol) {
          sql += ` ORDER BY "${this.orderByCol}" ${this.orderAsc ? 'ASC' : 'DESC'}`
        }
        if (this.limitVal != null) {
          sql += ` LIMIT ${this.limitVal}`
        }
        if (this.offsetVal != null) {
          sql += ` OFFSET ${this.offsetVal}`
        }

        const res = await query(sql, params)

        if (this.selectOptions?.head) {
          const countNum = parseInt(res.rows[0]?.count || '0', 10)
          return { data: null, error: null, count: countNum }
        }

        if (this.isSingle) {
          if (res.rowCount === 0) {
            const err = new Error('Row not found') as NeonDbError
            err.code = 'PGRST116'
            return { data: null, error: err }
          }
          return { data: res.rows[0], error: null }
        }

        if (this.isMaybeSingle) {
          return { data: res.rows[0] || null, error: null }
        }

        return { data: res.rows, error: null, count: res.rowCount }
      }

      if (this.mode === 'insert') {
        const isArray = Array.isArray(this.insertData)
        const rowsToInsert = isArray ? this.insertData : [this.insertData]

        if (rowsToInsert.length === 0) {
          return { data: [], error: null }
        }

        const keys = Object.keys(rowsToInsert[0])
        const colNames = keys.map((k) => `"${k}"`).join(', ')

        const valuesClauses: string[] = []
        for (const row of rowsToInsert) {
          const rowPlaceholders = keys.map((k) => {
            params.push(row[k])
            return `$${params.length}`
          })
          valuesClauses.push(`(${rowPlaceholders.join(', ')})`)
        }

        sql = `INSERT INTO public."${this.tableName}" (${colNames}) VALUES ${valuesClauses.join(
          ', '
        )} RETURNING *`

        const res = await query(sql, params)
        const returnedData = isArray || !this.isSingle ? res.rows : res.rows[0] || null
        return { data: returnedData, error: null }
      }

      if (this.mode === 'update') {
        const keys = Object.keys(this.updateData)
        if (keys.length === 0) {
          return { data: null, error: null }
        }

        const setClauses = keys.map((k) => {
          params.push(this.updateData[k])
          return `"${k}" = $${params.length}`
        })

        sql = `UPDATE public."${this.tableName}" SET ${setClauses.join(', ')}${whereClause} RETURNING *`
        const res = await query(sql, params)
        return { data: this.isSingle || this.isMaybeSingle ? res.rows[0] || null : res.rows, error: null }
      }

      if (this.mode === 'delete') {
        sql = `DELETE FROM public."${this.tableName}"${whereClause} RETURNING *`
        const res = await query(sql, params)
        return { data: res.rows, error: null }
      }

      return { data: null, error: null }
    } catch (err: any) {
      console.error(`[Neon DB Query Error on ${this.tableName}]:`, err)
      return { data: null, error: err }
    }
  }

  then<TResult1 = { data: any; error: NeonDbError | null; count?: number | null }, TResult2 = never>(
    onfulfilled?:
      | ((value: { data: any; error: NeonDbError | null; count?: number | null }) => TResult1 | PromiseLike<TResult1>)
      | undefined
      | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected)
  }
}
