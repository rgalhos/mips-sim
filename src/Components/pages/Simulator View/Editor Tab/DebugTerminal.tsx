import { Icon, Textarea } from '@chakra-ui/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MdDelete } from 'react-icons/md';
import { EWorkerCommand, IWorkerCPUDebugDump, WorkerMessageResponse } from '../../../../hardware/common/worker-service';
import { useSimulator } from '../../../../hooks/simulator.hook';
import { debounce } from '../../../../utils';

export default function DebugTerminal() {
  const { simulator } = useSimulator();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debugBuffer = useRef<string[]>([]);
  const [value, setValue] = useState('');

  const flushDebug = () => {
    if (debugBuffer.current.length) {
      setValue((old) => old.slice(-10000) + debugBuffer.current.join(''));
      debugBuffer.current = [];
    }
  };

  const updateDebugValue = debounce(flushDebug, 100);

  const onDump = useCallback(
    (response: Extract<WorkerMessageResponse, { command: EWorkerCommand.CPU_DEBUG_DUMP }>) => {
      [...response.data.registers, ...response.data.memory]
        .sort((a, b) => Number(a.pc - b.pc))
        .forEach((evt) => {
          if (typeof (evt as IWorkerCPUDebugDump['registers'][0]).reg !== 'undefined') {
            const r = evt as IWorkerCPUDebugDump['registers'][0];

            debugBuffer.current.push(
              `[cycle ${r.cycle}] [pc 0x${r.pc.toString(16).padStart(8, '0')}] ` +
                `reg[${r.reg}] = 0x${r.value.toString(16).padStart(8, '0')}\n`,
            );
          } else {
            const r = evt as IWorkerCPUDebugDump['memory'][0];

            debugBuffer.current.push(
              `[cycle ${r.cycle}] [pc 0x${r.pc.toString(16).padStart(8, '0')}] ` +
                `mem[0x${r.address.toString(16).padStart(8, '0')}] = 0x${r.value.toString(16).padStart(2, '0')}\n`,
            );
          }
        });

      if (debugBuffer.current.length > 100) {
        flushDebug();
      }

      updateDebugValue();
    },
    [updateDebugValue],
  );

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [value]);

  useEffect(() => {
    simulator.workerService.on(EWorkerCommand.CPU_DEBUG_DUMP, onDump);

    return () => {
      simulator.workerService.off(EWorkerCommand.CPU_DEBUG_DUMP, onDump);
    };
  }, [simulator, onDump]);

  return (
    <>
      <Icon
        as={MdDelete}
        onClick={() => {
          setValue('');
        }}
        style={{
          position: 'relative',
          left: '95%',
          top: 0,
          scale: '1.5',
          zIndex: 10,
        }}
      />
      <Textarea
        readOnly={true}
        userSelect="text"
        border="hidden"
        placeholder="Empty"
        value={value}
        height="280px"
        style={{ position: 'relative', bottom: 50, userSelect: 'text' }}
        id="debugTxtArea"
        scrollBehavior="smooth"
        ref={textareaRef}
      ></Textarea>
    </>
  );
}
