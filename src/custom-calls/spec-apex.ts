/**
 * spec-apex.ts
 */
import {
  authorization,
  readFileSyncUtf8,
  writeFileSyncUtf8
} from 'heat-sfdx-common';
import { v4 as uuidv4 } from 'uuid';
import { postComposite } from '../composite/composite';
import { getApexClasses } from '../objects/apex-class';
import { getApexTriggers } from '../objects/apex-trigger';
import {
  getContainerAsyncRequest,
  postContainerAsyncRequest
} from '../objects/container-async-request';
import { postMetadataContainer } from '../objects/metadata-container';
import json2md from 'json2md';

// The request in POST /tooling/composite can’t contain more than 25 operations.
const COMPOSITE_OPERATIONS_LIMIT = 25;
const RETRIEVE_LIMIT = 50000;
const COMPLETED = 'Completed';

/*********************
 * common
 *********************/
const NO_DATA =
  '※ ApexDoc が存在しないか、該当する Signature が見つかりません。';
const ACCESS_MODIFIER = `[private|protected|public|global]*[\\sabstract|\\svirtual|\\soverride]*[\\sstatic|\\stransient]*[\\sfinal]*[with|without|inherited]*[\\ssharing]*`;
const ANNOTATIONS = `[\\@\\w\\(\\=\\'\\/\\)\\n]*`;
const ANNOTATIONS_END = '\\n\\s+';
const ASSIGNED_VALUE = `[\\s\\=\\w\\.\\(\\)<>,]*;\\n`;
const CLASS_OPTIONS = `(extends\\s[\\w<>]+\\s|implements\\s\\w+\\s)*`;
const NAME = `(\\w+)`;
const VALUE = `(.+(\\s\\(\\)\\.<>,:;='")*)`;
const RETURN_TYPE = `[\\w\\.<>]`;
const TAGS_AREA_START = `\\/\\*+\\n`;
const TAGS_AREA_END = `\\s+\\*+\\/\\n`;
const TAGS_BODY_ITEM = `\\s\\*\\s\\@${NAME}\\s${VALUE}\\n`;
const TAGS_BODY = `([${TAGS_BODY_ITEM}]+)`;
const SIGNATURE_END = '\n$';
const SIGNATURE_START = `^\\s+`;
const SIGNATURE_END_CLASS = `\\s*\\{`;
const METHOD_PARAMS = `[\\w\\s\\n\\.,<>]*`;
const TRIGGER_PARAMS = `[\\w\\s\\n,]+`;

// FIXME: https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_classes_properties.htm
const GET_SET = `\\s\\{\\s+get;\\sset;\\s\\}\n`;

const REGEXP_PARAM_LIST_TYPE = new RegExp(`<+[\\w.]*>+`, 'g');
const REGEXP_PARAM_LEFT_PARENTHESIS = new RegExp(`\\(\\n\\s*`, 'g');
const REGEXP_PARAM_RIGHT_PARENTHESIS = new RegExp(`\\n\\s*\\)`, 'g');
const REGEXP_PARAM_COMMA = new RegExp(`,\\n\\s*`, 'g');

/*********************
 * target
 *********************/
const REGEXP_HEADER_CLASS = new RegExp(
  `^${TAGS_AREA_START}${TAGS_BODY}${TAGS_AREA_END}` +
    `${ANNOTATIONS}` +
    `${ACCESS_MODIFIER}` +
    `\\sclass\\s${NAME}\\s${CLASS_OPTIONS}${SIGNATURE_END_CLASS}`,
  'g'
);
const REGEXP_HEADER_TRIGGER = new RegExp(
  `^${TAGS_AREA_START}${TAGS_BODY}${TAGS_AREA_END}` +
    `${ANNOTATIONS}` +
    `trigger\\s${NAME}\\son\\s${NAME}\\(${TRIGGER_PARAMS}\\)${SIGNATURE_END_CLASS}`,
  'g'
);
const REGEXP_INNER_CLASS = new RegExp(
  `\\s+${TAGS_AREA_START}${TAGS_BODY}${TAGS_AREA_END}` +
    `\\s+${ANNOTATIONS}` +
    `\\s+${ACCESS_MODIFIER}` +
    `\\sclass\\s${NAME}\\s${CLASS_OPTIONS}${SIGNATURE_END_CLASS}`,
  'g'
);
const REGEXP_PROPERTY = new RegExp(
  `\\s+${TAGS_AREA_START}${TAGS_BODY}${TAGS_AREA_END}` +
    `\\s+${ANNOTATIONS}` +
    `\\s+${ACCESS_MODIFIER}` +
    `\\s${RETURN_TYPE}+\\s${NAME}${ASSIGNED_VALUE}`,
  'g'
);
const REGEXP_PROPERTY_GET_SET = new RegExp(
  `\\s+${TAGS_AREA_START}${TAGS_BODY}${TAGS_AREA_END}` +
    `\\s+${ANNOTATIONS}` +
    `\\s+${ACCESS_MODIFIER}` +
    `\\s${RETURN_TYPE}+\\s${NAME}${GET_SET}`,
  'g'
);
const REGEXP_CONSTRUCTOR = new RegExp(
  `\\s+${TAGS_AREA_START}${TAGS_BODY}${TAGS_AREA_END}` +
    `\\s+${ANNOTATIONS}` +
    `\\s+${ACCESS_MODIFIER}` +
    `\\s${NAME}\\(${METHOD_PARAMS}\\)${SIGNATURE_END_CLASS}`,
  'g'
);
const REGEXP_METHOD = new RegExp(
  `\\s+${TAGS_AREA_START}${TAGS_BODY}${TAGS_AREA_END}` +
    `\\s+${ANNOTATIONS}` +
    `\\s+${ACCESS_MODIFIER}` +
    `\\s${RETURN_TYPE}+\\s${NAME}\\(${METHOD_PARAMS}\\)${SIGNATURE_END_CLASS}`,
  'g'
);

/*********************
 * tags
 *********************/
