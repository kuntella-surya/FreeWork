import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/routes.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { setupSocket } from './config/Socket.js';
import routerMessage from './routes/MessageRoutes.js';
import routergoggle from './routes/googleroutes.js';
import { setSocketInstance } from './config/setSocketInstsnce.js';
import ratingRoutes from './routes/ratingroutes.js';

dotenv.config();
connectDB();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});


setupSocket(io);

setSocketInstance(io);

const connectedUsers = {};

io.on("connection", (socket) => {
  console.log("⚡ User connected");

  
  socket.on("register", (userId) => {
    connectedUsers[userId] = socket.id;
    socket.join(userId); 
    console.log(`✅ User registered: ${userId}`);
  });

  socket.on("disconnect", () => {
    for (const [uid, sid] of Object.entries(connectedUsers)) {
      if (sid === socket.id) {
        delete connectedUsers[uid];
        break;
      }
    }
    console.log("❌ User disconnected");
  });
});


app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api', authRoutes);
app.use('/api/auth',routergoggle);
app.use('/api/messages', routerMessage);
app.use('/api/rating', ratingRoutes);

app.get('/', (req, res) => res.send('✅ API Running'));

const PORT = process.env.PORT || 5001;
httpServer.listen(PORT,"0.0.0.0", () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
