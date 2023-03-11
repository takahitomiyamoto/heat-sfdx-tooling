/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/**
 * header.ts
 */
import { authorization } from 'heat-sfdx-common';
import { parseBodyHeader, parseHeader } from './parse';

/**
 * @description buildHeader
 * @param {*} auth
 */
export const buildHeader = (
  auth: authorization,
  jsonApex: any,
  jsonApexMember: any
) => {
  const bodyHeader = parseBodyHeader(jsonApex);

  const _params: any = {};
  _params.apex = jsonApex;
  _params.apexMember = jsonApexMember;
  _params.body = bodyHeader;
  const header = parseHeader(_params);

  const headerArea = [];
  const tableHeader = header.func.tableHeader(header);
  const tableSignature = header.func.tableSignature(header);
  const codeSignature = header.func.codeSignature(header);

  headerArea.push(tableHeader);
  headerArea.push(tableSignature);
  headerArea.push(codeSignature);

  return headerArea[0];
};

/**
 * @description buildHeaderApexDoc
 * @param {*} auth
 */
export const buildHeaderApexDoc = (
  auth: authorization,
  jsonApex: any,
  jsonApexMember: any
) => {
  const bodyHeader = parseBodyHeader(jsonApex);

  const _params: any = {};
  _params.apex = jsonApex;
  _params.apexMember = jsonApexMember;
  _params.body = bodyHeader;
  const header = parseHeader(_params);

  const headerArea = [];
  const tableHeaderApexDoc = header.func.tableHeaderApexDoc(header);
  const ulHeaderApexDoc = header.func.ulHeaderApexDoc(header);

  headerArea.push(tableHeaderApexDoc);
  headerArea.push(ulHeaderApexDoc);

  // return headerArea[0];
  return headerArea;
};

// TODO High: 場所を変える
export const outputBody = (
  auth: authorization,
  jsonApex: any,
  jsonApexMember: any
) => {
  const bodyHeader = parseBodyHeader(jsonApex);

  const _params: any = {};
  _params.apex = jsonApex;
  _params.apexMember = jsonApexMember;
  _params.body = bodyHeader;
  const header = parseHeader(_params);

  const debugArea = [];

  debugArea.push({
    code: {
      language: 'java',
      content: header.item.apexBody
    }
  });

  return debugArea[0];
};
