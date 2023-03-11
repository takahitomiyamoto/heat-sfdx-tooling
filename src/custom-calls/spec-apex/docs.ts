/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * docs.ts
 */
import json2md from 'json2md';
import { authorization, writeFileSyncUtf8 } from 'heat-sfdx-common';
import {
  buildExternalReferences,
  buildInnerClasses,
  buildProperties,
  buildConstructors,
  buildMethods
} from './md/body';
import { buildHeader, buildHeaderApexDoc, outputBody } from './md/header';
import { parseJsonApex, parseJsonApexMember } from './md/parse';
import { buildTitle } from './md/title';

/**
 * @description generateMarkdownSpecs
 * @param {*} auth
 */
const generateMarkdownSpecs = (auth: authorization) => {
  const md = [];
  const jsonApex = parseJsonApex(auth);
  const jsonApexMember = parseJsonApexMember(auth);

  // # Title
  md.push(buildTitle(auth, jsonApexMember));

  // ## Header
  md.push(buildHeader(auth, jsonApex, jsonApexMember));
  md.push({ p: '<br>' });

  md.push(buildHeaderApexDoc(auth, jsonApex, jsonApexMember));
  md.push({ p: '<br>' });

  // TODO Low: 表示内容をON／OFFできるようにする

  // ## External References
  md.push(buildExternalReferences(auth, jsonApexMember));
  md.push({ p: '<br>' });

  if ('ApexClass' === jsonApex.attributes.type) {
    // ## Properties
    md.push(buildProperties(auth, jsonApexMember));
    md.push({ p: '<br>' });

    // TODO High: Properties の ApexDoc

    // ## Constructors
    md.push(buildConstructors(auth, jsonApexMember));
    md.push({ p: '<br>' });

    // TODO High: Constructors の ApexDoc

    // ## Methods
    md.push(buildMethods(auth, jsonApexMember));
    md.push({ p: '<br>' });

    // TODO High: Methods の ApexDoc

    // ## InnerClasses
    md.push(buildInnerClasses(auth, jsonApexMember));
    md.push({ p: '<br>' });

    // TODO Medium: ### InnerClasses - External References
    // TODO Medium: ### InnerClasses - Properties
    // TODO Medium: ### InnerClasses - Constructors
    // TODO Medium: ### InnerClasses - Methods
  }

  // ## Body - debug only
  if (auth.options.verbose) {
    md.push(outputBody(auth, jsonApex, jsonApexMember));
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
