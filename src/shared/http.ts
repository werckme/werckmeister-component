
const cache = new Map<string, Promise<string>>();
export async function fetchText(url: string): Promise<string> {
    if (cache.has(url)) {
        return cache.get(url);
    }
    const txtPromise = fetch(url).then(request => {
        return request.text();
    });
    cache.set(url, txtPromise);
    return txtPromise;
}