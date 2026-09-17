"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldCheck, AlertCircle, ArrowLeft } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/admin";
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    urlError === "unauthorized"
      ? "Administrator privileges required. Please sign in with an authorized staff account."
      : null
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    // Verify admin role
    if (authData.user) {
      const { data: adminRecord, error: adminErr } = await supabase
        .from("admin_users")
        .select("role")
        .eq("user_id", authData.user.id)
        .single();

      if (adminErr || !adminRecord) {
        await supabase.auth.signOut();
        setError("Access denied: Your account is not registered as an administrator.");
        setLoading(false);
        return;
      }
    }

    router.push(redirectTarget);
    router.refresh();
  };

  return (
    <div className="w-full max-w-full sm:max-w-sm min-w-0 space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Storefront
      </Link>

      <Card className="w-full max-w-full sm:max-w-sm border-primary/20 shadow-lg overflow-hidden">
        <CardHeader className="text-center space-y-2 p-5 sm:p-8">
          <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl">HILIPI Staff & Admin</CardTitle>
          <CardDescription className="text-xs break-words max-w-[240px] mx-auto">
            Authenticate with your verified Supabase staff credentials
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 sm:p-6 pt-0 space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-xs">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 w-full min-w-0">
            <div className="space-y-1.5 w-full min-w-0">
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                Email
              </label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@hilipi.com"
                className="w-full min-w-0"
              />
            </div>

            <div className="space-y-1.5 w-full min-w-0">
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                Password
              </label>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full min-w-0"
              />
            </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Authenticating..." : "Sign In to Dashboard"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center">Loading login portal...</div>}>
      <LoginForm />
    </Suspense>
  );
}
