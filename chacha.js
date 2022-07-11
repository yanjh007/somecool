const crypto = require("crypto");

let ALGO = {
    Name: "chacha20-poly1305",
    tagLength: 16,
    ivLength: 12
}

// data to encrypto
let ptext = "China中国";

// 256-bit key and 96-bit iv
let key   = Buffer.alloc(32, 0x01); // 256bit key
let iv    = crypto.randomBytes(ALGO.ivLength);
let aData = crypto.randomBytes(ALGO.tagLength);

// some data to encrypt

// construct the cipher and set AAD
let cipher = crypto
    .createCipheriv(ALGO.Name , key, iv, { authTagLength: ALGO.tagLength })
    .setAAD(aData);
    
let ctext = Buffer.concat([
    cipher.update(ptext, 'utf-8'),
    cipher.final(),
    cipher.getAuthTag(),
    iv,aData]).toString("base64");

console.log("Encrypted:", ctext);
// return;

let barray = Buffer.from(ctext,"base64");
let adata2 = barray.slice(-ALGO.tagLength);
let iv2    = barray.slice(-(ALGO.ivLength+ALGO.tagLength), -ALGO.tagLength);
let tag2   = barray.slice(-(ALGO.ivLength+2*ALGO.tagLength),-(ALGO.ivLength+ALGO.tagLength));
barray = barray.slice(0,-(ALGO.ivLength+2*ALGO.tagLength));

// validate the MAC is ok => this will throw an
// exception if the cipher, assoc data, or auth tag are
// inaccurate
try {
    // create decipher
    let decipher = crypto.createDecipheriv(ALGO.Name, key, iv2, { authTagLength: ALGO.tagLength })
        .setAuthTag(tag2)
        .setAAD(adata2);

    let otext = decipher.update(barray).toString("utf-8");
    decipher.final();
    
    console.log("Decrypt:", otext);    
} catch (err) {
    console.error(err.message);
}
