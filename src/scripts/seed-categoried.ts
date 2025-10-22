import { db } from "@/db";
import { categories } from "@/db/schema";
import {} from "drizzle-orm";
const categoryNames = [
  "Cars and vehicles",
  "Comedy",
  "Education",
  "Gaming",
  "Entertainment",
  "Film and animation",
  "How-to and style",
  "Music",
  "News and politics",
  "People and blogs",
  "Pets and animals",
  "Science and technology",
  "Sports",
  "Travel and events",
];

async function main() {
  try {
    const values = categoryNames.map((name) => ({
      name,
      description: `Videos related to ${name.toLowerCase()}`,
    }));
    await db.insert(categories).values(values);
    console.log("categories seeding successfully");
  } catch (err) {
    console.error("Error seeding categories:", err);
    process.exit(1);
  }
}

main();
