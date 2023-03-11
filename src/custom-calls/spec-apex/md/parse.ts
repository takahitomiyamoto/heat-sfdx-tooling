/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * parse.ts
 */
import { authorization, readFileSyncUtf8 } from 'heat-sfdx-common';
import { extractApexDoc, REGEXP } from './common';
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
 * @description parseJsonApex
 * @param {*} auth
 */
export const parseJsonApex = (auth: authorization) => {
  const stringApex = readFileSyncUtf8(`${auth.options.logs.retrieveApex}`);
  const records = JSON.parse(stringApex).records;

  return !records
    ? []
    : records.filter((record: any) => {
        return auth.options.apexName === record.Name;
      })[0];
};

/**
 * @description parseJsonApexMember
 * @param {*} auth
 */
export const parseJsonApexMember = (auth: authorization) => {
  const stringApexMember = readFileSyncUtf8(
    `${auth.options.dir.symbolTable}/${auth.options.apexName}.json`
  );

  return JSON.parse(stringApexMember);
};

/**
 * @description parseBodyHeader
 * @param {*} jsonApex
 */
export const parseBodyHeader = (jsonApex: any) => {
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

export const parseHeader = (params: any) => {
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

  // TODO High: 表示形式
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
