/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/**
 * header.ts
 */
import { authorization } from 'heat-sfdx-common';
import {
  parseJsonApex,
  parseJsonApexMember,
  extractApexDoc,
  REGEXP
} from './common';
import { createCodeSignatureClass, createCodeSignatureTrigger } from './code';
import {
  createTableHeader,
  createTableHeaderApexDoc,
  createTableSignatureClass,
  createTableSignatureTrigger,
  createClassTable,
  createTriggerTable
} from './table';
import { createUlHeaderApexDoc } from './ul';

/**
 * @description parseBodyHeader
 * @param {*} jsonApex
 */
const parseBodyHeader = (jsonApex: any) => {
  const _body = jsonApex.Body;
  const _type = jsonApex.attributes.type;

  const regexp = {
    target: 'ApexClass' === _type ? REGEXP.HEADER_CLASS : REGEXP.HEADER_TRIGGER,
    tags: REGEXP.TAGS_HEADER,
    tagsArea: REGEXP.TAGS_AREA_HEADER,
    annotationsEnd: REGEXP.ANNOTATIONS_END_HEADER,
    signatureStart: REGEXP.SIGNATURE_START_HEADER,
    signatureEnd: REGEXP.SIGNATURE_END_HEADER
  };

  const header = extractApexDoc(_body, regexp);

  return {
    header: header
  };
};

const parseHeader = (params: any) => {
  const apex = params.apex;
  const apexMember = params.apexMember;
  const body = params.body;
  // Common
  const namespace = apexMember.namespace;
  const manageableState = apex.ManageableState;
  const apiVersion = apex.ApiVersion.toFixed(1);
  const apexType = apex.attributes.type;
  const table = apexMember.tableDeclaration;
  const name = table.name;

  // TODO
  const apexBodyCrc = apex.BodyCrc;
  const apexLengthWithoutComments = apex.LengthWithoutComments;
  const apexBody = apex.Body;

  // ApexClass
  const annotations = table.annotations;
  const modifiers = table.modifiers;
  const parentClass = apexMember.parentClass;
  const interfaces = apexMember.interfaces;
  // ApexTrigger
  const usageBeforeInsert = apex.UsageBeforeInsert;
  const usageBeforeUpdate = apex.UsageBeforeUpdate;
  const usageBeforeDelete = apex.UsageBeforeDelete;
  const usageAfterInsert = apex.UsageAfterInsert;
  const usageAfterUpdate = apex.UsageAfterUpdate;
  const usageAfterDelete = apex.UsageAfterDelete;
  const usageAfterUndelete = apex.UsageAfterUndelete;
  const entityDefinition = apex.EntityDefinition;

  const _params: any = {};
  _params.item = {};
  _params.item.namespace = namespace;
  _params.item.manageableState = manageableState;
  _params.item.apiVersion = apiVersion;
  _params.item.annotations = annotations;
  _params.item.modifiers = modifiers;
  _params.item.name = name;
  _params.item.parentClass = parentClass;
  _params.item.interfaces = interfaces;
  _params.item.body = body;
  _params.item.usageBeforeInsert = usageBeforeInsert;
  _params.item.usageBeforeUpdate = usageBeforeUpdate;
  _params.item.usageBeforeDelete = usageBeforeDelete;
  _params.item.usageAfterInsert = usageAfterInsert;
  _params.item.usageAfterUpdate = usageAfterUpdate;
  _params.item.usageAfterDelete = usageAfterDelete;
  _params.item.usageAfterUndelete = usageAfterUndelete;
  _params.item.entityDefinition = entityDefinition;
  _params.item.apexBodyCrc = apexBodyCrc;
  _params.item.apexLengthWithoutComments = apexLengthWithoutComments;
  _params.item.apexBody = apexBody;

  _params.func = {};
  _params.func.createTableTarget =
    'ApexClass' === apexType ? createClassTable : createTriggerTable;

  _params.func.tableHeader = createTableHeader;
  _params.func.tableSignature =
    'ApexClass' === apexType
      ? createTableSignatureClass
      : createTableSignatureTrigger;
  _params.func.codeSignature =
    'ApexClass' === apexType
      ? createCodeSignatureClass
      : createCodeSignatureTrigger;
  _params.func.tableHeaderApexDoc = createTableHeaderApexDoc;
  _params.func.ulHeaderApexDoc = createUlHeaderApexDoc;

  return _params;
};

/**
 * @description buildHeader
 * @param {*} auth
 */
export const buildHeader = (auth: authorization) => {
  const jsonApex = parseJsonApex(auth);
  const jsonApexMember = parseJsonApexMember(auth);
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
export const buildHeaderApexDoc = (auth: authorization) => {
  const jsonApex = parseJsonApex(auth);
  const jsonApexMember = parseJsonApexMember(auth);
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

// TODO: 場所を変える
export const outputBody = (auth: authorization) => {
  const jsonApex = parseJsonApex(auth);
  const jsonApexMember = parseJsonApexMember(auth);
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
