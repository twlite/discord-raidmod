import { createHash } from "crypto";

export const hashContent = (content: string) => {
    return createHash("md5").update(content.toLowerCase()).digest("hex");
};

export const verifyContent = (content: string, hash: string) => {
    return hashContent(content) === hash;
};
