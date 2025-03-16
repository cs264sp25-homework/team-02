import { defineSchema } from "convex/server";
import { profileTables } from "./profiles";

const schema = defineSchema({
  ...profileTables,
});

export default schema;
