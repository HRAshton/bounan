declare global {
    interface Array<T> {
        sortBy<K>(...props: ((val: T) => K)[]): T[];

        groupBy<K extends string | number | symbol>(fn: (val: T, index: number, arr?: T[]) => K): T[][];

        distinctBy<K>(fn: (val: T, index?: number, arr?: T[]) => K): T[];
    }
}

export {};