/**
 * index.ts
 */
import { authorization } from 'heat-sfdx-common';
import { generateApexSpecs } from './generate';
import { FIELDS } from './config/field';

/**
 * @description buildApexClassSpecs
 * @param auth
 */
export async function buildApexClassSpecs(auth: authorization) {
  auth.options.apexType = 'ApexClass';
  auth.options.apexMember = 'ApexClassMember';
  auth.options.fileExtension = '.cls';
  auth.options.fields = FIELDS.APEX_CLASS_MEMBER;

  auth.options.docs = {};
  auth.options.docs.externalReferences =
    auth.options.environment.docs.apexClass.externalReferences;
  auth.options.docs.innerClasses =
    auth.options.environment.docs.apexClass.innerClasses;
  auth.options.docs.properties =
    auth.options.environment.docs.apexClass.properties;
  auth.options.docs.methods = auth.options.environment.docs.apexClass.methods;

  auth.options.logs = {};
  auth.options.logs.createApex =
    auth.options.environment.logs.createApexClassMembers;
  auth.options.logs.retrieveApex =
    auth.options.environment.logs.retrieveApexClasses;

  auth.options.dir = {};
  auth.options.dir.output = auth.options.outputDir.class;
  auth.options.dir.symbolTable =
    auth.options.environment.logs.apexClass.symbolTable;
  auth.options.dir.rawData = auth.options.environment.logs.apexClass.rawData;

  return await generateApexSpecs(auth);
}

/**
 * @description buildApexTriggerSpecs
 * @param auth
 */
export async function buildApexTriggerSpecs(auth: authorization) {
  auth.options.apexType = 'ApexTrigger';
  auth.options.apexMember = 'ApexTriggerMember';
  auth.options.fileExtension = '.trigger';
  auth.options.fields = FIELDS.APEX_TRIGGER_MEMBER;

  auth.options.docs = {};
  auth.options.docs.externalReferences =
    auth.options.environment.docs.apexTrigger.externalReferences;

  auth.options.logs = {};
  auth.options.logs.createApex =
    auth.options.environment.logs.createApexTriggerMembers;
  auth.options.logs.retrieveApex =
    auth.options.environment.logs.retrieveApexTriggers;

  auth.options.dir = {};
  auth.options.dir.output = auth.options.outputDir.trigger;
  auth.options.dir.symbolTable =
    auth.options.environment.logs.apexTrigger.symbolTable;
  auth.options.dir.rawData = auth.options.environment.logs.apexTrigger.rawData;

  return await generateApexSpecs(auth);
}
