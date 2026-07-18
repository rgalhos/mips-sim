import { atom } from "nanostores";

export const enum ETabs {
  EDITOR,
  HEX_VIEW,
  MEMORY,
  DATAPATH,
  CACHE,
}

export const $simulatorTab = atom<ETabs>(ETabs.EDITOR);

export const setSimulatorTab = (tab: ETabs) => {
  $simulatorTab.set(tab);
};
