/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * generate.ts
 */
import { authorization } from 'heat-sfdx-common';
import { asyncCreateMetadataContainerId } from './api/async-create';
import { asyncRetrieveApex } from './api/async-retrieve';
import { runBatch } from './batch';

// The request in POST /tooling/composite can’t contain more than 25 operations.
const COMPOSITE_OPERATIONS_LIMIT = 25;
const MANAGED = ['beta', 'deleted', 'deprecated', 'released', 'installed'];

/**
 * @description generateApexSpecs
 * @param auth
 */
export async function generateApexSpecs(auth: authorization) {
  // create MetadataContainerId
  auth.options.logs.createMetadataContainer =
    auth.options.environment.logs.createMetadataContainer;
  auth.options.metadataContainerId = await asyncCreateMetadataContainerId(auth);

  // retrieve ApexClasses / ApexTriggers
  const apexRecords = await asyncRetrieveApex(auth);

  // run the batch operation because the request can’t contain more than 25 operations.
  const apexRecordsNotManaged = apexRecords?.filter((r: any) => {
    return !MANAGED.includes(r.ManageableState);
  });
  const size = apexRecordsNotManaged?.length;
  const scope = COMPOSITE_OPERATIONS_LIMIT;
  let start = 0;
  while (start < Math.ceil(size / scope)) {
    auth.options.apex = apexRecordsNotManaged.slice(start, start + scope - 1);

    /**
     * 1. create ApexClassMembers / ApexTriggerMembers
     * 2. create ContainerAsyncRequest
     * 3. retrieve ContainerAsyncRequest - State
     * 4. retrieve ApexClassMembers / ApexTriggerMembers
     * 5. archive .json
     */
    await runBatch(auth);
    start += scope;
  }

  return;
}
