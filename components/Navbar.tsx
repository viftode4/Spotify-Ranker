"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Session } from "next-auth";
import { signOut, signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  LogIn, 
  Music2, 
  LayoutList, 
  Menu, 
  User, 
  LogOut,
  Home,
  X,
  GripVertical,
  Activity
} from "lucide-react";
import { Drawer } from "vaul";

interface NavbarProps {
  session: Session | null;
}

export function Navbar({ session }: NavbarProps) {
  const pathname = usePathname();
  const user = session?.user;
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-sidebar/70 backdrop-blur-md border-b border-border/30 sticky top-0 z-[60]">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4 md:gap-6">
          <Link href="/" className="text-lg md:text-xl font-bold tracking-tight text-primary flex items-center gap-2 hover-lift">
            <Music2 className="h-5 w-5" />
            <span className="whitespace-nowrap">Spotify Ranker</span>
          </Link>
          
          {/* Desktop navigation */}
          <nav className="hidden md:flex gap-8">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors hover:text-primary relative group ${
                pathname === "/" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Activity
              {pathname === "/" && (
                <span className="absolute -bottom-1 left-0 h-[2px] w-full bg-primary"></span>
              )}
              <span className="absolute -bottom-1 left-0 h-[2px] w-0 bg-primary transition-all group-hover:w-full"></span>
            </Link>
            <Link
              href="/albums"
              className={`text-sm font-medium transition-colors hover:text-primary relative group ${
                pathname === "/albums" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Albums
              {pathname === "/albums" && (
                <span className="absolute -bottom-1 left-0 h-[2px] w-full bg-primary"></span>
              )}
              <span className="absolute -bottom-1 left-0 h-[2px] w-0 bg-primary transition-all group-hover:w-full"></span>
            </Link>
            <Link
              href="/tierlist"
              className={`text-sm font-medium transition-colors hover:text-primary relative group flex items-center gap-1 ${
                pathname === "/tierlist" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <span>Tier List</span>
              <LayoutList className="h-3.5 w-3.5" />
              {pathname === "/tierlist" && (
                <span className="absolute -bottom-1 left-0 h-[2px] w-full bg-primary"></span>
              )}
              <span className="absolute -bottom-1 left-0 h-[2px] w-0 bg-primary transition-all group-hover:w-full"></span>
            </Link>
          </nav>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 md:h-10 md:w-10 rounded-full border border-border/30 hover:bg-primary/10">
                  <Avatar>
                    <AvatarImage src={user.image || ""} alt={user.name || "User"} />
                    <AvatarFallback className="bg-primary/20 text-primary-foreground">
                      {user.name
                        ? user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                        : "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-card border border-border/50" align="end" forceMount>
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border/30" />
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href={`/users/${user.id}`} className="hover:text-primary transition-colors">Your Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer hover:text-primary transition-colors">
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => signIn()} 
              className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm bg-primary/10 border-primary/20 hover:bg-primary/20 transition-colors"
            >
              <LogIn className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="hidden xs:inline">Sign in</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
} 