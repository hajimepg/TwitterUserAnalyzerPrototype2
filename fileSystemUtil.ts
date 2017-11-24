import * as fs from "fs";

import * as DateFns from "date-fns";

export function createFileName(screenName: string): string {
    const currentDate: string = DateFns.format(new Date(), "YYYY-MM-DD");
    let filename: string;

    for (let i: number = 0; ; i++) {
        if (i === 0) {
            filename = `./${screenName}-${currentDate}.json`;
        }
        else {
            filename = `./${screenName}-${currentDate}_${i}.json`;
        }

        if (fs.existsSync(filename) === false) {
            break;
        }
    }

    return filename;
}

export function createDirName(screenName: string): string {
    const currentDate: string = DateFns.format(new Date(), "YYYY-MM-DD");
    let filename: string;

    for (let i: number = 0; ; i++) {
        if (i === 0) {
            filename = `./${screenName}-${currentDate}`;
        }
        else {
            filename = `./${screenName}-${currentDate}_${i}`;
        }

        if (fs.existsSync(filename) === false) {
            break;
        }
    }

    return filename;
}
