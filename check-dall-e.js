// Run using "node --env-file=.env check-dall-e.js"
const OpenAI = require("openai");
const fs = require("fs");
const { pipeline } = require("node:stream/promises");

async function generateAndDownloadImage(prompt, outputPath) {
    try {
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_KEY,
        });

        const image = await openai.images.generate({
            model: "dall-e-3",
            size: "1792x1024",
            prompt: prompt,
        });

        const revisedPrompt = image.data[0].revised_prompt;
        const imageURL = image.data[0].url;

        // Download the image from the imageURL and save it to a file
        const response = await fetch(imageURL);
        if (!response.ok) {
            throw new Error(
                `Failed to fetch the image: ${response.statusText}`
            );
        }
        await pipeline(response.body, fs.createWriteStream(outputPath));
        console.log("Download completed successfully");

        console.log(`Image has been saved to ${outputPath}`);
    } catch (error) {
        console.error("Failed to generate or download the image:", error);
    }
}

// Example usage:
generateAndDownloadImage(
    "A futuristic city skyline at night.",
    "shows/test-image.png"
);
