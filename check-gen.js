const OpenAI = require("openai");
const fsp = require("fs").promises;

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
        const showScriptFile = "shows/test-script.json";
        console.log(`Writing show script to ${showScriptFile}`);
        await fsp.writeFile(showScriptFile, responseJSON);
        console.log(`Script saved to ${showScriptFile}`);
    } catch (error) {
        console.error("Error saving script:", error);
    }

    const showObj = JSON.parse(responseJSON);
    return showObj;
}

(async () => {
    // Prompt the user for a show theme
    readline.question("Enter a show theme (optional): ", async (showTheme) => {
        try {
            // Generate our script including lighting cues
            const script = await generateScript(showTheme);
        } catch (error) {
            console.error(error);
        }

        readline.close();
    });
})();
