import prisma from "@/lib/prisma";
import ProfileClient from "./ProfileClient";
import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  let userId: string;
  try {
    const user = await getAuthUser();
    userId = user.id;
  } catch {
    redirect("/login");
    return;
  }

  const user = await prisma.user.findUnique({ 
    where: { id: userId }
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="w-full">
      <ProfileClient user={user} />
    </div>
  );
}
