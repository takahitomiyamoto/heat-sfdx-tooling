/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * code.ts
 */
import { REGEXP, getModifiers } from './common';

/**
 * @description _convertSignature
 * @param {*} signature
 */
const _convertSignature = (signature: string) => {
  return signature
    .replace(REGEXP.PARAM_LEFT_PARENTHESIS, '(\n  ')
    .replace(REGEXP.PARAM_RIGHT_PARENTHESIS, '\n)')
    .replace(REGEXP.PARAM_COMMA, ',\n  ');
};

// /**
//  * @description _createCodeContent
//  * @param {*} item
//  */
// const _createCodeContent = (item: any) => {
//   // const modifiers = getModifiers(item.modifiers);
//   // const _signature = `${modifiers} ${item.name}(${parameters.join(', ')})`;
//   // const signature = _convertSignature(_signature);

//   const content = [];
//   // content.push(signature);
//   return content;
// };

/**
 * @description createCodeSignatureClass
 * @param {*} params
 */
export const createCodeSignatureClass = (params: any) => {
  if (!params.item) {
    return { p: '' };
  }
  const modifiers = getModifiers(params.item.modifiers);
  const signature = `${modifiers} class ${params.item.name}`;

  const content = [];
  content.push(_convertSignature(signature));

  return {
    code: {
      language: 'java',
      content: content
    }
  };
};

/**
 * @description createCodeSignatureTrigger
 * @param {*} params
 */
export const createCodeSignatureTrigger = (params: any) => {
  if (!params.item) {
    return { p: '' };
  }
  const modifiers = getModifiers(params.item.modifiers);
  const signature = `${modifiers} class ${params.item.name}`;

  const content = [];
  content.push(_convertSignature(signature));

  return {
    code: {
      language: 'java',
      content: content
    }
  };
};
