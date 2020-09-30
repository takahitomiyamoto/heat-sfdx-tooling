/**
 * profile.ts
 */
import https from 'https';
import { authorization, httpRequest } from 'heat-sfdx-common';

/**
 * @name setOptionsProfileId
 * @description set options GET /services/data/vXX.0/tooling/sobjects/Profile/${params.options.recordId}
 */
const setOptionsProfileId = (params: authorization): https.RequestOptions => {
  const hostname = params.instanceUrl.replace('https://', '');
  return {
    hostname: hostname,
    path: `/services/data/${params.options.asOfVersion}/tooling/sobjects/Profile/${params.options.recordId}`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json'
    }
  };
};

/**
 * @name getProfile
 * @description GET Profile
 */
async function getProfile(params: authorization) {
  const result: any = await httpRequest(setOptionsProfileId(params), '');
  return result;
}

export { getProfile };
