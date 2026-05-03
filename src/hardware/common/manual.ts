export interface IUserManual {
  registers: IManualRegister[];
  instructions: IManualInstruction[];
}

export interface IManualRegister {
  name: string;
  alias?: string;
  kind: string;
  description: string;
}

export interface IManualInstruction {
  name: string;
  operation: string;
  description: string;
}
