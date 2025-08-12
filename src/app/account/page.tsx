import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return <div style={{padding:24}}>Not signed in. <a href="/login">Go to Login</a></div>;
  }
  return (
    <pre style={{padding:24,whiteSpace:'pre-wrap'}}>
{JSON.stringify(session,null,2)}
    </pre>
  );
}
