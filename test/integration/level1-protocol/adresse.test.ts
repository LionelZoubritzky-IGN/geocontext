/**
 * Integration test: geocode tool with real API calls.
 */

import { describe, it, expect } from "vitest";
import { callTool } from "../helpers/mcp-client.js";
import { withMcpServer } from "../helpers/level1-fixtures.js";
import { expectNonEmptyResults, expectToolCallToThrow } from "../helpers/level1-assertions.js";
import { INTEGRATION_CONFIG } from "../config/shared.js";

export type AdresseResult = {
  results: Array<{
    name: string;
    city: string;
    zipcode: string;
    context: string;
    distance: number;
    centroid?: {
      lon: number,
      lat: number
    };
  }>;
};


describe("Adresse (integration)", () => {
  const { getHandle } = withMcpServer();

  it("should find a result for a point in Bel Étang (Guadeloupe)", async () => {
    const result = await callTool<AdresseResult>(getHandle().client, "adresse", {
      lon: -61.369149,
      lat: 16.291592,
      maximumResponses: 1,
    });

    expectNonEmptyResults(result);

    const first = result.results[0];
    expect(first.name).toBeDefined();
    expect(first.context).toBeDefined();
    expect(first.distance).toBeDefined();
  }, INTEGRATION_CONFIG.timeout);

  it("should find the Barrage de Sarrans from approximate coordinates", async () => {
    const result = await callTool<AdresseResult>(getHandle().client, "adresse", {
      lon: 2.740276,
      lat: 44.829120,
      maximumResponses: 5,
    });

    expectNonEmptyResults(result);
    const text = JSON.stringify(result).toLowerCase();
    expect(text).toContain("barrage de sarrans");
    expect(text).toContain("argence");
    expect(text).toContain("aveyron");
    expect(text).toContain("occitanie");
    expect(text).toContain("12420");
  }, INTEGRATION_CONFIG.timeout);
});
