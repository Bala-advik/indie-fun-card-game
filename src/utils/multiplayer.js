import { Peer } from 'peerjs';

// Initialize a PeerJS connection for real-time WebRTC
export function initPeer(onOpen, onConnection, onError) {
  try {
    const peer = new Peer(undefined, {
      debug: 1, // Only print errors/warnings in console
    });

    peer.on('open', (id) => {
      onOpen(id);
    });

    peer.on('connection', (conn) => {
      onConnection(conn);
    });

    peer.on('error', (err) => {
      onError(err);
    });

    return peer;
  } catch (error) {
    onError(error);
    return null;
  }
}

// Connect to a Host Peer ID
export function connectToHost(peerInstance, hostId, playerName, onConnOpen, onData, onConnClose, onError) {
  try {
    const conn = peerInstance.connect(hostId, {
      reliable: true,
      metadata: { name: playerName || 'Guest' }
    });

    conn.on('open', () => {
      onConnOpen(conn);
    });

    conn.on('data', (data) => {
      onData(data);
    });

    conn.on('close', () => {
      onConnClose();
    });

    conn.on('error', (err) => {
      onError(err);
    });

    return conn;
  } catch (error) {
    onError(error);
    return null;
  }
}
