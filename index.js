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

// Socket setup
const io = socket(server);

io.on("connection", function (socket) {
    console.log('Socket Joined : ', socket.id)
    socket.emit('connection::ok', socket.id, io.sockets.server.httpServer._connections);
    socket.broadcast.emit('is::new', socket.id)

    socket.on('SDP', ({ to, data }) => {
        to ? io.to(to).emit('SDP', { from: socket.id, data }) : socket.emit('error', 'You are alone nobody to connect to.');
    })

    socket.on('SEND::CANDIDATE', ({ to, data }) => {
        to && io.to(to).emit('CANDIDATE', { from: socket.id, data })
    })

    socket.on('RECV::CANDIDATE', ({ to, data }) => {
        to && io.to(to).emit('CANDIDATE', { from: socket.id, data, type: 'recv' })
    })

    socket.on('disconnect', () => {
        console.log('Socket Left : ', socket.id)
    })
});