const REGEXP_TAGS_HEADER = new RegExp(TAGS_BODY_ITEM, 'g');
const REGEXP_TAGS_INNER_CLASS = new RegExp(TAGS_BODY_ITEM, 'g');
const REGEXP_TAGS_PROPERTY = new RegExp(TAGS_BODY_ITEM, 'g');
const REGEXP_TAGS_CONSTRUCTOR = new RegExp(TAGS_BODY_ITEM, 'g');
const REGEXP_TAGS_METHOD = new RegExp(TAGS_BODY_ITEM, 'g');

/*********************
 * tagsArea
 *********************/
const REGEXP_TAGS_AREA_HEADER = new RegExp(
  `${TAGS_AREA_START}${TAGS_BODY}${TAGS_AREA_END}`,
  'g'
);
const REGEXP_TAGS_AREA_INNER_CLASS = new RegExp(
  `\\s+${TAGS_AREA_START}${TAGS_BODY}${TAGS_AREA_END}`,
  'g'
);
const REGEXP_TAGS_AREA_PROPERTY = new RegExp(
  `\\s+${TAGS_AREA_START}${TAGS_BODY}${TAGS_AREA_END}`,
  'g'
);
const REGEXP_TAGS_AREA_CONSTRUCTOR = new RegExp(
  `\\s+${TAGS_AREA_START}${TAGS_BODY}${TAGS_AREA_END}`,
  'g'
);
const REGEXP_TAGS_AREA_METHOD = new RegExp(
  `\\s+${TAGS_AREA_START}${TAGS_BODY}${TAGS_AREA_END}`,
  'g'
);

/*********************
 * annotationsEnd
 *********************/
const REGEXP_ANNOTATIONS_END_HEADER = new RegExp(ANNOTATIONS_END);
const REGEXP_ANNOTATIONS_END_INNER_CLASS = new RegExp(ANNOTATIONS_END);
const REGEXP_ANNOTATIONS_END_PROPERTY = new RegExp(ANNOTATIONS_END);
const REGEXP_ANNOTATIONS_END_CONSTRUCTOR = new RegExp(ANNOTATIONS_END);
const REGEXP_ANNOTATIONS_END_METHOD = new RegExp(ANNOTATIONS_END);

/*********************
 * signatureStart
 *********************/
const REGEXP_SIGNATURE_START_HEADER = '';
const REGEXP_SIGNATURE_START_INNER_CLASS = new RegExp(SIGNATURE_START);
const REGEXP_SIGNATURE_START_PROPERTY = new RegExp(SIGNATURE_START);
const REGEXP_SIGNATURE_START_CONSTRUCTOR = new RegExp(SIGNATURE_START);
const REGEXP_SIGNATURE_START_METHOD = new RegExp(SIGNATURE_START);

/*********************
 * signatureEnd
 *********************/
const REGEXP_SIGNATURE_END_HEADER = new RegExp(SIGNATURE_END_CLASS);
const REGEXP_SIGNATURE_END_INNER_CLASS = new RegExp(SIGNATURE_END_CLASS);
const REGEXP_SIGNATURE_END_PROPERTY = new RegExp(SIGNATURE_END);
const REGEXP_SIGNATURE_END_CONSTRUCTOR = new RegExp(SIGNATURE_END_CLASS);
const REGEXP_SIGNATURE_END_METHOD = new RegExp(SIGNATURE_END_CLASS);

/*********************
 * keyStart
 *********************/
const REGEXP_KEY_START_METHOD = new RegExp(
  `${ANNOTATIONS}${ACCESS_MODIFIER}\\s${RETURN_TYPE}+\\s`
);

/*********************
 * TABLE_HEADER
 *********************/
const TABLE_HEADER_APEX_DOC = ['Description'];
const TABLE_HEADER_HEADER = ['Namespace', 'Manageable State', 'API Version'];
const TABLE_HEADER_CLASS = [
  'Annotation',
  'Modifier',
  'Name',
  'Parent Class',
  'Interfaces'
];
const TABLE_HEADER_TRIGGER = [
  'Before Insert',
  'Before Update',
  'Before Delete',
  'After Insert',
  'After Update',
  'After Delete',
  'After Undelete'
];
const TABLE_HEADER_EXTERNAL_REFERENCES = [
  'Namespace',
  'Name',
  'Variables',
  'Methods'
];
const TABLE_HEADER_PROPERTIES = ['Annotations', 'Modifier', 'Type', 'Name'];
const TABLE_HEADER_CONSTRUCTORS = [
  'Annotation',
  'Modifier',
  'Name',
  'Parameters'
];
const TABLE_HEADER_METHODS = [
  'Annotation',
  'Modifier',
  'Return Type',
  'Name',
  'Parameters'
];
// const TABLE_HEADER_PARAMETERS = ['Type', 'Name'];

/*********************
 * TITLE
 *********************/
const NOT_APPLICABLE = 'N/A';
const TITLE_CONSTRUCTORS = 'Constructors';
const TITLE_EXTERNAL_REFERENCES = 'External References';
const TITLE_INNER_CLASSES = 'Inner Classes';
const TITLE_METHODS = 'Methods';
// const TITLE_PARAMETERS = 'Parameters';
const TITLE_PROPERTIES = 'Properties';

/**
 * @description sleep
 * @param {*} sec
 */
const sleep = (sec: number) => {
  console.log(`[INFO] just give me ${sec} more seconds...`);
  return new Promise((resolve) => setTimeout(resolve, sec * 1000));
};

/**
 * @description setConfig
 * @param {*} environment
 * @param {*} apexType
 */
