
const API_BASE = import.meta.env.API_URL;

type HTTPMethod = "GET" | "POST" | "DELETE" | "PATCH";

export class ApiError extends Error { //Error already built into JS, we add status to it
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}
interface ApiErrorResponse {
    error?: string;
}

export async function apiCall<TBody, TResponse>(url: string, method: HTTPMethod, body: TBody): Promise<TResponse> {
    const res = await fetch(`${API_BASE}/${url}`, {
        method,
        headers: { "Content-Type": "application/json"},
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
        let message: string;
        try {
            const data: ApiErrorResponse = await res.json();
            message = data.error ?? `Errore del server (${res.status})`;
        } catch {
            message = `Errore del server (${res.status})`;
        }
        throw new ApiError(message, res.status); //throw instead of return signals an error (try, catch)
    }

    return res.json();
}