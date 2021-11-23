/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/**
 * common.ts
 */
import { authorization, readFileSyncUtf8 } from 'heat-sfdx-common';
import { createApexDocTable } from './table';

const ACCESS_MODIFIER = `[private|protected|public|global]*[\\sabstract|\\svirtual|\\soverride]*[\\sstatic|\\stransient]*[\\sfinal]*[with|without|inherited]*[\\ssharing]*`;
const ANNOTATIONS = `[\\@\\w\\(\\=\\'\\/\\)\\n]*`;
const ANNOTATIONS_END = '\\n\\s+';
const NAME = `(\\w+)`;
const VALUE = `(.+(\\s\\(\\)\\.<>,:;='")*)`;
const BODY_ITEM = `\\s\\*\\s\\@${NAME}\\s${VALUE}\\n`;

const CLASS = {
  OPTIONS: `(extends\\s[\\w<>]+\\s|implements\\s\\w+\\s)*`,
  SIGNATURE_END: `\\s*\\{`
};

const TRIGGER = {
  PARAMS: `[\\w\\s\\n,]+`
};

const TAGS = {
  AREA_START: `\\/\\*+\\n`,
  AREA_END: `\\s+\\*+\\/\\n`,
  BODY: `([${BODY_ITEM}]+)`
};

export const REGEXP = {
  HEADER_CLASS: new RegExp(
    `^${TAGS.AREA_START}${TAGS.BODY}${TAGS.AREA_END}` +
      `${ANNOTATIONS}` +
      `${ACCESS_MODIFIER}` +
      `\\sclass\\s${NAME}\\s${CLASS.OPTIONS}${CLASS.SIGNATURE_END}`,
    'g'
  ),
  HEADER_TRIGGER: new RegExp(
    `^${TAGS.AREA_START}${TAGS.BODY}${TAGS.AREA_END}` +
      `${ANNOTATIONS}` +
      `trigger\\s${NAME}\\son\\s${NAME}\\(${TRIGGER.PARAMS}\\)${CLASS.SIGNATURE_END}`,
    'g'
  ),
  TAGS_HEADER: new RegExp(BODY_ITEM, 'g'),
  TAGS_AREA_HEADER: new RegExp(
    `${TAGS.AREA_START}${TAGS.BODY}${TAGS.AREA_END}`,
    'g'
  ),
  ANNOTATIONS_END_HEADER: new RegExp(ANNOTATIONS_END),
  SIGNATURE_START_HEADER: '',
  SIGNATURE_END_HEADER: new RegExp(CLASS.SIGNATURE_END),
  PARAM_LIST_TYPE: new RegExp(`<+[\\w.]*>+`, 'g'),
  PARAM_LEFT_PARENTHESIS: new RegExp(`\\(\\n\\s*`, 'g'),
  PARAM_RIGHT_PARENTHESIS: new RegExp(`\\n\\s*\\)`, 'g'),
  PARAM_COMMA: new RegExp(`,\\n\\s*`, 'g')
};

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
 * @description extractApexDoc
 * @param {*} body
 * @param {*} regexp
 */
export const extractApexDoc = (body: any, regexp: any) => {
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
          .replace(REGEXP.PARAM_LIST_TYPE, '')
          .replace(REGEXP.PARAM_LEFT_PARENTHESIS, '(')
          .replace(REGEXP.PARAM_RIGHT_PARENTHESIS, ')')
          .replace(REGEXP.PARAM_COMMA, ', ');

        return {
          tags: tags,
          name: name,
          signature: signature,
          key: key
        };
      });
};

/**
 * @description createTarget
 * @param {*} params
 */
export const createTarget = (params: any) => {
  const item = params.func.fetchItem(params.item, params.body);

  const result = [];
  result.push(params.func.createTitle(params.item));
  result.push(createApexDocTable(item));
  result.push(
    !params.func.createTableHeader
      ? { p: '' }
      : params.func.createTableHeader(params.item)
  );
  result.push(params.func.createTableTarget(params.item));
  result.push(createListApexDoc(item));
  result.push(createCode(item));

  return result;
};

/**
 * @description fetchItem
 * @param {*} cons
 * @param {*} body
 */
export const fetchItem = (cons: any, body: any) => {
  const parameters = createParameters(cons.parameters);
  const modifiers = getModifiers(cons.modifiers);
  const signature = `${modifiers} ${cons.name}(${parameters.join(', ')})`;
  const item = !body?.constructors
    ? []
    : body.constructors.filter((i: any) => {
        return signature === i.signature;
      });
  return !item?.length ? null : item[0];
};

/**
 * @description createTitle
 * @param {*} item
 */
export const createTitle = (item: any) => {
  return { h3: item.name };
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
 * @description createParameters
 * @param {*} parameters
 */
const createParameters = (parameters: any) => {
  return !parameters
    ? []
    : parameters.map((param: any) => {
        return `${param.type} ${param.name}`;
      });
};

/**
 * @name getModifiers
 * @param {*} modifiers
 */
export const getModifiers = (modifiers: any) => {
  return convert(getModifierItems(modifiers).join(' '));
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
 * @description getModifierItems
 * @param {*} modifiers
 */
const getModifierItems = (modifiers: any) => {
  if (!modifiers?.length) {
    return ['-'];
  }
  return modifiers.map((modi: any) => {
    return modi;
  });
};

/**
 * @description convertSignature
 * @param {*} signature
 */
const convertSignature = (signature: string) => {
  return signature
    .replace(REGEXP.PARAM_LEFT_PARENTHESIS, '(\n  ')
    .replace(REGEXP.PARAM_RIGHT_PARENTHESIS, '\n)')
    .replace(REGEXP.PARAM_COMMA, ',\n  ');
};

/**
 * @name getAnnotations
 * @param {*} annotations
 */
export const getAnnotations = (annotations: any) => {
  return convert(getAnnotationNames(annotations).join(' '));
};

/**
 * @description getInterfaceNames
 * @param {*} interfaces
 */
export const getInterfaceNames = (interfaces: any) => {
  if (!interfaces?.length) {
    return ['-'];
  }
  return interfaces.map((inte: any) => {
    return inte.name;
  });
};

/**
 * @description getAnnotationNames
 * @param {*} annotations
 */
const getAnnotationNames = (annotations: any) => {
  if (!annotations?.length) {
    return ['-'];
  }
  return annotations.map((anno: any) => {
    return `@${anno.name}`;
  });
};

/**
 * @description getParentClass
 * @param {*} parentClass
 */
export const getParentClass = (parentClass: any) => {
  if (!parentClass) {
    return '-';
  }
  return parentClass;
};
