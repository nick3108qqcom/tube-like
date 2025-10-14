import { SearchIcon } from "lucide-react";

export default function SearchInput() {
  // TODO: add search functionality
  return (
    <form className="max-w-[600px] w-full flex">
      <div className="w-full relative">
        <input
          className="w-full rounded-l-full border focus:outline-none p-4 py-2.5 focus:border-blue-500"
          type="text"
          placeholder="Search"
        />
        {/* TODO: add remove search button */}
      </div>
      <button
        type="submit"
        className="rounded-r-full bg-gray-100 px-5 py-2.5 hover:bg-gray-200 border border-l-0 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <SearchIcon className="size-5" />
      </button>
    </form>
  );
}
