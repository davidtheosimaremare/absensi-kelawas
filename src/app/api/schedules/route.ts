import { adminOnly } from "@/lib/admin-check";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const unauthorized = await adminOnly();
  if (unauthorized) return unauthorized;

  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    let where = {};
    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      where = {
        date: {
          gte: startDate,
          lte: endDate,
        },
      };
    }

    const schedules = await prisma.schedule.findMany({
      where,
      orderBy: { date: "asc" },
    });
    return NextResponse.json(schedules);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch schedules" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const unauthorized = await adminOnly();
  if (unauthorized) return unauthorized;

  try {
    const body = await req.json();
    const { date, status } = body;

    if (!date || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const schedule = await prisma.schedule.upsert({
      where: { date: new Date(date) },
      update: { status },
      create: {
        date: new Date(date),
        status,
      },
    });

    return NextResponse.json(schedule);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update schedule" }, { status: 500 });
  }
}
