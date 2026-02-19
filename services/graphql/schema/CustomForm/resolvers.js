const { v4: uuidV4 } = require("uuid");
const {
  assertValidSession,
  getOrganizationDomain,
} = require("../../authentication");
const dayjs = require("dayjs");
require("dayjs/locale/ms-my");
require("dayjs/locale/en");
dayjs.locale("en");
const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);

const resolvers = {
  Query: {
    customFormById: async (self, params, context) => {
      return await context.collection("CustomForms").findOne({
        _id: params._id,
      });
    },
    customForm: async (self, params, context) => {
      if (!params.formId) return null;

      await context.collection("CustomForms").createIndex({
        formId: 1,
        ownerId: 1,
      });
      let foundCustomForm = await context.collection("CustomForms").findOne({
        formId: params.formId,
        ownerId: params.ownerId,
      });
      if (foundCustomForm) return foundCustomForm;

      let fields = [];
      if (params.initialFields) {
        for (let field of params.initialFields) {
          const newCustomField = {
            ...field,
            _id: field._id || uuidV4(),
            _createdAt: new Date().toISOString(),
            _updatedAt: new Date().toISOString(),
          };
          fields.push(newCustomField);
        }
      }

      let result = await context.collection("CustomForms").findOneAndUpdate(
        {
          formId: params.formId,
          ownerId: params.ownerId,
        },
        {
          $setOnInsert: {
            _id: uuidV4(),
            _createdAt: new Date().toISOString(),
            formId: params.formId,
            ownerId: params.ownerId,
            status: params.defaultStatus || "Tidak Aktif",
            fields:
              fields.length > 0
                ? fields
                : [
                    {
                      _id: uuidV4(),
                      type: "Short Text",
                      placeholder: "",
                      _createdAt: new Date().toISOString(),
                      _updatedAt: new Date().toISOString(),
                    },
                  ],
            index: params.index || 0,
            name: "",
            description: "",
          },
          $set: {
            _updatedAt: new Date().toISOString(),
          },
        },
        {
          upsert: true,
          returnOriginal: false,
          returnNewDocument: true,
        }
      );
      return result.value;
    },
    isCustomFormAvailable: async (self, params, context) => {
      if (!params.formId || !params.ownerId) return false;
      await context.collection("CustomForms").createIndex({
        formId: 1,
        ownerId: 1,
      });
      let foundCustomForm = await context.collection("CustomForms").findOne({
        formId: params.formId,
        ownerId: params.ownerId,
      });
      return foundCustomForm && foundCustomForm.status === "Aktif";
    },
  },

  Mutation: {
    createCustomForm: async (self, params, context) => {
      let fields = [];
      if (params.initialFields) {
        for (let field of params.initialFields) {
          const newCustomField = {
            ...field,
            _id: field._id || uuidV4(),
            _createdAt: new Date().toISOString(),
            _updatedAt: new Date().toISOString(),
          };
          fields.push(newCustomField);
        }
      }

      let result = await context.collection("CustomForms").findOneAndUpdate(
        {
          formId: params.formId,
          ownerId: params.ownerId,
        },
        {
          $setOnInsert: {
            _id: uuidV4(),
            _createdAt: new Date().toISOString(),
            formId: params.formId,
            ownerId: params.ownerId,
            status: params.defaultStatus || "Tidak Aktif",
            fields:
              fields.length > 0
                ? fields
                : [
                    {
                      _id: uuidV4(),
                      type: "Short Text",
                      placeholder: "",
                      _createdAt: new Date().toISOString(),
                      _updatedAt: new Date().toISOString(),
                    },
                  ],
            index: params.index || 0,
            name: params.name || "",
            description: params.description || "",
          },
          $set: {
            _updatedAt: new Date().toISOString(),
          },
        },
        {
          upsert: true,
          returnOriginal: false,
          returnNewDocument: true,
        }
      );
      return result.value;
    },
    updateCustomForm: async (self, params, context) => {
      await context.collection("CustomForms").createIndex({
        formId: 1,
        ownerId: 1,
      });

      let foundCustomForm = await context.collection("CustomForms").findOne({
        formId: params.formId,
        ownerId: params.ownerId,
      });

      if (!foundCustomForm) {
        throw new Error(`Form is invalid atau sudah tidak tersedia!`);
      }

      // console.log({ fields });
      let updates = {
        status: params.status || foundCustomForm.status || "Tidak Aktif",
        _updatedAt: new Date().toISOString(),
      };
      if (params.fields) {
        let fields = [];
        for (let field of params.fields) {
          // console.log({ field });
          const foundCustomField = foundCustomForm.fields.find(
            (f) => f._id === field._id
          );
          if (foundCustomField) {
            fields.push({
              ...foundCustomField,
              ...field,
              _updatedAt: new Date().toISOString(),
            });
          } else {
            const newCustomField = {
              ...field,
              _id: field._id || uuidV4(),
              _createdAt: new Date().toISOString(),
              _updatedAt: new Date().toISOString(),
            };
            fields.push(newCustomField);
          }
        }
        updates.fields = fields;
      }
      if (params.name) {
        updates.name = params.name;
      }
      if (params.description) {
        updates.description = params.description;
      }
      if (params.index) {
        updates.index = params.index;
      }
      await context.collection("CustomForms").updateOne(
        {
          _id: foundCustomForm._id,
        },
        {
          $set: {
            ...updates,
          },
        }
      );

      return "SUCCESS";
    },
    toggleCustomFormStatus: async (self, params, context) => {
      // console.log("toggleCustomFormStatus", params);

      await context.collection("CustomForms").createIndex({
        formId: 1,
        ownerId: 1,
      });

      let foundCustomForm = await context.collection("CustomForms").findOne({
        formId: params.formId,
        ownerId: params.ownerId,
      });

      if (!foundCustomForm) {
        throw new Error(`Form is invalid atau sudah tidak tersedia!`);
      }

      await context.collection("CustomForms").updateOne(
        {
          _id: foundCustomForm._id,
        },
        {
          $set: {
            status: params.status,
            _updatedAt: new Date().toISOString(),
          },
        }
      );

      return "SUCCESS";
    },
  },

  CustomForm: {
    fields: (self) =>
      self.fields || [
        {
          _id: uuidV4(),
          type: "Short Text",
          placeholder: "",
          _createdAt: new Date().toISOString(),
          _updatedAt: new Date().toISOString(),
        },
      ],
  },
};

exports.resolvers = resolvers;
