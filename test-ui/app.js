const {Room,RoomEvent,Track,} = LivekitClient;
let room = null;
let microphoneEnabled = false;
const connectButton = document.getElementById("connectButton");
const disconnectButton = document.getElementById("disconnectButton");
const micButton = document.getElementById("micButton");
const textInput = document.getElementById("textInput");
const sendTextButton = document.getElementById("sendTextButton");
const statusElement = document.getElementById("status");
const roomNameElement = document.getElementById("roomName");
const agentNameElement = document.getElementById("agentName");
const activityElement = document.getElementById("activity");


// --------------------------------------------------
// Logging  

function log(message) {

    const line =
        document.createElement("div");

    const time =
        new Date().toLocaleTimeString();

    line.textContent =
        `[${time}] ${message}`;

    activityElement.appendChild(line);

    activityElement.scrollTop =
        activityElement.scrollHeight;

    console.log(message);
}


// --------------------------------------------------
// Status
// --------------------------------------------------

function setStatus(status) {

    statusElement.textContent =
        status;
}


// --------------------------------------------------
// Get LiveKit token
// --------------------------------------------------

async function getToken() {

    log(
        "Requesting LiveKit token..."
    );

    const response =
        await fetch("/token");

    if (!response.ok) {

        throw new Error(
            `Token request failed: ${response.status}`
        );
    }

    const data =
        await response.json();

    return data;
}


// --------------------------------------------------
// Connect
// --------------------------------------------------

async function connect() {

    try {

        connectButton.disabled = true;

        setStatus("Connecting...");

        log(
            "Connecting to LiveKit..."
        );


        const data =
            await getToken();


        roomNameElement.textContent =
            data.roomName;


        room =
            new Room();


        // ------------------------------------------
        // Connected
        // ------------------------------------------

        room.on(
            RoomEvent.Connected,
            () => {

                setStatus("Connected");

                log(
                    "Connected to LiveKit room."
                );

                disconnectButton.disabled =
                    false;

                micButton.disabled =
                    false;

                textInput.disabled =
                    false;

                sendTextButton.disabled =
                    false;
            }
        );


        // ------------------------------------------
        // Disconnected
        // ------------------------------------------

        room.on(
            RoomEvent.Disconnected,
            () => {

                setStatus("Disconnected");

                log(
                    "Disconnected from room."
                );

                connectButton.disabled =
                    false;

                disconnectButton.disabled =
                    true;

                micButton.disabled =
                    true;

                textInput.disabled =
                    true;

                sendTextButton.disabled =
                    true;

                microphoneEnabled =
                    false;

                micButton.textContent =
                    "Microphone OFF";
            }
        );


        // ------------------------------------------
        // Participant connected
        // ------------------------------------------

        room.on(
            RoomEvent.ParticipantConnected,
            (participant) => {

                log(
                    `Participant joined: ${participant.identity}`
                );


                if (
                    participant.identity.includes("agent") ||
                    participant.identity.includes("Max")
                ) {

                    agentNameElement.textContent =
                        participant.identity;

                    log(
                        "Agent joined the room."
                    );
                }
            }
        );


        // ------------------------------------------
        // Audio track received
        // ------------------------------------------

        room.on(
            RoomEvent.TrackSubscribed,
            (
                track,
                publication,
                participant
            ) => {

                log(
                    `Received ${track.kind} track from ${participant.identity}`
                );


                if (
                    track.kind === Track.Kind.Audio
                ) {

                    const audioElement =
                        track.attach();

                    audioElement.autoplay =
                        true;

                    document.body.appendChild(
                        audioElement
                    );


                    log(
                        `Playing audio from ${participant.identity}`
                    );
                }
            }
        );


        // ------------------------------------------
        // Audio track removed
        // ------------------------------------------

        room.on(
            RoomEvent.TrackUnsubscribed,
            (track) => {

                track.detach();

                log(
                    "Remote track removed."
                );
            }
        );


        // ------------------------------------------
        // Connect to LiveKit
        // ------------------------------------------

        await room.connect(
            data.serverUrl,
            data.participantToken
        );


        log(
            `Joined room: ${room.name}`
        );


    } catch (error) {

        console.error(error);

        log(
            `ERROR: ${error.message}`
        );

        setStatus(
            "Connection failed"
        );

        connectButton.disabled =
            false;
    }
}


// --------------------------------------------------
// Disconnect
// --------------------------------------------------

async function disconnect() {

    if (!room) {
        return;
    }


    log(
        "Disconnecting..."
    );


    await room.disconnect();

    room = null;
}


// --------------------------------------------------
// Microphone
// --------------------------------------------------

async function toggleMicrophone() {

    if (!room) {
        return;
    }


    try {

        microphoneEnabled =
            !microphoneEnabled;


        await room.localParticipant
            .setMicrophoneEnabled(
                microphoneEnabled
            );


        if (microphoneEnabled) {

            micButton.textContent =
                "Microphone ON";

            log(
                "Microphone enabled."
            );

        } else {

            micButton.textContent =
                "Microphone OFF";

            log(
                "Microphone disabled."
            );
        }


    } catch (error) {

        console.error(error);

        log(
            `Microphone error: ${error.message}`
        );

        microphoneEnabled =
            false;

        micButton.textContent =
            "Microphone OFF";
    }
}


// --------------------------------------------------
// Text input
// --------------------------------------------------

async function sendTextMessage() {

    if (!room) {

        log(
            "Connect to Max first."
        );

        return;
    }


    const text =
        textInput.value.trim();


    if (!text) {
        return;
    }


    try {

        log(
            `You: ${text}`
        );


        await room.localParticipant.sendText(
            text,
            {
                topic: "lk.chat",
            }
        );


        textInput.value =
            "";


    } catch (error) {

        console.error(error);

        log(
            `Text input error: ${error.message}`
        );
    }
}


// --------------------------------------------------
// Send text with Enter
// --------------------------------------------------

function handleTextKeyDown(event) {

    if (
        event.key === "Enter" &&
        !event.shiftKey
    ) {

        event.preventDefault();

        sendTextMessage();
    }
}


// --------------------------------------------------
// Event listeners
// --------------------------------------------------

connectButton.addEventListener(
    "click",
    connect
);


disconnectButton.addEventListener(
    "click",
    disconnect
);


micButton.addEventListener(
    "click",
    toggleMicrophone
);


sendTextButton.addEventListener(
    "click",
    sendTextMessage
);


textInput.addEventListener(
    "keydown",
    handleTextKeyDown
);


// --------------------------------------------------
// Initial UI state
// --------------------------------------------------

disconnectButton.disabled =
    true;

micButton.disabled =
    true;

textInput.disabled =
    true;

sendTextButton.disabled =
    true;

