import { Icon, Textarea } from '@chakra-ui/react';
import Logger from '../../../../Service/Logger';
import { MdDelete } from 'react-icons/md';
import { useEffect, useRef } from 'react';

export default function DebugTerminal(props: { value: string; onClear: Function }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [props.value]);

  return (
    <>
      <Icon
        as={MdDelete}
        onClick={() => {
          Logger.instance.clearDebug();
          props.onClear();
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
        value={props.value}
        height="280px"
        style={{ position: 'relative', bottom: 50, userSelect: 'text' }}
        id="debugTxtArea"
        scrollBehavior="smooth"
        ref={textareaRef}
      ></Textarea>
    </>
  );
}
