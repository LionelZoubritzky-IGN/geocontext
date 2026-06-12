import { fetchJSONGet } from "../helpers/http.js";
import logger from "../logger.js";
import type { JsonFetcher } from "../helpers/http.js";
import { RateLimiter } from "../helpers/RateLimiter.js";
import { getEnv } from "../config/env.js";

export const ADRESSE_SOURCE = "Géoplateforme (service de géocodage)";

type RawAdresseFeature = {
  properties: {
    name: string;
    city: string;
    postcode: string;
    context: string;
    distance: number;
  };
  geometry: {
    type: string;
    coordinates: number[];
  };
}

export type AdresseResult = {
  name: string;
  city: string;
  zipcode: string;
  context: string;
  distance: number;
  centroid?: {
    lon: number,
    lat: number
  };
};

type RawAdresseResponse = {
  features?: RawAdresseFeature[];
};

export class AdresseClient {
  constructor(
    private rateLimiter: RateLimiter,
    private fetcher: JsonFetcher<RawAdresseResponse> = fetchJSONGet,
  ) {}

  /**
   * Get the nearest addresses for given coordinates
   *
   * @see https://geoservices.ign.fr/documentation/services/services-geoplateforme/geocodage
   */
  async adresse(lon: number, lat: number, maximumResponses = 3): Promise<AdresseResult[]> {
    await this.rateLimiter.limit();
    logger.debug(`[gpf:adresse] adresse(${lon}, ${lat}, ${maximumResponses})...`);

    const url = 'https://data.geopf.fr/geocodage/reverse/?' + new URLSearchParams({
      lon: String(lon),
      lat: String(lat),
      index: "address", // we could also include "parcel" but it is redundant with the cadastre tool
      limit: String(maximumResponses),
    }).toString();

    const json: RawAdresseResponse = await this.fetcher(url);
    const results = Array.isArray(json?.features) ? json.features : [];
    return results.map((item) => ({
      name: item.properties.name,
      city: item.properties.city,
      zipcode: item.properties.postcode,
      context: item.properties.context,
      distance: item.properties.distance,
      centroid: item.geometry.type == "Point" ? {
        lon: item.geometry.coordinates[0],
        lat: item.geometry.coordinates[1]
      } : undefined,
    }));
  }
}

export const adresseClient = new AdresseClient(
  new RateLimiter({ name: "GPF_ADRESSE", maxCalls: getEnv().GPF_GEOCODE_RATE_LIMIT, period: 1 }),
);
