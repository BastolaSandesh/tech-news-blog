export interface Vlog {
    id: string;
    title: string;
    content: string;
    sourceUrl: string;
    keyTakeaways: string[];
    timestamp: string;
}

export interface VlogResponse {
    vlogs: Vlog[];
    total: number;
    page: number;
    pageSize: number;
}
