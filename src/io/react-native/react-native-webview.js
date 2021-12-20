// @flow

import '../../client-side.js'

import * as React from 'react'
import { Platform, StyleSheet, View } from 'react-native'
import RNFS from 'react-native-fs'
import { type WebViewMessageEvent, WebView } from 'react-native-webview'
import { Bridge, onMethod } from 'yaob'

import { makeClientIo } from './react-native-io.js'
import { type ClientIo, type WorkerApi } from './react-native-types.js'

type Props = {
  debug?: boolean,
  onError(e: any): mixed,
  onLoad(clientIo: ClientIo, root: WorkerApi): Promise<mixed>
}

type WebViewCallbacks = {
  handleMessage: (event: WebViewMessageEvent) => void,
  setRef: (element: WebView | null) => void
}

/**
 * Sets up a YAOB bridge for use with a React Native WebView.
 * The returned callbacks should be passed to the `onMessage` and `ref`
 * properties of the WebView. Handles WebView reloads and related
 * race conditions.
 * @param {*} onRoot Called when the inner HTML sends a root object.
 * May be called multiple times if the inner HTML reloads.
 * @param {*} debug Provide a message prefix to enable debugging.
 */
function makeOuterWebViewBridge<Root>(
  onRoot: (root: Root) => mixed,
  debug?: string
): WebViewCallbacks {
  let bridge: Bridge | void
  let gatedRoot: Root | void
  let webview: WebView | null = null

  // Gate the root object on the WebView being ready:
  function tryReleasingRoot(): void {
    if (gatedRoot != null && webview != null) {
      onRoot(gatedRoot)
      gatedRoot = undefined
    }
  }

  // Feed incoming messages into the YAOB bridge (if any):
  function handleMessage(event: WebViewMessageEvent): void {
    const message = JSON.parse(event.nativeEvent.data)
    if (debug != null) console.info(`${debug} →`, message)

    // This is a terrible hack. We are using our inside knowledge
    // of YAOB's message format to determine when the client has restarted.
    if (
      bridge != null &&
      message.events != null &&
      message.events.find(event => event.localId === 0) != null
    ) {
      bridge.close(new Error('edge-core: The WebView has been unmounted.'))
      bridge = undefined
    }

    // If we have no bridge, start one:
    if (bridge == null) {
      let firstMessage = true
      bridge = new Bridge({
        sendMessage: message => {
          if (debug != null) console.info(`${debug} ←`, message)
          if (webview == null) return

          const js = `if (window.bridge != null) {${
            firstMessage
              ? 'window.gotFirstMessage = true;'
              : 'window.gotFirstMessage && '
          } window.bridge.handleMessage(${JSON.stringify(message)})}`
          firstMessage = false
          webview.injectJavaScript(js)
        }
      })

      // Use our inside knowledge of YAOB to directly
      // subscribe to the root object appearing:
      onMethod.call(bridge._state, 'root', root => {
        gatedRoot = root
        tryReleasingRoot()
      })
    }

    // Finally, pass the message to the bridge:
    bridge.handleMessage(message)
  }

  // Listen for the WebView component to mount:
  function setRef(element: WebView | null): void {
    webview = element
    tryReleasingRoot()
  }

  return { handleMessage, setRef }
}

/**
 * Launches the Edge core worker in a WebView and returns its API.
 */
export class EdgeCoreBridge extends React.Component<Props> {
  callbacks: WebViewCallbacks

  constructor(props: Props) {
    super(props)
    const { debug = false, onError, onLoad } = props

    // Set up the native IO objects:
    const clientIoPromise = makeClientIo()

    // Set up the YAOB bridge:
    this.callbacks = makeOuterWebViewBridge(
      (root: WorkerApi) => {
        clientIoPromise
          .then(nativeIo => onLoad(nativeIo, root))
          .catch(error => onError(error))
      },
      debug ? 'edge-core' : undefined
    )
  }

  render(): React.Node {
    const { debug = false } = this.props
    let uri =
      Platform.OS === 'android'
        ? 'file:///android_asset/edge-core/index.html'
        : `file://${RNFS.MainBundlePath}/edge-core/index.html`
    if (debug) {
      uri += '?debug=true'
      console.log(`edge core at ${uri}`)
    }

    return (
      <View style={debug ? styles.debug : styles.hidden}>
        <WebView
          allowFileAccess
          onMessage={this.callbacks.handleMessage}
          originWhitelist={['file://*']}
          ref={this.callbacks.setRef}
          source={{ uri }}
        />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  debug: {
    alignSelf: 'center',
    position: 'absolute',
    height: 10,
    width: 10,
    top: 50
  },
  hidden: { position: 'absolute', height: 0, width: 0 }
})
