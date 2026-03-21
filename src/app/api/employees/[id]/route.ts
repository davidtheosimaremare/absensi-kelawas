import { adminOnly } from "@/lib/admin-check";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await adminOnly();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    const body = await req.json();
    const { name, email, password, ktp } = body;

    const data: any = { name, email, ktp };
    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    const employee = await prisma.user.update({
      where: { id },
      data,
    });

    const { password: _, ...result } = employee;
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update employee" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await adminOnly();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    await prisma.user.delete({
      where: { id },
    });
    return NextResponse.json({ message: "Employee deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete employee" }, { status: 500 });
  }
}
