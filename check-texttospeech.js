// Run using "node --env-file=.env check-testtospeech.js"
const { spawn } = require("node:child_process");
const sdk = require("microsoft-cognitiveservices-speech-sdk");

async function synthesizeText(text) {
    const fileName = `shows/speech-audiotest.wav`;
    const speechConfig = sdk.SpeechConfig.fromSubscription(
        process.env.AZURE_SPEECH_KEY1,
        process.env.AZURE_SPEECH_REGION
    );
    const audioConfig = sdk.AudioConfig.fromAudioFileOutput(fileName);

    speechConfig.speechSynthesisVoiceName = "en-US-JaneNeural";

    // Create the speech synthesizer.
    var synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

    await synthesizer.speakTextAsync(
        text,
        function (result) {
            if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
                console.log(`Audio content written to file: ${fileName}`);
            } else {
                console.error(
                    "Speech synthesis canceled, " +
                        result.errorDetails +
                        "\nDid you set the speech resource key and region values?"
                );
            }
            synthesizer.close();
            synthesizer = null;
        },
        function (err) {
            console.trace("err - " + err);
            synthesizer.close();
            synthesizer = null;
        }
    );
}

async function playSound(soundPath) {
    try {
        // Spawn the cmdmp3.exe process
        const child = spawn("cmdmp3.exe", [soundPath]);

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

        console.log("Sound playback finished!");
    } catch (error) {
        console.error("Error playing Sound:", error);
    }
}

// Example usage:
synthesizeText(
    "This is an example of text-to-speech with Azure AI Speech Service."
);
