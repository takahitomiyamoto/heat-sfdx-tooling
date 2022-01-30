/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/**
 * execute.ts
 */
import https from 'https';
import { authorization, httpRequest } from 'heat-sfdx-common';

/**
 * @name setOptionsExecuteGet
 * @description set options GET /services/data/vXX.X
 */
const setOptionsExecuteGet = (params: authorization): https.RequestOptions => {
  const hostname = params.instanceUrl.replace('https://', '');
  const path = `/services/data/v${params.options.asOfVersion}`;

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
 * @name setOptionsExecutePost
 * @description set options POST /services/data/vXX.X
 */
const setOptionsExecutePost = (params: authorization): https.RequestOptions => {
  const hostname = params.instanceUrl.replace('https://', '');
  const path = `/services/data/v${params.options.asOfVersion}`;

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
 * @name executeGet
 * @description execute GET
 */
export async function executeGet(params: authorization) {
  const _options = setOptionsExecuteGet(params);

  return await httpRequest(_options, '');
}

/**
 * @name executePost
 * @description execute POST
 */
export async function executePost(params: authorization) {
  const _options = setOptionsExecutePost(params);
  const _requestBody = JSON.stringify(params.options.body);

  return await httpRequest(_options, _requestBody);
}
