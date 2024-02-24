// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../types/list.extensions.d.ts" />

Array.prototype.sortBy = function <T, K>(...props: ((val: T) => K)[]): T[] {
    return [...this].sort((a, b) =>
        props.reduce((acc, prop) => {
            if (acc === 0) {
                const [aProp, bProp] = [prop(a), prop(b)];
                acc = aProp > bProp ? 1 : aProp < bProp ? -1 : 0;
            }
            return acc;
        }, 0)
    );
};

Array.prototype.groupBy = function <T, K extends string | number | symbol>(
    fn: (val: T, index: number, arr?: T[]) => K,
): T[][] {
    const groups = this
        .map(fn)
        .reduce((acc: Record<K, T[]>, val: K, i: number) => {
            acc[val] = (acc[val] || []).concat(this[i]);
            return acc;
        }, {} as Record<K, T[]>);
    return Object.values(groups);
};

Array.prototype.distinctBy = function <T, K>(fn: (val: T, index?: number, arr?: T[]) => K): T[] {
    return this.filter((v: T, i: number, a: T[]) => a.findIndex((t) => fn(t) === fn(v)) === i);
};

export {};