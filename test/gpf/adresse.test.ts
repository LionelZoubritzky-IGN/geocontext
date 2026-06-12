import { describe, expect, it } from "vitest";
import { AdresseClient } from "../../src/gpf/adresse.js";
import { RateLimiter } from "../../src/helpers/RateLimiter.js";

const rawAdresseServiceResponse = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          6.171141,
          49.116845
        ]
      },
      "properties": {
        "type": "housenumber",
        "name": "3 Rue Haute Pierre",
        "label": "3 Rue Haute Pierre 57000 Metz",
        "street": "Rue Haute Pierre",
        "postcode": "57000",
        "citycode": "57463",
        "city": "Metz",
        "oldcitycode": null,
        "oldcity": null,
        "context": "57, Moselle, Grand Est",
        "importance": 0.64075,
        "housenumber": "3",
        "id": "57463_3300_00003",
        "banId": null,
        "x": 931453.96,
        "y": 6895429.96,
        "distance": 31,
        "score": 0.9969,
        "_type": "address"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          6.171382,
          49.117035
        ]
      },
      "properties": {
        "type": "street",
        "name": "Rue Haute Pierre",
        "postcode": "57000",
        "citycode": "57463",
        "city": "Metz",
        "oldcitycode": null,
        "oldcity": null,
        "context": "57, Moselle, Grand Est",
        "importance": 0.64075,
        "id": "57463_3300",
        "banId": null,
        "x": 931470.7,
        "y": 6895451.78,
        "label": "Rue Haute Pierre 57000 Metz",
        "distance": 43,
        "score": 0.9957,
        "_type": "address"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          6.171431,
          49.116946
        ]
      },
      "properties": {
        "type": "housenumber",
        "name": "12 Rue Haute Pierre",
        "label": "12 Rue Haute Pierre 57000 Metz",
        "street": "Rue Haute Pierre",
        "postcode": "57000",
        "citycode": "57463",
        "city": "Metz",
        "oldcitycode": null,
        "oldcity": null,
        "context": "57, Moselle, Grand Est",
        "importance": 0.64075,
        "housenumber": "12",
        "id": "57463_3300_00012",
        "banId": null,
        "x": 931474.67,
        "y": 6895442.04,
        "distance": 47,
        "score": 0.9953,
        "_type": "address"
      }
    }
  ]
};

describe("Test AdresseClient.adresse",() => {
  it("should identify '3 Rue Haute Pierre'", async () => {
    const rateLimiter = new RateLimiter({ name: "test", maxCalls: 100, period: 1 });
    const client = new AdresseClient(rateLimiter, async () => ({
      features: [rawAdresseServiceResponse.features[0], rawAdresseServiceResponse.features[1]],
    }));
    const results = await client.adresse(49.117011, 6.170795, 2);
    expect(results.length).toBeGreaterThan(0);
    const firstItem = results[0];

    expect(firstItem.name).toEqual("3 Rue Haute Pierre");
    expect(firstItem.centroid?.lon).toBeCloseTo(6.171141);
    expect(firstItem.centroid?.lat).toBeCloseTo(49.116845);
    expect(firstItem.city).toEqual('Metz');
    expect(firstItem.zipcode).toEqual('57000');
    expect(firstItem.context).toEqual("57, Moselle, Grand Est");
    expect(firstItem.distance).toBeCloseTo(31)

  });

  it("should honor maximumResponses", async () => {
    const rateLimiter = new RateLimiter({ name: "test", maxCalls: 100, period: 1 });
    const client = new AdresseClient(rateLimiter, async () => ({
      features: [rawAdresseServiceResponse.features[2]],
    }));
    const results = await client.adresse(49.116946, 6.171431, 1);

    expect(results).toHaveLength(1);
  });

  it("should return an empty array for unknown points", async () => {
    const rateLimiter = new RateLimiter({ name: "test", maxCalls: 100, period: 1 });
    const client = new AdresseClient(rateLimiter, async () => ({ features: [] }));
    const results = await client.adresse(48.774262, 6.502882);

    expect(results).toEqual([]);
  });

});
