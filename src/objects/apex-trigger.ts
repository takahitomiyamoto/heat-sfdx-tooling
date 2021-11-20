/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * apex-trigger.ts
 */
import https from 'https';
import { authorization, httpRequest } from 'heat-sfdx-common';

/**
 * @name setOptionsQueryApexTriggers
 * @description set options GET /services/data/vXX.0/tooling/query/?q=select+${fields}+from+ApexTrigger+order+by+Name+limit+${optionsLimit}
 */
const setOptionsQueryApexTriggers = (
  params: authorization
): https.RequestOptions => {
  const hostname = params.instanceUrl.replace('https://', '');
  const fields = params.options.fields.join(',');
  const optionsLimit = params.options.limit ? params.options.limit : 50000;
  const path = `/services/data/v${params.options.asOfVersion}/tooling/query/?q=select+${fields}+from+ApexTrigger+order+by+Name+limit+${optionsLimit}`;

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
 * @name getApexTriggers
 * @description GET List of ApexTriggers
 */
async function getApexTriggers(params: authorization) {
  const _options = setOptionsQueryApexTriggers(params);
  const _requestBody = '';

  return await httpRequest(_options, _requestBody);
}

export { getApexTriggers };
