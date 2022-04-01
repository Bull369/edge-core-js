// @flow

import { type SyncClient } from 'edge-sync-client'
import { type Dispatch } from 'redux'
import { type PixieInput, type TamePixie, combinePixies } from 'redux-pixies'

import { type EdgeIo, type EdgeLog } from '../types/types.js'
import { type AccountOutput, accounts } from './account/account-pixie.js'
import { type RootAction } from './actions.js'
import { type ContextOutput, context } from './context/context-pixie.js'
import { type CurrencyOutput, currency } from './currency/currency-pixie.js'
import { exchange } from './exchange/exchange-pixie.js'
import { type LogBackend } from './log/log.js'
import { type RootState } from './root-reducer.js'
import { type ScryptOutput, scrypt } from './scrypt/scrypt-pixie.js'

// The top-level pixie output structure:
export type RootOutput = {
  +accounts: { [accountId: string]: AccountOutput },
  +context: ContextOutput,
  +currency: CurrencyOutput,
  +scrypt: ScryptOutput
}

// Props passed to the root pixie:
export type RootProps = {
  +close: () => void,
  +dispatch: Dispatch<RootAction>,
  +io: EdgeIo,
  +log: EdgeLog,
  +logBackend: LogBackend,
  +onError: (e: Error) => mixed,
  +output: RootOutput,
  +state: RootState,
  +syncClient: SyncClient
}

export type ApiInput = PixieInput<RootProps>

/**
 * Downstream pixies take props that extend from `RootProps`,
 * so this casts those back down if necessary.
 */
export const toApiInput = (input: PixieInput<any>): ApiInput => input

export const rootPixie: TamePixie<RootProps> = combinePixies({
  accounts,
  context,
  currency,
  exchange,
  scrypt
})
