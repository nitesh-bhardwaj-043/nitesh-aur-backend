// require('dotenv').config({path:'./env'})
import dotenv from "dotenv"
import connectDB from "./db/index.js"

dotenv.config({
    path:'./env'
})

connectDB()








/*

- Normal approach where we link database in the same file

import express from "express"
const app=express()

;(async()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error",(error)=>{
            console.log("ERROR : ",error);
            throw error
        })

        app.listen(process.env.PORT,()=>{
            console.log(`server is listening on port ${process.env.PORT}`);
        })
    } catch (error) {
        console.log("ERROR : ",error);
        throw error
    }
})()
*/