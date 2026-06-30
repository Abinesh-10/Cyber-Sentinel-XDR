import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { BASE_URL } from "../lib/api/client";

export function useSocket(namespace = "/xdr") {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const client = io(`${BASE_URL}${namespace.startsWith("/") ? namespace : `/${namespace}`}`, {
      autoConnect: true,
      reconnection: true,
      transports: ["websocket", "polling"],
    });

    const handleConnect = () => {
      setConnected(true);
      setError(null);
    };
    const handleDisconnect = () => setConnected(false);
    const handleConnectError = (socketError: Error) => {
      setConnected(false);
      setError(socketError);
    };

    client.on("connect", handleConnect);
    client.on("disconnect", handleDisconnect);
    client.on("connect_error", handleConnectError);
    setSocket(client);

    return () => {
      client.off("connect", handleConnect);
      client.off("disconnect", handleDisconnect);
      client.off("connect_error", handleConnectError);
      client.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [namespace]);

  return { socket, connected, error };
}
