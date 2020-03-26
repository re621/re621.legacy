import { RequestQueue } from "./RequestQueue";

/**
 * Conventient class to make e6 api requests
 */
export class Api {

    private static instance: Api;

    //needed to authenticate some post requests, for example when you modify user settings
    private authenticityToken: string;

    private queue: RequestQueue;

    private constructor() {
        this.authenticityToken = $("head meta[name=csrf-token]").attr("content");
        this.queue = new RequestQueue(2000);
    }

    /**
     * 
     * @param url e6 endpoint without the host, => /posts/123456.json
     * @param method either post or get
     * @param data Optional, only used when method is post
     */
    protected static async requestFunction(url: string, method: string, data = {}): Promise<string> {
        return new Promise(async (resolve, reject) => {
            let requestInfo: RequestInit = {
                credentials: "include",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Header": "re621 userscript https://github.com/re621/re621"
                },
                method: method,
                mode: "cors"
            };
            if (method !== "GET" && method !== "get") {
                let postData = []
                data["authenticity_token"] = this.getInstance().authenticityToken;
                for (const key of Object.keys(data)) {
                    postData.push(encodeURIComponent(key) + "=" + encodeURIComponent(data[key]));
                }
                requestInfo.body = postData.join("&");
            }
            const request = await fetch(location.protocol + "//" + location.host + url, requestInfo);
            if (request.status >= 200 && request.status < 400) {
                resolve(await request.text());
            } else {
                reject();
            }
        });
    }

    private static async request(url: string, method: string, data?: {}) {
        const queue = this.getInstance().queue;
        const id = queue.getRequestId();
        queue.add(this.requestFunction, id, url, method, data);
        return await queue.getRequestResult(id);
    }

    /**
     * @todo better error handling
     * @param url e6 endpoint without the host, => /posts/123456.json
     * @returns the response as a string
     */
    public static async getUrl(url: string) {
        return await this.request(url, "GET");
    }

    /**
     * @todo better error handling
     * @param url e6 endpoint without the host, => /posts/123456.json
     * @returns the response as a string
     */
    public static async getJson(url: string) {
        const response = await this.getUrl(url);
        return JSON.parse(response);
    }

    /**
     * @todo better error handling
     * @param url e6 endpoint without the host, => /posts/123456.json
     * @returns the response as a string
     */
    public static async postUrl(url: string, json?: {}) {
        return await this.request(url, "GET", json);
    }

    /**
     * Returns a singleton instance of the class
     * @returns Api instance
     */
    public static getInstance(): Api {
        if (this.instance === undefined) this.instance = new Api();
        return this.instance;
    }
}