// Les dates traversent HTTP en JSON : on compare le body à la fixture sérialisée
export const serialized = (value: unknown) => JSON.parse(JSON.stringify(value));
