import { requireAdmin } from "@/features/admin/auth/require-admin";
import { createTestWebsiteFeeInvoice } from "@/features/website-fees/test-invoice";

export async function GET() {
    await requireAdmin();
    let test: Awaited<ReturnType<typeof createTestWebsiteFeeInvoice>>;
    try {
        test = await createTestWebsiteFeeInvoice();
    } catch (error) {
        console.error("[website-fees:test-invoice-download]", error);
        return new Response(
            "Invoice addresses are not fully configured. Add both server-side invoice address variables and redeploy.",
            { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } },
        );
    }
    const bytes = Buffer.from(test.pdf, "base64");

    return new Response(bytes, {
        headers: {
            "Cache-Control": "no-store",
            "Content-Disposition": `attachment; filename="${test.filename}"`,
            "Content-Type": "application/pdf",
        },
    });
}
