/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/**
 * body.ts
 */
import { authorization } from 'heat-sfdx-common';
import { getAnnotations, getModifiers } from './common';
import { TITLE } from './title';
import {
  TABLE_HEADER,
  createClassTableRow,
  createPropertyTableRow,
  createConstructorsTableRow,
  createParameters
} from './table';

const NOT_APPLICABLE = 'N/A';

export const buildExternalReferences = (
  auth: authorization,
  jsonApexMember: any
) => {
  const _items = jsonApexMember.externalReferences;

  const result = [];
  result.push({ h2: TITLE.EXTERNAL_REFERENCES });

  if (!_items?.length) {
    result.push({ p: NOT_APPLICABLE });
  } else {
    // ['Namespace', 'Name', 'Variables', 'Methods']
    const _rows = _items.map((item: any) => {
      const _row = [];
      const _namespace = !item.namespace ? '-' : item.namespace;
      const _variables = !item?.variables?.length
        ? ['-']
        : item.variables?.map((variable: any) => {
            return variable.name;
          });
      const _methods = !item?.methods?.length
        ? ['-']
        : item.methods?.map((method: any) => {
            return method.name;
          });
      _row.push(`${_namespace}`);
      _row.push(`${item.name}`);
      _row.push(`${_variables.join('<br>')}`);
      _row.push(`${_methods.join('<br>')}`);
      return _row;
    });

    result.push({
      table: {
        headers: TABLE_HEADER.EXTERNAL_REFERENCES,
        rows: _rows.sort()
      }
    });
  }

  return result;
};

// TODO High: うまく表示できてない
export const buildInnerClasses = (auth: authorization, jsonApexMember: any) => {
  const _items = jsonApexMember.innerClasses;

  const result = [];
  result.push({ h2: TITLE.INNER_CLASSES });

  if (!_items?.length) {
    result.push({ p: NOT_APPLICABLE });
  } else {
    // ['Annotation', 'Modifier', 'Name', 'Parent Class', 'Interfaces']
    const _rows = _items.map((item: any) => {
      return createClassTableRow(item);
    });

    result.push({
      table: {
        headers: TABLE_HEADER.CLASS,
        rows: _rows.sort()
      }
    });
  }

  //   const innerClasses = extractApexDoc(body, regexp);
  //   console.info(`\n## Inner Class`);
  //   console.info(JSON.stringify(innerClasses));

  //   return {
  //     innerClasses: innerClasses
  //   };

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

  return result;
};

export const buildProperties = (auth: authorization, jsonApexMember: any) => {
  const _items = jsonApexMember.properties;

  const result = [];
  result.push({ h2: TITLE.PROPERTIES });

  if (!_items?.length) {
    result.push({ p: NOT_APPLICABLE });
  } else {
    // ['Annotations', 'Modifier', 'Type', 'Name']
    const _rows = _items.map((item: any) => {
      return createPropertyTableRow(item);
    });

    result.push({
      table: {
        headers: TABLE_HEADER.PROPERTIES,
        rows: _rows.sort()
      }
    });
  }

  //   return _parseBodyProperties(body, [
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
  //   ]);

  //   regexps.forEach((regexp: any) => {
  //     const _properties = extractApexDoc(body, regexp);
  //     properties = properties.concat(_properties);
  //   });

  return result;
};

export const buildConstructors = (auth: authorization, jsonApexMember: any) => {
  const _items = jsonApexMember.constructors;

  const result = [];
  result.push({ h2: TITLE.CONSTRUCTORS });

  if (!_items?.length) {
    result.push({ p: NOT_APPLICABLE });
  } else {
    // ['Annotation', 'Modifier', 'Name', 'Parameters']
    const _rows = _items.map((item: any) => {
      return createConstructorsTableRow(item);
    });

    result.push({
      table: {
        headers: TABLE_HEADER.CONSTRUCTORS,
        rows: _rows.sort()
      }
    });
  }

  //   return _parseBodyConstructors(body, {
  //     target: REGEXP_CONSTRUCTOR,
  //     tags: REGEXP_TAGS_CONSTRUCTOR,
  //     tagsArea: REGEXP_TAGS_AREA_CONSTRUCTOR,
  //     annotationsEnd: REGEXP_ANNOTATIONS_END_CONSTRUCTOR,
  //     signatureStart: REGEXP_SIGNATURE_START_CONSTRUCTOR,
  //     signatureEnd: REGEXP_SIGNATURE_END_CONSTRUCTOR
  //   });

  return result;
};

export const buildMethods = (auth: authorization, jsonApexMember: any) => {
  const _items = jsonApexMember.methods;

  const result = [];
  result.push({ h2: TITLE.METHODS });

  if (!_items?.length) {
    result.push({ p: NOT_APPLICABLE });
  } else {
    // ['Annotation', 'Modifier', 'Return Type', 'Name', 'Parameters']
    const _rows = _items.map((item: any) => {
      const annotations = getAnnotations(item.annotations);
      const modifiers = getModifiers(item.modifiers);
      const parameters = !item?.parameters?.length
        ? '-'
        : createParameters(item.parameters).join(',<br>');
      const _type = !item.type ? 'void' : item.type;

      const _row = [];
      _row.push(`${annotations}`);
      _row.push(`${modifiers}`);
      _row.push(`${_type}`);
      _row.push(`${item.name}`);
      _row.push(`${parameters}`);
      return _row;
    });

    result.push({
      table: {
        headers: TABLE_HEADER.METHODS,
        rows: _rows.sort()
      }
    });
  }

  return result;
};
