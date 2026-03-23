import type { IUserManual } from './manual';
import type { IProcessor } from './processor';

export abstract class ISimulator<TProcessor extends IProcessor<any> = IProcessor<any>> {
  static name = 'Uninitialized simulator';

  /**
   * Object that will be used to mount the examples.
   * This object must be static.
   */
  public static readonly manual: IUserManual;

  public abstract readonly processor: TProcessor;

  public abstract readonly instructionKeywords: string[];

  public abstract readonly registerKeywords: string[];

  private _stepSpeed = 1000;

  get stepSpeed() {
    return this._stepSpeed;
  }

  public setStepSpeed(speed: number) {
    return this._stepSpeed;
  }
}
