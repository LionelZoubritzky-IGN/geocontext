/**
 * MCP tool exposing reverse geocoding for points of interest.
 */

import BaseTool from "./BaseTool.js";
import { z } from "zod";

import { pointsdinteretClient, POINTSDINTERET_SOURCE } from "../gpf/pointsdinteret.js";
import { READ_ONLY_OPEN_WORLD_TOOL_ANNOTATIONS } from "../helpers/toolAnnotations.js";
import { featureRefSchema, lonSchema, latSchema } from "../helpers/schemas.js";
import logger from "../logger.js";

// --- Schema ---

const pointsdinteretInputSchema = z.object({
  lon: lonSchema,
  lat: latSchema,
  maximumResponses: z
    .number()
    .int()
    .min(1)
    .max(50)
    .optional()
    .describe("Le nombre maximum de résultats à retourner (entre 1 et 50). Défaut : 3."),
}).strict();

// --- Types ---

type PointsDInteretInput = z.infer<typeof pointsdinteretInputSchema>;

const pointsdinteretResultSchema = z
  .object({
    name: z.string().describe("Le nom du point d'intérêt trouvé"),
    categories: z.array(z.string()).describe("Ses catégories"),
    city: z.string().optional().describe("Sa ville"),
    zipcode: z.string().optional().describe("Son code postal"),
    distance: z.number().describe("La distance en mètres entre le point demandé et le point d'intérêt retenu"),
    centroid: z.object({
      lon: lonSchema,
      lat: latSchema
    }).optional().describe("Les coordonnées du centre du point d'intérêt"),
    feature_ref: featureRefSchema.optional().describe("Référence WFS réutilisable, notamment avec `gpf_wfs_get_features_by_id` et dans le `intersects_feature_filter` de `gpf_wfs_get_features`."),
})
.catchall(z.unknown());

const pointsdinteretOutputSchema = z.object({
  results: z.array(pointsdinteretResultSchema).describe("La liste des points d'intérêt à proximité, ordonnée par distance."),
});

// --- Tool ---

class PointsDInteretTool extends BaseTool<PointsDInteretInput> {
  name = "pointsdinteret";
  title = "Points d'intérêt obtenus par géocodage inverse";
  annotations = READ_ONLY_OPEN_WORLD_TOOL_ANNOTATIONS;
  description = [
    "Renvoie les points d'intérêt les plus proches des coordonnées en entrée.",
    "Le champ `name` contient le nom du point d'intérêt et le champ `categories` liste ses classifications.",
    "Chaque résultat peut aussi inclure les coordonnées du point d'intérêt (`centroid`), sa distance aux coordonnées de départ (`distance`), des informations de localisation (`city`, `zipcode`) et un `feature_ref` utilisable dans `gpf_wfs_get_features_by_id` pour plus d'information.",
    "Les réultats sont classés par distance, puis par importance : utilise des coordonnées précises et monte la valeur de `maximumResponses` si l'information ne semble pas assez pertinente.",
    `(source : ${POINTSDINTERET_SOURCE}).`
  ].join("\n");
  protected outputSchemaShape = pointsdinteretOutputSchema;

  schema = pointsdinteretInputSchema;

  /**
   * Returns the points of interest relevant to the requested point.
   *
   * @param input Normalized tool input.
   * @returns The relevant points of interest.
   */
  async execute(input: PointsDInteretInput) {
    logger.info(`[tool] execute ${this.name} ...`, {
      input: input
    });
  
    return {
      results: await pointsdinteretClient.pointsdinteret(input.lon, input.lat, input.maximumResponses),
    };
  }
}

export default PointsDInteretTool;
