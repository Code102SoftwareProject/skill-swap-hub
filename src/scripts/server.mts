import { createServer } from "node:http";\
import next from "next";
import {Server} from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname =process.env.HOSTNAME;
const port = parseInt(process.env.PORT ?? "3000", 10);

const app = next({ dev,hostname,port });
const handle = app.getRequestHandler();

