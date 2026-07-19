import { atom } from "nanostores";

export const enum EPage {
  SIMULATOR,
  DOCUMENTATION,
  EXAMPLE,
  ABOUT,
}

export const $page = atom<EPage>(EPage.SIMULATOR);

export const setPage = (page: EPage) => {
  $page.set(page);
};
