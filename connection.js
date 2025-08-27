// Do not change this file
import dotenv from 'dotenv';
dotenv.config();
import pkg from "mongodb";
const { MongoClient } = pkg;

async function main(callback) {
    const URI = process.env.MONGO_URI; // Declare MONGO_URI in your .env file
    console.log("[DB] URI:", URI);
    const client = new MongoClient(URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    try {
        console.log("[DB] Attempting to connect to MongoDB...");
        // Connect to the MongoDB cluster
        await client.connect();
        console.log("[DB] Connected to MongoDB successfully.");

        // Make the appropriate DB calls
        await callback(client);
    } catch (e) {
        // Catch any errors
        console.error("[DB] Connection error:", e);
        throw new Error("Unable to Connect to Database");
    }
}

export default main;
