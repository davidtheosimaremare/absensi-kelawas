import { adminOnly } from "@/lib/admin-check";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function GET() {
  const unauthorized = await adminOnly();
  if (unauthorized) return unauthorized;

  try {
    const employees = await prisma.user.findMany({
      where: { role: "EMPLOYEE" },
      select: {
        id: true,
        name: true,
        email: true,
        ktp: true,
        faceData: true,
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(employees);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const unauthorized = await adminOnly();
  if (unauthorized) return unauthorized;

  try {
    const body = await req.json();
    const { name, email, password, ktp } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const employee = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        ktp,
        role: "EMPLOYEE",
      },
    });

    const { password: _, ...result } = employee;
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create employee" }, { status: 500 });
  }
}
