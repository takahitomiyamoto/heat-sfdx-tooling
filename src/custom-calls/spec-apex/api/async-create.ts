// TODO:
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * async-create.ts
 */
import { v4 as uuidv4 } from 'uuid';
import { authorization, writeFileSyncUtf8 } from 'heat-sfdx-common';
import { postMetadataContainer } from '../../../objects/metadata-container';
import { postComposite } from '../../../composite/composite';
import { postContainerAsyncRequest } from '../../../objects/container-async-request';

/**
 * @description asyncCreateMetadataContainerId
 * @param auth
 */
export async function asyncCreateMetadataContainerId(auth: authorization) {
  auth.options.body = {};
  auth.options.body.name = uuidv4().substring(0, 32);
  const responseString = await postMetadataContainer(auth);
  const logFile = auth.options.logs.createMetadataContainer;

  // archive
  writeFileSyncUtf8(logFile, responseString);
  if (auth.options.verbose) {
    console.info(logFile);
  }

  return JSON.parse(responseString).id;
}

/**
 * @description asyncCreateApexMembers
 * @param {*} auth
 */
export async function asyncCreateApexMembers(auth: authorization) {
  const compositeRequest = auth.options.apex.map((record: any) => {
    return {
      method: 'POST',
      url: `/services/data/v${auth.options.asOfVersion}/tooling/sobjects/${auth.options.apexMember}/`,
      referenceId: record.Id,
      body: {
        Body: record.Body,
        MetadataContainerId: auth.options.metadataContainerId,
        ContentEntityId: record.Id
      }
    };
  });

  auth.options.body = {};
  auth.options.body.compositeRequest = compositeRequest;
  const responseString = await postComposite(auth);
  const logFile = auth.options.logs.createApex;

  // archive
  writeFileSyncUtf8(logFile, responseString);
  if (auth.options.verbose) {
    console.info(logFile);
  }

  return JSON.parse(responseString).compositeResponse;
}

/**
 * @description asyncCreateContainerAsyncRequestId
 * @param {*} auth
 */
export async function asyncCreateContainerAsyncRequestId(auth: authorization) {
  const responseString = await postContainerAsyncRequest(auth);
  const logFile = auth.options.logs.createContainerAsyncRequest;

  // archive
  writeFileSyncUtf8(logFile, responseString);
  if (auth.options.verbose) {
    console.info(logFile);
  }
  return JSON.parse(responseString).id;
}
