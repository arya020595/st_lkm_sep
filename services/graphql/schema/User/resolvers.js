const { v4: uuidV4 } = require("uuid");
// const { assertValidSession } = require("../../authentication");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const bcrypt = require("bcryptjs");
const {
  assertValidSession,
  DEFAULT_EXPIRIDITY,
  NO_EXPIRIDITY,
} = require("../../authentication");
const jwt = require("jsonwebtoken");
const GraphQLJSON = require("graphql-type-json");
const { exportCollectionDataAsExcel } = require("./export");
const TOKENIZE = process.env.TOKENIZE;

let countFailedLoginAttempt = {};
let failedLoginAttemptResolver = {};
const FAILED_LOGIN_ATTEMPT_RESOLVE_TIME = 60 * 1000; // 60 seconds
const MAX_FAILED_LOGIN_ATTEMPT = 3;

const resolvers = {
  JSON: GraphQLJSON,

  Query: {
    allUsers: async (self, params, context) => {
      let users = await context
        .collection("Users")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
          // PREFIX
        })
        .toArray();

      let organizations = await context
        .collection("Organizations")
        .find({})
        .toArray();
      organizations = organizations.reduce((all, org) => {
        all[org.PREFIX] = org;
        return all;
      }, {});

      return users.map((user) => {
        return {
          ...user,
          Organization: organizations[user.PREFIX],
        };
      });
    },
    allUserRoles: async (self, params, context) => {
      return await context
        .collection("UserRoles")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
          // PREFIX
        })
        .sort({
          name: 1,
        })
        .toArray();
    },
    currentUser: async (self, params, context) => {
      // assertValidSession(context.activeSession);
      if (
        !context.activeSession ||
        !context.activeSession.User ||
        !context.activeSession.User._id
      ) {
        return null;
      }
      // console.log("currentUser...", context.activeSession.User);
      const user = await context.collection("Users").findOne({
        _id: context.activeSession.User._id,
      });
      // console.log({ user });
      return user;
    },
  },

  Mutation: {
    registerUser: async (self, params, context) => {
      const found = await context.collection("Users").findOne({
        employeeId: params.employeeId,
        ...NOT_DELETED_DOCUMENT_QUERY,
        // PREFIX
      });

      if (found) {
        // throw new Error(`Username ${found.employeeId} telah digunakan!`);
        throw new Error(`Username ${found.employeeId} already use!`);
      }

      console.log(params);
      const newUser = {
        _id: uuidV4(),
        employeeId: (params.employeeId || "").trim(),
        roleId: (params.roleId || "").trim(),
        email: (params.email || "").trim(),
        phone: (params.phone || "").trim(),
        status: (params.status || "").trim(),
        password: params.password ? bcrypt.hashSync(params.password, 10) : "",
        defaultPassword: params.password,
        regionIds: params.regionIds,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
        // PREFIX
      };

      await context.collection("Users").insertOne(newUser);
      return newUser;
    },
    deleteUser: async (self, params, context) => {
      await context.collection("Users").updateOne(
        {
          _id: params._id,
        },
        {
          $set: {
            _deletedAt: new Date().toISOString(),
          },
        },
      );
      return "SUCCESS";
    },
    deactivateUser: async (self, params, context) => {
      await context.collection("Users").updateOne(
        {
          _id: params._id,
        },
        {
          $set: {
            status: "Not Active",
            _updatedAt: new Date().toISOString(),
          },
        },
      );
      return "SUCCESS";
    },
    activateUser: async (self, params, context) => {
      await context.collection("Users").updateOne(
        {
          _id: params._id,
        },
        {
          $set: {
            status: "Active",
            _updatedAt: new Date().toISOString(),
          },
        },
      );
      return "SUCCESS";
    },
    updateUser: async (self, params, context) => {
      let update = {
        name: (params.name || "").trim(),
        roleId: ("" + params.roleId).trim(),
        address: (params.address || "").trim(),
        employeeId: (params.employeeId || "").trim(),
        email: (params.email || "").trim(),
        phone: (params.phone || "").trim(),
        pictureUrl: (params.pictureUrl || "").trim(),
        regionIds: params.regionIds,
        deptCode: params.deptCode || "",
        _updatedAt: new Date().toISOString(),
      };
      if (!update.employeeId) {
        delete update.employeeId;
      } else {
        const found = await context.collection("Users").findOne({
          _id: {
            $ne: params._id,
          },
          employeeId: params.employeeId,
          ...NOT_DELETED_DOCUMENT_QUERY,
        });

        if (found) {
          throw new Error(`Username ${found.employeeId} already use!`);
        }
      }

      if (!update.name) {
        delete update.name;
      }
      if (!update.address) {
        delete update.address;
      }
      if (!update.email) {
        delete update.email;
      }
      if (!update.phone) {
        delete update.phone;
      }
      if (!update.pictureUrl) {
        delete update.pictureUrl;
      }
      // console.log({ update });
      // throw {};
      await context.collection("Users").updateOne(
        {
          _id: params._id,
        },
        {
          $set: {
            ...update,
          },
        },
      );
      return "SUCCESS";
    },
    updateRoleForUser: async (self, params, context) => {
      await context.collection("Users").updateOne(
        {
          _id: params._id,
        },
        {
          $set: {
            roleId: params.roleId,
            PREFIX: params.PREFIX,
            PREFIXES: params.PREFIXES ? params.PREFIXES : [],
            _updatedAt: new Date().toISOString(),
          },
        },
      );
      return "SUCCESS";
    },
    updateUserPassword: async (self, params, context) => {
      const foundUser = await context.collection("Users").findOne({
        _id: params._id,
      });
      if (!foundUser) {
        // throw new Error(`User is invalid atau tidak ditemukan!`);
        throw new Error(`User invalid or not found!`);
      }

      // if (!bcrypt.compareSync(params.oldPassword, foundUser.password)) {
      //   // throw new Error(`Password lama tidak cocok!`);
      //   throw new Error(`Old password not match!`);
      // }

      await context.collection("Users").updateOne(
        {
          _id: params._id,
        },
        {
          $set: {
            password: bcrypt.hashSync(params.newPassword, 10),
            _updatedAt: new Date().toISOString(),
          },
        },
      );
      return "SUCCESS";
    },
    resetUserPassword: async (self, params, context) => {
      const foundUser = await context.collection("Users").findOne({
        _id: params._id,
      });
      if (!foundUser) {
        // throw new Error(`User is invalid atau tidak ditemukan!`);
        throw new Error(`User invalid or not found!`);
      }

      await context.collection("Users").updateOne(
        {
          _id: params._id,
        },
        {
          $set: {
            password: bcrypt.hashSync(params.newPassword, 10),
            _updatedAt: new Date().toISOString(),
          },
        },
      );
      return "SUCCESS";
    },

    updateTagsForUser: async (self, params, context) => {
      await context.collection("Users").updateOne(
        {
          _id: params._id,
        },
        {
          $set: {
            tags: [...params.tags],
            _updatedAt: new Date().toISOString(),
          },
        },
      );
      return "SUCCESS";
    },

    createUserRole: async (self, params, context) => {
      const newRole = {
        _id: uuidV4(),
        ...params,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
        // PREFIX
      };
      await context.collection("UserRoles").insertOne(newRole);
      return newRole;
    },
    updateUserRole: async (self, params, context) => {
      await context.collection("UserRoles").updateOne(
        {
          _id: params._id,
        },
        {
          $set: {
            name: params.name,
            privileges: params.privileges,
            _updatedAt: new Date().toISOString(),
          },
        },
      );
      return "SUCCESS";
    },
    deleteUserRole: async (self, params, context) => {
      await context.collection("UserRoles").updateOne(
        {
          _id: params._id,
        },
        {
          $set: {
            _deletedAt: new Date().toISOString(),
          },
        },
      );
      await context.collection("Users").updateMany(
        {
          roleId: params._id,
        },
        {
          $set: {
            status: "Not Active",
            _updatedAt: new Date().toISOString(),
          },
        },
        // {
        //   multi: true
        // }
      );
      return "SUCCESS";
    },

    logIn: async (self, params, context) => {
      const foundUser = await context.collection("Users").findOne({
        employeeId: params.employeeId,
        // status: "Aktif",
        // roleId: "DEFAULT_GM_ROLE",
        ...NOT_DELETED_DOCUMENT_QUERY,
      });
      // if (!foundUser) {
      //   // throw new Error(`User ${params.employeeId} tidak ditemukan!`);
      //   throw new Error(`User ${params.employeeId} not found!`);
      // }
      if (foundUser.status !== "Active") {
        throw new Error(
          // `User ${params.employeeId} saat ini dalam status Non Aktif!`,
          `User ${params.employeeId} currently Not Active!`,
        );
      }

      if (
        process.env.NODE_ENV === "production" &&
        !bcrypt.compareSync(params.password, foundUser.password)
      ) {
        if (countFailedLoginAttempt[foundUser._id]) {
          countFailedLoginAttempt[foundUser._id] += 1;
        } else {
          countFailedLoginAttempt[foundUser._id] = 1;
        }
        //
        if (failedLoginAttemptResolver[foundUser._id]) {
          clearTimeout(failedLoginAttemptResolver[foundUser._id]);
        }
        failedLoginAttemptResolver[foundUser._id] = setTimeout(() => {
          console.log(
            "Resolve login attempt, after 60 seconds, for",
            foundUser._id,
          );
          countFailedLoginAttempt[foundUser._id] = 0;
        }, FAILED_LOGIN_ATTEMPT_RESOLVE_TIME);
        //

        if (countFailedLoginAttempt[foundUser._id] < MAX_FAILED_LOGIN_ATTEMPT) {
          throw new Error(
            `Password tidak cocok! (Failed Login Attempt ${
              countFailedLoginAttempt[foundUser._id]
            })`,
          );
        } else {
          const foundRole = await context.collection("Users").findOne({
            _id: foundUser.roleId,
          });
          if (foundRole && foundRole.name.toUpperCase().trim() === "PEGAWAI") {
            // do nothing
          } else {
            await context.collection("Users").updateOne(
              {
                _id: foundUser._id,
              },
              {
                $set: {
                  status: "Not Active",
                  failedLoginAttemptAt: new Date().toISOString(),
                  _updatedAt: new Date().toISOString(),
                },
              },
            );
          }
          countFailedLoginAttempt[foundUser._id] = 0;
          if (failedLoginAttemptResolver[foundUser._id]) {
            clearTimeout(failedLoginAttemptResolver[foundUser._id]);
          }
          throw new Error(
            // `Password tidak cocok! Anda telah gagal login hingga ${MAX_FAILED_LOGIN_ATTEMPT} kali!`,
            `Password not match! You failed login until ${MAX_FAILED_LOGIN_ATTEMPT} times!`,
          );
        }
      }

      countFailedLoginAttempt[foundUser._id] = 0;
      if (failedLoginAttemptResolver[foundUser._id]) {
        clearTimeout(failedLoginAttemptResolver[foundUser._id]);
      }

      const session = await createSession({
        user: foundUser,
        collection: context.collection,
        expiresIn: NO_EXPIRIDITY,
        // expiresIn: params.wontExpired ? NO_EXPIRIDITY : DEFAULT_EXPIRIDITY,
      });
      return session;
    },
    logOut: async (self, params, context) => {
      if (context.activeSession) {
        await context
          .collection("UserSessions")
          .updateOne(
            { _id: context.activeSession._id },
            { $set: { _deletedAt: new Date().toISOString() } },
          );
      }
      return "SUCCESS";
    },

    logInByEmployeeId: async (self, params, context) => {
      if (context.activeSession && context.activeSession.errorPage) {
        throw new Error("Error Invalid Page");
      }
      await context.collection("Users").createIndex({
        employeeId: 1,
      });
      const foundUser = await context.collection("Users").findOne({
        employeeId: params.employeeId,
        // status: "Aktif",
        // roleId: "DEFAULT_GM_ROLE",
        ...NOT_DELETED_DOCUMENT_QUERY,
      });
      // console.log({
      //   params,
      //   foundUser,
      // });
      if (!foundUser) {
        // throw new Error(`User ${params.employeeId} tidak ditemukan!`);
        throw new Error(`User ${params.employeeId} not found!`);
      }
      if (foundUser.status !== "Active") {
        throw new Error(
          // `User ${params.employeeId} saat ini dalam status Non Aktif!`,
          `User ${params.employeeId} currently Not Active!`,
        );
      }

      const session = await createSession({
        user: foundUser,
        collection: context.collection,
        expiresIn: NO_EXPIRIDITY,
        // expiresIn: params.wontExpired ? NO_EXPIRIDITY : DEFAULT_EXPIRIDITY,
      });
      return session;
    },
    checkEmployeeIdAndPassword: async (self, params, context) => {
      const foundUser = await context.collection("Users").findOne({
        employeeId: params.employeeId,
        status: "Active",
      });
      if (!foundUser) {
        throw new Error(`Unknown employee id ${params.employeeId}`);
      }

      if (!bcrypt.compareSync(params.password, foundUser.password)) {
        throw new Error(`Invalid Password`);
      }

      return foundUser.employeeId;
    },
    checkEmployeeIdAndPasswordTokenized: async (self, params, context) => {
      const tokenized = jwt.verify(params.tokenizedInput, TOKENIZE);

      const { iat, ...tokenizedInput } = tokenized;

      const foundUser = await context.collection("Users").findOne({
        employeeId: tokenizedInput.employeeId,
        status: "Active",
      });
      if (!foundUser) {
        throw new Error(`Unknown employee id ${tokenizedInput.employeeId}`);
      }

      if (!bcrypt.compareSync(tokenizedInput.password, foundUser.password)) {
        throw new Error(`Invalid Password`);
      }

      const payload = {
        employeeId: foundUser.employeeId,
      };

      let token = jwt.sign(payload, TOKENIZE);
      return token;
      // return foundUser.employeeId;
    },
    exportCollectionDataAsExcel,
  },

  User: {
    Role: async (self, params, context) => {
      return await context.collection("UserRoles").findOne({
        _id: self.roleId,
      });
    },
    tags: (self) => (self.tags ? self.tags : []),
    LocalRegion: async (self, params, context) => {
      if (self.regionIds) {
        return await context
          .collection("Regions")
          .find({
            _id: {
              $in: self.regionIds,
            },
          })
          .toArray();
      }
      return [];
    },
  },

  UserSession: {
    User: async (self, params, context) => {
      return await context.collection("Users").findOne({
        _id: self.userId,
      });
    },
  },

  UserRole: {
    countUsers: async (self, params, context) => {
      return await context
        .collection("Users")
        .find({
          roleId: self._id,
        })
        .count();
    },
    privileges: (self) => self.privileges || [],
  },
};

exports.resolvers = resolvers;

const createSession = async ({
  user,
  expiresIn = DEFAULT_EXPIRStringITY,
  collection,
}) => {
  const sessionId = uuidV4();
  delete user.password;
  const jwtPayload = {
    sessionId,
    user: {
      _id: user._id,
      employeeId: user.employeeId,
      phone: user.phone,
      email: user.email,
      roleId: user.roleId,
      status: user.status,
    },
  };
  const jwtSecret = process.env.APP_SECRET || "SECRET";
  let token =
    expiresIn === null
      ? jwt.sign(jwtPayload, jwtSecret, {})
      : jwt.sign(jwtPayload, jwtSecret, { expiresIn });
  const newSession = {
    _id: sessionId,
    userId: user._id,
    employeeId: user.employeeId,
    token: "token-" + token,
    expiresIn,
    _createdAt: new Date().toISOString(),
    _updatedAt: new Date().toISOString(),
  };
  await collection("UserSessions").insertOne(newSession);
  try {
    await collection("Users").updateOne(
      {
        _id: user._id,
      },
      {
        $set: {
          lastLoginAt: new Date().toISOString(),
          _updatedAt: new Date().toISOString(),
        },
      },
    );
  } catch (err) {}
  return newSession;
};
