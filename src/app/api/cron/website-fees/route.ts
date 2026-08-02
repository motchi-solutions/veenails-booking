import { timingSafeEqual } from "node:crypto";
import { runMonthlyWebsiteFeeWorkflow } from "@/features/website-fees/run-monthly-workflow";

function isAuthorized(request: Request) {
    const secret = process.env.CRON_SECRET;
    const authorization = request.headers.get("authorization");
    if (!secret || !authorization) return false;
    const expected = Buffer.from(`Bearer ${secret}`);
    const received = Buffer.from(authorization);
    return expected.length === received.length && timingSafeEqual(expected, received);
}

export async function GET(request: Request) {
    if (!isAuthorized(request)) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        return Response.json(await runMonthlyWebsiteFeeWorkflow());
    } catch (error) {
        console.error("[cron:website-fees]", error);
        return Response.json({ error: "Monthly website fee workflow failed." }, { status: 500 });
    }
}
