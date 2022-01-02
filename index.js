const express = require("express");
const socket = require("socket.io");
const { RTCPeerConnection } = require("wrtc");

// App setup
const PORT = 3000;
const app = express();
const server = app.listen(PORT, function () {
    console.log(`Listening on port ${PORT}`);
    console.log(`http://localhost:${PORT}`);
});

// Static files
app.use(express.static("public"));

const peer = new RTCPeerConnection()

// Socket setup
const io = socket(server);

io.on("connection", function (socket) {
    socket.emit('connection::ok', socket.id, io.sockets.server.httpServer._connections === 1 ? true : false);
    socket.broadcast.emit('is::new', socket.id, io.sockets.server.httpServer._connections)
    io.emit('log', io.sockets.server.httpServer._connections)

    socket.on('SDP', ({ to, data }) => {
        to ? io.to(to).emit('SDP', { from: socket.id, data }) : socket.emit('error', 'You are alone nobody to connect to.');
    })

    socket.on('CANDIDATE', ({ to, data }) => {
        to ? io.to(to).emit('CANDIDATE', { from: socket.id, data }) : socket.emit('error', 'You are alone nobody to connect to.');
    })
});
