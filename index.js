const cors = require('cors');
const crypto = require('crypto');
const express = require("express");
const socket = require("socket.io");

const secret = 'ixj"O6nAz)L(V7w~xRzb=2%x9Kz.}G|GRkba,8q)2z{tnE.z2,}6uz<]RM4Sq]d';


// App setup
const PORT = 8080;
const app = express();
const server = app.listen(PORT, function () {
    console.log(`Listening on port ${PORT}`);
    console.log(`http://localhost:${PORT}`);
});

// Static files
app.use(express.static("public"));

app.use(cors())

app.get('/test', (req, res) => res.json({ 'yay': true }))

const getTURNCredentials = (name, secret) => {
    let unixTimeStamp = parseInt(Date.now() / 1000) + 24 * 3600,
        // this credential would be valid for the next 24 hours
        username = crypto.createHash('md5').update([unixTimeStamp, name].join(':')).digest("hex"),
        password,
        hmac = crypto.createHmac('sha1', secret);
    hmac.setEncoding('base64');
    hmac.write(username);
    hmac.end();
    password = hmac.read();
    return {
        username,
        password
    };
}

// Socket setup
const io = socket(server, {
    cors: {
        origin: ['*'],
    }
});

io.on("connection", function (socket) {
    console.log('Socket Joined : ', socket.id);

    socket.emit('connection', socket.id, io.of("/").adapter.rooms.size);

    socket.broadcast.emit('new-peer-connected', {
        sid: socket.id, iceServers: [
            { url: 'turn:stun.6buns.com', ...getTURNCredentials(socket.id, secret) }
        ]
    })

    socket.on('join-room', (room, callback) => {
        socket.join(room)
        let peerList = []
        for (const [roomName, id] of io.of("/").adapter.rooms) {
            if (roomName === room && id !== socket.id) {
                callback([...id])
            }
        }
        callback([])
    })

    socket.on('offer-sdp', ({ to, from, sdp }) => {
        console.log(`From : ${from} :: To : ${to} :: sdp : ${sdp.type}`)
        if (to) {
            io.to(to).emit('offer-sdp', { to, from, sdp })
        } else {
            socket.emit('error', 'You are alone nobody to connect to.');
        }
    })

    socket.on('answer-sdp', ({ to, from, sdp }) => {
        console.log(`From : ${from} :: To : ${to} :: sdp : ${sdp.type}`)
        if (to) {
            io.to(to).emit('answer-sdp', { to, from, sdp })
        } else {
            socket.emit('error', 'You are alone nobody to connect to.');
        }
    })

    socket.on('candidates', ({ to, from, candidates }) => {
        console.log(`From : ${from} :: To : ${to} :: candidates : ${JSON.stringify(candidates)}`)
        if (to) {
            io.to(to).emit('candidates', { to, from, candidates })
        } else {
            socket.emit('error', 'You are alone nobody to connect to.');
        }
    })

    socket.on('disconnect', () => {
        console.log('Socket Left : ', socket.id, socket.adapter.sids)
        try {
            for (const [id, setmap] of socket.adapter.sids) {
                io.to(id).emit('peer-disconnected', socket.id)
            }
        } catch (error) {
            console.log(error)
        }
    })
});

io.of('/').adapter.on('create-room', (room) => {
    console.log(`room ${room} was created.`);
})

io.of('/').adapter.on('delete-room', (room) => {
    console.log(`room ${room} was deleted.`)
})

io.of('/').adapter.on('join-room', (room, id) => {
    console.log(`socket ${id} has joined room ${room}`);
})

io.of('/').adapter.on('leave-room', (room, id) => {
    console.log(`socket ${id} has left room ${room}`);
})
