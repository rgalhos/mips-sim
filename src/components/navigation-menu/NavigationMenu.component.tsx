import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { $page, EPage, setPage } from "@/lib/stores/page.store";
import { cn } from "@/lib/utils";
import { useStore } from "@nanostores/react";

const GITHUB_REPO_URL = "https://github.com/rgalhos/rv-sim";

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("size-5", className)} fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z" />
    </svg>
  );
}

const navItems = [
  { label: "Simulator", page: EPage.SIMULATOR },
  { label: "Documentation", page: EPage.DOCUMENTATION },
  { label: "Examples", page: EPage.EXAMPLE },
  { label: "About", page: EPage.ABOUT },
] as const;

type NavMenuProps = {
  className?: string;
};

export function NavMenu({ className }: NavMenuProps) {
  const activePage = useStore($page);

  return (
    <header className={cn("shrink-0 border-b border-border bg-background", className)}>
      <div className="flex h-14 w-full items-center gap-6 px-6">
        <div className="flex items-center gap-2">
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub repository"
            className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <GitHubIcon />
          </a>
          <span className="text-sm font-semibold tracking-tight">RV-SIM</span>
        </div>

        <NavigationMenu className="max-w-none flex-none justify-start">
          <NavigationMenuList className="justify-start gap-1">
            {navItems.map((item) => (
              <NavigationMenuItem key={item.page}>
                <button
                  type="button"
                  onClick={() => setPage(item.page)}
                  className={cn(
                    navigationMenuTriggerStyle(),
                    "relative after:absolute after:inset-x-2 after:bottom-1 after:h-0.5 after:rounded-full after:bg-foreground after:opacity-0 after:transition-opacity hover:after:opacity-0",
                    activePage === item.page && "text-foreground after:opacity-100"
                  )}
                >
                  {item.label}
                </button>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </header>
  );
}