const setConfig = (environment: any, apexType: string) => {
  switch (apexType) {
    case 'ApexClass':
      return {
        apexMember: 'ApexClassMember',
        getApex: getApexClasses,
        retrieveLogFile: environment.logs.retrieveApexClasses,
        createLogFile: environment.logs.createApexClassMembers,
        symbolTableFolder: environment.logs.apexClass.symbolTable,
        rawDataFolder: environment.logs.apexClass.rawData,
        docsFolder: environment.docs.apexClass,
        fileExtension: '.cls',
        fields: [
          'Id',
          'Name',
          'ApiVersion',
          'Body',
          'BodyCrc',
          'LengthWithoutComments',
          'ManageableState',
          'NamespacePrefix'
        ]
      };
    case 'ApexTrigger':
      return {
        apexMember: 'ApexTriggerMember',
        getApex: getApexTriggers,
        retrieveLogFile: environment.logs.retrieveApexTriggers,
        createLogFile: environment.logs.createApexTriggerMembers,
        symbolTableFolder: environment.logs.apexTrigger.symbolTable,
        rawDataFolder: environment.logs.apexTrigger.rawData,
        docsFolder: environment.docs.apexTrigger,
        fileExtension: '.trigger',
        fields: [
          'Id',
          'Name',
          'ApiVersion',
          'Body',
          'BodyCrc',
          'EntityDefinition.DeveloperName',
          'EntityDefinition.NamespacePrefix',
          'LengthWithoutComments',
          'ManageableState',
          'Status',
          'UsageAfterDelete',
          'UsageAfterInsert',
          'UsageAfterUndelete',
          'UsageAfterUpdate',
          'UsageBeforeDelete',
          'UsageBeforeInsert',
          'UsageBeforeUpdate',
          'UsageIsBulk'
        ]
      };
    default:
      return {};
  }
};

/**
 * @description asyncCreateMetadataContainerId
 * @param params
 */
async function asyncCreateMetadataContainerId(params: any) {
  const responseString = await postMetadataContainer({
    accessToken: params.accessToken,
    instanceUrl: params.instanceUrl,
    options: {
      asOfVersion: params.asOfVersion,
      body: {
        name: uuidv4().substring(0, 32)
      }
    }
  });

  // archive
  writeFileSyncUtf8(params.createMetadataContainer, responseString);
  console.log(params.createMetadataContainer);

  return JSON.parse(responseString).id;
}

/**
 * @description asyncRetrieveApex
 * @param {*} params
 */
async function asyncRetrieveApex(params: any) {
  const responseString = await params.getApex({
    accessToken: params.accessToken,
    instanceUrl: params.instanceUrl,
    options: {
      asOfVersion: params.asOfVersion,
      fields: params.fields,
      limit: RETRIEVE_LIMIT
    }
  });

  // archive
  writeFileSyncUtf8(params.retrieveLogFile, responseString);
  console.log(params.retrieveLogFile);

  return JSON.parse(responseString).records;
}

/**
 * @description asyncCreateApexMembers
 * @param {*} params
 */
export async function asyncCreateApexMembers(params: any) {
  const compositeRequest = params.apex.map((record: any) => {
    return {
      method: 'POST',
      url: `/services/data/v${params.asOfVersion}/tooling/sobjects/${params.apexMember}/`,
      referenceId: record.Id,
      body: {
        Body: record.Body,
        MetadataContainerId: params.metadataContainerId,
        ContentEntityId: record.Id
      }
    };
  });

  const responseString = await postComposite({
    accessToken: params.accessToken,
    instanceUrl: params.instanceUrl,
    options: {
      asOfVersion: params.asOfVersion,
      body: {
        compositeRequest: compositeRequest
      }
    }
  });

  // archive
  writeFileSyncUtf8(params.createLogFile, responseString);
  console.log(params.createLogFile);

  return JSON.parse(responseString).compositeResponse;
}

/**
 * @description asyncCreateContainerAsyncRequestId
 * @param {*} params
 */
async function asyncCreateContainerAsyncRequestId(params: any) {
  const responseString = await postContainerAsyncRequest({
    accessToken: params.accessToken,
    instanceUrl: params.instanceUrl,
    options: {
      asOfVersion: params.asOfVersion,
      body: {
        MetadataContainerId: params.metadataContainerId,
        IsCheckOnly: true
      }
    }
  });

  // archive
  writeFileSyncUtf8(params.createContainerAsyncRequest, responseString);
  console.log(params.createContainerAsyncRequest);

  return JSON.parse(responseString).id;
}

/**
 * @description asyncRetrieveContainerAsyncRequestState
 * @param {*} params
 */
async function asyncRetrieveContainerAsyncRequestState(params: any) {
  const responseString = await getContainerAsyncRequest({
    accessToken: params.accessToken,
    instanceUrl: params.instanceUrl,
    options: {
      asOfVersion: params.asOfVersion,
      id: params.containerAsyncRequestId,
      fields: ['Id', 'State', 'MetadataContainerId']
    }
  });

  // archive
  writeFileSyncUtf8(params.retrieveContainerAsyncRequests, responseString);
  console.log(params.retrieveContainerAsyncRequests);

  return JSON.parse(responseString).records[0].State;
}

/**
 * @description asyncRetrieveApexMembers
 * @param {*} params
 */
async function asyncRetrieveApexMembers(params: any) {
  const compositeRequest = params.apexMembers.map((record: any) => {
    return {
      method: 'GET',
      url: record.httpHeaders.Location,
      referenceId: record.referenceId
    };
  });

  const responseString = await postComposite({
    accessToken: params.accessToken,
    instanceUrl: params.instanceUrl,
    options: {
      asOfVersion: params.asOfVersion,
      body: {
        compositeRequest: compositeRequest
      }
    }
  });
  const compositeResponse = JSON.parse(responseString).compositeResponse;

  const results = await compositeResponse.map((record: any) => {
    return {
      symbolTable: {
        filename: `${params.symbolTableFolder}/${record.body.FullName}.json`,
        contents: JSON.stringify(record.body.SymbolTable)
      }
    };
  });

  return results;
}

/**
 * @description _getJsonApex
 * @param {*} params
 * @param {*} apexMember
 */
const _getJsonApex = (params: any, apexMember: string) => {
  const stringApex = readFileSyncUtf8(`${params.retrieveLogFile}`);
  const records = JSON.parse(stringApex).records;

  return records.filter((record: any) => {
    return apexMember === record.Name;
  })[0];
};

/**
 * @description _getJsonApexMember
 * @param {*} params
 * @param {*} apexMember
 */
const _getJsonApexMember = (params: any, apexMember: string) => {
  const stringApexMember = readFileSyncUtf8(
    `${params.symbolTableFolder}/${apexMember}.json`
  );

  return JSON.parse(stringApexMember);
};

