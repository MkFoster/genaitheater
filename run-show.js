const { Board, Servo } = require("johnny-five");
const dmx = require("enttec-open-dmx-usb");
const dmxDevice = dmx.EnttecOpenDMXUSBDevice;
const fs = require("fs").promises;
const { spawn } = require("node:child_process");
const path = require("path");

const boardComPort = "COM6";

// Run the show
(async () => {
    let dmx;
    let board;
    let ch1Servo;
    let ch2Servo;

    let lightingEnabled = true;
    try {
        dmx = new dmxDevice(await dmxDevice.getFirstAvailableDevice());
    } catch (error) {
        console.log(
            "No DMX interface found.  Proceeding without lighting.  Error: ",
            error
        );
        lightingEnabled = false;
    }

    let boardEnabled = true;
    try {
        board = await getBoard(boardComPort);
        ch1Servo = new Servo({
            pin: 10,
            range: [10, 170],
            startAt: 90,
        });

        ch2Servo = new Servo({
            pin: 11,
            range: [10, 170],
            startAt: 90,
        });
    } catch (error) {
        console.log(
            "No Board found.  Proceeding without animations.  Error: ",
            error
        );
        boardEnabled = false;
    }

    const showFolder = "shows" + path.sep;
    const soundFolder = "sound-effects" + path.sep;
    const rawJSON = await fs.readFile(showFolder + "script.json", "utf8");
    const show = JSON.parse(rawJSON);

    for (let i = 0; i < show.cues.length; i++) {
        const cueObj = show.cues[i];
        switch (cueObj.type) {
            case "lights":
                if (lightingEnabled) {
                    dmx.setChannels(cueObj.chVals);
                }
                break;
            case "wait":
                await sleep(cueObj.duration);
                break;
            case "script":
                await playSound(showFolder + cueObj.file);
                break;
            case "sound":
                await playSound(soundFolder + cueObj.file);
                break;
            case "bg":
                await displayImage(
                    __dirname + path.sep + showFolder + cueObj.file
                );
                break;
            case "animate":
                if (boardEnabled) {
                    let servo;
                    if (cueObj.char == "ch1") {
                        servo = ch1Servo;
                    } else if (cueObj.char == "ch2") {
                        servo = ch2Servo;
                    } else {
                        console.log("Unknown char(character) animation.");
                    }
                    switch (cueObj.motion) {
                        case "faceForward":
                            servo.center();
                            break;
                        case "faceFullRight":
                            servo.min();
                            break;
                        case "faceFullLeft":
                            servo.max();
                            break;
                        case "facePartRight":
                            servo.to(50);
                            break;
                        case "facePartLeft":
                            servo.to(130);
                            break;
                        default:
                            console.log("Unknown motion.");
                    }
                }
                break;
            default:
                console.error(`Unknown cue type: ${cueObj.type}`);
                break;
        }
    }
    process.exit();
})();

async function sleep(durationMilliseconds) {
    await new Promise((resolve) => setTimeout(resolve, durationMilliseconds));
}

async function getBoard(arduinoComPort) {
    return new Promise((resolve, reject) => {
        const board = new Board({ port: arduinoComPort });
        board.on("ready", function () {
            // Board is ready, resolve the promise with the board object
            resolve(board);
        });
        board.on("error", function (error) {
            // Board error, reject the promise with the error
            reject(error);
        });
    });
}

async function playSound(soundPath) {
    try {
        // Spawn the cmdmp3.exe process
        const child = spawn("cmdmp3.exe", [soundPath]);

        console.log("Playing :", soundPath);
        // Wait for the process to exit
        await new Promise((resolve, reject) => {
            child.on("error", reject);
            child.on("exit", (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`cmdmp3.exe exited with code ${code}`));
                }
            });
        });
    } catch (error) {
        console.error("Error playing WAV:", error);
    }
}

async function displayImage(imagePath) {
    try {
        // Spawn the Irfanview process
        const child = spawn(
            "C:\\Program Files\\IrfanView\\i_view64.exe",
            [imagePath, "/fs"],
            {
                detached: true,
                stdio: "ignore",
            }
        );
        child.unref();
        console.log("Displaying :", imagePath);
    } catch (error) {
        console.error("Error displaying image:", error);
    }
}
