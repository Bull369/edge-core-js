class EdgeCoreWebView: RCTView, WKNavigationDelegate, WKScriptMessageHandler {
  let queue = DispatchQueue(label: "app.edge.reactnative.core")
  let disklet = Disklet()
  var webView: WKWebView?

  // react api--------------------------------------------------------------

  @objc var onMessage: RCTDirectEventBlock?
  @objc var onScriptError: RCTDirectEventBlock?

  @objc var source: String? {
    didSet { if source != oldValue { visitPage() } }
  }

  func runJs(js: String) {
    webView?.evaluateJavaScript(
      js
        .replacingOccurrences(of: "\u{2028}", with: "\\u2028")
        .replacingOccurrences(of: "\u{2029}", with: "\\u2029"),
      completionHandler: { result, error in return }
    )
  }

  // view api --------------------------------------------------------------

  override func didMoveToWindow() {
    if let webView = self.webView {
      webView.configuration.userContentController
        .removeScriptMessageHandler(forName: "edgeCore")
      webView.removeFromSuperview()
      self.webView = nil
    }
    if window == nil { return }

    // Set up our native bridge:
    let configuration = WKWebViewConfiguration()
    configuration.userContentController = WKUserContentController()
    configuration.userContentController.add(self, name: "edgeCore")

    // Set up the WKWebView child:
    let webView = WKWebView(frame: bounds, configuration: configuration)
    webView.navigationDelegate = self
    addSubview(webView)
    self.webView = webView

    // Launch the core:
    visitPage()
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    webView?.frame = bounds
  }

  // callbacks -------------------------------------------------------------

  func webView(
    _: WKWebView,
    didFailProvisionalNavigation: WKNavigation!,
    withError: Error
  ) {
    // This makes webpack live-reload work correctly:
    visitPage()
  }

  func webViewWebContentProcessDidTerminate(_: WKWebView) {
    // Reload if we run out of memory:
    visitPage()
  }

  func userContentController(
    _: WKUserContentController,
    didReceive scriptMessage: WKScriptMessage
  ) {
    if let call = scriptMessage.body as? NSArray,
      let id = call[0] as? Int,
      let name = call[1] as? String,
      let args = call[2] as? NSArray
    {
      if id == 0 { return handleMessage(name, args: args) }

      let promise = PendingCall(
        resolve: { result in
          self.runJs(
            js: "window.nativeBridge.resolve(\(id), \(self.stringify(result)))")
        },
        reject: { message in
          self.runJs(
            js: "window.nativeBridge.reject(\(id), \(self.stringify(message)))")
        })

      return queue.async {
        do {
          try self.handleCall(name, args: args, promise: promise)
        } catch {
          promise.reject("\(error)")
        }
      }
    }
  }

  // utilities -------------------------------------------------------------

  struct PendingCall {
    var resolve: (_ value: Any?) -> Void
    var reject: (_ message: String) -> Void
  }

  func handleCall(
    _ name: String,
    args: NSArray,
    promise: PendingCall
  ) throws {
    if name == "diskletDelete", let path = args[0] as? String {
      try disklet.delete(path: path)
      return promise.resolve(nil)
    }
    if name == "diskletGetData", let path = args[0] as? String {
      return promise.resolve(try disklet.getData(path: path).base64EncodedString())
    }
    if name == "diskletGetText", let path = args[0] as? String {
      return promise.resolve(try disklet.getText(path: path))
    }
    if name == "diskletList", let path = args[0] as? String {
      return promise.resolve(try disklet.list(path: path) as NSDictionary)
    }
    if name == "diskletSetData",
      let path = args[0] as? String,
      let base64 = args[1] as? String,
      let data = Data.init(base64Encoded: base64)
    {
      try disklet.setData(path: path, data: data)
      return promise.resolve(nil)
    }
    if name == "diskletSetText",
      let path = args[0] as? String,
      let text = args[1] as? String
    {
      try disklet.setText(path: path, text: text)
      return promise.resolve(nil)
    }
    return promise.reject("No method \(name)")
  }

  func handleMessage(
    _ name: String, args args: NSArray
  ) {
    if name == "postMessage", let message = args[0] as? String {
      onMessage?(["message": message])
      return
    }
    if name == "scriptError", let source = args[0] as? String {
      onScriptError?(["source": source])
      return
    }
  }

  func defaultSource() -> String? {
    if let bundleUrl = Bundle.main.url(
      forResource: "edge-core-js",
      withExtension: "bundle"
    ),
      let bundle = Bundle(url: bundleUrl),
      let script = bundle.url(forResource: "edge-core", withExtension: "js")
    {
      return script.absoluteString
    }
    return nil
  }

  func stringify(_ raw: Any?) -> String {
    if let value = raw,
      let data = try? JSONSerialization.data(
        withJSONObject: value,
        options: [.fragmentsAllowed]
      ),
      let string = String(data: data, encoding: .utf8)
    {
      return string
    }
    return "undefined"
  }

  func visitPage() {
    if let src = source ?? defaultSource() {
      webView?.loadHTMLString(
        """
        <!doctype html><html><head>
        <meta charset="utf-8">
        <title>edge-core-js</title>
        <script
          charset="utf-8"
          defer
          src="\(src)"
          onerror="window.webkit.messageHandlers.edgeCore.postMessage([0, 'scriptError', ['\(src)']])"
        ></script>
        </head><body></body></html>
        """,
        baseURL: Bundle.main.bundleURL
      )
    }
  }
}
