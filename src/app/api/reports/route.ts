import { adminOnly } from "@/lib/admin-check";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";

export async function GET(req: Request) {
  const unauthorized = await adminOnly();
  if (unauthorized) return unauthorized;

  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "month"; // month, week

    let startDate, endDate;

    if (range === "week") {
      startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
      endDate = endOfWeek(new Date(), { weekStartsOn: 1 });
    } else {
      startDate = startOfMonth(new Date());
      endDate = endOfMonth(new Date());
    }

    // Fetch metrics
    const [totalEmployees, presentToday, schedules] = await Promise.all([
      prisma.user.count({ where: { role: "EMPLOYEE" } }),
      prisma.attendance.count({
        where: {
          checkIn: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.schedule.findMany({
        where: {
          date: { gte: startDate, lte: endDate },
        },
      }),
    ]);

    // Fetch raw attendance for the range
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        checkIn: { gte: startDate, lte: endDate },
      },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
      orderBy: { checkIn: "desc" },
    });

    return NextResponse.json({
      metrics: {
        totalEmployees,
        presentToday,
        attendanceRate: totalEmployees > 0 ? (presentToday / totalEmployees) * 100 : 0,
      },
      records: attendanceRecords,
      schedules,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}
