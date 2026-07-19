export const AboutPage = () => {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto pb-8">
      <h1 className="font-heading text-lg font-semibold">About</h1>

      <p>
        <a href="https://github.com/rgalhos/riscv-sim" target="_blank">
          RV-SIM
        </a>{" "}
        is a web-based educational RISC-V simulator created by{" "}
        <a href="https://github.com/rgalhos" target="_blank">
          @rgalhos
        </a>
        . It started as a fork of the{" "}
        <a href="https://github.com/ReinaldoAssis/mips-sim" target="_blank">
          WIMS
        </a>{" "}
        MIPS simulator created by{" "}
        <a href="https://github.com/ReinaldoAssis" target="_blank">
          @ReinaldoAssis
        </a>
        , but eventually evolved into its own thing.
      </p>
    </div>
  );
};
