import { getSession } from "next-auth/react";

export default async function authHeader(): Promise<Record<string, string>> {
  const session = await getSession();

  if (session) {
    // Kalau ada accessToken di session, pakai itu
    // Kalau tidak, bisa pakai Bearer dari JWT
    return { Authorization: `Bearer ${(session as any).accessToken ?? ""}` };
  }

  return {};
}
// export default function authHeader() {
//   const obj = JSON.parse(sessionStorage.getItem("authUser") || "");

//   if (obj && obj.accessToken) {
//     return { Authorization: obj.accessToken };
//   } else {
//     return {};
//   }
// }
