const sum = (a, b) => {
    if (typeof a !== "number" || typeof b !== "number") {
        console.log("Invalid input. Please provide numbers.");
        return null;
    }

    const result = a + b;
    console.log(`Sum of ${a} and ${b} is: ${result}`);
    return result;
};

sum(5, 10);