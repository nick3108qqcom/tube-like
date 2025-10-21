import { trpc } from "@/trpc/server";
import PageClient from "./client";
import { HydrateClient } from "@/trpc/server";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

export default async function Home() {
  void trpc.hello.prefetch({
    text: "from TRPC",
  });
  return (
    <HydrateClient>
      <Suspense fallback={<div>Loading...</div>}>
        <ErrorBoundary fallback={<div>Something went wrong.</div>}>
          <PageClient></PageClient>;
        </ErrorBoundary>
      </Suspense>
    </HydrateClient>
  );
}
