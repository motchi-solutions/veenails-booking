import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

type ReviewTokenPayload = {
    runId: string;
    nonce: string;
    billingMonth: string;
};

function secret() {
    const value =
        process.env.WEBSITE_FEE_WORKFLOW_SECRET?.trim() ||
        process.env.CRON_SECRET?.trim();
    if (!value) throw new Error("Missing website fee workflow secret.");
    return value;
}

export function createReviewToken(payload: ReviewTokenPayload) {
    const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = createHmac("sha256", secret())
        .update(encoded)
        .digest("base64url");
    return `${encoded}.${signature}`;
}

export function verifyReviewToken(token: string): ReviewTokenPayload | null {
    const [encoded, supplied] = token.split(".");
    if (!encoded || !supplied) return null;

    const expected = createHmac("sha256", secret())
        .update(encoded)
        .digest("base64url");
    const suppliedBytes = Buffer.from(supplied);
    const expectedBytes = Buffer.from(expected);
    if (
        suppliedBytes.length !== expectedBytes.length ||
        !timingSafeEqual(suppliedBytes, expectedBytes)
    ) {
        return null;
    }

    try {
        const parsed = JSON.parse(
            Buffer.from(encoded, "base64url").toString("utf8"),
        ) as ReviewTokenPayload;
        return parsed.runId && parsed.nonce && parsed.billingMonth
            ? parsed
            : null;
    } catch {
        return null;
    }
}
