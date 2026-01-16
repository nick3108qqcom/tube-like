import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

// 初始化 Redis 客户端
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET() {
  try {
    // 执行一个简单的写操作：更新心跳时间戳
    // 设置 EX (过期时间) 为 15 天，防止这个 key 永久占用空间
    await redis.set("last_heartbeat", new Date().toISOString(), {
      ex: 1296000,
    });

    return NextResponse.json({
      success: true,
      message: "Heartbeat sent to Upstash!",
    });
  } catch (error) {
    console.error("Redis heartbeat failed:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
