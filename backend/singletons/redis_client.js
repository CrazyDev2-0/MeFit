// ######################################## ACCESS ENVIRABLE VARIABLES #############################################################
require('dotenv').config();

// Redis
const Redis = require("redis");

// Class
class RedisClient{
    static instance = null;
    static client = Redis.createClient();

    static async getInstance(){
        if(RedisClient.instance == null){
            RedisClient.instance = new RedisClient();
            RedisClient.client = Redis.createClient({
                url : process.env.REDIS_URL
            });
            await RedisClient.client.connect();
        }
        return RedisClient.instance;
    }

    async storeValueToList(key, value){
        await RedisClient.client.sAdd(key.toString(), value.toString());
    }

    async getValueFromList(key){
        var data = await RedisClient.client.sMembers(key.toString());
        await RedisClient.client.del(key.toString());
        return data;
    }

    async getValue(key){
        return await RedisClient.client.get(key.toString());
    }

    async setValue(key, value){
        return await RedisClient.client.set(key.toString(), value.toString());
    }

    async deleteKey(key){
        await RedisClient.client.del(key.toString());
    }

    async exists(key){
        return await RedisClient.client.exists(key.toString());
    }

    async storeTimestamp(key, value){
        await RedisClient.client.zAdd(key.toString(), [{
            "score" : "1",
            "value" : value.toString()
        }]);
    }

    async getAllTimestamps(key){
        const timestamps =  await RedisClient.client.zRange(key.toString(), 0, -1);
        // Delete the old timestamps
        await RedisClient.client.zRem(key.toString(), timestamps);
        return timestamps;
    }
}


module.exports = RedisClient;   