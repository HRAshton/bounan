export const addProtocol = (url: string): string => {
    if (!url.startsWith('//') && !url.startsWith('https:')) {
        throw new Error('Link should start with // or https://');
    }

    return url.startsWith('http') ? url : `https:${url}`;
}