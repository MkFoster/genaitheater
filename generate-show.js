/**
 * GenAI Theater - Generate Show Script
 *
 * Run using "node --env-file=.env generate-show.js"
 */
const OpenAI = require("openai");
const fsp = require("fs").promises;
const fs = require("fs");
const { pipeline } = require("node:stream/promises");
const sdk = require("microsoft-cognitiveservices-speech-sdk");

const readline = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout,
});

const openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY,
});

async function generateScript(showTheme) {
    const modelName = "gpt-4-turbo";

    // Get the prompt text from a file
    const promptFile = "prompts/generate-show-prompt.txt";
    console.log(`Loading prompt from ${promptFile}`);
    let systemContent = await fsp.readFile(promptFile, "utf-8");

    let userContent;
    // Add show theme to the prompt if provided
    if (showTheme) {
        userContent = `showTheme: ${showTheme}`;
    } else {
        userContent = "Theme: Software developers";
    }

    console.log("Calling ", modelName);
    const completion = await openai.chat.completions.create({
        messages: [
            {
                role: "system",
                content: systemContent,
            },
            {
                role: "user",
                content: userContent,
            },
        ],
        model: modelName,
        response_format: { type: "json_object" },
        max_tokens: 4096,
    });

    const responseJSON = completion.choices[0].message.content;
    // Save the JSON response to a file for future reference
    try {
        const showScriptFile = "shows/script.json";
        console.log(`Writing show script to ${showScriptFile}`);
        await fsp.writeFile(showScriptFile, responseJSON);
        console.log(`Script saved to ${showScriptFile}`);
    } catch (error) {
        console.error("Error saving script:", error);
    }

    const showObj = JSON.parse(responseJSON);
    return showObj;
}

async function generateScriptAudio(character, line, audioFile) {
    const fileName = `shows/${audioFile}`;
    const speechConfig = sdk.SpeechConfig.fromSubscription(
        process.env.AZURE_SPEECH_KEY1,
        process.env.AZURE_SPEECH_REGION
    );
    const audioConfig = sdk.AudioConfig.fromAudioFileOutput(fileName);

    if (character === "character1") {
        speechConfig.speechSynthesisVoiceName = "en-US-JaneNeural";
    } else {
        speechConfig.speechSynthesisVoiceName = "en-US-JasonNeural";
    }

    // Create the speech synthesizer.
    let synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

    // Use a Promise to handle the asynchronous operation
    await new Promise((resolve, reject) => {
        synthesizer.speakTextAsync(
            line,
            (result) => {
                if (
                    result.reason ===
                    sdk.ResultReason.SynthesizingAudioCompleted
                ) {
                    console.log(`Audio content written to file: ${fileName}`);
                    resolve(result);
                } else {
                    console.error(
                        "Speech synthesis canceled, " +
                            result.errorDetails +
                            "\nDid you set the speech resource key and region values?"
                    );
                    reject(new Error("Speech synthesis failed."));
                }
            },
            (err) => {
                console.trace("err - " + err);
                reject(err);
            }
        );
    });

    synthesizer.close();
    synthesizer = null;
}

async function generateAndDownloadImage(prompt, outputPath) {
    try {
        const image = await openai.images.generate({
            model: "dall-e-3",
            size: "1792x1024",
            prompt: prompt,
        });
        const imageURL = image.data[0].url;

        // Download the image from the imageURL and save it to a file
        const response = await fetch(imageURL);
        if (!response.ok) {
            throw new Error(
                `Failed to fetch the image: ${response.statusText}`
            );
        }
        await pipeline(response.body, fs.createWriteStream(outputPath));
        console.log(`Image has been saved to ${outputPath}`);
    } catch (error) {
        console.error("Failed to generate or download the image:", error);
    }
}

// Loop over the show cues and generate voice audio, images, etc.
async function generateShowAssets(scriptObj) {
    for (let i = 0; i < scriptObj.cues.length; i++) {
        const cueObj = scriptObj.cues[i];
        switch (cueObj.type) {
            case "script":
                await generateScriptAudio(
                    cueObj.character,
                    cueObj.line,
                    cueObj.audioFile
                );
                break;
            case "background":
                await generateAndDownloadImage(
                    cueObj.imagePrompt,
                    `shows/${cueObj.bgImageFile}`
                );
                break;
        }
    }
}

(async () => {
    // Prompt the user for a show theme
    readline.question("Enter a show theme (optional): ", async (showTheme) => {
        try {
            // Generate our script including lighting cues
            const script = await generateScript(showTheme);

            // Generate show assets including audio files, images, etc.
            await generateShowAssets(script);
        } catch (error) {
            console.error(error);
        }

        readline.close();
    });
})();
