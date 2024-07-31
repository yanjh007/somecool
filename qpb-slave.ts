import { serve } from "bun";
import { createHmac } from "crypto";

const slaveID = Math.random().toString(36).slice(2,8);

let TSTART, SVKEY,
ISOPEN  = true,
ISFULL  = false, // pool is full response wait
ISWAIT  = false; // pool is full response wait

const DOPT = {
    status: 200,
    headers :{
        'Content-Type': 'text/plain'
    }
};

const handleReq = async (req)=>{
    let rtext;

    if (ISOPEN) {
        if (req.url.indexOf("/reg/") > -1) {
            let tend,qid = req.url.split("/reg/")[1];
            // simulate random
            // qid = (Date.now() % 10000000).toString(16) + Math.random().toString(16).slice(2,6);

            tend = process.hrtime(TSTART);

            // time string
            qid =  (((tend[0] * 1e9 + tend[1]) / 1e3) >>>0 ).toString(32).padStart(8,"0") ; // nano

            // client id
            qid += "-" + Math.random().toString(36).slice(2,6);

            // sign
            qid += "-" + Buffer.from(createHmac("SHA1",SVKEY).update(qid).digest().reduce((c,v,i)=>(c[i%4]^=v,c),[])).toString("hex");

            // to master handle job

            if (ISFULL) {
                rtext = "FULL:" + qid; // should sign
            } else if (ISWAIT) {
                rtext = "WAIT:" + qid; // should sign
                process.send({ code: "job", content: qid });
            } else {
                rtext = "OK:" + qid; // should sign
                process.send({ code: "job", content: qid });
            }
        } else {

            // res.statusCode = 301;
            rtext = "ERR:Format";
        }
    } else {
        rtext = "ERR:NotOpen";
    };

    return new Response(rtext, DOPT);
};

process.on("message", (message) => {
  // print message from parent
  // console.log("From Master:",message);

  switch(message?.code) {
    case "start":

     SVKEY = message.SVKEY;
     serve({
       hostname: message.HOST || "127.0.0.1" ,
       port: message.PORT || 6080,
       development: false,
       reusePort: true, // Share the same port across multiple processes This is the important part!
       fetch: handleReq
     });
    break;

  }
});

process.send("SlaveOK:"+slaveID);
