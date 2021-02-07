# multisender in wanchain

# Problem:
Previously in Wanchain Network, additional tools were required in order to transfer many ERC20 tokens at once.
Many people still do this manually, one transaction at a time. This process is time consuming and prone to an error.

# Solution:
This Dapp allows a user to send thousands of token transfers in a very effecient way by batching them in groups of 145 token transfers per Wanchain transaction. This automation saves time by automatically generating transactions to wanmask. Finally, this tool allows a user to maintain security of their account by delegating the trust of their private keys to a secure wanmask wallet.

# How to use:
1. Install [wanmask](https://wanmask.io).
2. Make sure you have an account in wanmask which has a token balance.
3. Make sure your wanmask is pointed to the network that you would like to use.
4. Make sure your wanmask account is unlocked.
5. Go to OUR site.
6. Wait for the full page to load.
7. Select a token from the dropdown that you would like to send.
8. Provide either JSON or CSV text in the textarea (see example below).
9. Click next.
10. If everything looks good, click next once again.
11. Wait for wanmask to generate an approval transaction.
12. Once the approval transaction is mined, wanmask will generate as many transactions as needed for your token transfers (145 addresses per tx).
13. Done!

You can test this tool on any test network, if you want to make sure that
everything will work as expected.

Contracts deployed wanchain:
```
testnet:  0xf82FAcD9C905abc3484fc2165c7538C50EF1629d
mainnet:  0xf82FAcD9C905abc3484fc2165c7538C50EF1629d
```
 
```
Example CSV:
```csv
0xCBA5018De6b2b6F89d84A1F5A68953f07554765e,12
0xa6Bf70bd230867c870eF13631D7EFf1AE8Ab85c9,1123.45645
0x00b5F428905DEA1a67940093fFeaCeee58cA91Ae,1.049
0x00fC79F38bAf0dE21E1fee5AC4648Bc885c1d774,14546
```

Thanks to: 

multisender.app
https://github.com/rstormsf/multisender
