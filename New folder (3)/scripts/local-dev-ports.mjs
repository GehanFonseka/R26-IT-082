import { createConnection } from "node:net";

const addressIsAvailable = (port, host) => new Promise((resolve, reject) => {
  const socket = createConnection({ port, host });
  const finish = (available) => { socket.destroy(); resolve(available); };
  socket.once("connect", () => finish(false));
  socket.once("error", (error) => {
    socket.destroy();
    if (["ECONNREFUSED", "EAFNOSUPPORT", "EADDRNOTAVAIL", "ENETUNREACH", "EHOSTUNREACH"].includes(error.code)) finish(true);
    else reject(error);
  });
  socket.setTimeout(1000, () => finish(false));
});

export const portIsAvailable = async (port) => (await Promise.all([
  addressIsAvailable(port, "127.0.0.1"), addressIsAvailable(port, "::1"),
])).every(Boolean);

export async function findOccupiedPorts(services) {
  const checks = await Promise.all(services.map(async (service) => ({
    ...service, available: await portIsAvailable(service.port),
  })));
  return checks.filter(({ available }) => !available);
}
