import * as lodash from "lodash";

import GetUserTimeLineOptions from "./getUserTimeLineOptions";
import Profile from "./profile";
import Tweet from "./tweet";
import User from "./user";

export async function getProfile(client, screenName?: string) {
    let endpoint: string;
    let options: object;

    if (screenName === undefined) {
        endpoint = "account/verify_credentials";
        options = {};
    }
    else {
        endpoint = "users/show";
        options = { screen_name: screenName };
    }

    return new Promise<Profile>((resolve, reject) => {
        client.get(endpoint, options, (error, response) => {
            if (error) {
                reject(error);
                return;
            }

            resolve(response);
        });
    });
}

export async function getTweets(client, screenName: string) {
    return new Promise<Tweet[]>((resolve, reject) => {
        const result: Tweet[] = [];

        function getTweetsInternal(maxId?: number) {
            const options: GetUserTimeLineOptions = {
                count: 200,
                exclude_replies: false,
                include_rts: false,
                trim_user: true,
            };
            if (screenName !== undefined) {
                options.screen_name = screenName;
            }
            if (maxId !== undefined) {
                options.max_id = maxId;
            }

            client.get("statuses/user_timeline", options, (error, response: Tweet[]) => {
                if (error) {
                    reject(error);
                    return;
                }

                if (response.length === 0) {
                    resolve(result);
                    return;
                }

                const lastTweetId = lodash.last(response).id;
                console.log(`count=${response.length} lastTweetId=${lastTweetId}` );

                if (response.length === 1 && maxId === lastTweetId) {
                    resolve(result);
                }
                else {
                    for (const tweet of response) {
                        if (result.findIndex((t) => t.id === tweet.id) === -1) {
                            result.push(tweet);
                        }
                    }

                    getTweetsInternal(lastTweetId);
                }
            });
        }

        getTweetsInternal();
    });
}

async function getUserList(client, endpoint: string, screenName?: string) {
    return new Promise<User[]>((resolve, reject) => {
        let users: User[] = [];

        function getUserListInternal(cursor: number) {
            const options: { skip_status, count, cursor, screen_name? } = { skip_status: true, count: 200, cursor };
            if (screenName !== undefined) {
                options.screen_name = screenName;
            }

            client.get(endpoint, options, (error, response) => {
                if (error) {
                    reject(error);
                    return;
                }

                users = users.concat(response.users);

                console.log(`next_cursor=${response.next_cursor}`);
                if (response.next_cursor === 0) {
                    resolve(users);
                }
                else {
                    getUserListInternal(response.next_cursor);
                }
            });
        }

        getUserListInternal(-1);
    });
}

export async function getFollowers(client, screenName?: string) {
    return getUserList(client, "followers/list", screenName);
}

export async function getFriends(client, screenName?: string) {
    return getUserList(client, "friends/list", screenName);
}
