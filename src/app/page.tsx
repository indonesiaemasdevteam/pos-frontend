// import { cookies } from "next/headers";
// import { redirect } from "next/navigation";

// export default async function Home() {
//   const cookieStore = await cookies();
//   const authUser = cookieStore.get("authUser");

//   // If user is authenticated, redirect to dashboard
//   if (authUser) {
//     redirect("/dashboard");
//   }

//   // If user is not authenticated, redirect to login
//   redirect("/auth/login");
// }
import { redirect } from "next/navigation";

export default async function Home() {
  if (process.env.PREVIEW_MODE === "true") {
    redirect("/dashboard");
  }

  const [{ getServerSession }, { authOptions }] = await Promise.all([
    import("next-auth"),
    import("@/lib/auth/auth"),
  ]);
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  redirect("/auth/login");
}
