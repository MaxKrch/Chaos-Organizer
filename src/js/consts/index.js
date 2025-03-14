import { general } from './generalVariable.js';
import { sidebarStaticElements } from './sidebarVariables.js';
import { feedHeaderStaticElements } from './feedHeaderVaiables.js';
import { createNoteStaticElements } from './feedFooterVariables.js';
import {
  initialState,
  orderedKeysInitialState,
  idbParams,
} from './storeVariables.js';
import {
  routes,
  SSEMessageEvents,
  connectionOptions,
} from './connectionVariables.js';
import { popupVariable } from './popupVariables.js';
import { authVariables } from './authVariables.js';
import { loginStreams } from './loginVariable.js';
import { fileLimits, knownTypes } from './fileVariables.js';

export {
  general,
  sidebarStaticElements,
  feedHeaderStaticElements,
  createNoteStaticElements,
  initialState,
  orderedKeysInitialState,
  idbParams,
  popupVariable,
  routes,
  SSEMessageEvents,
  connectionOptions,
  authVariables,
  loginStreams,
  fileLimits,
  knownTypes,
};
