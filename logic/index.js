require("dotenv").config();

const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");
const transporter = nodemailer.createTransport(
  sendgridTransport({
    auth: {
      api_key: process.env.SENDGRID_KEY
    }
  })
);

const {
  models: { Product, Order, User }
} = require("planbe-data");


const {
  AlreadyExistsError,
  AuthError,
  NotAllowedError,
  NotFoundError
} = require("../errors");
const validate = require("../../utils/validate");

const logic = {

  async registerUser(type, name, surname, email, username, password) {
    validate([
      { key: "type", value: type, type: String },
      { key: "name", value: name, type: String },
      { key: "surname", value: surname, type: String },
      { key: "email", value: email, type: String },
      { key: "username", value: username, type: String },
      { key: "password", value: password, type: String }
    ]);

    let user = await User.findOne({ username });
    let _email = await User.findOne({ email });

    if (user)
      throw new AlreadyExistsError(`Username ${username} already registered`);
    if (_email)
      throw new AlreadyExistsError(`Email ${email} already registered`);

    user = new User({ type, name, surname, email, username, password });
    await user.save();
    await console.log("From Backend: registration is done!");
  },


  sendConfirmationRegistration(name, email) {
    validate([
      { key: "name", value: name, type: String },
      { key: "email", value: email, type: String }
    ]);

    return transporter.sendMail({
      to: email, 
      bcc: "pepdbm7@gmail.com", 
      from: "hola@eatplanbe.com",
      subject: "Sign in completed",
      html: `<h1>Hey ${name}!!</h1>
            <h2>You have succesfully registered!</h2><br/><br/>
            <p><i><u>Planbe</u> Team</i></p>`
    });
  },

  async authenticateUser(username, password) {
    validate([
      { key: "username", value: username, type: String },
      { key: "password", value: password, type: String }
    ]);

    const user = await User.findOne({ username });

    if (!user || user.password !== password)
      throw new AuthError("invalid username or password");

    return user.id;
  },

  retrieveUser(id) {
    validate([{ key: "id", value: id, type: String }]);

    return (async () => {
      const user = await User.findById(id, {
        _id: 0,
        password: 0,
        orders: 0,
        __v: 0
      }).lean();

      if (!user) throw new NotFoundError(`user with id ${id} not found`);

      user.id = id;

      return user;
    })();
  },


  updateUser(id, type, name, surname, email, username, newPassword, password) {
    validate([
      { key: "id", value: id, type: String },
      { key: "type", value: type, type: String },
      { key: "name", value: name, type: String },
      { key: "surname", value: surname, type: String },
      { key: "email", value: email, type: String },
      { key: "username", value: username, type: String },
      { key: "newPassword", value: newPassword, type: String },
      { key: "password", value: password, type: String }
    ]);

    return (async () => {
      const user = await User.findById(id);

      if (!user) throw new NotFoundError(`user with id ${id} not found`);

      if (user.password !== password) throw new AuthError("invalid password");

      const _user = await User.findOne({ username });
      const _email = await User.findOne({ email });

    
      if (_user)
        throw new AlreadyExistsError(`username ${username} already exists`);
      if (_email) throw new AlreadyExistsError(`email ${email} already used`);

      user.type = type;
      user.name = name;
      user.surname = surname;
      user.email = email;
      user.username = username;
      user.password = newPassword;

      await user.save();
    })();
  },

  sendAccountUpdated(name, email, username, newPassword) {
    validate([
      { key: "name", value: name, type: String },
      { key: "email", value: email, type: String },
      { key: "username", value: username, type: String },
      { key: "newPassword", value: newPassword, type: String }
    ]);
    return transporter
      .sendMail({
        to: email, 
        from: "planbe@gmail.com",
        subject: "Account Updated",
        html: `<h1>Hey ${name}!!</h1>
            <h2><font color="red">you have succesfully updated your account!<font></h2><br/><br/>
            <p><strong>Your new username is:</strong> ${username}</p><br/>
            <p><strong>Your new password is:</strong> ${newPassword}</p><br/><br/>
            <p><i><u>Planbe</u> Team</i></p>`
      })
      .then(res => {

        res.status(201);
        res.json({
          message: "Email correctly sent !!"
        });
      });
  },


  setContactEmailData(id, subject, textarea) {
    validate([
      { key: "id", value: id, type: String },
      { key: "subject", value: subject, type: String },
      { key: "textarea", value: textarea, type: String }
    ]);
    return (async () => {
      const user = await User.findById(id);

      if (!user) throw new NotFoundError(`user with id ${id} not found`);

      const name = user.name;
      const username = user.username;
      const email = user.email;
      debugger;

      await this.sendContactEmail(subject, textarea, name, username, email);
    })();
  },

  sendContactEmail(subject, textarea, name, username, email) {
    validate([
      { key: "subject", value: subject, type: String },
      { key: "textarea", value: textarea, type: String },
      { key: "name", value: name, type: String },
      { key: "username", value: username, type: String },
      { key: "email", value: email, type: String }
    ]);

    return transporter.sendMail({
      to: "hola@eatplanbe.com",
      bcc: "pepdbm7@gmail.com", 
      from: email,
      subject: subject,
      html: `<h1>Message from your client ${name}!!</h1>
        <p><strong>Client's username:</strong> ${username}<br/><br/>
        <strong>Client's email address:</strong> ${email}</p><br/><br/>
        <i>${textarea}/i>`
    });
  },

  retrieveAllProducts() {
    return (async () => {
      const projection = {
        _id: true,
        type: true,
        name: true,
        price: true,
        image: true,
        description: true
      };
      const products = await Product.find({}, projection).lean(); 
      products.forEach(product => {
        product.id = product._id; 
        delete product._id; 
      });
      if (!products) throw new NotFoundError("products not found");

      return products;
    })();
  },


  addProductToUserCart(id, productId) {

    validate([
      { key: "id", value: id, type: String },
      { key: "productId", value: productId, type: String }
    ]);

    return (async () => {
      const user = await User.findById(id);

      if (!user) throw new NotFoundError(`user with id ${id} not found`);

      const product = await Product.findOne({ _id: productId });

      if (!product)
        throw new NotFoundError(`product with id ${productId} not found`);

      user.basket.push(product._id);

      await user.save();
    })();
  },

  async listCartProducts(id) {
    validate([{ key: "id", value: id, type: String }]);

    const user = await User.findById(id).lean();
    if (!user) throw new NotFoundError(`user with id ${id} not found`);

    const productsArray = user.basket;

    if (productsArray.length) {

      const projection = {
        _id: true,
        type: true,
        name: true,
        price: true,
        image: true,
        quantity: true,
        description: true
      };
      let products = await Promise.all(
        productsArray.map(
          async productId =>
            await Product.findById(productId, projection).lean()
        )
      );


      products.forEach(product => {
        product.id = product._id.toString();
        delete product._id;
      });


      products.forEach(_product => {
        let repeatedTimes = products.filter(
          __product => __product.id === _product.id
        );
        _product.quantity = repeatedTimes.length;
      });


      products.forEach(_product =>
        products.filter(__product => __product.id !== _product.id)
      );

      const flags = new Set();
      let productsToList = products.filter(product => {
        if (flags.has(product.id)) {
          return false;
        }
        flags.add(product.id);
        return product;
      });


      productsToList = productsToList.sort((a, b) =>
        a.id > b.id ? 1 : b.id > a.id ? -1 : 0
      );

      return productsToList;
    }
    return [];
  },

  async removeProduct(id, productId) {
    validate([
      { key: "id", value: id, type: String },
      { key: "productId", value: productId, type: String }
    ]);

    const user = await User.findById(id);

    if (!user) throw new NotFoundError(`user with id ${id} not found`);

    let basket = user.basket;

    if (!basket) throw new NotFoundError(`user 's basket not found`);

    const product = await Product.findById(productId);

    if (!product)
      throw new NotFoundError(`product with id ${productId} not found`);

    if (basket.length) {
      const productInCart = user.basket.filter(
        _productId => _productId == productId
      );

      if (!productInCart.length)
        throw new NotFoundError(
          `product with id ${productId} not found in the basket`
        );

      const duplicated = user.basket.filter(
        _productId => _productId == productId
      );
      const different = user.basket.filter(
        _productId => _productId != productId
      );

      if (duplicated.length) {
        duplicated.pop();
        user.basket = different.concat(duplicated);
      }
      await user.save();
    }
  },

  addMore(id, productId) {
    validate([
      { key: "id", value: id, type: String },
      { key: "productId", value: productId, type: String }
    ]);

    return (async () => {
      const user = await User.findById(id);

      if (!user) throw new NotFoundError(`user with id ${id} not found`);

      const product = await Product.findOne({ _id: productId });

      if (!product)
        throw new NotFoundError(`product with id ${productId} not found`);

      user.basket.push(product._id);

      await user.save();
    })();
  },

  createNewOrder(userId, products, total) {
    validate([
      { key: "userId", value: userId, type: String },
      { key: "products", value: products, type: Array },
      { key: "total", value: total, type: String }
    ]);

    return (async () => {
      const user = await User.findById(userId);

      if (!user) throw new NotFoundError(`User with id ${userId} not found`);

      const order = new Order({ products: products, total: total });
      user.orders.forEach(_order => {
        if (_order._id === order._id)
          throw new AlreadyExistsError(
            `Order with id ${order._id} already exists in user!`
          );
        _order.id = order._id;
        delete order._id;
      });

      await user.orders.push(order);

      await user.save();
    })();
  },

  addDroppingDetails(id, place, day, month, year, time, comments, paid) {
    validate([
      { key: "id", value: id, type: String },
      { key: "place", value: place, type: String },
      { key: "day", value: day, type: String },
      { key: "month", value: month, type: String },
      { key: "year", value: year, type: String },
      { key: "time", value: time, type: String },
      { key: "comments", value: comments, type: String, optional: true },
      { key: "paid", value: paid, type: Boolean }
    ]);

    return (async () => {
      const user = await User.findById(id);

      if (!user) throw new NotFoundError(`user with id ${id} not found`);

      const userOrders = user.orders;

      if (userOrders.length) {
        const pendingOrder = userOrders.find(
          order => !(order.place && order.time && order.paid)
        );

        if (pendingOrder && pendingOrder.length > 1)
          throw new AlreadyExistsError(
            `There are more than one pending order!!!`
          );


        pendingOrder.id = pendingOrder._id;
        delete pendingOrder._id;

        pendingOrder.place = place;
        pendingOrder.day = day;
        pendingOrder.month = month;
        pendingOrder.year = year;
        pendingOrder.time = time;
        pendingOrder.comments = comments;
        pendingOrder.paid = paid;

        const _name = user.name;
        const _email = user.email;
        const _total = pendingOrder.total;
        const _products = pendingOrder.products.forEach(
          product => product.name
        );

        await user.update({ name: _name }, { $set: { basket: [] } });

        debugger;

        await user.save();

        await this.sendConfirmationOrder(
          _name,
          _email,
          place,
          day,
          month,
          year,
          time,
          comments,
          _products,
          _total
        );

        return true;
      }
    })();
  },

  sendConfirmationOrder(
    name,
    email,
    place,
    day,
    month,
    year,
    time,
    comments,
    products,
    total
  ) {
    validate([
      { key: "name", value: name, type: String },
      { key: "email", value: email, type: String },
      { key: "place", value: place, type: String },
      { key: "day", value: day, type: String },
      { key: "month", value: month, type: String },
      { key: "year", value: year, type: String },
      { key: "time", value: time, type: String },
      { key: "comments", value: comments, type: String },
      { key: "products", value: products, type: Array },
      { key: "total", value: total, type: String }
    ]);

    return transporter.sendMail({
      to: email, 
      bcc: "pepdbm7@gmail.com", 
      from: "hola@eatplanbe.com",
      subject: "Order completed!",
      html: `<h1>Hello ${name}!</h1>
            <h2 style="color: blue;>Your order has been successfully done!</h2>
            <p style="color: blue>Your breakfast will be sent to <b>${place}</b> on the <b>${day}</b>, <b>${month}</b> of <b>${year}</b>, in the time frame of <b>${time}</b>.</p>
            <p style="color: blue>The <b>products</b> bought were: ${products}</p>
            <p style="color: blue>The total paid was <b>${total} €</b></p>
            <p style="color: blue>Comments: ${comments}</p>
            <h1 style="color: red; text-align: center; text-decoration: underline overline"><b>Enjoy your meal!!</b></h1>`
    });
  },

  deleteUnfinishedOrders(id) {
    validate([{ key: "id", value: id, type: String }]);
    return (async () => {
      const user = await User.findById(id);

      if (!user) throw new NotFoundError(`user with id ${id} not found`);

      let ordersArray = user.orders;

      if (ordersArray.length) {
     
        const pendingOrders = await ordersArray.filter(
          order => !(order.place && order.time && order.paid)
        ); 

        await pendingOrders.forEach(x =>
          ordersArray.splice(
            ordersArray.findIndex(
              order =>
                !(
                  order.place ||
                  order.day ||
                  order.month ||
                  order.year ||
                  order.comments ||
                  order.paid
                ),
              1
            )
          )
        );

        await user.save();
      }
    })();
  },


  retrieveOrders(id) {
    validate([{ key: "id", value: id, type: String }]);

    return (async () => {
      const user = await User.findById(id)
        .populate({ path: "orders.products" })
        .lean(); 

      if (!user) throw new NotFoundError(`user with id ${id} not found`);

      const orders = user.orders;
      return orders;
    })();
  }
};

module.exports = logic;
