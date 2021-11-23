// TODO:
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * parse.ts
 */
import json2md from 'json2md';
import {
  authorization,
  readFileSyncUtf8,
  writeFileSyncUtf8
} from 'heat-sfdx-common';
import {
  createHeaderTable,
  createClassTable,
  createTriggerTable,
  createApexDocTable,
  createConstructorsTable,
  createExternalReferencesTable,
  createMethodsTable,
  createPropertiesTable
} from './md/table';
import { TITLE } from './md/title';

/*********************
 * common
 *********************/
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
const TABLE_HEADER_PARAMETERS = ['Type', 'Name'];

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

// /**
//  * @description parseBodyInnerClasses
//  * @param {*} body
//  */
// export const parseBodyInnerClasses = (body: any) => {
//   const regexp = {
//     target: REGEXP_INNER_CLASS,
//     tags: REGEXP_TAGS_INNER_CLASS,
//     tagsArea: REGEXP_TAGS_AREA_INNER_CLASS,
//     annotationsEnd: REGEXP_ANNOTATIONS_END_INNER_CLASS,
//     signatureStart: REGEXP_SIGNATURE_START_INNER_CLASS,
//     signatureEnd: REGEXP_SIGNATURE_END_INNER_CLASS
//   };

//   const innerClasses = extractApexDoc(body, regexp);
//   // console.info(`\n## Inner Class`);
//   // console.info(JSON.stringify(innerClasses));

//   return {
//     innerClasses: innerClasses
//   };
// };

// /**
//  * @description parseBodyProperties
//  * @param {*} body
//  */
// export const parseBodyProperties = (body: any) => {
//   const regexps = [
//     {
//       target: REGEXP_PROPERTY,
//       tags: REGEXP_TAGS_PROPERTY,
//       tagsArea: REGEXP_TAGS_AREA_PROPERTY,
//       annotationsEnd: REGEXP_ANNOTATIONS_END_PROPERTY,
//       signatureStart: REGEXP_SIGNATURE_START_PROPERTY,
//       signatureEnd: REGEXP_SIGNATURE_END_PROPERTY
//     },
//     {
//       target: REGEXP_PROPERTY_GET_SET,
//       tags: REGEXP_TAGS_PROPERTY,
//       tagsArea: REGEXP_TAGS_AREA_PROPERTY,
//       annotationsEnd: REGEXP_ANNOTATIONS_END_PROPERTY,
//       signatureStart: REGEXP_SIGNATURE_START_PROPERTY,
//       signatureEnd: REGEXP_SIGNATURE_END_PROPERTY
//     }
//   ];

//   let properties: any = [];
//   regexps.forEach((regexp: any) => {
//     const _properties = extractApexDoc(body, regexp);
//     properties = properties.concat(_properties);
//   });

//   // console.info(`\n## Properties`);
//   // console.info(JSON.stringify(properties));

//   return {
//     properties: properties
//   };
// };

// /**
//  * @description parseBodyConstructors
//  * @param {*} body
//  */
// export const parseBodyConstructors = (body: any) => {
//   const regexp = {
//     target: REGEXP_CONSTRUCTOR,
//     tags: REGEXP_TAGS_CONSTRUCTOR,
//     tagsArea: REGEXP_TAGS_AREA_CONSTRUCTOR,
//     annotationsEnd: REGEXP_ANNOTATIONS_END_CONSTRUCTOR,
//     signatureStart: REGEXP_SIGNATURE_START_CONSTRUCTOR,
//     signatureEnd: REGEXP_SIGNATURE_END_CONSTRUCTOR
//   };

//   const constructors = extractApexDoc(body, regexp);
//   // console.info(`\n## Constructors`);
//   // console.info(JSON.stringify(constructors));

//   return {
//     constructors: constructors
//   };
// };

// /**
//  * @description parseBodyMethods
//  * @param {*} body
//  */
// export const parseBodyMethods = (body: any) => {
//   const regexp = {
//     target: REGEXP_METHOD,
//     tags: REGEXP_TAGS_METHOD,
//     tagsArea: REGEXP_TAGS_AREA_METHOD,
//     annotationsEnd: REGEXP_ANNOTATIONS_END_METHOD,
//     signatureStart: REGEXP_SIGNATURE_START_METHOD,
//     signatureEnd: REGEXP_SIGNATURE_END_METHOD,
//     keyStart: REGEXP_KEY_START_METHOD
//   };

