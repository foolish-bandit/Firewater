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
import { BOURBONS_VOL11 } from './data/bourbons_vol11';
import { BOURBONS_VOL12 } from './data/bourbons_vol12';
import { BOURBONS_VOL13 } from './data/bourbons_vol13';
import { BOURBONS_VOL14 } from './data/bourbons_vol14';
import { BOURBONS_VOL15 } from './data/bourbons_vol15';
import { BOURBONS_VOL16 } from './data/bourbons_vol16';
import { BOURBONS_VOL17 } from './data/bourbons_vol17';
import { BOURBONS_VOL18 } from './data/bourbons_vol18';
import { BOURBONS_VOL19 } from './data/bourbons_vol19';
import { BOURBONS_VOL20 } from './data/bourbons_vol20';
import { SCOTCH_VOL1 } from './data/scotch_vol1';
import { SCOTCH_VOL2 } from './data/scotch_vol2';
import { IRISH_WHISKEY } from './data/irish_whiskey';
import { RYE_WHISKEY } from './data/rye_whiskey';
import { VODKA } from './data/vodka';
import { GIN } from './data/gin';
import { RUM } from './data/rum';
import { RUM_VOL2 } from './data/rum_vol2';
import { TEQUILA_MEZCAL } from './data/tequila_mezcal';
import { TEQUILA_MEZCAL_VOL2 } from './data/tequila_mezcal_vol2';
import { BRANDY_COGNAC } from './data/brandy_cognac';
import { JAPANESE_WHISKY } from './data/japanese_whisky';
import { LIQUEURS } from './data/liqueurs';
import { ABSINTHE_PASTIS } from './data/absinthe_pastis';
import { AQUAVIT } from './data/aquavit';
import { GRAPPA_EAUX_DE_VIE } from './data/grappa_eaux_de_vie';
import { ASIAN_SPIRITS } from './data/asian_spirits';
import { CACHACA_WORLD_SPIRITS } from './data/cachaca_world_spirits';

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
  ...BOURBONS_VOL11,
  ...BOURBONS_VOL12,
  ...BOURBONS_VOL13,
  ...BOURBONS_VOL14,
  ...BOURBONS_VOL15,
  ...BOURBONS_VOL16,
  ...BOURBONS_VOL17,
  ...BOURBONS_VOL18,
  ...BOURBONS_VOL19,
  ...BOURBONS_VOL20,
];

export const SCOTCH: Bourbon[] = [...SCOTCH_VOL1, ...SCOTCH_VOL2];

export const ALL_RUM: Bourbon[] = [...RUM, ...RUM_VOL2];

export const ALL_TEQUILA_MEZCAL: Bourbon[] = [...TEQUILA_MEZCAL, ...TEQUILA_MEZCAL_VOL2];

export {
  IRISH_WHISKEY,
  RYE_WHISKEY,
  VODKA,
  GIN,
  RUM,
  RUM_VOL2,
  TEQUILA_MEZCAL,
  TEQUILA_MEZCAL_VOL2,
  BRANDY_COGNAC,
  JAPANESE_WHISKY,
  LIQUEURS,
  ABSINTHE_PASTIS,
  AQUAVIT,
  GRAPPA_EAUX_DE_VIE,
  ASIAN_SPIRITS,
  CACHACA_WORLD_SPIRITS,
};

export const ALL_LIQUORS: Bourbon[] = [
  ...BOURBONS,
  ...SCOTCH,
  ...IRISH_WHISKEY,
  ...RYE_WHISKEY,
  ...VODKA,
  ...GIN,
  ...ALL_RUM,
  ...ALL_TEQUILA_MEZCAL,
  ...BRANDY_COGNAC,
  ...JAPANESE_WHISKY,
  ...LIQUEURS,
  ...ABSINTHE_PASTIS,
  ...AQUAVIT,
  ...GRAPPA_EAUX_DE_VIE,
  ...ASIAN_SPIRITS,
  ...CACHACA_WORLD_SPIRITS,
];
