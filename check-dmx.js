const dmx = require("enttec-open-dmx-usb");
const dmxDevice = dmx.EnttecOpenDMXUSBDevice;
const fs = require('fs').promises;

let device;

// Initialize DMX devices
(async () => {
    device = new dmxDevice(await dmxDevice.getFirstAvailableDevice());

    const rawJSON = await fs.readFile('dmx-test-sequence.json', 'utf8');
    const testSequence = JSON.parse(rawJSON);

    for (let i = 0; i < testSequence.cues.length; i++) {
        const cueObj = testSequence.cues[i];
        switch (cueObj.type) {
            case "lights":
                device.setChannels(cueObj.channelValues);
                break;
            case "wait":
                await new Promise(resolve => setTimeout(resolve, testSequence.standardDurationMilliSeconds));
                break;
            default:
                console.error(`Unknown cue type: ${cueObj.type}`);
                break;
        }
    }
})();
