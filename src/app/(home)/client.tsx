"use client";
import { trpc } from "@/trpc/client";

export default function client() {
  const [data] = trpc.hello.useSuspenseQuery({
    text: "from TRPC",
  });
  return <div>client: {data.greeting}</div>;
}
