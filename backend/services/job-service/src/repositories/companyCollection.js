import { getDatabase } from "../config/mongo.js";
import { companyContext } from "../middleware/companyContext.js";

// All staff reads and writes carry the company from the authenticated gateway context.
export const scopeCollection = (collection, context) => {
  if (!context?.companyId) return collection;
  const query = (filter) => ({ $and: [filter ?? {}, { companyId: context.companyId }] });
  return {
    find: (filter) => collection.find(query(filter)),
    findOne: (filter) => collection.findOne(query(filter)),
    updateOne: (filter, update, options) => collection.updateOne(query(filter), update, options),
    deleteOne: (filter) => collection.deleteOne(query(filter)),
    insertOne: (record) => {
      record.companyId = context.companyId;
      return collection.insertOne(record);
    },
  };
};

export const companyCollection = async (name) => scopeCollection(
  (await getDatabase()).collection(name), companyContext.getStore(),
);
