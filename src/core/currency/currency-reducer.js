// @flow

import { type FatReducer, buildReducer, mapReducer } from 'redux-keto'

import { type EdgeMetaToken } from '../../types/types.js'
import { type RootAction } from '../actions.js'
import { type RootState } from '../root-reducer.js'
import {
  type CurrencyWalletState,
  currencyWalletReducer
} from './wallet/currency-wallet-reducer.js'

export type CurrencyState = {
  +currencyWalletIds: string[],
  +customTokens: EdgeMetaToken[],
  +wallets: { [walletId: string]: CurrencyWalletState }
}

export const currency: FatReducer<
  CurrencyState,
  RootAction,
  RootState
> = buildReducer({
  currencyWalletIds(state, action: RootAction, next: RootState): string[] {
    // Optimize the common case:
    if (next.accountIds.length === 1) {
      const id = next.accountIds[0]
      return next.accounts[id].activeWalletIds
    }

    const allIds = next.accountIds.map(
      accountId => next.accounts[accountId].activeWalletIds
    )
    return [].concat(...allIds)
  },

  customTokens(state = [], action: RootAction): EdgeMetaToken[] {
    if (action.type === 'ADDED_CUSTOM_TOKEN') {
      const {
        currencyCode,
        currencyName,
        contractAddress,
        multiplier
      } = action.payload
      const token = {
        currencyCode,
        currencyName,
        contractAddress,
        denominations: [
          {
            name: currencyCode,
            multiplier
          }
        ]
      }
      const out = state.filter(info => info.currencyCode !== currencyCode)
      out.push(token)
      return out
    }
    return state
  },

  wallets: mapReducer(
    currencyWalletReducer,
    (props: RootState) => props.currency.currencyWalletIds
  )
})