/**
 * @description extractApexDoc
 * @param {*} body
 * @param {*} regexp
 */
const extractApexDoc = (body: any, regexp: any) => {
  body = body.replace(/\r\n?/g, '\n');
  const targetRaws = body.match(regexp.target);
  return !targetRaws
    ? []
    : targetRaws.map((raw: any) => {
        const rawTags = raw.replace(regexp.target, '$1').match(regexp.tags);
        const tags = !rawTags
          ? []
          : rawTags.map((tag: any) => {
              return {
                key: tag.replace(regexp.tags, '$1'),
                value: tag.replace(regexp.tags, '$2')
              };
            });
        const name = raw.replace(regexp.target, '$2');
        const signature = raw
          .replace(regexp.tagsArea, '')
          .replace(regexp.annotationsEnd, '\n')
          .replace(regexp.signatureStart, '')
          .replace(regexp.signatureEnd, '');
        const key = signature
          .replace(regexp.keyStart, '')
          .replace(REGEXP_PARAM_LIST_TYPE, '')
          .replace(REGEXP_PARAM_LEFT_PARENTHESIS, '(')
          .replace(REGEXP_PARAM_RIGHT_PARENTHESIS, ')')
          .replace(REGEXP_PARAM_COMMA, ', ');

        return {
          tags: tags,
          name: name,
          signature: signature,
          key: key
        };
      });
};

/**
 * @description _parseBodyHeader
 * @param {*} body
 * @param {*} regexp
 */
const _parseBodyHeader = (body: any, regexp: any) => {
  const header = extractApexDoc(body, regexp);
  console.log(`\n## Header`);
  console.log(JSON.stringify(header));

  return {
    header: header
  };
};

/**
 * @description parseBodyHeader
 * @param {*} body
 * @param {*} type
 */
const parseBodyHeader = (body: any, type: string) => {
  return _parseBodyHeader(body, {
    target: 'ApexClass' === type ? REGEXP_HEADER_CLASS : REGEXP_HEADER_TRIGGER,
    tags: REGEXP_TAGS_HEADER,
    tagsArea: REGEXP_TAGS_AREA_HEADER,
    annotationsEnd: REGEXP_ANNOTATIONS_END_HEADER,
    signatureStart: REGEXP_SIGNATURE_START_HEADER,
    signatureEnd: REGEXP_SIGNATURE_END_HEADER
  });
};

/**
 * @description _parseBodyInnerClasses
 * @param {*} body
 * @param {*} regexp
 */
const _parseBodyInnerClasses = (body: any, regexp: any) => {
  const innerClasses = extractApexDoc(body, regexp);
  console.log(`\n## Inner Class`);
  console.log(JSON.stringify(innerClasses));

  return {
    innerClasses: innerClasses
  };
};

/**
 * @description parseBodyInnerClasses
 * @param {*} body
 */
const parseBodyInnerClasses = (body: any) => {
  return _parseBodyInnerClasses(body, {
    target: REGEXP_INNER_CLASS,
    tags: REGEXP_TAGS_INNER_CLASS,
    tagsArea: REGEXP_TAGS_AREA_INNER_CLASS,
    annotationsEnd: REGEXP_ANNOTATIONS_END_INNER_CLASS,
    signatureStart: REGEXP_SIGNATURE_START_INNER_CLASS,
    signatureEnd: REGEXP_SIGNATURE_END_INNER_CLASS
  });
};

/**
 * @description _parseBodyProperties
 * @param {*} body
 * @param {*} regexps
 */
const _parseBodyProperties = (body: any, regexps: any) => {
  let properties: any = [];
  regexps.forEach((regexp: any) => {
    const _properties = extractApexDoc(body, regexp);
    properties = properties.concat(_properties);
  });

  console.log(`\n## Properties`);
  console.log(JSON.stringify(properties));

  return {
    properties: properties
  };
};

/**
 * @description parseBodyProperties
 * @param {*} body
 */
const parseBodyProperties = (body: any) => {
  return _parseBodyProperties(body, [
    {
      target: REGEXP_PROPERTY,
      tags: REGEXP_TAGS_PROPERTY,
      tagsArea: REGEXP_TAGS_AREA_PROPERTY,
      annotationsEnd: REGEXP_ANNOTATIONS_END_PROPERTY,
      signatureStart: REGEXP_SIGNATURE_START_PROPERTY,
      signatureEnd: REGEXP_SIGNATURE_END_PROPERTY
    },
    {
      target: REGEXP_PROPERTY_GET_SET,
      tags: REGEXP_TAGS_PROPERTY,
      tagsArea: REGEXP_TAGS_AREA_PROPERTY,
      annotationsEnd: REGEXP_ANNOTATIONS_END_PROPERTY,
      signatureStart: REGEXP_SIGNATURE_START_PROPERTY,
      signatureEnd: REGEXP_SIGNATURE_END_PROPERTY
    }
  ]);
};

/**
 * @description _parseBodyConstructors
 * @param {*} body
 * @param {*} regexp
 */
const _parseBodyConstructors = (body: any, regexp: any) => {
  const constructors = extractApexDoc(body, regexp);
  console.log(`\n## Constructors`);
  console.log(JSON.stringify(constructors));

  return {
    constructors: constructors
  };
};

/**
 * @description parseBodyConstructors
 * @param {*} body
 */
const parseBodyConstructors = (body: any) => {
  return _parseBodyConstructors(body, {
    target: REGEXP_CONSTRUCTOR,
    tags: REGEXP_TAGS_CONSTRUCTOR,
    tagsArea: REGEXP_TAGS_AREA_CONSTRUCTOR,
    annotationsEnd: REGEXP_ANNOTATIONS_END_CONSTRUCTOR,
    signatureStart: REGEXP_SIGNATURE_START_CONSTRUCTOR,
    signatureEnd: REGEXP_SIGNATURE_END_CONSTRUCTOR
  });
};

/**
 * @description _parseBodyMethods
 * @param {*} body
 * @param {*} regexp
 */
const _parseBodyMethods = (body: any, regexp: any) => {
  const methods = extractApexDoc(body, regexp);
  console.log(`\n## Methods`);
  console.log(JSON.stringify(methods));

  return {
    methods: methods
  };
};

