export class WebSocket extends godot.Node {
  socket: godot.WebSocketClient
  _onopen: Function
  _onerror: Function
  _onclose: Function
  _onmessage: Function

  private url: string
  private protocols
  private requestId: number

  constructor(url, protocols) {
    super()
    this.url = url;
    this.socket = new godot.WebSocketClient()
    this.protocols = new godot.PoolStringArray(protocols)

    this.socket.connect("connection_closed", this, "_onclose")
    this.socket.connect("connection_error", this, "_onerror")
    this.socket.connect("connection_established", this, "_onopen")
    this.socket.connect("data_received", this, "_on_data")

    setTimeout(() => {
      let err = this.socket.connect_to_url(this.url, protocols);
      if (err != godot.OK) {
        console.log("Unable to connect", err)
        this.set_process(false)
        cancelAnimationFrame(this.requestId)
      }
      console.log("websocket connecting:", err, this.url, this.protocols)
      this.requestId = requestAnimationFrame(this._process)
    }, 10)
  }

  _process = (_delta: number) => {
    this.socket.poll()
  }

  set onopen(fn) {
    this._onopen = fn
  }

  set onerror(fn) {
    this._onerror = fn
  }

  set onclose(fn) {
    this._onclose = fn
  }

  set onmessage(fn) {
    this._onmessage = fn
  }

  _on_data() {
    let data = this.socket.get_peer(1).get_packet().get_buffer();
    this._onmessage && this._onmessage({ data })
  }

  send(bytes) {
    this.socket.get_peer(1).put_packet(new godot.PoolByteArray(bytes))
  }

  close() {
  }
}

export default {
  exports: {
    WebSocket
  }
};