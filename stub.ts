import * as fs from "fs";

import Profile from "./profile";
import Tweet from "./tweet";
import User from "./user";

/* tslint:disable:variable-name */
class Parameters {
    public cursor?: number;
    public screen_name?: string;
    public max_id?: number;
}
/* tslint:enable:variable-name */

export default {
    get: (endpoint: string, parameters: Parameters, callback: (error, response) => void) => {
        if (endpoint === "statuses/user_timeline") {
            const fileContents = fs.readFileSync("./stubTweets.json", { encoding: "utf8" });
            const tweets: Tweet[] = JSON.parse(fileContents);

            let beginIndex: number;
            if (parameters.max_id === undefined || parameters.max_id === null) {
                beginIndex = 0;
            }
            else {
                beginIndex = tweets.findIndex((tweet) => tweet.id === parameters.max_id);
                if (beginIndex === -1) {
                    beginIndex = 0;
                }
            }

            const endIndex: number = Math.min(beginIndex + 200, tweets.length);
            const response: Tweet[] = tweets.slice(beginIndex, endIndex); // Note: endIndexの要素は含まない

            callback(null, response);
        }
        else if (endpoint === "account/verify_credentials" || endpoint === "users/show") {
            const fileContents = fs.readFileSync("./stubProfile.json", { encoding: "utf8" });
            const profile: Profile = JSON.parse(fileContents);

            callback(null, profile);
        }
        else if (endpoint === "followers/list" || endpoint === "friends/list") {
            let fileName: string;
            if (endpoint === "followers/list") {
                fileName = (parameters.screen_name === undefined) ?
                    "./stubYourFollowers.json" : "./stubTargetFollowers.json";
            }
            else {
                fileName = (parameters.screen_name === undefined) ?
                    "./stubYourFriends.json" : "./stubTargetFriends.json";
            }

            const fileContents = fs.readFileSync(fileName, { encoding: "utf8" });
            const users: User[] = JSON.parse(fileContents);

            const beginIndex = (parameters.cursor === undefined || parameters.cursor === -1) ? 0 : parameters.cursor;
            const endIndex = Math.min(beginIndex + 200, users.length);
            const responseUsers = users.slice(beginIndex, endIndex); // Note: endIndexの要素は含まない
            const nextCursor = (endIndex >= users.length) ? 0 : endIndex;

            callback(null, { next_cursor: nextCursor, users: responseUsers });
        }
    }
};
