// @flow

import { expect } from 'chai'
import { describe, it } from 'mocha'

import { pickBestQuote } from '../../src/core/swap/swap-api.js'
import { type EdgeSwapQuote, type EdgeSwapRequest } from '../../src/index.js'

const typeHack: any = {}

const request: EdgeSwapRequest = typeHack

const quotes: EdgeSwapQuote[] = [
  {
    request,
    fromNativeAmount: '51734472727286000',
    toNativeAmount: '347987',
    networkFee: {
      currencyCode: 'ETH',
      nativeAmount: '3492187272714000'
    },
    pluginId: 'changenow',
    expirationDate: new Date('2022-01-21T04:35:22.033Z'),
    isEstimate: false,
    approve: async () => typeHack,
    close: async () => undefined
  },
  {
    request,
    isEstimate: false,
    fromNativeAmount: '51734472727286000',
    toNativeAmount: '321913.5410141837507493644',
    networkFee: {
      currencyCode: 'ETH',
      nativeAmount: '3492187272714000'
    },
    expirationDate: new Date('2022-01-21T04:35:18.000Z'),
    pluginId: 'switchain',
    approve: async () => typeHack,
    close: async () => undefined
  },
  {
    request,
    fromNativeAmount: '51734472727286000',
    toNativeAmount: '327854',
    networkFee: {
      currencyCode: 'ETH',
      nativeAmount: '3492187272714000'
    },
    pluginId: 'godex',
    expirationDate: new Date('2022-01-21T04:53:22.097Z'),
    isEstimate: false,
    approve: async () => typeHack,
    close: async () => undefined
  }
]

describe('swap', function () {
  it('picks the best quote', function () {
    const quote = pickBestQuote(quotes, undefined, {})
    expect(quote.pluginId).equals('changenow')
  })

  it('picks the preferred swap provider', function () {
    const quote = pickBestQuote(quotes, 'switchain', {})
    expect(quote.pluginId).equals('switchain')
  })

  it('picks the swap provider with an active promo code', function () {
    const quote = pickBestQuote(quotes, undefined, {
      switchain: 'deal10'
    })
    expect(quote.pluginId).equals('switchain')
  })
})
