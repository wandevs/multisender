var UpgradebleStormSender = artifacts.require("./UpgradebleStormSender.sol");

module.exports = function(deployer) {
  deployer.deploy(UpgradebleStormSender);
};
