/**
 * composite.ts
 */
import https from 'https';
import { authorization, httpRequest } from 'heat-sfdx-common';

/**
 * @name setOptionsPostComposite
 * @description set options POST /services/data/vXX.X/tooling/composite
 */
const setOptionsPostComposite = (
  params: authorization
): https.RequestOptions => {
  const hostname = params.instanceUrl.replace('https://', '');
  const path = `/services/data/v${params.options.asOfVersion}/tooling/composite`;

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
 * @name postComposite
 * @description POST Composite
 */
async function postComposite(params: authorization) {
  return await httpRequest(
    setOptionsPostComposite(params),
    JSON.stringify(params.options.body)
  );
}

export { postComposite };
