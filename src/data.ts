import { Liquor, FlavorProfile } from './liquorTypes';
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
import { SCOTCH_VOL3 } from './data/scotch_vol3';
import { SCOTCH_VOL4 } from './data/scotch_vol4';
import { IRISH_WHISKEY } from './data/irish_whiskey';
import { IRISH_WHISKEY_VOL2 } from './data/irish_whiskey_vol2';
import { IRISH_WHISKEY_VOL3 } from './data/irish_whiskey_vol3';
import { RYE_WHISKEY } from './data/rye_whiskey';
import { RYE_WHISKEY_VOL2 } from './data/rye_whiskey_vol2';
import { RYE_WHISKEY_VOL3 } from './data/rye_whiskey_vol3';
import { CANADIAN_WHISKY } from './data/canadian_whisky';
import { CANADIAN_WHISKY_VOL2 } from './data/canadian_whisky_vol2';
import { CANADIAN_WHISKY_VOL3 } from './data/canadian_whisky_vol3';
import { VODKA } from './data/vodka';
import { VODKA_VOL2 } from './data/vodka_vol2';
import { VODKA_VOL3 } from './data/vodka_vol3';
import { VODKA_VOL4 } from './data/vodka_vol4';
import { GIN } from './data/gin';
import { GIN_VOL2 } from './data/gin_vol2';
import { GIN_VOL3 } from './data/gin_vol3';
import { GIN_VOL4 } from './data/gin_vol4';
import { RUM } from './data/rum';
import { RUM_VOL2 } from './data/rum_vol2';
import { TEQUILA_MEZCAL } from './data/tequila_mezcal';
import { TEQUILA_MEZCAL_VOL2 } from './data/tequila_mezcal_vol2';
import { BRANDY_COGNAC } from './data/brandy_cognac';
import { ARMAGNAC } from './data/armagnac';
import { JAPANESE_WHISKY } from './data/japanese_whisky';
import { JAPANESE_WHISKY_VOL2 } from './data/japanese_whisky_vol2';
import { JAPANESE_WHISKY_VOL3 } from './data/japanese_whisky_vol3';
import { LIQUEURS } from './data/liqueurs';
import { AMARO } from './data/amaro';
import { ABSINTHE_PASTIS } from './data/absinthe_pastis';
import { AQUAVIT } from './data/aquavit';
import { GENEVER } from './data/genever';
import { GRAPPA_EAUX_DE_VIE } from './data/grappa_eaux_de_vie';
import { ASIAN_SPIRITS } from './data/asian_spirits';
import { CACHACA_WORLD_SPIRITS } from './data/cachaca_world_spirits';
import { VERMOUTH_FORTIFIED } from './data/vermouth_fortified';
import { BITTERS } from './data/bitters';

export type { Liquor, FlavorProfile };

export const BOURBONS: Liquor[] = [
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

export const SCOTCH: Bourbon[] = [...SCOTCH_VOL1, ...SCOTCH_VOL2, ...SCOTCH_VOL3, ...SCOTCH_VOL4];

export const ALL_IRISH_WHISKEY: Bourbon[] = [...IRISH_WHISKEY, ...IRISH_WHISKEY_VOL2, ...IRISH_WHISKEY_VOL3];

export const ALL_RYE: Bourbon[] = [...RYE_WHISKEY, ...RYE_WHISKEY_VOL2, ...RYE_WHISKEY_VOL3];

export const ALL_CANADIAN: Bourbon[] = [...CANADIAN_WHISKY, ...CANADIAN_WHISKY_VOL2, ...CANADIAN_WHISKY_VOL3];

export const ALL_JAPANESE_WORLD: Bourbon[] = [...JAPANESE_WHISKY, ...JAPANESE_WHISKY_VOL2, ...JAPANESE_WHISKY_VOL3];

export const ALL_VODKA: Bourbon[] = [...VODKA, ...VODKA_VOL2, ...VODKA_VOL3, ...VODKA_VOL4];

export const ALL_GIN: Bourbon[] = [...GIN, ...GIN_VOL2, ...GIN_VOL3, ...GIN_VOL4];

export const ALL_RUM: Bourbon[] = [...RUM, ...RUM_VOL2];

export const ALL_TEQUILA_MEZCAL: Bourbon[] = [...TEQUILA_MEZCAL, ...TEQUILA_MEZCAL_VOL2];

export const ALL_BRANDY: Bourbon[] = [...BRANDY_COGNAC, ...ARMAGNAC];

export const ALL_AMARO_LIQUEURS: Bourbon[] = [...LIQUEURS, ...AMARO];

export {
  IRISH_WHISKEY,
  IRISH_WHISKEY_VOL2,
  IRISH_WHISKEY_VOL3,
  RYE_WHISKEY,
  RYE_WHISKEY_VOL2,
  RYE_WHISKEY_VOL3,
  CANADIAN_WHISKY,
  CANADIAN_WHISKY_VOL2,
  CANADIAN_WHISKY_VOL3,
  VODKA,
  VODKA_VOL2,
  VODKA_VOL3,
  VODKA_VOL4,
  GIN,
  GIN_VOL2,
  GIN_VOL3,
  GIN_VOL4,
  RUM,
  RUM_VOL2,
  TEQUILA_MEZCAL,
  TEQUILA_MEZCAL_VOL2,
  BRANDY_COGNAC,
  ARMAGNAC,
  JAPANESE_WHISKY,
  JAPANESE_WHISKY_VOL2,
  JAPANESE_WHISKY_VOL3,
  LIQUEURS,
  AMARO,
  ABSINTHE_PASTIS,
  AQUAVIT,
  GENEVER,
  GRAPPA_EAUX_DE_VIE,
  ASIAN_SPIRITS,
  CACHACA_WORLD_SPIRITS,
  VERMOUTH_FORTIFIED,
  BITTERS,
};

export const ALL_LIQUORS: Liquor[] = [
  ...BOURBONS,
  ...SCOTCH,
  ...ALL_IRISH_WHISKEY,
  ...ALL_RYE,
  ...ALL_CANADIAN,
  ...ALL_VODKA,
  ...ALL_GIN,
  ...ALL_RUM,
  ...ALL_TEQUILA_MEZCAL,
  ...ALL_BRANDY,
  ...ALL_JAPANESE_WORLD,
  ...ALL_AMARO_LIQUEURS,
  ...ABSINTHE_PASTIS,
  ...AQUAVIT,
  ...GENEVER,
  ...GRAPPA_EAUX_DE_VIE,
  ...ASIAN_SPIRITS,
  ...CACHACA_WORLD_SPIRITS,
  ...VERMOUTH_FORTIFIED,
  ...BITTERS,
];
