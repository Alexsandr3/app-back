import 'dotenv/config'
import mongoose from "mongoose";


const mongoUri = process.env.MONGO_URI || "mongodb://0.0.0.0:27017";



export async function runDb() {
    try {
        await mongoose.connect(mongoUri, {dbName: 'Mongoose'});
        console.log("Connected successfully to MONGOOSE server");
    } catch {
        console.log("Can't connect to db");
        await mongoose.disconnect()
    }
}