/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/**
 * title.ts
 */
import { authorization } from 'heat-sfdx-common';

/*********************
 * TITLE
 *********************/
export const TITLE = {
  CONSTRUCTORS: 'Constructors',
  PROPERTIES: 'Properties',
  EXTERNAL_REFERENCES: 'External References',
  INNER_CLASSES: 'Inner Classes',
  METHODS: 'Methods'
};

export const buildTitle = (auth: authorization, jsonApexMember: any) => {
  const title = `${jsonApexMember.name}${auth.options.fileExtension}`;
  return { h1: title };
};
