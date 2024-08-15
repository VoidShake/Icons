export type PageData = {
   count: number
   total: number
   previousPage: number | undefined
   nextPage: number | undefined
   pageCount: number
   pageSize: number
}

export type Page<T> = PageData & {
   items: T[]
}
