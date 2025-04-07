"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CSSProperties } from "react";
import { Session } from "next-auth";
import { signIn } from "next-auth/react";
import { Home, LayoutList, LogIn, User, Activity } from "lucide-react";

interface MobileNavigationProps {
  session: Session | null;
}

export function MobileNavigation({ session }: MobileNavigationProps) {
  const pathname = usePathname();
  const user = session?.user;

  // Define the style directly to ensure it works on all devices
  const navigationStyle: CSSProperties = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    backgroundColor: 'rgba(24, 13, 42, 0.9)', // Match your theme's sidebar color
    backdropFilter: 'blur(8px)',
    borderTop: '1px solid rgba(48, 30, 84, 0.2)' // Match your theme's border color
  };

  return (
    <div style={navigationStyle} className="md:hidden">
      <nav className="flex items-center justify-around h-16">
        <Link 
          href="/" 
          className={`flex flex-col items-center justify-center w-full h-full px-2 transition-colors relative ${
            pathname === "/" ? "text-primary" : "text-muted-foreground hover:text-primary"
          }`}
        >
          <Activity className="h-5 w-5 mb-1" />
          <span className="text-xs font-medium">Activity</span>
          {pathname === "/" && (
            <span className="absolute top-0 inset-x-0 h-0.5 bg-primary"></span>
          )}
        </Link>
        
        <Link 
          href="/albums" 
          className={`flex flex-col items-center justify-center w-full h-full px-2 transition-colors relative ${
            pathname === "/albums" ? "text-primary" : "text-muted-foreground hover:text-primary"
          }`}
        >
          <Home className="h-5 w-5 mb-1" />
          <span className="text-xs font-medium">Albums</span>
          {pathname === "/albums" && (
            <span className="absolute top-0 inset-x-0 h-0.5 bg-primary"></span>
          )}
        </Link>
        
        <Link 
          href="/tierlist" 
          className={`flex flex-col items-center justify-center w-full h-full px-2 transition-colors relative ${
            pathname === "/tierlist" ? "text-primary" : "text-muted-foreground hover:text-primary"
          }`}
        >
          <LayoutList className="h-5 w-5 mb-1" />
          <span className="text-xs font-medium">Tier List</span>
          {pathname === "/tierlist" && (
            <span className="absolute top-0 inset-x-0 h-0.5 bg-primary"></span>
          )}
        </Link>
        
        {user ? (
          <Link 
            href={`/users/${user.id}`} 
            className={`flex flex-col items-center justify-center w-full h-full px-2 transition-colors relative ${
              pathname.startsWith(`/users/${user.id}`) ? "text-primary" : "text-muted-foreground hover:text-primary"
            }`}
          >
            <User className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Profile</span>
            {pathname.startsWith(`/users/${user.id}`) && (
              <span className="absolute top-0 inset-x-0 h-0.5 bg-primary"></span>
            )}
          </Link>
        ) : (
          <button
            onClick={() => signIn()} 
            className="flex flex-col items-center justify-center w-full h-full px-2 transition-colors text-muted-foreground hover:text-primary"
          >
            <LogIn className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Sign in</span>
          </button>
        )}
      </nav>
    </div>
  );
} 