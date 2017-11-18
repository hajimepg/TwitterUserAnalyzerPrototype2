/* tslint:disable:variable-name */
export default class Tweet {
    public created_at: string;
    public id: number;
    public id_str: string;
    public text: string;
    public truncated: boolean;
    public entities: {
        hashtags: Array<{ text: string, indicies: number[] }>,
        symbols: any[],
        user_mentions: any[],
        urls: any[]
    };
    public source: string;
    public in_reply_to_status_id: number;
    public in_reply_to_status_id_str: string;
    public in_reply_to_user_id: number;
    public in_reply_to_user_id_str: string;
    public in_reply_to_screen_name: string;
    public user: { id: number, id_str: string };
    public geo: any;
    public coordinates: any;
    public place: any;
    public contributors: any;
    public is_quote_status: boolean;
    public retweet_count: number;
    public favorite_count: number;
    public favorited: boolean;
    public retweeted: boolean;
    public lang: string;
}
/* tslint:enable:variable-name */
