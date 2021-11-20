/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

/**
 * async-retrieve.ts
 */
import { authorization, writeFileSyncUtf8 } from 'heat-sfdx-common';
import { postComposite } from '../../../composite/composite';
import { getContainerAsyncRequest } from '../../../objects/container-async-request';
import { getApexClasses } from '../../../objects/apex-class';
import { getApexTriggers } from '../../../objects/apex-trigger';

const LIMIT = {
  RETRIEVE: 50000
};
const FIELDS = {
  CONTAINER_ASYNC_REQUEST: ['Id', 'State', 'MetadataContainerId', 'ErrorMsg']
};

const retrieveRecords = (
  auth: authorization,
  logFile: string,
  responseString: string
) => {
  writeFileSyncUtf8(logFile, responseString);
  if (auth.options.verbose) {
    console.info(logFile);
  }
  return JSON.parse(responseString).records;
};

/**
 * @description asyncRetrieveApexClasses
 * @param {*} auth
 */
export async function asyncRetrieveApexClasses(auth: authorization) {
  auth.options.limit = LIMIT.RETRIEVE;
  const responseString = await getApexClasses(auth);
  const logFile = auth.options.logs.retrieveApex;

  return retrieveRecords(auth, logFile, responseString);
}

/**
 * @description asyncRetrieveApexTriggers
 * @param {*} auth
 */
export async function asyncRetrieveApexTriggers(auth: authorization) {
  auth.options.limit = LIMIT.RETRIEVE;
  const responseString = await getApexTriggers(auth);
  const logFile = auth.options.logs.retrieveApex;

  return retrieveRecords(auth, logFile, responseString);
}

/**
 * @description asyncRetrieveApex
 * @param {*} auth
 */
export async function asyncRetrieveApex(auth: authorization) {
  switch (auth.options.apexType) {
    case 'ApexClass':
      return await asyncRetrieveApexClasses(auth);
    case 'ApexTrigger':
      return await asyncRetrieveApexTriggers(auth);
    default:
      return;
  }
}

/**
 * @description asyncRetrieveContainerAsyncRequest
 * @param {*} auth
 */
export async function asyncRetrieveContainerAsyncRequest(auth: authorization) {
  auth.options.id = auth.options.containerAsyncRequestId;
  auth.options.fields = FIELDS.CONTAINER_ASYNC_REQUEST;

  const responseString = await getContainerAsyncRequest(auth);
  const logFile = auth.options.logs.retrieveContainerAsyncRequests;

  // archive
  writeFileSyncUtf8(logFile, responseString);
  if (auth.options.verbose) {
    console.info(logFile);
  }
  return {
    status: JSON.parse(responseString).records[0].State,
    errorMsg: JSON.parse(responseString).records[0].ErrorMsg
  };
}

/**
 * @description asyncRetrieveApexMembers
 * @param {*} auth
 */
export async function asyncRetrieveApexMembers(auth: authorization) {
  const compositeRequest = auth.options.apexMembers.map((record: any) => {
    return {
      method: 'GET',
      url: record.httpHeaders.Location,
      referenceId: record.referenceId
    };
  });

  auth.options.body = {};
  auth.options.body.compositeRequest = compositeRequest;
  const responseString = await postComposite(auth);

  const compositeResponse = JSON.parse(responseString).compositeResponse;
  const results = await compositeResponse.map((record: any) => {
    return {
      symbolTable: {
        filename: `${auth.options.dir.symbolTable}/${record.body.FullName}.json`,
        contents: JSON.stringify(record.body.SymbolTable)
      }
    };
  });

  return results;
}
