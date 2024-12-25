import { spawn } from "bun";

const cpus = navigator.hardwareConcurrency; // Number of CPU cores
const buns = new Array(cpus);

console.log("Bun Cluster:", cpus);

const
FSLAVE = "./qpb-slave.ts", // slave file
SVKEY = Buffer.from("serverkey"),
HOST  = "0.0.0.0",
PORT  = 6080,
JQUEUE = [];

let rjob,isJobbing = false;
const doJob = async()=>{
    if (isJobbing) return;

    while(1) {
        let job = JQUEUE.shift();
        if (!job) break;

        isJobbing = true;

        rjob = await new Promise(r=>{
           setTimeout(()=>{
                r("Done:" + job);
           }, 200 + Math.random(300));
        });

        console.log("Done:", rjob);
        isJobbing = false;
    };
};

const onMessage = (msg)=>{
   switch(msg?.code) {
     case "job": JQUEUE.push(msg.content); doJob();  break;
   }
};


for (let i = 0; i < cpus; i++) {
  buns[i] = spawn({
    cmd: ["bun", FSLAVE],
    ipc: onMessage,
    stdout: "inherit",
    stderr: "inherit",
    stdin: "inherit",
  });
}

// send message to slaves
function sendSlave(msg) {
  for (const bun of buns) bun.send(msg);
};

// kill slaves
function kill() {
  for (const bun of buns) bun.kill();
}

setTimeout(()=>{
   sendSlave({ code: "start", SVKEY, HOST, PORT } );
},1000);

process.on("SIGINT", kill);
process.on("exit", kill);