/**
 * @description parseBodyMethods
 * @param {*} body
 */
const parseBodyMethods = (body: any) => {
  return _parseBodyMethods(body, {
    target: REGEXP_METHOD,
    tags: REGEXP_TAGS_METHOD,
    tagsArea: REGEXP_TAGS_AREA_METHOD,
    annotationsEnd: REGEXP_ANNOTATIONS_END_METHOD,
    signatureStart: REGEXP_SIGNATURE_START_METHOD,
    signatureEnd: REGEXP_SIGNATURE_END_METHOD,
    keyStart: REGEXP_KEY_START_METHOD
  });
};

/**
 * @description _createTableRows
 * @param {*} item
 * @param {*} funcs
 */
const _createTableRows = (item: any, funcs: any) => {
  const rows = [];
  rows.push(funcs.createTableRow(item));
  return rows;
};

/**
 * @description createTable
 * @param {*} item
 * @param {*} headers
 * @param {*} funcs
 */
const createTable = (item: any, headers: any, funcs: any) => {
  const rows = !funcs.createTableRows
    ? _createTableRows(item, funcs)
    : funcs.createTableRows(item, funcs);

  return {
    table: {
      headers: headers,
      rows: rows
    }
  };
};

/**
 * @description _createTableRowsApexDoc
 * @param {*} item
 */
const _createTableRowsApexDoc = (item: any) => {
  const tags = item?.tags;
  if (!tags) {
    return [[NO_DATA]];
  }
  const descriptionTag = tags.filter((tag: any) => {
    return 'description' === tag.key;
  });

  const value = !descriptionTag.length ? NO_DATA : descriptionTag[0].value;

  return [[value]];
};

/**
 * @description createTableApexDoc
 * @param {*} item
 */
const createTableApexDoc = (item: any) => {
  return createTable(item, TABLE_HEADER_APEX_DOC, {
    createTableRows: _createTableRowsApexDoc
  });
};

/**
 * @description createListApexDoc
 * @param {*} item
 */
const createListApexDoc = (item: any) => {
  return !item
    ? { p: '' }
    : {
        ul: item.tags.map((tag: any) => {
          return `**\`${tag.key}\`** : ${tag.value}`;
        })
      };
};

/**
 * @description convertSignature
 * @param {*} signature
 */
const convertSignature = (signature: string) => {
  return signature
    .replace(REGEXP_PARAM_LEFT_PARENTHESIS, '(\n  ')
    .replace(REGEXP_PARAM_RIGHT_PARENTHESIS, '\n)')
    .replace(REGEXP_PARAM_COMMA, ',\n  ');
};

/**
 * @description _createCodeContent
 * @param {*} item
 */
const _createCodeContent = (item: any) => {
  const content = [];
  const signature = convertSignature(item.signature);
  content.push(signature);
  return content;
};

/**
 * @description createCode
 * @param {*} item
 */
const createCode = (item: any) => {
  return !item
    ? { p: '' }
    : {
        code: {
          language: 'java',
          content: _createCodeContent(item)
        }
      };
};

/**
 * @description createTarget
 * @param {*} body
 * @param {*} params
 * @param {*} funcs
 */
const createTarget = (params: any, body: any, funcs: any) => {
  const item = funcs.fetchItem(params, body);

  const result = [];
  result.push(funcs.createTitle(params));
  result.push(createTableApexDoc(item));
  result.push(
    !funcs.createTableHeader ? { p: '' } : funcs.createTableHeader(params)
  );
  result.push(funcs.createTableTarget(params));
  result.push(createListApexDoc(item));
  result.push(createCode(item));

  return result;
};

/**
 * @description createParameters
 * @param {*} parameters
 */
const createParameters = (parameters: any) => {
  return parameters.map((param: any) => {
    return `${param.type} ${param.name}`;
  });
};

/**
 * @description getModifierItems
 * @param {*} modifiers
 */
const getModifierItems = (modifiers: any) => {
  if (!modifiers.length) {
    return ['-'];
  }
  return modifiers.map((modi: any) => {
    return modi;
  });
};

/**
 * @description convert
 * @param {*} value
 */
const convert = (value: string) => {
  switch (value) {
    case 'static public':
      return 'public static';
    case 'static public final':
      return 'public static final';
    case 'private testMethod':
      return 'private';
    case 'private static testMethod':
      return 'static';
    case 'public testMethod with sharing':
      return 'public with sharing';
    case '@IsTest':
      return '@isTest';
    case '@TestSetup':
      return '@testSetup';
    default:
      return value;
  }
};

/**
 * @name getModifiers
 * @param {*} modifiers
 */
const getModifiers = (modifiers: any) => {
  return convert(getModifierItems(modifiers).join(' '));
};

/**
 * @description _fetchItem
 * @param {*} cons
 * @param {*} body
 */
const _fetchItem = (cons: any, body: any) => {
  const parameters = createParameters(cons.parameters);
  const modifiers = getModifiers(cons.modifiers);
  const signature = `${modifiers} ${cons.name}(${parameters.join(', ')})`;
  const item = body.constructors.filter((i: any) => {
    return signature === i.signature;
  });
  return !item.length ? null : item[0];
};

/**
 * @description _createTitle
 * @param {*} cons
 */
const _createTitle = (cons: any) => {
  return { h3: cons.name };
};

/**
 * @description _createTableRow
 * @param {*} params
 */
const _createTableRow = (params: any) => {
  const row = [];
  row.push(`${params.namespace}`);
  row.push(`${params.manageableState}`);
  row.push(`${params.apiVersion}`);
  return row;
};

/**
 * @description _createTableHeader
 * @param {*} params
 */
const _createTableHeader = (params: any) => {
  return createTable(params, TABLE_HEADER_HEADER, {
    createTableRow: _createTableRow
  });
};

/**
 * @description _createHeaderArea
 * @param {*} params
 * @param {*} funcs
 */
const _createHeaderArea = (params: any, funcs: any) => {
  const body = params.body;
  return createTarget(params, body, {
    fetchItem: _fetchItem,
    createTitle: _createTitle,
    createTableHeader: _createTableHeader,
    createTableTarget: funcs.createTableTarget
  });
};

