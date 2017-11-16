# Solum contracts

## Development
For development (run tests) need node.js version >= v7.10.0

* Install testRPC

```
npm install -g ethereumjs-testrpc
```

* Install dependencies

```
npm i
```

```
npm run test
```

### testRPC run examle
```
testrpc -p 6083 --account="0xc449f31ec797799dd5d19d69b5fffc0749ca0747a5a4b29a25c13a8257bd84b1,1000000000000000000000000" --account="0x7d158041e9309d17c10800e7e8a7689cf6a7fb0c6c2212abf3cbda2c476b0a46,1000000" --account="0x5893942de7ed423ac2904c12416969814fe6bedf8a87d69b9fb8f0dce5fc265c,100000000" --account="0xd1632e469d739c94cae6dbba8f714793f8cbce5af80940ed9556b0b2b5c59,99999000000000000000000" --account="0x5bc720911b898a4674daf580447b5e5f24ed3a9890241c1a9f51443188fca2a6,100000000000000000000" --account="0x99c3c8be5e79b025f024e6e00ce6780601830be6916a68923ac8c32aa922a601,100000000000000000000" --locked=true
```