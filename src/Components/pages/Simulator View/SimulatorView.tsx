import { ArrowForwardIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Flex,
  Icon,
  IconButton,
  Input,
  Slide,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Tooltip,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import { useEffect, useRef, useState } from 'react';
import { BsFileEarmarkCode, BsTerminalFill } from 'react-icons/bs';
import { CgScreen } from 'react-icons/cg';
import { FaDownload, FaFolderOpen } from 'react-icons/fa';
import { HiPause, HiPlay } from 'react-icons/hi';
import { IoMdSave } from 'react-icons/io';
import { RiRewindFill, RiSettings2Fill } from 'react-icons/ri';
import { stringifyTokenizerError } from '../../../hardware/analyzer/tokenizer';
import { IAssembledInstruction } from '../../../hardware/common/simulator';
import { EWorkerCommand, WorkerMessageResponse } from '../../../hardware/common/worker-service';
import { useSimulator } from '../../../hooks/simulator.hook';
import Logger from '../../../Service/Logger';
import SharedData, { Instruction } from '../../../Service/SharedData';
import WorkerService from '../../../Service/WorkerService';
import ConfigModal from './Editor Tab/ConfigModal';
import ConsoleTerminal from './Editor Tab/ConsoleTerminal';
import DebugTerminal from './Editor Tab/DebugTerminal';
import EditorView from './Editor Tab/EditorTab';
import LoadProgramModal from './Editor Tab/LoadProgramModal';
import Screen from './Editor Tab/Screen';
import HexView from './HexView';
import MemoryView from './MemoryView';

function HiPlayIcon() {
  return <Icon as={HiPlay} style={{ transform: 'scale(1.4)' }} />;
}

function HiPauseIcon() {
  return <Icon as={HiPause} style={{ transform: 'scale(1.4)' }} />;
}

function TerminalFill() {
  return <Icon as={BsTerminalFill} />;
}

export default function SimulatorView() {
  const { simulator } = useSimulator();
  const [code, setCode] = useState<string>('');
  const [program, setProgram] = useState<null | Array<IAssembledInstruction>>(null);
  const [currentInstruction] = useState<Instruction>();

  const toast = useToast();

  let share: SharedData = SharedData.instance;
  let log: Logger = Logger.instance;

  const txtProgramtitle = useRef<HTMLInputElement>(null);

  const [consoleOpen, setConsoleOpen] = useState<boolean>(false);
  const [consoleTxt, setConsoleTxt] = useState<string>('');
  const [currentTerminal, setCurrentTerminal] = useState<number>(0);
  const [debugTxt, setDebugTxt] = useState<string>('');
  const [configModalOpen, setConfigModalOpen] = useState<boolean>(false);
  const [loadProgramModalOpen, setLoadProgramModalOpen] = useState<boolean>(false);
  const [screenModalOpen, setScreenModalOpen] = useState<boolean>(false);
  const [mainTabIndex, setMainTabIndex] = useState(0);

  const [cpuHalted, setCpuHalted] = useState(true);

  const toolbarBg = useColorModeValue('gray.50', 'gray.900');
  const toolbarBorder = useColorModeValue('gray.200', 'gray.700');

  function handleKeyPress(e: KeyboardEvent) {
    simulator.handleKeyPress(e);
  }

  useEffect(
    () => {
      document.addEventListener('keypress', handleKeyPress, true);
      return () => document.removeEventListener('keypress', handleKeyPress, true);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    if (txtProgramtitle.current) txtProgramtitle.current.value = share.programTitle;
  }, [share.programTitle, program, currentInstruction]);

  useEffect(() => {
    Logger.instance.onLogChange(() => {
      setConsoleTxt(log.getConsole() + log.getErrors());
      setDebugTxt(log.getDebug());

      let debugTxtArea = document.getElementById('debugTxtArea');
      if (debugTxtArea) debugTxtArea.scrollTop = debugTxtArea.scrollHeight;

      let consoleTxtArea = document.getElementById('consoleTxtArea');
      if (consoleTxtArea) consoleTxtArea.scrollTop = consoleTxtArea.scrollHeight;
    });
  }, [consoleOpen, debugTxt, log]);

  useEffect(() => {
    const ws = simulator.workerService;
    const onCpuDump = (response: Extract<WorkerMessageResponse, { command: EWorkerCommand.CPU_DUMP }>) => {
      setCpuHalted(response.data.halted);
    };
    ws.on(EWorkerCommand.CPU_DUMP, onCpuDump);
    ws.requestCpuDump();

    return () => {
      ws.off(EWorkerCommand.CPU_DUMP, onCpuDump);
    };
  }, [simulator.workerService]);

  function onEditorChange(value: string | undefined, event: any) {
    setCode(value!);
    share.code = value ?? code;
  }

  function forceGetCode() {
    if (share.monacoEditor == null) {
      log.pushAppError('Monaco editor is null');
      return;
    }

    if (!code && share.monacoEditor != null) {
      let monacoCode = share.monacoEditor.getValue();
      setCode(monacoCode);
      share.code = monacoCode;
    }
  }

  function assembleCode() {
    forceGetCode();
    setProgram(null);

    try {
      if (!simulator.workerService.worker) {
        simulator.createCpuWorker();
      }

      const assembled = simulator.assembleCode(share.code);
      simulator.syncWorker();

      share.program = assembled;

      setProgram(assembled);

      toast({
        title: 'Code assembled',
        description: 'Your code has been assembled',
        status: 'success',
        duration: 4000,
        isClosable: true,
      });

      return true;
    } catch (e) {
      share.program = [];
      setProgram([]);

      toast({
        title: 'Assemble failed',
        description: stringifyTokenizerError(e as Error),
        status: 'error',
        duration: 4000,
        isClosable: true,
      });

      return false;
    }
  }

  function toggleRunPause() {
    if (!simulator.workerService.worker) {
      simulator.createCpuWorker();
    }

    if (cpuHalted) {
      simulator.workerService.runCode();
    } else {
      setCpuHalted(true);
      simulator.workerService.setHalted(true);
    }
  }

  function callExecuteStep() {
    if (!simulator.workerService.worker) {
      simulator.createCpuWorker();
    }

    simulator.workerService.stepCode();
  }

  return (
    <Tabs index={mainTabIndex} onChange={setMainTabIndex} variant="soft-rounded" style={{ zIndex: 50 }}>
      <TabList style={{ zIndex: 50 }}>
        <Tab style={{ zIndex: 50 }}>Editor</Tab>
        <Tab style={{ zIndex: 50 }}>Hex View</Tab>
        {/* <Tab style={{ zIndex: 50 }}>Datapath</Tab> */}
        <Tab style={{ zIndex: 50 }}>Memory</Tab>
      </TabList>

      <Box
        position="sticky"
        top={0}
        zIndex={49}
        bg={toolbarBg}
        borderBottomWidth="1px"
        borderColor={toolbarBorder}
        py={2}
        px={2}
      >
        <Flex gap={2} flexWrap="wrap" align="center">
          <Tooltip label="Assemble">
            <IconButton
              icon={<BsFileEarmarkCode style={{ transform: 'scale(1.4)' }} />}
              colorScheme="linkedin"
              variant="solid"
              onClick={() => {
                assembleCode();
              }}
              aria-label="Assemble program"
              borderRadius={50}
              size="sm"
              zIndex={10}
            >
              Run
            </IconButton>
          </Tooltip>
          <Tooltip label={cpuHalted ? 'Run' : 'Pause'}>
            <IconButton
              icon={cpuHalted ? <HiPlayIcon /> : <HiPauseIcon />}
              colorScheme={cpuHalted ? 'teal' : 'orange'}
              variant="solid"
              onClick={() => toggleRunPause()}
              aria-label={cpuHalted ? 'Run program' : 'Pause execution'}
              borderRadius={50}
              size="sm"
              zIndex={10}
            >
              {cpuHalted ? 'Run' : 'Pause'}
            </IconButton>
          </Tooltip>
          <Tooltip label="Run next instruction">
            <IconButton
              icon={<ArrowForwardIcon style={{ transform: 'scale(1.4)' }} />}
              colorScheme="yellow"
              aria-label="Run step"
              variant="solid"
              borderRadius={50}
              size="sm"
              onClick={() => callExecuteStep()}
              zIndex={10}
            >
              Step
            </IconButton>
          </Tooltip>
          <Tooltip label="Open terminal">
            <IconButton
              icon={<TerminalFill />}
              color="white"
              backgroundColor={SharedData.theme.editorBackground}
              variant="solid"
              aria-label="Open console"
              borderRadius={50}
              size="sm"
              zIndex={10}
              onClick={() => {
                setConsoleOpen(!consoleOpen);
              }}
            >
              Terminal
            </IconButton>
          </Tooltip>
          <Tooltip label="Reset">
            <IconButton
              icon={<Icon as={RiRewindFill} />}
              aria-label="Reset"
              backgroundColor={SharedData.theme.editorBackground}
              color="white"
              borderRadius={50}
              size="sm"
              zIndex={10}
              onClick={() => {
                WorkerService.instance.resetCpu();
                share.currentProcessor?.reset();
                if (share.currentProcessor) {
                  share.currentProcessor.halted = true;
                  share.currentProcessor.frequency = 1000;
                  share.processorFrequency = 1000;
                }
                clearInterval(share.interval ?? 0);
              }}
            >
              Reset
            </IconButton>
          </Tooltip>
          <Tooltip label="Screen">
            <IconButton
              icon={<CgScreen />}
              aria-label={'Screen'}
              backgroundColor={SharedData.theme.editorBackground}
              color="white"
              borderRadius={50}
              size="sm"
              zIndex={10}
              onClick={() => {
                setScreenModalOpen(!screenModalOpen);
              }}
            />
          </Tooltip>
          <Tooltip label="Configuration">
            <IconButton
              icon={<Icon as={RiSettings2Fill} style={{ transform: 'scale(1.2)' }} />}
              zIndex={10}
              aria-label="Configuration"
              backgroundColor={SharedData.theme.editorBackground}
              color="white"
              borderRadius={50}
              size="sm"
              onClick={() => setConfigModalOpen(true)}
            >
              Configuration
            </IconButton>
          </Tooltip>
          <Tooltip label="Save">
            <IconButton
              icon={<Icon as={IoMdSave} style={{ transform: 'scale(1.2)' }} />}
              zIndex={10}
              aria-label="Save"
              backgroundColor={SharedData.theme.editorBackground}
              color="white"
              borderRadius={50}
              size="sm"
              onClick={() => {
                share.saveProgram(share.programTitle.toLowerCase(), share.code);
                toast({
                  title: 'Code saved',
                  description: 'Your code has been saved',
                  status: 'success',
                  duration: 3000,
                  isClosable: true,
                });
              }}
            >
              Save
            </IconButton>
          </Tooltip>
          <Tooltip label="Load">
            <IconButton
              icon={<Icon as={FaFolderOpen} style={{ transform: 'scale(1.2)' }} />}
              zIndex={10}
              aria-label="Load"
              backgroundColor={SharedData.theme.editorBackground}
              color="white"
              borderRadius={50}
              size="sm"
              onClick={() => setLoadProgramModalOpen(true)}
            >
              Load
            </IconButton>
          </Tooltip>
          <Tooltip label="Download Code">
            <IconButton
              icon={<Icon as={FaDownload} style={{ transform: 'scale(1.2)' }} />}
              zIndex={10}
              aria-label="Download Code"
              backgroundColor={SharedData.theme.editorBackground}
              color="white"
              borderRadius={50}
              size="sm"
              onClick={() => {
                function downloadFile() {
                  const element = document.createElement('a');
                  const file = new Blob([share.code], { type: 'text/plain' });
                  element.href = URL.createObjectURL(file);
                  element.download = share.programTitle + '.txt';
                  document.body.appendChild(element);
                  element.click();
                }

                try {
                  downloadFile();
                  toast({
                    title: 'Code downloaded',
                    description: 'Your code has been downloaded',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                  });
                } catch {
                  toast({
                    title: 'Something went wrong...',
                    description: 'There was an error while trying to download the code',
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                  });
                }
              }}
            >
              Download
            </IconButton>
          </Tooltip>
        </Flex>
      </Box>

      <Box display={screenModalOpen ? 'block' : 'none'} aria-hidden={!screenModalOpen}>
        <Screen visible={screenModalOpen} />
      </Box>

      <Slide
        direction="bottom"
        in={consoleOpen}
        style={{
          zIndex: 48,
        }}
      >
        <Box
          p="40px"
          color="white"
          mt="4"
          bg="#20212b"
          rounded="md"
          shadow="md"
          style={{
            position: 'relative',
            right: '11px',
            width: '102vw',
            height: '350px',
          }}
        >
          <Stack direction="row" spacing={4} zIndex={10}>
            <Button
              style={{
                position: 'relative',
                borderBottom: currentTerminal === 0 ? 'solid' : 'none',
                backgroundColor: 'none',
                background: 'none',
                borderRadius: '0px',
                top: -40,
                right: 20,
                zIndex: 10,
              }}
              onClick={() => setCurrentTerminal(0)}
            >
              Terminal
            </Button>
            <Button
              style={{
                position: 'relative',
                borderBottom: currentTerminal === 1 ? 'solid' : 'none',
                backgroundColor: 'none',
                background: 'none',
                borderRadius: '0px',
                top: -40,
                right: 20,
                zIndex: 10,
              }}
              onClick={() => setCurrentTerminal(1)}
            >
              Debug
            </Button>
          </Stack>

          <Box display={currentTerminal === 0 ? 'block' : 'none'} aria-hidden={currentTerminal !== 0}>
            <ConsoleTerminal />
          </Box>
          <Box display={currentTerminal === 1 ? 'block' : 'none'} aria-hidden={currentTerminal !== 1}>
            <DebugTerminal
              value={debugTxt}
              onClear={() => {
                setDebugTxt('');
                Logger.instance.clearDebug();
              }}
            />
          </Box>
        </Box>
      </Slide>

      <TabPanels>
        <TabPanel>
          <Stack>
            <Input
              placeholder="Recent"
              ref={txtProgramtitle}
              variant={'unstyled'}
              defaultValue={share.programTitle}
              onChange={(e) => {
                share.programTitle = e.target.value;
              }}
            />
            <EditorView onEditorChange={onEditorChange} />
          </Stack>
        </TabPanel>

        <TabPanel>
          <HexView program={program ?? []} />
        </TabPanel>

        {/* <TabPanel>
          <HardwareView callExecutableStep={callExecuteStep} />
        </TabPanel> */}

        <TabPanel>
          <MemoryView visible={mainTabIndex === 2} />
        </TabPanel>
      </TabPanels>

      {configModalOpen ? <ConfigModal isOpen={configModalOpen} close={() => setConfigModalOpen(false)} /> : <></>}
      <LoadProgramModal isOpen={loadProgramModalOpen} close={() => setLoadProgramModalOpen(false)} />
    </Tabs>
  );
}
