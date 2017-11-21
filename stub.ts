import * as fs from "fs";

import Profile from "./profile";
import Tweet from "./tweet";

/* tslint:disable:variable-name */
class Parameters {
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
    }
};
