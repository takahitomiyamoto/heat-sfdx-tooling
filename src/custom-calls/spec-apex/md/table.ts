// TODO:
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

/**
 * table.ts
 */
import {
  getAnnotations,
  getModifiers,
  getInterfaceNames,
  getParentClass
} from './common';

export const TABLE_HEADER = {
  HEADER: [
    'Namespace',
    'Manageable State',
    'API Version',
    'Cyclic Redundancy Check',
    'Length of the Class without Comments'
  ],
  CLASS: ['Annotation', 'Modifier', 'Name', 'Parent Class', 'Interfaces'],
  TRIGGER: [
    'Before Insert',
    'Before Update',
    'Before Delete',
    'After Insert',
    'After Update',
    'After Delete',
    'After Undelete'
  ],
  APEX_DOC: ['Description'],
  CONSTRUCTORS: ['Annotation', 'Modifier', 'Name', 'Parameters'],
  EXTERNAL_REFERENCES: ['Namespace', 'Name', 'Variables', 'Methods'],
  PROPERTIES: ['Annotations', 'Modifier', 'Type', 'Name'],
  METHODS: ['Annotation', 'Modifier', 'Return Type', 'Name', 'Parameters']
};
const NO_DATA =
  '※ ApexDoc が存在しないか、該当する Signature が見つかりません。';

/**
 * @description createParameters
 * @param {*} parameters
 */
// TODO: 可能ならparse.tsに
export const createParameters = (parameters: any) => {
  return !parameters
    ? []
    : parameters.map((param: any) => {
        return `${param.type} ${param.name}`;
      });
};

// ----------
// TableRow (table-row.ts)
// ----------
/**
 * @description createTableRow
 * @param {*} item
 */
const createTableRow = (item: any) => {
  const row = [];
  row.push(`${item.namespace}`);
  row.push(`${item.manageableState}`);
  row.push(`${item.apiVersion}`);
  return row;
};

/**
 * @description createClassTableRow
 * @param {*} item
 */
export const createClassTableRow = (item: any) => {
  const annotations = getAnnotations(item.annotations);
  const modifiers = getModifiers(item.modifiers);
  const parentClass = getParentClass(item.parentClass);
  const interfaces = getInterfaceNames(item.interfaces).join(', ');
  const className = item.name;

  const row = [];
  row.push(`${annotations}`);
  row.push(`${modifiers}`);
  row.push(`${className}`);
  row.push(`${parentClass}`);
  row.push(`${interfaces}`);
  return row;
};

/**
 * @description createTriggerTableRow
 * @param {*} item
 */
const createTriggerTableRow = (item: any) => {
  const row = [];
  row.push(`${item.usageBeforeInsert ? 'Y' : ''}`);
  row.push(`${item.usageBeforeUpdate ? 'Y' : ''}`);
  row.push(`${item.usageBeforeDelete ? 'Y' : ''}`);
  row.push(`${item.usageAfterInsert ? 'Y' : ''}`);
  row.push(`${item.usageAfterUpdate ? 'Y' : ''}`);
  row.push(`${item.usageAfterDelete ? 'Y' : ''}`);
  row.push(`${item.usageAfterUndelete ? 'Y' : ''}`);
  return row;
};

/**
 * @description createConstructorsTableRow
 * @param {*} item
 */
export const createConstructorsTableRow = (item: any) => {
  const annotations = getAnnotations(item.annotations);
  const modifiers = getModifiers(item.modifiers);
  const parameters = !item?.parameters?.length
    ? '-'
    : createParameters(item.parameters).join(',<br>');

  const row = [];
  row.push(`${annotations}`);
  row.push(`${modifiers}`);
  row.push(`${item.name}`);
  row.push(`${parameters}`);
  return row;
};

/**
 * @description createPropertyTableRow
 * @param {*} params
 */
export const createPropertyTableRow = (item: any) => {
  const annotations = getAnnotations(item.annotations);
  const modifiers = getModifiers(item.modifiers);

  const row = [];
  row.push(annotations);
  row.push(modifiers);
  row.push(item.type);
  row.push(item.name);
  return row;
};

// ----------
// TableRows (table-row.ts)
// ----------
/**
 * @description createTableRows
 * @param {*} params
 */
const createTableRows = (item: any, func: any) => {
  const rows = [];
  rows.push(func.createTableRow(item));
  return rows;
};

/**
 * @description createApexDocTableRows
 * @param {*} item
 */
const createApexDocTableRows = (item: any) => {
  const tags = item?.tags;
  if (!tags) {
    return [[NO_DATA]];
  }
  const descriptionTag = tags.filter((tag: any) => {
    return 'description' === tag.key;
  });

  const value = !descriptionTag?.length ? NO_DATA : descriptionTag[0].value;

  return [[value]];
};

/**
 * @description createConstructorsTableRows
 * @param {*} item
 * @param {*} func
 */
const createConstructorsTableRows = (item: any, func: any) => {
  // TODO: リファクタリング
  return !item?.length
    ? [func.createTableRow(item)]
    : item.map((cons: any) => {
        return func.createTableRow(cons);
      });
};

// ----------
// Table
// ----------
/**
 * @description createTable
 * @param {*} params
 */
const createTable = (params: any) => {
  const rows = [];
  if (!params.func.createTableRows) {
    // rows.push(params.func.createTableRow(params.item));
    rows.push(params.func.createTableRow(params.items));
  } else {
    // rows.push(params.func.createTableRows(params.item, params.func));
    rows.push(params.func.createTableRows(params.items, params.func));
  }

  return {
    table: {
      headers: params.headers,
      rows: rows
    }
  };
};

