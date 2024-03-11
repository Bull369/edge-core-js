import { asArray, asObject, asString } from 'cleaners'

import { EdgePluginMap, JsonObject } from '../../browser'
import { asJsonObject, makeJsonFile } from '../../util/file-helpers'

export interface InfoCacheFile {
  corePlugins?: EdgePluginMap<JsonObject>
  syncServers?: string[]
}

export const INFO_CACHE_FILE_NAME = 'infoCache.json'

export const asInfoCacheFile = asObject<InfoCacheFile>({
  // date: asDate,
  corePlugins: asObject(asJsonObject),
  syncServers: asArray(asString)
})

export const infoCacheFile = makeJsonFile(asInfoCacheFile)
