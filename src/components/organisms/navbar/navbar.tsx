import Link from "next/link";
import { CirclePlus, LayoutDashboard, LogOut, Vote } from "lucide-react";
import { auth } from "@/auth";
import {
  Avatar, AvatarFallback, AvatarImage,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components";

function getInitials(name?: string | null, email?: string | null) {
  if (name && name.trim().length > 0) {
    return name
      .split(" ")
      .slice(0, 2)
      .map((token) => token[0]?.toUpperCase())
      .join("");
  }

  if (email) {
    return email.slice(0, 2).toUpperCase();
  }

  return "U";
}

export async function Navbar() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-md">
      <nav className="mx-auto flex h-16 w-full max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6 sm:gap-8">
          <Link href="/" className="flex items-center gap-2 text-[var(--text-primary)]">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)] text-white">
              <Vote className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold tracking-wide">Nomina</span>
          </Link>

          {user && (
            <div className="hidden items-center gap-1 sm:flex">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/elections/create">
                  <CirclePlus className="h-4 w-4" />
                  Create Election
                </Link>
              </Button>
            </div>
          )}
        </div>

        {!user ? (
          <Button asChild>
            <Link href="/api/auth/signin">Continue with Google</Link>
          </Button>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="rounded-full ring-offset-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/20"
                aria-label="Open profile menu"
              >
                <Avatar className="h-10 w-10 border border-[var(--border)]">
                  <AvatarImage src={user.image ?? ""} alt={user.name ?? "User"} />
                  <AvatarFallback>{getInitials(user.name, user.email)}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="space-y-0.5">
                <p className="text-sm font-medium text-[var(--text-primary)]">{user.name ?? "User"}</p>
                <p className="text-xs text-[var(--text-secondary)]">{user.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/api/auth/signout" className="text-[var(--destructive)] focus:text-[var(--destructive-hover)]">
                  <LogOut className="h-4 w-4" />
                  Log out
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </nav>
    </header>
  );
}
