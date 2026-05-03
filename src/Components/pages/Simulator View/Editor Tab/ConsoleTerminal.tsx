import { Icon, Textarea } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { MdDelete } from 'react-icons/md';
import { EWorkerCommand, WorkerMessageResponse } from '../../../../hardware/common/worker-service';
import { useSimulator } from '../../../../hooks/simulator.hook';

export default function ConsoleTerminal() {
  const { simulator } = useSimulator();
  const [output, setOutput] = useState('');

  function handleClear() {
    setOutput('');
  }

  function onMessage(message: WorkerMessageResponse) {
    setOutput((curr) => curr + message.data);
  }

  useEffect(() => {
    simulator.workerService.on(EWorkerCommand.CPU_RESET, handleClear);
    simulator.workerService.on(EWorkerCommand.TERMINAL_PRINT, onMessage);

    return () => {
      simulator.workerService.off(EWorkerCommand.CPU_RESET, handleClear);
      simulator.workerService.off(EWorkerCommand.TERMINAL_PRINT, onMessage);
    };
  }, [simulator]);

  return (
    <>
      <Icon
        as={MdDelete}
        onClick={handleClear}
        style={{
          position: 'relative',
          left: '95%',
          scale: '1.5',
          zIndex: 10,
        }}
      />
      <Textarea
        readOnly={true}
        border="hidden"
        placeholder="Empty"
        value={output}
        height="250px"
        style={{ position: 'relative', bottom: 50, userSelect: 'text' }}
        id="consoleTxtArea"
        scrollBehavior="smooth"
      ></Textarea>
    </>
  );
}
