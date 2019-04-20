const { Good, Auction, User, sequelize } = require('./models');

module.exports = async () => {
  try {
    const targets = await Good.findAll({
      where: {
        soldId: null,
      },
    });
    targets.forEach(async (target) => {
      const end = new Date(target.createdAt);
      end.setHours(end.getHours() + target.end);
      if (new Date() > end) {
        const success = await Auction.find({
          where: { goodId: target.id },
          order: [['bid', 'DESC']],
        });
        await Good.update({ soldId: success.userId }, { where: { id: target.id } });
        await User.update({
          money: sequelize.literal(`money - ${success.bid}`),
        }, {
          where: { id: success.userId },
        });
      } else {
        schedule.scheduledJobs(end, async() => {
          const success = await Auction.find({
            where: { goodId: target.id },
            order: [['bid', 'DESC']], // Highest bid price.
          });
          await Good.update({ soldId: success.userId }, { where: { id: target.id } });
          await User.update({
            money: sequelize.literal(`money - ${success.bid}`), // SQL Query in sequelize
          }, {
            where: { id: success.userId },
          });
        });
      }
    });
  } catch (error) {
    console.error(error);
  }
};
