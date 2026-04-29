import { Input, Stack, Tab, TabList, TabPanel, TabPanels, Tabs, useToast } from '@chakra-ui/react';
import { useEffect, useRef, useState } from 'react';
import { IAssembledInstruction } from '../../../hardware/common/simulator';
import { useSimulator } from '../../../hooks/simulator.hook';
import Logger from '../../../Service/Logger';
import SharedData, { Instruction } from '../../../Service/SharedData';
import EditorView from './Editor Tab/EditorTab';
import { ScreenRenderer } from './Editor Tab/Screen';
import HardwareView from './HardwareView';
import HexView from './HexView';
import MemoryTerminal from './MemoryTerminal';

export default function SimulatorView() {
  const { simulator } = useSimulator();
  // Handles the assembly code present in the editor
  const [code, setCode] = useState<string>('');
  const [program, setProgram] = useState<null | Array<IAssembledInstruction>>(null);
  const [currentInstruction, setCurrentInstruction] = useState<Instruction>();

  // Handles the title of the program
  //const [programTitle, setProgramTitle] = useState<string>("Recent");

  // const [assemblyCode, setAssemblyCode] = useState<string>("");

  // SimulatorService instance that handles the assembly of the code
  //let simservice: SimulatorService = SimulatorService.getInstance();

  // Notification toast
  const toast = useToast();

  // Holds the shared state of the application
  let share: SharedData = SharedData.instance;

  // Logger instance
  let log: Logger = Logger.instance;

  const txtProgramtitle = useRef<HTMLInputElement>(null);

  function handleKeyPress(e: KeyboardEvent) {
    simulator.handleKeyPress(e);
  }

  useEffect(
    () => {
      // TODO : check if it is necessary to remove the event
      // document.removeEventListener("keydown", handleKeyPress, true)
      document.addEventListener('keypress', handleKeyPress, true);

      return () => document.removeEventListener('keypress', handleKeyPress, true);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    if (txtProgramtitle.current) txtProgramtitle.current.value = share.programTitle;
  }, [share.programTitle, program, currentInstruction]);

  // Updates the assembly code when the code changes
  function onEditorChange(value: string | undefined, event: any) {
    setCode(value!);
    share.code = value ?? code;
  }

  function forceGetCode() {
    if (share.monacoEditor == null) {
      log.pushAppError('Monaco editor is null');
      return;
    }

    //console.log('monaco editor value ', share.monacoEditor.getValue());
    //console.log('code ', code);
    if (!code && share.monacoEditor != null) {
      let monacoCode = share.monacoEditor.getValue();
      setCode(monacoCode);
      share.code = monacoCode;
    }
  }

  function setScreenRendererCanva() {
    try {
      let canva = (document.getElementById('screenCanvas') as HTMLCanvasElement).getContext('2d');
      ScreenRenderer.instance.draw = canva;
    } catch {}
  }

  function assembleCode() {
    // first, we have to link our canvas with our ScreenRenderer
    setScreenRendererCanva();

    // if code state is empty, get code from monaco editor and update share.code
    forceGetCode();

    setProgram(null);

    //resets the program
    try {
      if (!simulator.workerService.worker) {
        simulator.createCpuWorker();
      }

      const assembled = simulator.assembleCode(share.code);
      //simulator.processor.loadProgram(assembled);
      simulator.syncWorker();

      share.program = assembled;

      // Assembles the code
      // simservice.assembledCode = simservice.assemble(share.code);
      // share._debugMemory();

      setProgram(assembled);

      return true;
    } catch (e) {
      share.program = [];
      setProgram([]);

      toast({
        title: 'Assemble failed',
        description: 'Your code has not been assembled, please check the terminal for errors',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });

      return false;
    } finally {
      if (log.getErrors().length === 0 && log.appErrors.length === 0) {
        toast({
          title: 'Code assembled',
          description: 'Your code has been assembled',
          status: 'success',
          duration: 4000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Assemble failed',
          description: 'Your code has not been assembled, please check the terminal for errors',
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
      }
    }
  }

  function runCode() {
    if (!simulator.workerService.worker) {
      simulator.createCpuWorker();
    }

    const success = assembleCode();
    if (!success) {
      return;
    }

    simulator.workerService.runCode();

    //simulator.workerService.loadProgram(program);
    //simulator.syncWorker();
    //simulator.workerService.runCode();

    //simulator.cpuWorker?.postMessage

    console.log('@todo runCode');

    //// first, we have to link our canvas with our ScreenRenderer
    //setScreenRendererCanva()
    //share.ibuffer = [0];
    //// share.resetStartMemory();
    //
    //if (share.currentProcessor == null) share.currentProcessor = new MonoMIPS();
    //
    //share.currentProcessor.halted = false;
    //WorkerService.instance.runCode(share.program, share.processorFrequency);
    //
    //console.log(`Running at frequency ${share.processorFrequency}`)
  }

  function callExecuteStep() {
    console.log('@todo execute step');

    if (!simulator.workerService.worker) {
      simulator.createCpuWorker();
    }

    simulator.workerService.stepCode();
    //share.updateCode();
    //if(share.currentProcessor == null) share.currentProcessor = new MonoMIPS();
    //
    //if(share.currentProcessor.halted){
    //  share.currentProcessor.halted = false;
    //  // console.log("processor was halted before")
    //  simservice.assembledCode = simservice.assemble(share.code)
    //  WorkerService.instance.stepCode();
    //}
    //else
    //{
    //  // console.log("processor was not halted before")
    //  WorkerService.instance.stepCode();
    //}
    //
    //setProgram(simservice.program);
    //
    //setCurrentInstruction(share.currentProcessor.currentInstruction);
  }

  /* DESCRIPTION */
  // View page that houses the assembly code editor, assembly hex, and hardware view

  return (
    <Tabs variant="soft-rounded" style={{ zIndex: 50 }}>
      <TabList style={{ zIndex: 50 }}>
        <Tab style={{ zIndex: 50 }}>Editor</Tab>
        <Tab style={{ zIndex: 50 }}>Hex View</Tab>
        <Tab style={{ zIndex: 50 }}>Datapath</Tab>
        <Tab style={{ zIndex: 50 }}>Memory</Tab>
      </TabList>

      <TabPanels>
        <TabPanel>
          <Stack>
            <Input
              placeholder="Recent"
              ref={txtProgramtitle}
              variant={'unstyled'}
              defaultValue={share.programTitle}
              onChange={(e) => {
                // setProgramTitle(e.target.value);
                share.programTitle = e.target.value;
              }}
            />
            <EditorView
              onEditorChange={onEditorChange}
              assembleBtn={assembleCode}
              runBtn={runCode}
              callExecuteStep={callExecuteStep}
            />
          </Stack>
        </TabPanel>

        <TabPanel>
          {/* <Textarea
            style={{ height: "80vh" }}
            value={
              simservice.program.map(i => "0x"+i.machineCode.toString(16)).join(" ")  
            }
          /> */}
          <HexView program={program ?? []} />
        </TabPanel>

        <TabPanel>
          <HardwareView callExecutableStep={callExecuteStep} />
          {/* stepFunc={callExecuteStep} currentI={share.currentProcessor?.currentInstruction ?? null} */}
        </TabPanel>

        <TabPanel>
          <MemoryTerminal />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}
