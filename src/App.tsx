import { NavMenu } from "@/components/navigation-menu/NavigationMenu.component";
import { Toaster } from "@/components/ui/sonner";
import { SimulatorContainer } from "@/containers/simulator/Simulator.container";

export function App() {
  return (
    <div className="flex h-svh w-full flex-col">
      <NavMenu activeHref="/" />

      <main className="flex min-h-0 flex-1 flex-col p-6">
        <SimulatorContainer />
      </main>

      <Toaster duration={5000} position="bottom-center" richColors />
    </div>
  );
}

export default App;
