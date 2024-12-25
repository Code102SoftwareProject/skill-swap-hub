import mongoose from "mongoose";
import exp from "node:constants";

const  MONGODB_URI=process.env.MONGODB_URI

const connect = async ()=>{
    const connectionState=mongoose.connection.readyState;
    if(connectionState===1){
        console.log("DB already connected");
        return;
    }
    if (connectionState===2){
        console.log("DB connecting");
        return;
    }

    try {
        mongoose.connect(MONGODB_URI,{
             dbName: "skilswaphub",
              bufferCommands: true
        });
        console.log("DB connected");
    }catch (error: any ){
        console.error("Error connecting to the database:", error);
        throw new Error(`Database connection failed: ${error.message}`);
    }
}

export  default connect;