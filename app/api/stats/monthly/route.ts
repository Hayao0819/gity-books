export const dynamic = "force-dynamic";
import { type NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
    try {
        requireAuth(request);

        const { searchParams } = new URL(request.url);
        const year = Number.parseInt(
            searchParams.get("year") || new Date().getFullYear().toString(),
        );
        const month = Number.parseInt(
            searchParams.get("month") || (new Date().getMonth() + 1).toString(),
        );

        if (month < 1 || month > 12) {
            return NextResponse.json(
                { error: "Invalid month. Must be between 1 and 12" },
                { status: 400 },
            );
        }

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        // Get daily checkout counts using Supabase's date functions
        if (!supabaseAdmin) {
            console.error("Supabase admin client is null");
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 },
            );
        }
        type DailyStat = { date: string; count: number };
        const { data: checkoutStatsRaw, error: checkoutError } =
            await (supabaseAdmin.rpc as unknown as (
                fn: string,
                params: Record<string, unknown>
            ) => Promise<{ data: unknown; error: unknown }>)(
                "get_daily_checkout_stats",
                {
                    start_date: startDate.toISOString(),
                    end_date: endDate.toISOString(),
                }
            );
        const checkoutStats = checkoutStatsRaw as unknown as DailyStat[];

        if (checkoutError) {
            console.error("Database error:", checkoutError);
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 },
            );
        }

        // Get daily return counts
        if (!supabaseAdmin) {
            console.error("Supabase admin client is null");
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 },
            );
        }
        const { data: returnStatsRaw, error: returnError } =
            await (supabaseAdmin.rpc as unknown as (
                fn: string,
                params: Record<string, unknown>
            ) => Promise<{ data: unknown; error: unknown }>)(
                "get_daily_return_stats",
                {
                    start_date: startDate.toISOString(),
                    end_date: endDate.toISOString(),
                }
            );
        const returnStats = returnStatsRaw as unknown as DailyStat[];

        if (returnError) {
            console.error("Database error:", returnError);
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 },
            );
        }

        // Merge data by date
        const statsMap = new Map<
            string,
            { month: string; checkouts: number; returns: number }
        >();

        if (Array.isArray(checkoutStats)) {
            for (const stat of checkoutStats) {
                const dateStr = stat.date;
                if (!statsMap.has(dateStr)) {
                    statsMap.set(dateStr, {
                        month: dateStr,
                        checkouts: 0,
                        returns: 0,
                    });
                }
                const entry = statsMap.get(dateStr);
                if (entry) entry.checkouts = stat.count;
            }
        }

        if (Array.isArray(returnStats)) {
            for (const stat of returnStats) {
                const dateStr = stat.date;
                if (!statsMap.has(dateStr)) {
                    statsMap.set(dateStr, {
                        month: dateStr,
                        checkouts: 0,
                        returns: 0,
                    });
                }
                const entry = statsMap.get(dateStr);
                if (entry) entry.returns = stat.count;
            }
        }

        const stats = Array.from(statsMap.values());

        return NextResponse.json({
            year,
            month,
            stats,
        });
    } catch (error) {
        console.error("Get monthly stats error:", error);
        if (error instanceof Error && error.message.includes("token")) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
