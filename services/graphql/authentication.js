const jwt = require("jsonwebtoken");
const HEADER_REGEX = /Bearer token-(.*)$/;
const Base64 = require("js-base64").Base64;
const bcrypt = require("bcryptjs");

exports.authenticate = async (req, context) => {
  try {
    // console.log("req.headers", req.headers);
    // console.log("req.headers.authorization", !!req.headers.authorization);

    if (!req.headers.authorization) {
      return { User: {} };
    }
    const authorizationHeader =
      req.headers.authorization && HEADER_REGEX.exec(req.headers.authorization);

    // console.log("authorizationHeader", authorizationHeader);
    if (!authorizationHeader) {
      return { User: {} };
    }
    const token = authorizationHeader[1];

    // console.log("token", token);
    if (!token) {
      return { User: {} };
    }
    const { sessionId, user, expiresIn } = jwt.verify(
      token,
      process.env.APP_SECRET || "SECRET",
    );

    // const cacheKey = "Lato:UserSessions:" + sessionId;
    // let isActive = await context.redis.get(cacheKey);
    let isActive = null;
    if (!isActive) {
      isActive = await context.collection("UserSessions").findOne(
        {
          _id: sessionId,
          _deletedAt: {
            $exists: false,
          },
        },
        {
          projection: {
            _id: 1,
            _deletedAt: 1,
          },
        },
      );
      // console.log("Cache missed!", isActive);
      if (isActive) {
        // await context.redis.setex(cacheKey, 2 * 60 * 60, 1); // TTL for 2 hours
      } else {
        throw {
          message: `Session is invalid or not available!`,
        };
      }
    }

    return {
      _id: sessionId,
      User: {
        ...user,
      },
      expiresIn,
      // token,
    };
  } catch (err) {
    // console.log("! Authenticate error:", err.message);
    return {
      User: {},
    };
    // throw err;
  }
};

const assertValidSession = (session) => {
  if (process.env.NODE_ENV !== "production") {
    return;
  }
  if (!session) {
    console.log(
      "SESSION ERROR: Sesi Anda telah habis. Silahkan lakukan refresh halaman web, dan login kembali.",
    );
    throw new Error(
      "Sesi Anda telah habis. Silahkan lakukan refresh halaman web, dan login kembali.",
    );
  }
  if (!session.User || !session.User._id) {
    console.log("SESSION ERROR: Invalid user session");
    throw new Error("Invalid user session");
  }
};
exports.assertValidSession = assertValidSession;

exports.DEFAULT_EXPIRIDITY = "30d";
exports.NO_EXPIRIDITY = "100y";

// ###############################################################################################
// ###############################################################################################
// ###############################################################################################

const DEFAULT_ROLES = [
  {
    _id: "__SUPER_USER__",
    name: "Super User",
    privileges: [],
  },
];

const DEFAULT_USERS = [
  {
    _id: "__ROOT__",
    username: "root",
    employeeId: "root",
    defaultPassword: "toor",
    status: "Active",
    roleId: "__SUPER_USER__",
  },
];

const DEFAULT_ORGANIZATIONS = [
  {
    _id: "__ORG__",
    name: "DEFAULT",
    description: "DEFAULT",
    PREFIX: "__ORG__",
    locked: true,
  },
];

const makeSureDefaultUsersAreExists = async (collection) => {
  for (const defaultRole of DEFAULT_ROLES) {
    const found = await collection("UserRoles").findOne({
      _id: defaultRole._id,
    });
    if (found) {
      await collection("UserRoles").updateOne(
        {
          _id: found._id,
        },
        {
          $set: {
            ...defaultRole,
            _updatedAt: new Date().toISOString(),
          },
        },
      );
    } else {
      await collection("UserRoles").insertOne({
        ...defaultRole,
        _id: defaultRole._id,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      });
    }
  }

  for (const defaultUser of DEFAULT_USERS) {
    const found = await collection("Users").findOne({
      _id: defaultUser._id,
    });
    if (found) {
      // await collection("Users").updateOne(
      //   {
      //     _id: found._id
      //   },
      //   {
      //     $set: {
      //       ...defaultUser,
      //       _updatedAt: new Date().toISOString()
      //     }
      //   }
      // );
    } else {
      console.log(`  Set up default user: ${defaultUser.username}.`);
      await collection("Users").insertOne({
        ...defaultUser,
        _id: defaultUser._id,
        password: bcrypt.hashSync(defaultUser.defaultPassword, 10),
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      });
    }
  }

  for (const defaultOrganization of DEFAULT_ORGANIZATIONS) {
    const found = await collection("Organizations").findOne({
      _id: defaultOrganization._id,
    });
    if (found) {
      // await collection("Organizations").updateOne(
      //   {
      //     _id: found._id
      //   },
      //   {
      //     $set: {
      //       ...defaultOrganization,
      //       _updatedAt: new Date().toISOString()
      //     }
      //   }
      // );
    } else {
      console.log(
        `  Set up default organization: ${defaultOrganization.name}.`,
      );
      await collection("Organizations").insertOne({
        ...defaultOrganization,
        _id: defaultOrganization._id,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      });
    }
  }
};
exports.makeSureDefaultUsersAreExists = makeSureDefaultUsersAreExists;

exports.getOrganizationDomain = (session) => {
  assertValidSession(session);
  return (
    session.organizationId || session.User.latestActiveOrganizationId || ""
  );
};
