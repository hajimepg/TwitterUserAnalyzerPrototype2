import * as DateFns from "date-fns";
import * as lodash from "lodash";

import DailyTweetCount from "./dailyTweetCount";
import DailyHourlyTweetCount from "./daylyHourlyTweetCount";

export function convertDailyTweetCount(dailyTweetCount: DailyTweetCount[]) {
    const JSTOffsetHours = 9;
    const maxDate = lodash.last(dailyTweetCount).date;
    const minDate = DateFns.format(DateFns.addHours(DateFns.subDays(maxDate, 30), JSTOffsetHours), "YYYY-MM-DD");

    const result: Array<{ label: string, count: number, height?: number }> = [];
    for (const day of DateFns.eachDay(minDate, maxDate)) {
        const date = DateFns.format(DateFns.addHours(day, JSTOffsetHours), "YYYY-MM-DD");

        const record = dailyTweetCount.find((r) => r.date === date);
        if (record === undefined) {
            result.push({ label: date.substr(-2), count: 0 });
        }
        else {
            result.push({ label: record.date.substr(-2), count: record.count });
        }
    }

    const maxCount: number = lodash.maxBy(result, "count").count;
    const halfCount: number = Math.round(maxCount / 2);

    const maxHeight: number = 185;
    for (const data of result) {
        data.height = Math.round(maxHeight * data.count / maxCount);
    }

    return {
        data: result,
        verticalLabels: [0, halfCount, maxCount]
    };
}

export function convertDayHourTweetCount(dayHourTweetCount: DailyHourlyTweetCount[]) {
    const result = lodash.cloneDeep(dayHourTweetCount);

    for (const outer of result) {
        for (const inner of outer.hours) {
            let color: string = "";
            if (inner.count >= 30) {
                color = "#196127";
            }
            else if (inner.count >= 20) {
                color = "#239a3b";
            }
            else if (inner.color >= 10) {
                color = "#7bc96f";
            }
            else if (inner.count >= 1) {
                color = "#c6e48b";
            }
            else {
                color = "#ebedf0";
            }

            inner.color = color;
        }
    }

    return result;
}
