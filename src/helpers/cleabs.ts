import { wfsSchemaStore } from "../wfs/catalog.js";
import { wfsClient } from '../wfs/execution.js';
import type { WfsFeatureCollectionResponse } from '../wfs/types.js';
import { buildMainRequest } from '../wfs/request.js'
import type { GpfWfsGetFeaturesInput } from "../wfs/schema.js";
import { compileQueryParts } from "../wfs/queryPreparation.js"

/**
 * Compute the FeatureRef corresponding to a cleabs, given a description of the object it corresponds to
 * 
 * In practice:
 * 1. Retrieve the WFS feature types corresponding to the description.
 * 2. For each type, query WFS with a `cleabs = cleabs` CQL filter to check if there is a match with that type.
 * 
 * This approach could probably be optimized.
 *
 * @param {string | undefined} cleabs The absolute key.
 * @param {string} description keywords corresponding to the objected designated by the cleabs.
 * @param {number?} searchdepth number of feature types to try. Default: 5
 * @returns The FeatureRef of the object if found, undefined otherwise
 */
export default async function feature_ref_from_cleabs(cleabs: string | undefined, description: string, searchdepth=5) {
  if (cleabs === undefined) {
    return undefined
  }
  try {
    const search = await wfsSchemaStore.searchFeatureTypesWithScores(description, searchdepth);
    for (const result of search) {

      const { collection } = result
      if (collection.id === undefined) {
        continue
      }
      const typename : string = collection.id;

      const featureType = await wfsClient.getFeatureType(typename);
      const input : GpfWfsGetFeaturesInput = {
        typename: typename,
        limit: searchdepth,
        result_type: "results",
        select: ["cleabs"],
        where: [
          {
            property: "cleabs",
            operator: "eq",
            value: cleabs
          }
        ]
      }
      const compiled = compileQueryParts(input, featureType, undefined);
      const request = buildMainRequest(input, compiled);
      const featureCollection : WfsFeatureCollectionResponse = await wfsClient.fetchFeatureCollection(request);

      if ( featureCollection?.features?.length != 1 || featureCollection?.features[0].id === undefined ) {
        continue
      }

      return {
        typename: typename,
        feature_id: featureCollection.features[0].id,
      }

    }
  } catch {}
  return undefined
}
