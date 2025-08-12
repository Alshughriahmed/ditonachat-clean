'use client';
export default function LoginPage() {
  return (
    <div style={{padding:24}}>
      <h1>Sign in</h1>
      <a href="/api/auth/signin/google" style={{padding:'8px 12px',border:'1px solid #999',borderRadius:8,display:'inline-block'}}>
        Continue with Google
      </a>
    </div>
  );
}
