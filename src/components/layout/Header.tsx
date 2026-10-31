'use client';

import { Menu, Bell, User, LogOut, Moon, Sun, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTheme } from '@/hooks/useTheme';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  onToggleSidebar?: (collapsed: boolean) => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const { data: session } = useSession();

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' });
  };

  const userName = session?.user?.name || 'User';
  const userRole = session?.user?.role || 'cashier';
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <header className="sticky top-0 z-sticky h-header bg-surface border-b border-border flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-4">
        <button
          className="p-2 rounded-md text-text-muted hover:text-text hover:bg-border transition-colors md:hidden"
          aria-label="Toggle sidebar"
          onClick={() => onToggleSidebar?.(true)}
        >
          <Menu className="w-5 h-5" aria-hidden="true" />
        </button>
        <div className="hidden md:flex items-center gap-2 bg-accent-muted rounded-lg px-3 py-1">
          <span className="text-xs font-medium text-accent">freshfold</span>
          <span className="text-xs text-text-muted">Main Location</span>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <Button variant="ghost" size="icon" className="relative" asChild>
          <a href="/notifications">
            <Bell className="w-5 h-5" aria-hidden="true" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full" aria-label="3 notifications" />
          </a>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 pl-2 pr-3" aria-label="User menu">
              <Avatar className="w-8 h-8">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userName)}`} alt={userName} />
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
              <span className="hidden md:block font-medium">{userName}</span>
              <ChevronDown className="w-4 h-4 hidden md:block" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal text-text-muted">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium text-text">{userName}</p>
                <p className="text-xs text-text-muted capitalize">{userRole}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="flex items-center gap-2">
              <a href="/settings/profile">
                <User className="w-4 h-4" aria-hidden="true" />
                Profile
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={toggleTheme} className="flex items-center gap-2">
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-danger flex items-center gap-2">
              <LogOut className="w-4 h-4" aria-hidden="true" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}