"use client";

import { Suspense, useState } from "react";
import { SearchIcon, XIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { APP_URL } from "@/constants";
import { Button } from "@/components/ui/button";

export const SearchInput = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchInputSuspense />
    </Suspense>
  );
};

export function SearchInputSuspense() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("query") || "";
  const categoryId = searchParams.get("categoryId") || "";
  const [value, setValue] = useState(query);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const url = new URL("/search", APP_URL);
    const newQuery = value.trim();

    url.searchParams.set("query", encodeURIComponent(newQuery));

    if (categoryId) {
      url.searchParams.set("categoryId", categoryId);
    }
    if (newQuery === "") {
      url.searchParams.delete("query");
    }

    setValue(newQuery);
    router.push(url.toString());

    router.push(url.pathname + url.search);
  };

  return (
    <form className="max-w-[600px] w-full flex" onSubmit={handleSearch}>
      <div className="w-full relative">
        <input
          className="w-full rounded-l-full border focus:outline-none p-4 py-2.5 focus:border-blue-500"
          type="text"
          placeholder="Search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        {value && (
          <Button
            type="button"
            onClick={() => setValue("")}
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full "
          >
            <XIcon className="text-gray-500" />
          </Button>
        )}
      </div>
      <button
        type="submit"
        disabled={!value.trim()}
        className="rounded-r-full bg-gray-100 px-5 py-2.5 hover:bg-gray-200 border border-l-0 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <SearchIcon className="size-5" />
      </button>
    </form>
  );
}