/**
 * @description getAnnotationNames
 * @param {*} annotations
 */
const getAnnotationNames = (annotations: any) => {
  if (!annotations.length) {
    return ['-'];
  }
  return annotations.map((anno: any) => {
    return `@${anno.name}`;
  });
};

/**
 * @name getAnnotations
 * @param {*} annotations
 */
const getAnnotations = (annotations: any) => {
  return convert(getAnnotationNames(annotations).join(' '));
};

/**
 * @description getInterfaceNames
 * @param {*} interfaces
 */
const getInterfaceNames = (interfaces: any) => {
  if (!interfaces.length) {
    return ['-'];
  }
  return interfaces.map((inte: any) => {
    return inte.name;
  });
};

/**
 * @description createTableRowClass
 * @param {*} params
 */
const createTableRowClass = (params: any) => {
  const annotations = getAnnotations(params.annotations);
  const modifiers = getModifiers(params.modifiers);
  const parentClass = !params.parentClass ? '-' : params.parentClass;
  const interfaces = getInterfaceNames(params.interfaces).join(', ');

  const row = [];
  row.push(`${annotations}`);
  row.push(`${modifiers}`);
  row.push(`${params.name}`);
  row.push(`${parentClass}`);
  row.push(`${interfaces}`);
  return row;
};

/**
 * @description createTableClass
 * @param {*} params
 */
const createTableClass = (params: any) => {
  return createTable(params, TABLE_HEADER_CLASS, {
    createTableRow: createTableRowClass
  });
};

/**
 * @description _createTableRowTrigger
 * @param {*} params
 */
const _createTableRowTrigger = (params: any) => {
  const row = [];
  row.push(`${params.usageBeforeInsert ? 'Y' : ''}`);
  row.push(`${params.usageBeforeUpdate ? 'Y' : ''}`);
  row.push(`${params.usageBeforeDelete ? 'Y' : ''}`);
  row.push(`${params.usageAfterInsert ? 'Y' : ''}`);
  row.push(`${params.usageAfterUpdate ? 'Y' : ''}`);
  row.push(`${params.usageAfterDelete ? 'Y' : ''}`);
  row.push(`${params.usageAfterUndelete ? 'Y' : ''}`);
  return row;
};

/**
 * @description createTableTrigger
 * @param {*} params
 */
const createTableTrigger = (params: any) => {
  return createTable(params, TABLE_HEADER_TRIGGER, {
    createTableRow: _createTableRowTrigger
  });
};

/**
 * @description createHeaderArea
 * @param {*} params
 */
const createHeaderArea = (params: any) => {
  const apex = params.apex;
  const apexMember = params.apexMember;
  const body = params.body;
  // Common
  const namespace = apexMember.namespace;
  const manageableState = apex.ManageableState;
  const apiVersion = apex.ApiVersion.toFixed(1);
  const attributes = apex.attributes;
  const table = apexMember.tableDeclaration;
  const name = table.name;
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

  switch (attributes.type) {
    case 'ApexClass':
      return _createHeaderArea(
        {
          namespace: namespace,
          manageableState: manageableState,
          apiVersion: apiVersion,
          annotations: annotations,
          modifiers: modifiers,
          name: name,
          parentClass: parentClass,
          interfaces: interfaces,
          body: body
        },
        { createTableTarget: createTableClass }
      );
    case 'ApexTrigger':
      return _createHeaderArea(
        {
          namespace: namespace,
          manageableState: manageableState,
          apiVersion: apiVersion,
          usageBeforeInsert: usageBeforeInsert,
          usageBeforeUpdate: usageBeforeUpdate,
          usageBeforeDelete: usageBeforeDelete,
          usageAfterInsert: usageAfterInsert,
          usageAfterUpdate: usageAfterUpdate,
          usageAfterDelete: usageAfterDelete,
          usageAfterUndelete: usageAfterUndelete,
          name: name,
          entityDefinition: entityDefinition,
          body: body
        },
        { createTableTarget: createTableTrigger }
      );
    default:
      return {};
  }
};

/**
 * @description _createArea
 * @param {*} config
 * @param {*} params
 */
const _createArea = (config: any, params: any) => {
  const result = [];
  result.push({ h2: config.title });

  if (!params.items.length) {
    result.push({ p: NOT_APPLICABLE });
  } else {
    result.push(config.create(params));
  }

  return result;
};

/**
 * @description createTableExternalReferences
 * @param {*} params
 */
const createTableExternalReferences = (params: any) => {
  return createTable(params, TABLE_HEADER_EXTERNAL_REFERENCES, {
    createTableRow: _createTableRow,
    createTableRows: _createTableRows
  });
};

/**
 * @description createExternalReferences
 * @param {*} params
 */
const createExternalReferences = (params: any) => {
  const externalReferences = params.items;
  return createTableExternalReferences(externalReferences);
};

/**
 * @description createInnerExternalReferencesArea
 * @param {*} params
 */
const createInnerExternalReferencesArea = (params: any) => {
  const result = [];
  result.push({ h4: TITLE_EXTERNAL_REFERENCES });

  if (!params.length) {
    return [];
  }

  result.push(createTableExternalReferences(params));

  return result;
};

/**
 * @description _createTableRowConstructors
 * @param {*} cons
 */
const _createTableRowConstructors = (cons: any) => {
  const annotations = getAnnotations(cons.annotations);
  const modifiers = getModifiers(cons.modifiers);
  const parameters = !cons.parameters.length
    ? '-'
    : createParameters(cons.parameters).join(',<br>');

  const row = [];
  row.push(`${annotations}`);
  row.push(`${modifiers}`);
  row.push(`${cons.name}`);
  row.push(`${parameters}`);
  return row;
};

/**
 * @description _createTableRowsConstructors
 * @param {*} params
 * @param {*} funcs
 */
const _createTableRowsConstructors = (params: any, funcs: any) => {
  return !params.length
    ? [funcs.createTableRow(params)]
    : params.map((cons: any) => {
        return funcs.createTableRow(cons);
      });
};

/**
 * @description createTableConstructors
 * @param {*} params
 */
