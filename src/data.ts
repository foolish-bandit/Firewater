import { Bourbon, FlavorProfile } from './bourbonTypes';
import { BOURBONS_VOL1 } from './data/bourbons_vol1';
import { BOURBONS_VOL2 } from './data/bourbons_vol2';
import { BOURBONS_VOL3 } from './data/bourbons_vol3';
import { BOURBONS_VOL4 } from './data/bourbons_vol4';
import { BOURBONS_VOL5 } from './data/bourbons_vol5';
import { BOURBONS_VOL6 } from './data/bourbons_vol6';
import { BOURBONS_VOL7 } from './data/bourbons_vol7';
import { BOURBONS_VOL8 } from './data/bourbons_vol8';
import { BOURBONS_VOL9 } from './data/bourbons_vol9';
import { BOURBONS_VOL10 } from './data/bourbons_vol10';

export type { Bourbon, FlavorProfile };

export const BOURBONS: Bourbon[] = [
  ...BOURBONS_VOL1,
  ...BOURBONS_VOL2,
  ...BOURBONS_VOL3,
  ...BOURBONS_VOL4,
  ...BOURBONS_VOL5,
  ...BOURBONS_VOL6,
  ...BOURBONS_VOL7,
  ...BOURBONS_VOL8,
  ...BOURBONS_VOL9,
  ...BOURBONS_VOL10,
];
