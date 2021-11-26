// @flow

import { expect } from 'chai'
import { describe, it } from 'mocha'
import { base64 } from 'rfc4648'

import {
  type EdgeInternalStuff,
  getInternalStuff
} from '../../../src/core/context/internal-api.js'
import { makeRepoPaths } from '../../../src/core/storage/repo.js'
import { makeFakeEdgeWorld, makeFakeIo } from '../../../src/index.js'
import { fakeUser } from '../../fake/fake-user.js'

const contextOptions = { apiKey: '', appId: '' }
const dataKey = base64.parse(fakeUser.loginKey)
const syncKey = base64.parse(fakeUser.syncKey)
const quiet = { onLog() {} }

describe('repo', function () {
  it('read file', async function () {
    const io = makeFakeIo()
    const { disklet } = makeRepoPaths(io, syncKey, dataKey)
    const payload = '{"message":"Hello"}'
    const box = `{
      "encryptionType": 0,
      "iv_hex": "82454458a5eaa6bc7dc4b4081b9f36d1",
      "data_base64": "lykLWi2MUBbcrdbbo2cZ9Q97aVohe6LZUihp7xfr1neAMj8mr0l9MP1ElteAzG4GG1FmjSsptajr6I2sNc5Kmw=="
    }`

    await io.disklet.setText(
      'repos/GkVrxd1EmZpU6SkEwfo3911t1WjwBDW3tdrKd7QUDvvN/changes/a/b.json',
      box
    )
    expect(await disklet.getText('a/b.json')).equals(payload)
  })

  it('data round-trip', async function () {
    const io = makeFakeIo()
    const { disklet } = makeRepoPaths(io, syncKey, dataKey)
    const payload = 'Test data'

    await disklet.setText('b.txt', payload)
    expect(await disklet.getText('b.txt')).equals(payload)
  })

  it('repo-to-repo sync', async function () {
    const world = await makeFakeEdgeWorld([fakeUser], quiet)
    const context1 = await world.makeEdgeContext(contextOptions)
    const context2 = await world.makeEdgeContext(contextOptions)
    const i1 = getInternalStuff(context1)
    const i2 = getInternalStuff(context2)
    const disklet1 = await i1.getRepoDisklet(syncKey, dataKey)
    const disklet2 = await i2.getRepoDisklet(syncKey, dataKey)

    const payload = 'Test data'
    await disklet1.setText('a/b.json', payload)
    await i1.syncRepo(syncKey)
    await i2.syncRepo(syncKey)
    expect(await disklet2.getText('a/b.json')).equals(payload)
  })

  it('large repo-to-repo sync', async function () {
    const world = await makeFakeEdgeWorld([fakeUser], quiet)
    const context1 = await world.makeEdgeContext(contextOptions)
    const context2 = await world.makeEdgeContext(contextOptions)
    const i1 = getInternalStuff(context1)
    const i2 = getInternalStuff(context2)
    const disklet1 = await i1.getRepoDisklet(syncKey, dataKey)
    const disklet2 = await i2.getRepoDisklet(syncKey, dataKey)

    const files = Array.from({ length: 333 }, (_, i) => `a/${i}.txt`)
    await Promise.all(
      files.map(async file => disklet1.setText(file, `${file} content`))
    )

    async function fullSync(internal: EdgeInternalStuff): Promise<void> {
      let i: number = 0
      while (true) {
        const response = await internal.syncRepo(syncKey)
        const j = Object.keys(response.changes).length
        if (j === i) break
        i = j
      }
    }

    await fullSync(i1)
    await fullSync(i2)

    await Promise.all(
      files.map(async file => {
        expect(await disklet2.getText(file)).equals(`${file} content`)
      })
    )
  })
})
