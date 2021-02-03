var UpgradebleStormSender = artifacts.require("./UpgradebleStormSender.sol");

module.exports = async function(deployer) {
  await deployer.deploy(UpgradebleStormSender);
  let upgradebleStormSender = await UpgradebleStormSender.at('0xf82FAcD9C905abc3484fc2165c7538C50EF1629d');
  await upgradebleStormSender.initialize('0xd98cb0c4e26be727fc05c3d5405d83851494098a', {gas: 200000});
};