//   const methods = extractApexDoc(body, regexp);
//   // console.info(`\n## Methods`);
//   // console.info(JSON.stringify(methods));

//   return {
//     methods: methods
//   };
// };

// /**
//  * @description createInnerClasses
//  * @param {*} params
//  */
// export const createInnerClasses = (params: any) => {
//   const innerClasses = params.items;
//   const body = params.body;

//   return !innerClasses
//     ? []
//     : innerClasses.map((inne: any) => {
//         const innerClass = {
//           annotations: inne.tableDeclaration.annotations,
//           modifiers: inne.tableDeclaration.modifiers,
//           name: inne.name,
//           parentClass: inne.parentClass,
//           interfaces: inne.interfaces
//         };

//         const result = [];
//         result.push(
//           createTarget({
//             item: innerClass,
//             body: body,
//             func: {
//               fetchItem: fetchItem,
//               createTitle: _createTitle,
//               createTableTarget: createClassTable
//             }
//           })
//         );
//         result.push([
//           createInnerExternalReferencesArea(inne.externalReferences)
//         ]);
//         result.push([createInnerConstructorsArea(inne.constructors)]);
//         result.push([createInnerPropertiesArea(inne.properties)]);

//         return result;
//       });
// };

// /**
//  * @description createProperties
//  * @param {*} params
//  */
// export const createProperties = (params: any) => {
//   const properties = params.items;
//   const body = params.body;

//   return !properties
//     ? []
//     : properties.map((prop: any) => {
//         return createTarget({
//           item: prop,
//           body: body,
//           func: {
//             fetchItem: fetchItem,
//             createTitle: _createTitle,
//             createTableTarget: createPropertiesTable
//           }
//         });
//       });
// };

// /**
//  * @description createConstructors
//  * @param {*} params
//  */
// export const createConstructors = (params: any) => {
//   const constructors = params.items;
//   const body = params.body;

//   return !constructors
//     ? []
//     : constructors.map((cons: any) => {
//         return createTarget({
//           item: cons,
//           body: body,
//           func: {
//             fetchItem: fetchItem,
//             createTitle: _createTitle,
//             createTableTarget: createConstructorsTable
//           }
//         });
//       });
// };

// /**
//  * @description createMethods
//  * @param {*} params
//  */
// export const createMethods = (params: any) => {
//   const methods = params.items;
//   const body = params.body;

//   return !methods
//     ? []
//     : methods.map((meth: any) => {
//         return createTarget({
//           item: meth,
//           body: body,
//           func: {
//             fetchItem: fetchItem,
//             createTitle: _createTitle,
//             createTableTarget: createMethodsTable
//           }
//         });
//       });
// };

// /**
//  * @description addRawData
//  * @param {*} md
//  * @param {*} json
//  * @param {*} filename
//  */
// export const addRawData = (md: any, json: any, filename: string) => {
//   md.push({ h2: 'Raw Data' });
//   const h3List = Object.keys(json);
//   for (const h3 of h3List) {
//     md.push({ h3: h3 });
//     md.push({ p: JSON.stringify(json[h3]) });
//   }

//   writeFileSyncUtf8(filename, json2md(md));
// };

/**
 * @description createInnerConstructorsArea
 * @param {*} params
 */
const createInnerConstructorsArea = (params: any) => {
  const result = [];
  result.push({ h4: TITLE.CONSTRUCTORS });

  if (!params?.length) {
    return [];
  }

  result.push(createConstructorsTable(params));

  return result;
};

/**
 * @description createInnerPropertiesArea
 * @param {*} params
 */
const createInnerPropertiesArea = (params: any) => {
  const result = [];
  result.push({ h4: TITLE.PROPERTIES });

  if (!params?.length) {
    return [];
  }

  result.push(createPropertiesTable(params));

  return result;
};

/**
 * @description createInnerExternalReferencesArea
 * @param {*} params
 */
const createInnerExternalReferencesArea = (params: any) => {
  const result = [];
  result.push({ h4: TITLE.EXTERNAL_REFERENCES });

  if (!params?.length) {
    return [];
  }

  result.push(createExternalReferencesTable(params));

  return result;
};

// const TITLE_CONSTRUCTORS = 'Constructors';
// const TITLE_PROPERTIES = 'Properties';
// const TITLE_EXTERNAL_REFERENCES = 'External References';
