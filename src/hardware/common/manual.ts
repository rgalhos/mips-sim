export interface IUserManual {
  registers: IManualRegister[];
  instructions: IManualInstruction[];
}

export interface IManualRegister {
  name: string;
  kind: string;
}

export interface IManualInstruction {
  name: string;
  operation: string;
  desciption: string;
}
