// TODO:
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

/**
 * ul.ts
 */
/**
 * @description createUlHeaderApexDoc
 * @param {*} item
 */
export const createUlHeaderApexDoc = (params: any) => {
  // const tags = params.item?.tags;
  const tags = params.item?.body?.header[0]?.tags;

  if (!tags) {
    return { p: '' };
  }
  return {
    ul: tags.map((tag: any) => {
      return `**\`${tag.key}\`** : ${tag.value}`;
    })
  };
};