const createTableConstructors = (params: any) => {
  return createTable(params, TABLE_HEADER_CONSTRUCTORS, {
    createTableRow: _createTableRowConstructors,
    createTableRows: _createTableRowsConstructors
  });
};

/**
 * @description createInnerConstructorsArea
 * @param {*} params
 */
const createInnerConstructorsArea = (params: any) => {
  const result = [];
  result.push({ h4: TITLE_CONSTRUCTORS });

  if (!params.length) {
    return [];
  }

  result.push(createTableConstructors(params));

  return result;
};

/**
 * @description createTableRowProperty
 * @param {*} params
 */
const createTableRowProperty = (params: any) => {
  const annotations = getAnnotations(params.annotations);
  const modifiers = getModifiers(params.modifiers);

  const row = [];
  row.push(annotations);
  row.push(modifiers);
  row.push(params.type);
  row.push(params.name);
  return row;
};

/**
 * @description createTableProperties
 * @param {*} params
 * @param {*} funcs
 */
const createTableProperties = (params: any) => {
  return createTable(params, TABLE_HEADER_PROPERTIES, {
    createTableRow: createTableRowProperty,
    createTableRows: _createTableRows
  });
};

/**
 * @description createInnerPropertiesArea
 * @param {*} params
 */
const createInnerPropertiesArea = (params: any) => {
  const result = [];
  result.push({ h4: TITLE_PROPERTIES });

  if (!params.length) {
    return [];
  }

  result.push(createTableProperties(params));

  return result;
};

/**
 * @description createInnerClasses
 * @param {*} params
 */
const createInnerClasses = (params: any) => {
  const innerClasses = params.items;
  const body = params.body;

  return innerClasses.map((inne: any) => {
    const innerClass = {
      annotations: inne.tableDeclaration.annotations,
      modifiers: inne.tableDeclaration.modifiers,
      name: inne.name,
      parentClass: inne.parentClass,
      interfaces: inne.interfaces
    };

    const result = [];
    result.push(
      createTarget(innerClass, body, {
        fetchItem: _fetchItem,
        createTitle: _createTitle,
        createTableTarget: createTableClass
      })
    );
    result.push([createInnerExternalReferencesArea(inne.externalReferences)]);
    result.push([createInnerConstructorsArea(inne.constructors)]);
    result.push([createInnerPropertiesArea(inne.properties)]);

    return result;
  });
};

/**
 * @description createProperties
 * @param {*} params
 */
const createProperties = (params: any) => {
  const properties = params.items;
  const body = params.body;

  return properties.map((prop: any) => {
    return createTarget(prop, body, {
      fetchItem: _fetchItem,
      createTitle: _createTitle,
      createTableTarget: createTableProperties
    });
  });
};

/**
 * @description createConstructors
 * @param {*} params
 */
const createConstructors = (params: any) => {
  const constructors = params.items;
  const body = params.body;

  return constructors.map((cons: any) => {
    return createTarget(cons, body, {
      fetchItem: _fetchItem,
      createTitle: _createTitle,
      createTableTarget: createTableConstructors
    });
  });
};

/**
 * @description _createTableMethods
 * @param {*} meth
 */
const _createTableMethods = (meth: any) => {
  return createTable(meth, TABLE_HEADER_METHODS, {
    createTableRow: _createTableRow
  });
};

/**
 * @description createMethods
 * @param {*} params
 */
const createMethods = (params: any) => {
  const methods = params.items;
  const body = params.body;

  return methods.map((meth: any) => {
    return createTarget(meth, body, {
      fetchItem: _fetchItem,
      createTitle: _createTitle,
      createTableTarget: _createTableMethods
    });
  });
};

/**
 * @description _addRawData
 * @param {*} md
 * @param {*} json
 * @param {*} filename
 */
const _addRawData = (md: any, json: any, filename: string) => {
  md.push({ h2: 'Raw Data' });
  const h3List = Object.keys(json);
  for (let h3 of h3List) {
    md.push({ h3: h3 });
    md.push({ p: JSON.stringify(json[h3]) });
  }

  writeFileSyncUtf8(filename, json2md(md));
};

/**
 * @description generateMarkdownSpecs
 * @param {*} config
 * @param {*} apexMember
 */
const generateMarkdownSpecs = (params: any, apexMember: string) => {
  const jsonApex = _getJsonApex(params, apexMember);
  const jsonApexMember = _getJsonApexMember(params, apexMember);

  // TODO: 表示内容をON／OFFできるようにする

  // Title
  const title = `${jsonApexMember.name}${params.fileExtension}`;
  console.log(`\n---`);
  console.log(`\n# ${title}`);

  const md = [];
  md.push({ h1: title });

  const bodyHeader = parseBodyHeader(jsonApex.Body, jsonApex.attributes.type);
  const bodyInnerClass = parseBodyInnerClasses(jsonApex.Body);
  const bodyProperties = parseBodyProperties(jsonApex.Body);
  const bodyConstructors = parseBodyConstructors(jsonApex.Body);
  const bodyMethods = parseBodyMethods(jsonApex.Body);

  // Header
  md.push(
    createHeaderArea({
      apex: jsonApex,
      apexMember: jsonApexMember,
      body: bodyHeader
    })
  );
  md.push({ p: '<br>' });

  // External References
  md.push(
    _createArea(
      {
        title: TITLE_EXTERNAL_REFERENCES,
        create: createExternalReferences
      },
      {
        items: jsonApexMember.externalReferences
      }
    )
  );
  md.push({ p: '<br>' });

  if ('ApexClass' === jsonApex.attributes.type) {
    // Inner Classes
    md.push(
      _createArea(
        {
          title: TITLE_INNER_CLASSES,
          create: createInnerClasses
        },
        {
          items: jsonApexMember.innerClasses,
          body: bodyInnerClass
        }
      )
    );
    md.push({ p: '<br>' });

    // Properties
    md.push(
      _createArea(
        {
          title: TITLE_PROPERTIES,
          create: createProperties
        },
        {
          items: jsonApexMember.properties,
          body: bodyProperties
        }
      )
    );
    md.push({ p: '<br>' });

    // Constructors
    md.push(
      _createArea(
        {
          title: TITLE_CONSTRUCTORS,
          create: createConstructors
        },
        {
          items: jsonApexMember.constructors,
          body: bodyConstructors
        }
      )
    );
    md.push({ p: '<br>' });

    // Methods
    md.push(
      _createArea(
        {
          title: TITLE_METHODS,
          create: createMethods
        },
        {
          items: jsonApexMember.methods,
          body: bodyMethods
        }
      )
    );
    md.push({ p: '<br>' });
  }

  // archive
  writeFileSyncUtf8(`${params.docsFolder}/${apexMember}.md`, json2md(md));

  // raw data
  const filename = `${params.rawDataFolder}/${apexMember}.raw.md`;
  _addRawData(md, jsonApexMember, filename);
};

