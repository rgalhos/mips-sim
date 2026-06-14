import { Icon, Input, Textarea } from '@chakra-ui/react';
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { MdDelete } from 'react-icons/md';
import { EWorkerCommand, WorkerMessageResponse } from '../../../../hardware/common/worker-service';
import { useSimulator } from '../../../../hooks/simulator.hook';

const STDIN_MAX_LEN = 255;

export default function ConsoleTerminal() {
  const { simulator } = useSimulator();
  const [output, setOutput] = useState('');
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleClear() {
    setOutput('');
  }

  function onMessage(message: WorkerMessageResponse) {
    setOutput((curr) => curr + message.data);
  }

  function submitInput() {
    simulator.handleStdinInput(input);
    setOutput((curr) => curr + input + '\n');
    setInput('');
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    submitInput();
  }

  function handleInputKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitInput();
    }
  }

  useEffect(() => {
    simulator.workerService.on(EWorkerCommand.CPU_RESET, handleClear);
    simulator.workerService.on(EWorkerCommand.TERMINAL_PRINT, onMessage);

    return () => {
      simulator.workerService.off(EWorkerCommand.CPU_RESET, handleClear);
      simulator.workerService.off(EWorkerCommand.TERMINAL_PRINT, onMessage);
    };
  }, [simulator]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [output]);

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
        height="240px"
        style={{ position: 'relative', bottom: 50, userSelect: 'text' }}
        id="consoleTxtArea"
        scrollBehavior="smooth"
        ref={textareaRef}
      />
      <form onSubmit={handleSubmit} style={{ position: 'relative', bottom: 50 }}>
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value.slice(0, STDIN_MAX_LEN))}
          onKeyDown={handleInputKeyDown}
          placeholder="Terminal input"
          maxLength={STDIN_MAX_LEN}
          borderRadius={0}
          size="sm"
        />
      </form>
    </>
  );
}
