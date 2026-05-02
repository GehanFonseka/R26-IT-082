function backendTest1(message) {
    if (!message) {
        console.log("No message provided");
        return;
    }

    const time = new Date().toLocaleTimeString();
    console.log(`[${time}] Backend Test: ${message}`);
}

// calling function with value
backendTest1("Backend test file 1 - updated");