"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Headset, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForgotPassword } from "@/api/services/auth/auth-service";
import Link from "next/link";

const forgotSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotForm = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const forgotMutation = useForgotPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = (data: ForgotForm) => {
    forgotMutation.mutate(data.email, {
      onSuccess: () => setSent(true),
    });
  };

  return (
    <div className="animate-fade-in">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] text-white shadow-lg mb-4">
          <Headset className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Reset Password
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-lg">
        {sent ? (
          <div className="text-center space-y-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--success-light)]">
              <Mail className="h-6 w-6 text-[var(--success)]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                Check your inbox
              </p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                We sent a password reset link to{" "}
                <span className="font-medium">{getValues("email")}</span>
              </p>
            </div>
            <Button variant="ghost" asChild className="mt-4">
              <Link href="/login">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to login
              </Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="forgot-email" className="text-sm font-medium text-[var(--text-primary)]">
                Email Address
              </Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="you@prologics.lk"
                className="h-11 bg-[var(--background)] border-[var(--border)]"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-[var(--destructive)]">{errors.email.message}</p>
              )}
            </div>

            {forgotMutation.isError && (
              <div className="rounded-lg bg-[var(--destructive-light)] border border-[var(--destructive)]/20 p-3">
                <p className="text-sm text-[var(--destructive)]">
                  Something went wrong. Please try again.
                </p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white"
              disabled={forgotMutation.isPending}
            >
              {forgotMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </Button>

            <div className="text-center">
              <Link
                href="/login"
                className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors inline-flex items-center gap-1"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
