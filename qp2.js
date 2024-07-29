/**
 * 抢位接口处理机制
 * 
 */
const 
cluster = require('cluster'),
numCPUs = 4, // require('os').cpus().length,
EventEmitter = require('events');

// 主进程
if (cluster.isMaster) {
    const 
    HOST = '127.0.0.1',
    PORT = 5000,
    SVKEY   = "signkey",
    TOPEN   = (0 | Date.now() / 60000) + 1 , // 开始时间 
    TCLOSE  = TOPEN + 5, // 结束时间
    JQUEUE  = []; 

    let 
    ISOPEN = false,
    ISFULL = false,
    ISWAIT = false,
    JWAIT   = 1000, // 待定数量
    JCOUNT  = 5000; // 派位数量

    // job event
    const emjobs = new EventEmitter();
    emjobs
    .on("open", ()=>{
        const TSTART = process.hrtime();

        // open and send config
        sendMsg("Open:" + JSON.stringify({ TSTART, SVKEY, JCOUNT, JWAIT }));
    })
    .on("close", ()=>{
        sendMsg("Close:");
    })
    .on('job', (job) => {
        JQUEUE.push(job);
    });

    // 向子进程发送消息
    const sendMsg = (message)=>{
        for (const id in cluster.workers) {
            const worker = cluster.workers[id];
            // console.log(`Worker ${worker.process.pid} is alive`);

            // 向所有子进程发送消息
            worker.send(message);
        }
    };

    // 收到子进程消息
    const onMsg = (msg)=>{
        // console.log(`Master received message from worker ${worker.process.pid}: ${msg}`);
        if (msg.startsWith("Job:")) {
            msg = msg.slice(4);

            emjobs.emit("job",msg);

            if (!ISFULL && !(JCOUNT--)) { // full
                ISFULL = true;
                sendMsg("Full:");
            } else if (!ISWAIT && JCOUNT < JWAIT) {
                ISWAIT = true;
                sendMsg("Wait:");
            };

        } else if (msg.startsWith("System:")) {
            console.log("Get Syscode", msg.slice(6));
        } else {
            console.log("Get Message", msg);
        }
    };

    // check open
    let tcheck = setInterval(()=>{
        if (Date.now()/60000 >= TOPEN) {
            // stop check
            clearInterval(tcheck);

            // emit open
            emjobs.emit("open");

            // close time
            setTimeout(()=>{ emjobs.emit("close"); }, (TCLOSE - TOPEN) * 60000 );
        };
    },1000);

    // 创建子进程
    for (let i = 0; i < numCPUs; i++) cluster.fork().on("message", onMsg);

    // 监听子进程退出事件
    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died`);
    });

    // start web
    sendMsg("Start:"+ JSON.stringify({ HOST, PORT }));

    // job service // job queue
    const jservice = ()=>{
        let isRunning = false;

        const doJob = (job)=> new Promise(r=>{
            setTimeout(()=>{ r(job) },100+ Math.random()*400);
        });

        const checkRun = async()=>{
            // is running
            if (isRunning) return;

            let r,job = JQUEUE.pop();

            if (job) {
                isRunning = true;

                r = await doJob(job);
                console.log("Job Done", r);

                isRunning = false;
            } 
        }

        setInterval(checkRun, 1000);
    }; jservice();
   
    console.log(`Master ${process.pid} is running for ${numCPUs} worker` );
    return;
}

// http server
const 
http   = require('http'),
crypto = require("crypto");

let TSTART, SVKEY, 
ISTATUS = 0,
ISOPEN  = false, 
ISFULL  = false, // pool is full response wait 
ISWAIT  = false; // pool is full response wait 

const handleReq =  (req,res)=>{
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');

    if (ISOPEN) {
        if (req.url.startsWith("/reg/")) {
            let tend,qid = req.url.split("/reg/")[1];
            // simulate random
            // qid = (Date.now() % 10000000).toString(16) + Math.random().toString(16).slice(2,6);

            tend = process.hrtime(TSTART);

            // time string
            qid =  (((tend[0] * 1e9 + tend[1]) / 1e3) >>>0 ).toString(32).padStart(8,"0") ; // nano

            // client id 
            qid += "-" + Math.random().toString(36).slice(2,6);

            // sign 
            qid += "-"+crypto.createHmac("SHA1",SVKEY).update(qid).digest("hex");
            
            // to master handle job
            process.send("Job:"+ qid);

            if (ISFULL) {
                res.end("FULL:"+ qid); // should sign
            } else if (ISWAIT) {
                res.end("WAIT:" + qid); // should sign
            } else {
                res.end("OK:" + qid); // should sign
            }
        } else {
            // res.statusCode = 301;
            res.end("ERR:Format");
        }
    } else {
        res.end('ERR:NotOpen');
    }
}

// 监听主进程的消息
process.on('message', (msg) => {
    console.log("Master Message:", msg);

    if (msg.startsWith("Start:")) { // start web service 
        let {HOST, PORT } = JSON.parse(msg.slice(6));
        http.createServer(handleReq).listen( PORT, HOST, () => {
            console.log(`Server running at ${HOST}:${PORT}/`);
        });
    } else if (msg.startsWith("Open:")) { // open service
        ISOPEN = true;
        ({ TSTART, SVKEY } = JSON.parse(msg.slice(5)));
        console.log(TSTART,SVKEY);

        SVKEY = Buffer.from(SVKEY);
    } else if (msg.startsWith("Close:")) { // close service
        ISOPEN = false;            
    } else if (msg.startsWith("Full:")) { // full 
        ISFULL = true;
    } else if (msg.startsWith("Wait:")) { // wait 
        ISWAIT = true;
    }
});

// test 
// autocannon -c 800 -d 20 http://localhost:5000/reg/0000
