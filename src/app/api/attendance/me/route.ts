import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { startOfDay, endOfDay } from "date-fns";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = (session.user as any).id;
    const today = new Date();
    
    const attendance = await prisma.attendance.findFirst({
      where: {
        userId,
        checkIn: {
          gte: startOfDay(today),
          lte: endOfDay(today),
        },
      },
    });

    return NextResponse.json(attendance || {});
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch status" }, { status: 500 });
  }
}
