import { prisma } from "@/lib/prisma";

export async function getSignUpEnabled() {
  return (await prisma.user.count()) === 0;
}
