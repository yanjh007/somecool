const bs58 = require('bs58');

const atext = JSON.stringify({
    address: "China中国"
});

const address = bs58.encode(Buffer.from(atext));

console.log("b58:",address);
// => 16UjcYNBG9GTK4uq2f7yYEbuifqCzoLMGS

const otext = Buffer.from(bs58.decode(address)).toString("utf-8");
console.log("original text:", otext);

// const address = '16UjcYNBG9GTK4uq2f7yYEbuifqCzoLMGS'
// const bytes = bs58.decode(address)
// // See uint8array-tools package for helpful hex encoding/decoding/compare tools
// console.log(Buffer.from(bytes).toString('hex'))
// => 003c176e659bea0f29a3e9bf7880c112b1b31b4dc826268187