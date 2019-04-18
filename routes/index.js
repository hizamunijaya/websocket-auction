const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const schedule = require('node-schedule');

const { Good, Auction, User, sequelize } = require('../models');
const { isLoggedIn, isNotLoggedIn } = require('../routes/middlewares');

const router = express.Router();

router.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

router.get('/', async (req, res, next) => {
  try {
    const goods = await Good.findAll({ where: { soldId: null } });
    res.render('main', {
      title: 'NodeAuction',
      goods,
      loginError: req.flash('loginError'),
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.get('/join', isNotLoggedIn, (req, res) => {
  res.render('join', {
    title: 'Join - Auction',
    joinError: req.flash('joinError'),
  });
});

router.get('/good', isLoggedIn, (req, res) => {
  res.render('good', { title: 'goods Registration - Auction' });
});

fs.readdir('uploads', (error) => {
  if (error) {
    console.error('The uploads folder does not exist, creating the uploads folder');
    fs.mkdirSync('uploads');
  }
});

const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, 'uploads/');
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname);
      cb(null, path.basename(file.originalname, ext) + new Date().valueOf() + ext);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

router.post('/good', isLoggedIn, upload.single('img'), async (req, res, next) => {
  try {
    const { name, price } = req.body;
    const good = await Good.create({
      ownerId: req.user.id,
      name,
      img: req.file.filename,
      price,
    });
    // Scheduling for successful bidder selection.
    const end = new Date();
    end.setDate(end.getDate() + 1); // After 24Hours.
    /*
      Schedules are stored in server memory
      The scheduler disappears when the server is turned off.
    */
    schedule.scheduleJob(end, async () => {
      const success = await Auction.find({
        where: { goodId: good.id },
        order: [['bid', 'DESC']], // Highest bid price.
      });
      await Good.update({ soldId: success.userId }, { where: { id: good.id } });
      await User.update({
        money: sequelize.literal(`money - ${success.bid}`), // SQL Query in sequelize
      }, {
        where: { id: success.userId },
      });
    });
    res.redirect('/');
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.get('/good/:id', isLoggedIn, async (req, res, next) => {
  try {
    const [good, auction] = await Promise.all([
      Good.find({
        where: { id: req.params.id },
        include: {
          model: User,
          as: 'owner',
        },
      }),
      Auction.findAll({
        where: { goodId: req.params.id },
        include: { model: User },
        order: [['bid', 'ASC']],
      }),
    ]);
    res.render('auction', {
      title: `${good.name} - NodeAuction`,
      good,
      auction,
      auctionError: req.flash('auctionError'),
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.post('/good/:id/bid', async (req, res, next) => {
  try {
    const { bid, msg } = req.body;
    const good = await Good.find({
      where: { id: req.params.id },
      include: { model: Auction },
      order: [[{ model: Auction }, 'bid', 'DESC']],
    });
    // When bidding at a price lower than starting price
    if (good.price > bid) {
      return res.status(403).send('You must bid higher than the starting price.');
    }
    // When bidding time ends
    if (new Date(good.createdAt).valueOf() + (24 * 60 * 60 * 1000) < new Date()) {
      return res.status(403).send('The auction has ended.');
    }
    if (good.auctions[0] && good.auctions[0].bid >= bid) {
      return res.status(403).send('Must be higher than previous bid.');
    }
    const result = await Auction.create({
      bid,
      msg,
      userId: req.user.id,
      goodId: req.params.id,
    });
    req.app.get('io').to(req.params.id).emit('bid', {
      bid: result.bid,
      msg: result.msg,
      nickname: req.user.nickname,
    });
    return res.send('ok');
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.get('/list', isLoggedIn, async (req, res, next) => {
  try {
    const goods = await Good.findAll({
      where: { soldId: req.user.id },
      include: { model: Auction },
      order: [[{ model: Auction }, 'bid', 'DESC']],
    });
    res.render('list', { title: 'successful bidding list', goods });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;
