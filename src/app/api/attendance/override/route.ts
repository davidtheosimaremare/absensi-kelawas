import { adminOnly } from "@/lib/admin-check";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { startOfDay, endOfDay } from "date-fns";

export async function POST(req: Request) {
  const unauthorized = await adminOnly();
  if (unauthorized) return unauthorized;

  try {
    const { userId, date, status } = await req.json(); // status: 'PRESENT', 'ABSENT', 'LATE'

    if (!userId || !date || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const targetDate = new Date(date);

    const attendance = await prisma.attendance.upsert({
      where: {
        // We need a unique constraint or find it first. 
        // Since we don't have a unique constraint on (userId, date), we find it.
        id: (await prisma.attendance.findFirst({
            where: {
                userId,
                checkIn: {
                    gte: startOfDay(targetDate),
                    lte: endOfDay(targetDate),
                }
            }
        }))?.id || "new-id-" + Math.random()
      },
      update: {
        status,
        checkIn: status === 'PRESENT' ? startOfDay(targetDate) : null,
      },
      create: {
        userId,
        checkIn: status === 'PRESENT' ? startOfDay(targetDate) : null,
        status,
      },
    });

    return NextResponse.json(attendance);
  } catch (error) {
    return NextResponse.json({ error: "Failed to override attendance" }, { status: 500 });
  }
}
