// @vitest-environment node
import { expect, it } from "vitest";
import {
  matchesNodeSearch,
  parseConfigSearchQuery,
  resolveConfigMapSearch,
} from "./config-form.search.ts";

type Search = Parameters<typeof matchesNodeSearch>[0];
const string = (description?: string): Search["schema"] => ({ type: "string", description });
const object = (properties: NonNullable<Search["schema"]["properties"]>): Search["schema"] => ({
  type: "object",
  properties,
});
const array = (
  items?: Search["schema"]["items"],
  allOf?: Search["schema"]["allOf"],
): Search["schema"] => ({ type: "array", items, allOf });
function matches(query: string, schema: Search["schema"], options: Partial<Search> = {}) {
  return matchesNodeSearch({
    schema,
    value: {},
    path: [],
    hints: {},
    ...options,
    criteria: parseConfigSearchQuery(query),
  });
}

it.each([
  ["tag:security", true],
  ["mode tag:security", false],
] as const)("matches text and tag criteria: %s", (query, expected) => {
  expect(
    matches(query, object({ auth: object({ token: string() }) }), {
      path: ["gateway"],
      hints: { "gateway.auth.token": { label: "Access Token", tags: ["security", "secret"] } },
    }),
  ).toBe(expected);
});

it.each([
  ["credential source", array(object({ source: string("Credential source") })), true],
  [
    "composed overflow",
    array(
      [string("outer")],
      [
        {
          items: [{}, string("secondary")],
          additionalItems: string("Composed overflow"),
        },
      ],
    ),
    true,
  ],
  [
    "impossible endpoint",
    array(undefined, [
      { items: [string("reachable")], additionalItems: false },
      { items: [{}, string("Impossible endpoint")] },
    ]),
    false,
  ],
] satisfies [string, Search["schema"], boolean][])(
  "searches only reachable empty-array schemas: %s",
  (query, schema, expected) => {
    expect(matches(query, schema, { value: [], path: ["endpoints"] })).toBe(expected);
  },
);

it("searches additional-property schemas before entries exist", () => {
  expect(
    matches(
      "remote service",
      { type: "object", additionalProperties: object({ url: string() }) },
      {
        path: ["servers"],
        hints: { "servers.*.url": { help: "Endpoint used by the remote service" } },
      },
    ),
  ).toBe(true);
});

const entries = { reserved: "hidden", alpha: "visible" };
it.each([
  ["", entries, ["alpha"], true],
  ["alpha", entries, ["alpha"], true],
  ["reserved", entries, [], false],
  ["missing", entries, [], false],
  ["", {}, [], true],
  ["alpha", {}, [], false],
] satisfies [string, Record<string, string>, string[], boolean][])(
  "scopes map visibility to searchable entries: %s",
  (query, value, keys, visible) => {
    const result = resolveConfigMapSearch({
      schema: string(),
      value,
      path: ["settings"],
      hints: {},
      reservedKeys: new Set(["reserved"]),
      searchCriteria: parseConfigSearchQuery(query),
    });
    expect(result.visibleEntries.map(([key]) => key)).toEqual(keys);
    expect(result.visible).toBe(visible);
  },
);
