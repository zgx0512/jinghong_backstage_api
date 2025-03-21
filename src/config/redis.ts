import { createClient } from "redis";

const redisClient = createClient({
  url: process.env.REDIS_URL as string,
});

redisClient.connect().catch(console.error);

redisClient.on("error", (err) => console.error("Redis Client Error:", err));
redisClient.on("connect", () => console.log("Redis Client Connected"));

export default redisClient;
