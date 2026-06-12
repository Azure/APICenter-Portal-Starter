export type HomeDrawerKind = 'api' | 'model';

export interface HomeDrawerSelection {
  kind: HomeDrawerKind;
  name: string;
}

export interface HomeLocationState {
  drawer?: HomeDrawerSelection;
}