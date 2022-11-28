// @flow

import { type FatReducer, buildReducer, memoizeReducer } from 'redux-keto'

import { type EdgeUserInfo } from '../../types/types.js'
import { base58 } from '../../util/encoding.js'
import { type RootAction } from '../actions.js'
import { type RootState } from '../root-reducer.js'
import { searchTree } from './login.js'
import { type LoginStash } from './login-stash.js'
import { type WalletInfoFullMap } from './login-types.js'
import { findPin2Stash } from './pin2.js'

export type LoginStashMap = { [username: string]: LoginStash }

export type LoginState = {
  +apiKey: string,
  +appId: string,
  +clientId: Uint8Array,
  +deviceDescription: string | null,
  +serverUri: string,
  +stashes: LoginStashMap,
  +localUsers: EdgeUserInfo[],
  +walletInfos: WalletInfoFullMap
}

const dummyClientId = new Uint8Array(0)

export const login: FatReducer<
  LoginState,
  RootAction,
  RootState
> = buildReducer({
  apiKey(state = '', action: RootAction): string {
    return action.type === 'INIT' ? action.payload.apiKey : state
  },

  appId(state = '', action: RootAction): string {
    return action.type === 'INIT' ? action.payload.appId : state
  },

  clientId(state = dummyClientId, action: RootAction): Uint8Array {
    return action.type === 'INIT' ? action.payload.clientId : state
  },

  deviceDescription(state = null, action: RootAction): string | null {
    return action.type === 'INIT' ? action.payload.deviceDescription : state
  },

  localUsers: memoizeReducer(
    (next: RootState) => next.login.appId,
    (next: RootState) => next.login.stashes,
    (appId: string, stashes: LoginStashMap): EdgeUserInfo[] => {
      const out: EdgeUserInfo[] = []
      for (const username of Object.keys(stashes)) {
        const stashTree = stashes[username]
        const stash = searchTree(stashTree, stash => stash.appId === appId)

        const keyLoginEnabled =
          stash != null &&
          (stash.passwordAuthBox != null || stash.loginAuthBox != null)
        const pin2Stash = findPin2Stash(stashTree, appId)
        const { recovery2Key } = stashTree

        out.push({
          keyLoginEnabled,
          lastLogin: stashTree.lastLogin,
          loginId: base58.stringify(stashTree.loginId),
          pinLoginEnabled: pin2Stash != null,
          recovery2Key:
            recovery2Key != null ? base58.stringify(recovery2Key) : undefined,
          username,
          voucherId: stash != null ? stash.voucherId : undefined
        })
      }
      return out
    }
  ),

  serverUri(state = '', action: RootAction): string {
    return action.type === 'INIT' ? action.payload.authServer : state
  },

  stashes(state = {}, action: RootAction): LoginStashMap {
    switch (action.type) {
      case 'INIT': {
        const out: LoginStashMap = {}

        // Extract the usernames from the top-level objects:
        for (const stash of action.payload.stashes) {
          if (stash.username != null) {
            const { username } = stash
            out[username] = stash
          }
        }

        return out
      }

      case 'LOGIN_STASH_DELETED': {
        const copy = { ...state }
        delete copy[action.payload]
        return copy
      }

      case 'LOGIN_STASH_SAVED': {
        const { username } = action.payload
        if (username == null) throw new Error('Missing username')

        const out = { ...state }
        out[username] = action.payload
        return out
      }
    }
    return state
  },

  walletInfos(state, action: RootAction, next: RootState): WalletInfoFullMap {
    // Optimize the common case:
    if (next.accountIds.length === 1) {
      const id = next.accountIds[0]
      return next.accounts[id].walletInfos
    }

    const out: WalletInfoFullMap = {}
    for (const accountId of next.accountIds) {
      const account = next.accounts[accountId]
      for (const id of Object.keys(account.walletInfos)) {
        const info = account.walletInfos[id]
        out[id] = info
      }
    }
    return out
  }
})
