import { MongoClient, Db } from "mongodb";
import configs from "./config";
let db :Db;

const connect = async () : Promise<Db> => {
const client = new MongoClient(configs.MONGODB_URL,{
    ignoreUndefined:true
})
console.log("✅ : database connected")
return client.db(configs.DB_NAME)
}

export default  async () : Promise<Db> => {
    if(!db){
        db  = await connect()
        return db;
    }
    return db;
}