import Tweet from "./tweet";

/* tslint:disable:variable-name */
export default class Profile {
    public id: number;
    public id_str: string;
    public name: string;
    public screen_name: string;
    public location: string;
    public description: string;
    public url: string;
    public entities: object;
    public protected: boolean;
    public followers_count: number;
    public friends_count: number;
    public listed_count: number;
    public created_at: string;
    public favourites_count: number;
    public utc_offset: number;
    public time_zone: string;
    public geo_enabled: boolean;
    public verified: boolean;
    public statuses_count: number;
    public lang: string;
    public status: Tweet;
    public contributors_enabled: boolean;
    public is_translator: boolean;
    public is_translation_enabled: boolean;
    public profile_background_color: string;
    public profile_background_image_url: string;
    public profile_background_image_url_https: string;
    public profile_background_tile: boolean;
    public profile_image_url: string;
    public profile_image_url_https: string;
    public profile_link_color: string;
    public profile_sidebar_border_color: string;
    public profile_sidebar_fill_color: string;
    public profile_text_color: string;
    public profile_use_background_image: boolean;
    public has_extended_profile: boolean;
    public default_profile: boolean;
    public default_profile_image: boolean;
    public following: boolean;
    public follow_request_sent: boolean;
    public notifications: boolean;
    public translator_type: string;
}
/* tslint:enable:variable-name */
