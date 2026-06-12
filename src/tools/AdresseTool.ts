/**
 * MCP tool exposing reverse geocoding.
 */

import BaseTool from "./BaseTool.js";
import { z } from "zod";

import { adresseClient, ADRESSE_SOURCE } from "../gpf/adresse.js";
import { READ_ONLY_OPEN_WORLD_TOOL_ANNOTATIONS } from "../helpers/toolAnnotations.js";
import { lonSchema, latSchema } from "../helpers/schemas.js";
import logger from "../logger.js";

// --- Schema ---

const adresseInputSchema = z.object({
  lon: lonSchema,
  lat: latSchema,
  maximumResponses: z
    .number()
    .int()
    .min(1)
    .max(20)
    .optional()
    .describe("Le nombre maximum de résultats à retourner (entre 1 et 20). Défaut : 3."),
}).strict();

// --- Types ---

type AdresseInput = z.infer<typeof adresseInputSchema>;

const adresseResultSchema = z
  .object({
    name: z.string().describe("Le nom de l'adresse, composée soit d'un numéro et nom de rue, soit seulement du nom de la rue, de la localité ou de la commune"),
    city: z.string().describe("La commune"),
    zipcode: z.string().describe("Le code postal"),
    context: z.string().describe("Le numéro du département, le département et la région"),
    distance: z.number().describe("La distance en mètres entre le point demandé et l'adresse indiquée."),
    centroid: z.object({
      lon: lonSchema,
      lat: latSchema
    }).optional().describe("Les coordonnées du centre de l'adresse.")
})
.catchall(z.unknown());

const adresseOutputSchema = z.object({
  results: z.array(adresseResultSchema).describe("La liste des addresses à proximité, ordonnée par distance."),
});

// --- Tool ---

class AdresseTool extends BaseTool<AdresseInput> {
  name = "adresse";
  title = "Adresses obtenues par géocodage inverse";
  annotations = READ_ONLY_OPEN_WORLD_TOOL_ANNOTATIONS;
  description = [
    "Renvoie les adresses les plus proches des coordonnées en entrée.",
    "Chaque résultat peut aussi inclure les coordonnées de l'adresse (`centroid`) et sa distance aux coordonnées de départ (`distance`).",
    "Les réultats sont classés par distance : utilisez des coordonnées précises et montez la valeur de `maximumResponses` si l'information ne semble pas assez pertinente.",
    `(source : ${ADRESSE_SOURCE}).`
  ].join("\n");
  protected outputSchemaShape = adresseOutputSchema;

  schema = adresseInputSchema;

  /**
   * Returns the adresses closest to the requested point.
   *
   * @param input Normalized tool input.
   * @returns The relevant adresses.
   */
  async execute(input: AdresseInput) {
    logger.info(`[tool] execute ${this.name} ...`, {
      input: input
    });
  
    return {
      results: await adresseClient.adresse(input.lon, input.lat, input.maximumResponses),
    };
  }
}

export default AdresseTool;
