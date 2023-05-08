import { RefObject } from 'react';
import { Config, Slot } from '../models/config';
import { PrebidAdUnit, PrebidCommand, PrebidCommandQueue } from '../models/pbjs';
export declare const isPrebidUsed: () => boolean;
export declare const getAdUnits: (slots: Slot[], gam: boolean) => PrebidAdUnit[];
export declare const setupAdUnitsAndConfig: (data: Config) => void;
export declare const activateIframe: (id: string, iframeRef: RefObject<HTMLIFrameElement>, setAdSlotSizeCallback: () => void) => void;
export declare const addToQueue: (func: Function) => Promise<void>;
export declare const prebidQueue: (queue: PrebidCommandQueue & Array<PrebidCommand>, func: Function) => Promise<void>;
