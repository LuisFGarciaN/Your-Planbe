require("dotenv").config();
const express = require("express");
const router = express.Router();

const bodyParser = require("body-parser");
const jsonBodyParser = bodyParser.json(); 
const jwt = require("jsonwebtoken");


const logic = require("../Your-Planbe/logic");
const jwtVerifier = require("./jwt-verifier");
const routeHandler = require("./route-handler");
const bearerTokenParser = require("../utils/bearer-token-parser");

const {
  env: { JWT_SECRET }
} = process;


router.post("/users", jsonBodyParser, (req, res) => {
  routeHandler(() => {
    const { type, name, surname, email, username, password } = req.body;
    return logic
      .registerUser(type, name, surname, email, username, password)
      .then(() => logic.sendConfirmationRegistration(name, email))
      .then(() => {
        res.status(201);
        res.json({ message: `${username} successfully registered` });
      });
  }, res);
});


router.post("/auth", jsonBodyParser, (req, res) => {
  routeHandler(() => {
    const { username, password } = req.body;

    return logic.authenticateUser(username, password).then(id => {
      const token = jwt.sign({ sub: id }, JWT_SECRET);

      res.json({
        data: {
          id,
          token
        }
      });
    });
  }, res);
});


router.get("/users/:id", [bearerTokenParser, jwtVerifier], (req, res) => {
  routeHandler(() => {
    const {
      params: { id },
      sub
    } = req;

    if (id !== sub) throw Error("token sub does not match user id");

    return logic.retrieveUser(id).then(user =>
      res.json({
        data: user
      })
    );
  }, res);
});


router.patch(
  "/update/:id",
  [bearerTokenParser, jwtVerifier, jsonBodyParser],
  (req, res) => {
    routeHandler(() => {
      const {
        params: { id },
        sub,
        body: { type, name, surname, email, username, newPassword, password }
      } = req;

      if (id !== sub) throw Error("token sub does not match user id");

      return logic
        .updateUser(
          id,
          type,
          name,
          surname,
          email,
          username,
          newPassword,
          password
        )
        .then(() => {
          logic.sendAccountUpdated(name, email, username, newPassword);
        })
        .then(() =>
          res.json({
            message: "user updated!"
          })
        );
    }, res);
  }
);


router.post(
  "/contact/:id",
  [bearerTokenParser, jwtVerifier, jsonBodyParser],
  (req, res) => {
    routeHandler(() => {
      const {
        sub,
        params: { id },
        body: { subject, textarea }
      } = req;

      if (id !== sub) throw Error("token sub does not match user id");

      return logic.setContactEmailData(id, subject, textarea);
    }, res);
  }
);

router.get("/home", (req, res) => {
  routeHandler(() => {
    return logic.retrieveAllProducts().then(product =>
      res.json({
        data: product
      })
    );
  }, res);
});

router.patch(
  "/cart/:id/product/:productId",
  [bearerTokenParser, jwtVerifier, jsonBodyParser],
  (req, res) => {
    routeHandler(() => {
      const {
        sub,
        params: { id, productId }
      } = req;

      if (id !== sub) throw Error("token sub does not match user id");

      return logic.addProductToUserCart(id, productId).then(() =>
        res.json({
          message: "product added to user.s basket"
        })
      );
    }, res);
  }
);

router.patch(
  "/cart/:id/more/:productId",
  [bearerTokenParser, jwtVerifier, jsonBodyParser],
  (req, res) => {
    routeHandler(() => {
      const {
        sub,
        params: { id, productId }
      } = req;

      if (id !== sub) throw Error("token sub does not match user id");

      return logic.addMore(id, productId).then(() =>
        res.json({
          message: "product added to user.s basket"
        })
      );
    }, res);
  }
);


router.get("/cart/:id", [bearerTokenParser, jwtVerifier], (req, res) => {
  routeHandler(() => {
    const {
      sub,
      params: { id }
    } = req;

    if (id !== sub) throw Error("token sub does not match user id");
    return logic.listCartProducts(id).then(basket =>
      res.json({
        data: basket
      })
    );
  }, res);
});

router.delete(
  "/cart/product/:productId",
  [bearerTokenParser, jwtVerifier, jsonBodyParser],
  (req, res) => {
    routeHandler(() => {
      const {
        sub,
        params: { productId }
      } = req;

      if (!sub) throw Error("invalid user or token");

      return logic.removeProduct(sub, productId).then(() =>
        res.json({
          message: "product removed"
        })
      );
    }, res);
  }
);

router.post(
  "/cart/:id",
  [bearerTokenParser, jwtVerifier, jsonBodyParser],
  (req, res) => {
    routeHandler(() => {
      const {
        params: { id },
        sub,
        body: { products, total }
      } = req;

      if (id !== sub) throw Error("token sub does not match user id");

      return logic.createNewOrder(id, products, total).then(() => {
        res.status(201);
        res.json({
          message: `Order successfully created`
        });
      });
    }, res);
  }
);


router.delete(
  "/setorder/:id",
  [bearerTokenParser, jwtVerifier, jsonBodyParser],
  (req, res) => {
    routeHandler(() => {
      const {
        sub,
        params: { id }
      } = req;

      if (!sub) throw Error("invalid user or token");

      return logic.deleteUnfinishedOrders(id).then(() =>
        res.json({
          message: "Unfinished orders have been removed!"
        })
      );
    }, res);
  }
);

router.patch(
  "/setorder/:id",
  [bearerTokenParser, jwtVerifier, jsonBodyParser],
  (req, res) => {
    routeHandler(() => {
      const {
        sub,
        params: { id },
        body: { place, day, month, year, time, comments, paid }
      } = req;

      if (id !== sub) throw Error("token sub does not match user id");
      return logic
        .addDroppingDetails(id, place, day, month, year, time, comments, paid)
        .then(ok => {
          res.json({
            message: "Order successfully completed!"
          });
        });
    }, res);
  }
);

router.get("/vieworders/:id", [bearerTokenParser, jwtVerifier], (req, res) => {
  routeHandler(() => {
    const {
      sub,
      params: { id }
    } = req;

    if (id !== sub) throw Error("token sub does not match user id");

    return logic.retrieveOrders(id).then(orders =>
      res.json({
        data: orders
      })
    );
  }, res);
});

module.exports = router;
