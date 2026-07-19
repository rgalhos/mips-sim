import { NavMenu } from "@/components/navigation-menu/NavigationMenu.component";
import { AboutPage } from "@/components/pages/About.page";
import { DocumentationPage } from "@/components/pages/Documentation.page";
import { ExamplesPage } from "@/components/pages/Examples.page";
import { Toaster } from "@/components/ui/sonner";
import { SimulatorContainer } from "@/containers/simulator/Simulator.container";
import { $page, EPage } from "@/lib/stores/page.store";
import { cn } from "@/lib/utils";
import { useStore } from "@nanostores/react";

export function App() {
  const page = useStore($page);

  return (
    <div className="flex h-svh w-full flex-col">
      <NavMenu />

      <main className="flex min-h-0 flex-1 flex-col p-6">
        <div className={cn("flex min-h-0 flex-1 flex-col", page !== EPage.SIMULATOR && "hidden")}>
          <SimulatorContainer />
        </div>

        {page === EPage.DOCUMENTATION && <DocumentationPage />}
        {page === EPage.EXAMPLE && <ExamplesPage />}
        {page === EPage.ABOUT && <AboutPage />}
      </main>

      <Toaster duration={5000} position="bottom-center" richColors />
    </div>
  );
}

export default App;
