/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * batch.ts
 */
import { authorization, writeFileSyncUtf8 } from 'heat-sfdx-common';
import {
  asyncCreateApexMembers,
  asyncCreateContainerAsyncRequestId
} from './api/async-create';
import {
  asyncRetrieveContainerAsyncRequest,
  asyncRetrieveApexMembers
} from './api/async-retrieve';
import { generateDocs } from './docs';

const COMPLETED = 'Completed';

/**
 * @description sleep
 * @param {*} sec
 */
const sleep = (sec: number) => {
  console.log(`just give me ${sec} more seconds...`);
  return new Promise((resolve) => setTimeout(resolve, sec * 1000, ''));
};

/**
 * @description runBatch
 * @param {*} auth
 */
export async function runBatch(auth: authorization) {
  // create ApexClassMembers / ApexTriggerMembers
  const apexMembers = await asyncCreateApexMembers(auth);

  // create ContainerAsyncRequest
  auth.options.logs.createContainerAsyncRequest =
    auth.options.environment.logs.createContainerAsyncRequest;
  auth.options.id = auth.options.metadataContainerId;

  auth.options.body = {};
  auth.options.body.MetadataContainerId = auth.options.metadataContainerId;
  auth.options.body.IsCheckOnly = true;

  const containerAsyncRequestId =
    await asyncCreateContainerAsyncRequestId(auth);

  // retrieve ContainerAsyncRequest - State
  let containerAsyncRequest;
  while (COMPLETED !== containerAsyncRequest?.status) {
    if (containerAsyncRequest?.errorMsg) {
      console.error('ErrorMsg', containerAsyncRequest?.errorMsg);
    }

    auth.options.containerAsyncRequestId = containerAsyncRequestId;
    auth.options.logs.retrieveContainerAsyncRequests =
      auth.options.environment.logs.retrieveContainerAsyncRequests;

    containerAsyncRequest = await asyncRetrieveContainerAsyncRequest(auth);

    await sleep(3);
  }

  // retrieve ApexClassMembers / ApexTriggerMembers
  auth.options.apexMembers = apexMembers;
  const results = await asyncRetrieveApexMembers(auth);

  // archive .json
  results.forEach((result: any) => {
    writeFileSyncUtf8(result.symbolTable.filename, result.symbolTable.contents);
    if (auth.options.verbose) {
      console.info(result.symbolTable.filename);
    }
  });

  // generate .md from .json
  const apexNames = auth.options.apex.map((a: any) => {
    return a.Name;
  });

  auth.options.apexNames = apexNames;
  await generateDocs(auth);
}
