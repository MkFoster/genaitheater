const { Board, Servo, Led } = require("johnny-five");
const arduinoComPort = "COM6";
let board;

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

(async () => {
    let boardEnabled = true;
    try {
        board = await getBoard(arduinoComPort);
    } catch (error) {
        console.log(
            "No Board found.  Proceeding without animations.  Error: ",
            error
        );
        boardEnabled = false;
    }

    if (boardEnabled) {
        // Create an Led on pin 13
        const led = new Led(13);

        // Strobe the pin on/off, defaults to 100ms phases
        led.strobe();

        const character1Servo = new Servo({
            pin: 10,
            range: [10, 170],
            startAt: 90,
        });

        const character2Servo = new Servo({
            pin: 11,
            range: [10, 170],
            startAt: 90,
        });

        await sleep(1000);
        character1Servo.min();
        await sleep(1000);
        character1Servo.max();
        await sleep(1000);
        character1Servo.center();

        await sleep(1000);
        character2Servo.min();
        await sleep(1000);
        character2Servo.max();
        await sleep(1000);
        character2Servo.center();
        await sleep(1000);
    }
    console.log("Test complete");
    process.exit();
})();
