import { Link, Text } from '@chakra-ui/react';

export default function CreditsPage() {
  return (
    <>
      <h1 style={{ fontSize: 30, paddingBottom: 10 }}>Credits</h1>

      <Text>
        <Link color="blue.500" href="https://github.com/rgalhos/riscv-sim">
          RV-SIM
        </Link>{' '}
        is a web-based educational RISC-V simulator created by{' '}
        <Link color="blue.500" href="https://github.com/rgalhos">
          @rgalhos
        </Link>
        . It is a fork of the{' '}
        <Link color="blue.500" href="https://github.com/ReinaldoAssis/mips-sim">
          WIMS
        </Link>{' '}
        web-based MIPS simulator created by{' '}
        <Link color="blue.500" href="https://github.com/ReinaldoAssis">
          @ReinaldoAssis
        </Link>
        .
      </Text>
    </>
  );
}
