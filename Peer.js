const { RTCPeerConnection } = require("wrtc");

const createPeerConnection = (n) => {
    const rpc = new RTCPeerConnection({
        iceServers: [
            {
                urls: [
                    "stun:stun1.l.google.com:19302",
                    "stun:stun1.l.google.com:19302",
                ],
            },
        ],
        iceCandidatePoolSize: 10,
    });

    rpc.addStream(thisStream);

    rpc.onicecandidate = (e) => {
        if (e.candidate) {
            candidates.push(e.candidate);
        }
    };

    rpc.oniceconnectionstatechange = (e) =>
        (state = e.currentTarget.connectionState);

    rpc.ontrack = (e) => {
        console.log(`Track is here. :: ${{ e }}`);
        const vid = document.createElement("video");
        vid.setAttribute("class", "video");
        vid.setAttribute("id", `remote-video-${n}`);
        vid.setAttribute("autoplay", "autoplay");
        vid.setAttribute("muted", "muted");
        vid.setAttribute("controls", "controls");
        console.log(vid);
        document.querySelector("main").append(vid);
    };

    return rpc;
};

const createAnswer = (peer) => {
    peer.createAnswer({
        offerToReceiveAudio: 1,
        offerToReceiveVideo: 1,
    })
        .then((sdp) => {
            peer.setLocalDescription(sdp);
            send("SDP", sdp);
        })
        .catch(console.log);
};


module.exports = { createPeerConnection, createAnswer }
