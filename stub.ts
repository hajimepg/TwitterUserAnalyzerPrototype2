import * as fs from "fs";

import Tweet from "./tweet";

export default {
    get: (endpoint: string, parameters: { max_id?: number }, callback: (error, response) => void) => {
        if (endpoint === "statuses/user_timeline") {
            const fileContents = fs.readFileSync("./stub.json", { encoding: "utf8" });
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
    }
};
