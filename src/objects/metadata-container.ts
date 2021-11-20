/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/**
 * metadata-container.ts
 */
import https from 'https';
import { authorization, httpRequest } from 'heat-sfdx-common';

/**
 * @name setOptionsQueryMetadataContainer
 * @description set options GET /services/data/vXX.0/tooling/query/?q=select+Id+,Name+from+MetadataContainer+order+by+Name+limit+${optionsLimit}
 */
const setOptionsQueryMetadataContainer = (
  params: authorization
): https.RequestOptions => {
  const hostname = params.instanceUrl.replace('https://', '');
  const optionsLimit = params.options.limit ? params.options.limit : 50000;
  const path = `/services/data/v${params.options.asOfVersion}/tooling/query/?q=select+Id+,Name+from+MetadataContainer+order+by+Name+limit+${optionsLimit}`;

  return {
    hostname: hostname,
    path: path,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json'
    }
  };
};

/**
 * @name setOptionsPostMetadataContainer
 * @description set options /services/data/vXX.0/tooling/sobjects/MetadataContainer
 */
const setOptionsPostMetadataContainer = (
  params: authorization
): https.RequestOptions => {
  const hostname = params.instanceUrl.replace('https://', '');
  const path = `/services/data/v${params.options.asOfVersion}/tooling/sobjects/MetadataContainer`;

  return {
    hostname: hostname,
    path: path,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json'
    }
  };
};

/**
 * @name getMetadataContainerList
 * @description GET MetadataContainer List
 */
async function getMetadataContainerList(params: authorization) {
  const _options = setOptionsQueryMetadataContainer(params);
  const _requestBody = '';

  return await httpRequest(_options, _requestBody);
}

/**
 * @name postMetadataContainer
 * @description POST ApexClass
 */
async function postMetadataContainer(params: authorization) {
  const _options = setOptionsPostMetadataContainer(params);
  const _requestBody = JSON.stringify(params.options.body);

  return await httpRequest(_options, _requestBody);
}

export { getMetadataContainerList, postMetadataContainer };
