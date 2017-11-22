import * as fs from "fs";
import * as http from "http";
import * as path from "path";

function getExtension(contentType: string | string[]): string {
    switch (contentType) {
        case "image/jpeg":
            return "jpg";
        case "image/png":
            return "png";
        default:
            return "";
    }
}

function getOriginalImageUrl(profileImageUrl: string): string {
    return profileImageUrl.replace("_normal", "");
}

export async function downloadProfileImage(
    profileImageUrl: string, imageDir: string, baseFileName: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        const originalImageUrl = getOriginalImageUrl(profileImageUrl);

        http.get(originalImageUrl, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error(`download ${profileImageUrl} failed. statusCode=${res.statusCode}`));
                return;
            }

            const contentType = res.headers["content-type"];
            const extension: string = getExtension(contentType);
            if (extension === "") {
                reject(new Error(`Unsupported content-type: ${contentType}`));
                return;
            }

            const chunks: Buffer[] = [];
            res.on("data", (chunk: Buffer) => {
                chunks.push(chunk);
            });
            res.on("end", () => {
                const filename = `${baseFileName}.${extension}`;
                const imageData = Buffer.concat(chunks);
                fs.writeFileSync(path.join(imageDir, filename), imageData);
                resolve(filename);
            });
        });
    });
}