/**
 * @description createHeaderTable
 * @param {*} params
 */
export const createHeaderTable = (params: any) => {
  return createTable({
    item: params,
    headers: TABLE_HEADER.HEADER,
    func: {
      createTableRow: createTableRow
    }
  });
};

/**
 * @description createClassTable
 * @param {*} params
 */
export const createClassTable = (params: any) => {
  return createTable({
    item: params,
    headers: TABLE_HEADER.CLASS,
    func: {
      createTableRow: createClassTableRow
    }
  });
};

/**
 * @description createTriggerTable
 * @param {*} params
 */
export const createTriggerTable = (params: any) => {
  return createTable({
    item: params,
    headers: TABLE_HEADER.TRIGGER,
    func: {
      createTableRow: createTriggerTableRow
    }
  });
};

/**
 * @description createApexDocTable
 * @param {*} params
 */
export const createApexDocTable = (params: any) => {
  return createTable({
    item: params,
    headers: TABLE_HEADER.APEX_DOC,
    func: {
      createTableRows: createApexDocTableRows
    }
  });
};

/**
 * @description createConstructorsTable
 * @param {*} params
 */
export const createConstructorsTable = (params: any) => {
  return createTable({
    item: params,
    headers: TABLE_HEADER.CONSTRUCTORS,
    func: {
      createTableRow: createConstructorsTableRow,
      createTableRows: createConstructorsTableRows
    }
  });
};

/**
 * @description createExternalReferencesTable
 * @param {*} params
 */
export const createExternalReferencesTable = (params: any) => {
  return createTable({
    item: params,
    headers: TABLE_HEADER.EXTERNAL_REFERENCES,
    func: {
      createTableRow: createTableRow,
      createTableRows: createTableRows
    }
  });
};

/**
 * @description createPropertiesTable
 * @param {*} params
 */
export const createPropertiesTable = (params: any) => {
  return createTable({
    item: params,
    headers: TABLE_HEADER.PROPERTIES,
    func: {
      createTableRow: createPropertyTableRow,
      createTableRows: createTableRows
    }
  });
};

/**
 * @description createMethodsTable
 * @param {*} params
 */
export const createMethodsTable = (params: any) => {
  return createTable({
    item: params,
    headers: TABLE_HEADER.METHODS,
    func: {
      createTableRow: createTableRow
    }
  });
};

/**
 * @description createTableHeader
 * @param {*} params
 */
export const createTableHeader = (params: any) => {
  const rows = [];
  const _namespace = !params.item.namespace ? '-' : params.item.namespace;

  rows.push(`${_namespace}`);
  rows.push(`${params.item.manageableState}`);
  rows.push(`${params.item.apiVersion}`);
  rows.push(`${params.item.apexBodyCrc}`);
  rows.push(`${params.item.apexLengthWithoutComments}`);

  return {
    table: {
      headers: TABLE_HEADER.HEADER,
      rows: [rows]
    }
  };
};

/**
 * @description createTableHeaderApexDoc
 * @param {*} params
 */
export const createTableHeaderApexDoc = (params: any) => {
  // const tags = params.item?.tags;
  const tags = params.item?.body?.header[0]?.tags;

  if (!tags) {
    return {
      table: {
        headers: TABLE_HEADER.APEX_DOC,
        rows: [[NO_DATA]]
      }
    };
  }

  const descriptionTag = tags.filter((tag: any) => {
    return 'description' === tag.key;
  });
  const value = !descriptionTag?.length ? NO_DATA : descriptionTag[0].value;

  const rows = [];
  rows.push(value);

  return {
    table: {
      headers: TABLE_HEADER.APEX_DOC,
      rows: [rows]
    }
  };
};

/**
 * @description createTableSignatureClass
 * @param {*} params
 */
export const createTableSignatureClass = (params: any) => {
  const annotations = getAnnotations(params.item.annotations);
  const modifiers = getModifiers(params.item.modifiers);
  const parentClass = getParentClass(params.item.parentClass);
  const interfaces = getInterfaceNames(params.item.interfaces).join(', ');
  const className = params.item.name;

  const rows = [];
  rows.push(`${annotations}`);
  rows.push(`${modifiers}`);
  rows.push(`${className}`);
  rows.push(`${parentClass}`);
  rows.push(`${interfaces}`);

  return {
    table: {
      headers: TABLE_HEADER.CLASS,
      rows: [rows]
    }
  };
};

/**
 * @description createTableSignatureTrigger
 * @param {*} params
 */
export const createTableSignatureTrigger = (params: any) => {
  const rows = [];
  rows.push(`${params.item.usageBeforeInsert ? 'Y' : ''}`);
  rows.push(`${params.item.usageBeforeUpdate ? 'Y' : ''}`);
  rows.push(`${params.item.usageBeforeDelete ? 'Y' : ''}`);
  rows.push(`${params.item.usageAfterInsert ? 'Y' : ''}`);
  rows.push(`${params.item.usageAfterUpdate ? 'Y' : ''}`);
  rows.push(`${params.item.usageAfterDelete ? 'Y' : ''}`);
  rows.push(`${params.item.usageAfterUndelete ? 'Y' : ''}`);

  return {
    table: {
      headers: TABLE_HEADER.TRIGGER,
      rows: [rows]
    }
  };
};
