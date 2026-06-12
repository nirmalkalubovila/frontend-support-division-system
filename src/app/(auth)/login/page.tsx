"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useThemeStore from "@/store/theme-store";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Headset, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin } from "@/api/services/auth/auth-service";
import Link from "next/link";

// ── Validation Schema ──────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

// ── Login Page ─────────────────────────────────────────────────
export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const loginMutation = useLogin();
  const { companyName, slogan, logoUrl } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const companyToShow = mounted ? (companyName || "Prologics Support") : "Prologics Support";
  const sloganToShow = mounted ? (slogan || "Support Division System") : "Support Division System";
  const logoToShow = mounted ? logoUrl : null;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data, {
      onSuccess: () => {
        router.push("/dashboard");
      },
    });
  };

  return (
    <div className="animate-fade-in">
      {/* Logo & Title */}
      <div className="text-center mb-8">
        {logoToShow ? (
          <img src={logoToShow} alt="Logo" className="h-14 w-14 object-contain mx-auto mb-4 bg-[var(--surface)] rounded-2xl shadow-md p-1" />
        ) : (
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] text-white shadow-lg mb-4">
            <Headset className="h-7 w-7" />
          </div>
        )}
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Welcome Back
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Sign in to {companyToShow}
        </p>
      </div>

      {/* Login Card */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="login-email" className="text-sm font-medium text-[var(--text-primary)]">
              Email Address
            </Label>
            <Input
              id="login-email"
              type="email"
              placeholder="you@prologics.lk"
              autoComplete="email"
              className="h-11 bg-[var(--background)] border-[var(--border)] focus:border-[var(--border-focus)] transition-colors"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-[var(--destructive)]">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="login-password" className="text-sm font-medium text-[var(--text-primary)]">
                Password
              </Label>
              <Link
                href="/forgot-password"
                className="text-xs text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
                className="h-11 bg-[var(--background)] border-[var(--border)] focus:border-[var(--border-focus)] pr-10 transition-colors"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-[var(--destructive)]">{errors.password.message}</p>
            )}
          </div>

          {/* Error Message */}
          {loginMutation.isError && (
            <div className="rounded-lg bg-[var(--destructive-light)] border border-[var(--destructive)]/20 p-3">
              <p className="text-sm text-[var(--destructive)]">
                {(loginMutation.error as { response?: { data?: { message?: string } } })?.response?.data
                  ?.message ?? "Invalid email or password. Please try again."}
              </p>
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            className="w-full h-11 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] hover:opacity-90 text-white font-medium transition-all shadow-md hover:shadow-lg"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-[var(--text-tertiary)] mt-6">
        {companyToShow} — {sloganToShow} v1.0
      </p>
    </div>
  );
}