/**
 * @description generateDocs
 * @param {*} params
 */
async function generateDocs(params: any) {
  params.apexNames.forEach((apexName: string) => {
    generateMarkdownSpecs(params, apexName);
  });

  // TODO: BodyCrc と LengthWithoutComments を一覧化してチェックできるようにする
  // apexNames.forEach((apexName) => {
  //   generateMarkdownList(config, apexName);
  // });
}

/**
 * @description runBatch
 * @param {*} params
 */
async function runBatch(params: any) {
  // create ApexClassMembers / ApexTriggerMembers
  const apexMembers = await asyncCreateApexMembers({
    accessToken: params.accessToken,
    apex: params.apex,
    asOfVersion: params.asOfVersion,
    apexMember: params.apexMember,
    instanceUrl: params.instanceUrl,
    createLogFile: params.createLogFile,
    metadataContainerId: params.metadataContainerId
  });

  // create ContainerAsyncRequest
  const containerAsyncRequestId = await asyncCreateContainerAsyncRequestId({
    accessToken: params.accessToken,
    instanceUrl: params.instanceUrl,
    asOfVersion: params.asOfVersion,
    MetadataContainerId: params.metadataContainerId,
    createContainerAsyncRequest: params.createContainerAsyncRequest
  });

  // retrieve ContainerAsyncRequest - State
  let containerAsyncRequestState;
  while (COMPLETED !== containerAsyncRequestState) {
    containerAsyncRequestState = await asyncRetrieveContainerAsyncRequestState({
      accessToken: params.accessToken,
      instanceUrl: params.instanceUrl,
      asOfVersion: params.asOfVersion,
      retrieveContainerAsyncRequests: params.retrieveContainerAsyncRequests,
      containerAsyncRequestId: containerAsyncRequestId
    });

    await sleep(3);
  }

  // retrieve ApexClassMembers / ApexTriggerMembers
  const results = await asyncRetrieveApexMembers({
    accessToken: params.accessToken,
    instanceUrl: params.instanceUrl,
    asOfVersion: params.asOfVersion,
    symbolTableFolder: params.symbolTableFolder,
    apexMembers: apexMembers
  });

  // archive .json
  results.forEach((result: any) => {
    writeFileSyncUtf8(result.symbolTable.filename, result.symbolTable.contents);
    console.log(result.symbolTable.filename);
  });

  // generate .md from .json
  const apexNames = params.apex.map((a: any) => {
    return a.Name;
  });
  await generateDocs({
    apexNames: apexNames,
    fileExtension: params.fileExtension,
    docsFolder: params.docsFolder,
    rawDataFolder: params.rawDataFolder
  });
}

/**
 * @description buildApexSpecs
 * @param config
 * @param params
 */
async function buildApexSpecs(config: any, params: authorization) {
  // create MetadataContainerId
  const metadataContainerId = await asyncCreateMetadataContainerId({
    accessToken: params.accessToken,
    instanceUrl: params.instanceUrl,
    asOfVersion: params.options.asOfVersion,
    createMetadataContainer:
      params.options.environment.logs.createMetadataContainer
  });

  // retrieve ApexClasses / ApexTriggers
  const apexRecords = await asyncRetrieveApex({
    accessToken: params.accessToken,
    instanceUrl: params.instanceUrl,
    asOfVersion: params.options.asOfVersion,
    getApex: config.getApex,
    fields: config.fields,
    retrieveLogFile: config.retrieveLogFile
  });

  // run the batch operation because the request can’t contain more than 25 operations.
  const size = JSON.parse(readFileSyncUtf8(config.retrieveLogFile)).size;
  const scope = COMPOSITE_OPERATIONS_LIMIT;
  let start = 0;
  while (start < Math.ceil(size / scope)) {
    const apex = apexRecords.slice(start, start + scope - 1);

    /**
     * 1. create ApexClassMembers / ApexTriggerMembers
     * 2. create ContainerAsyncRequest
     * 3. retrieve ContainerAsyncRequest - State
     * 4. retrieve ApexClassMembers / ApexTriggerMembers
     * 5. archive .json
     */
    await runBatch({
      accessToken: params.accessToken,
      instanceUrl: params.instanceUrl,
      asOfVersion: params.options.asOfVersion,
      createContainerAsyncRequest:
        params.options.environment.logs.createContainerAsyncRequest,
      retrieveContainerAsyncRequests:
        params.options.environment.logs.retrieveContainerAsyncRequests,
      apexMember: config.apexMember,
      createLogFile: config.createLogFile,
      fileExtension: config.fileExtension,
      docsFolder: config.docsFolder,
      rawDataFolder: config.rawDataFolder,
      retrieveLogFile: config.retrieveLogFile,
      symbolTableFolder: config.symbolTableFolder,
      apex: apex,
      metadataContainerId: metadataContainerId
    });

    start += scope;
  }

  return null;
}

/**
 * @description buildApexClassSpecs
 * @param params
 */
export async function buildApexClassSpecs(params: authorization) {
  const config = setConfig(params.options.environment, 'ApexClass');
  return await buildApexSpecs(config, params);
}

/**
 * @description buildApexTriggerSpecs
 * @param params
 */
export async function buildApexTriggerSpecs(params: authorization) {
  const config = setConfig(params.options.environment, 'ApexTrigger');
  return await buildApexSpecs(config, params);
}
