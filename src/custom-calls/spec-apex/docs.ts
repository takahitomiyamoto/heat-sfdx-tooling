/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * docs.ts
 */
import json2md from 'json2md';
import { authorization, writeFileSyncUtf8 } from 'heat-sfdx-common';
import { buildTitle } from './md/title';
import { buildHeader, buildHeaderApexDoc, outputBody } from './md/header';
import {
  buildExternalReferences,
  buildInnerClasses,
  buildProperties,
  buildConstructors,
  buildMethods
} from './md/body';
import { parseJsonApex, parseJsonApexMember } from './parse';

/**
 * @description generateMarkdownSpecs
 * @param {*} auth
 */
const generateMarkdownSpecs = (auth: authorization) => {
  const md = [];

  // # Title
  md.push(buildTitle(auth));

  // ## Header
  md.push(buildHeader(auth));
  md.push({ p: '<br>' });

  md.push(buildHeaderApexDoc(auth));
  md.push({ p: '<br>' });

  // TODO: 表示内容をON／OFFできるようにする

  // ## External References
  md.push(buildExternalReferences(auth));
  md.push({ p: '<br>' });

  const jsonApexMember = parseJsonApexMember(auth);
  const jsonApex = parseJsonApex(auth);

  if ('ApexClass' === jsonApex.attributes.type) {
    // ## InnerClasses
    md.push(buildInnerClasses(auth));
    md.push({ p: '<br>' });

    // ## Properties
    md.push(buildProperties(auth));
    md.push({ p: '<br>' });

    // ## Constructors
    md.push(buildConstructors(auth));
    md.push({ p: '<br>' });

    // ## Methods
    md.push(buildMethods(auth));
    md.push({ p: '<br>' });
  }

  // ## Body - debug only
  if (auth.options.verbose) {
    md.push(outputBody(auth));
  }

  // archive
  const logFile = `${auth.options.dir.output}/${auth.options.apexName}.md`;

  if (auth.options.verbose) {
    console.info(logFile);
  }
  writeFileSyncUtf8(logFile, json2md(md));

  // raw data
  const filename = `${auth.options.dir.rawData}/${auth.options.apexName}.raw.md`;
  md.push({ h2: 'Raw Data' });
  const h3List = Object.keys(jsonApexMember);
  for (const h3 of h3List) {
    md.push({ h3: h3 });
    md.push({ p: JSON.stringify(jsonApexMember[h3]) });
  }
  writeFileSyncUtf8(filename, json2md(md));
};

/**
 * @description generateDocs
 * @param {*} auth
 */
export async function generateDocs(auth: authorization) {
  auth.options.apexNames?.forEach((apexName: string) => {
    auth.options.apexName = apexName;
    generateMarkdownSpecs(auth);
  });
}
