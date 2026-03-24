export type HomeDrawerKind = 'api' | 'languageModel';

export interface HomeDrawerSelection {
  kind: HomeDrawerKind;
  name: string;
}

export interface HomeLocationState {
  drawer?: HomeDrawerSelection;
}