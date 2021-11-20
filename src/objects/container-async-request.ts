/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * metadata-container.ts
 */
import https from 'https';
import { authorization, httpRequest } from 'heat-sfdx-common';

/**
 * @name setOptionsQueryContainerAsyncRequest
 * @description set options GET /services/data/vXX.0/tooling/query/?q=select+${fields}+from+ContainerAsyncRequest+where+Id+=+'${params.options.id}'
 */
const setOptionsQueryContainerAsyncRequest = (
  params: authorization
): https.RequestOptions => {
  const hostname = params.instanceUrl.replace('https://', '');
  const fields = params.options.fields.join(',');
  const path = `/services/data/v${params.options.asOfVersion}/tooling/query/?q=select+${fields}+from+ContainerAsyncRequest+where+Id+=+'${params.options.id}'`;

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
 * @name setOptionsPostContainerAsyncRequest
 * @description set options POST /services/data/vXX.0/tooling/sobjects/ContainerAsyncRequest
 */
const setOptionsPostContainerAsyncRequest = (
  params: authorization
): https.RequestOptions => {
  const hostname = params.instanceUrl.replace('https://', '');
  const path = `/services/data/v${params.options.asOfVersion}/tooling/sobjects/ContainerAsyncRequest`;

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
 * @name getContainerAsyncRequest
 * @description GET ContainerAsyncRequest
 */
async function getContainerAsyncRequest(params: authorization) {
  const _options = setOptionsQueryContainerAsyncRequest(params);
  const _requestBody = '';

  return await httpRequest(_options, _requestBody);
}

/**
 * @name postContainerAsyncRequest
 * @description POST ContainerAsyncRequest
 */
async function postContainerAsyncRequest(params: authorization) {
  const _options = setOptionsPostContainerAsyncRequest(params);
  const _requestBody = JSON.stringify(params.options.body);
  return await httpRequest(_options, _requestBody);
}

export { getContainerAsyncRequest, postContainerAsyncRequest };
