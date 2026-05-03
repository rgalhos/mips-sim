import { ChakraProvider } from '@chakra-ui/react';
import SidebarWithHeader from './Components/Sidebar';
import CreditsPage from './Components/pages/Credits';
import ExamplePage from './Components/pages/Exemples/ExamplePage';
import InstructionManual from './Components/pages/InstructionSet/InstructionManual';
import SimulatorView from './Components/pages/Simulator View/SimulatorView';
import theme from './Components/utils/theme';
import { SimulatorProvider } from './hooks/simulator.hook';

export function App() {
  return (
    <SimulatorProvider>
      <ChakraProvider theme={theme}>
        <SidebarWithHeader>
          <SimulatorView />
          <InstructionManual />
          <ExamplePage />
          <CreditsPage />
        </SidebarWithHeader>
      </ChakraProvider>
    </SimulatorProvider>
  );
}
