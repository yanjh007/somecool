/**
 *  Multi Layer Time Wheel
 *  OtherDay - Hour - Minute - Second
 */
const
async = require("async");

let 
CUR_TICK = {
    Hour: 0,
    Minute: 0,
    Second: 0,
    Time: 0,
},
// future 0, Hour(1~24), Minite(25~84), Second(85~144) todays job 
JOB_TODAY   = Array(145).fill().map((v,idx)=>({ idx })), 
TM_INTERVAL = 900;

// job queue
const QUE_JOB = async.queue((job,cb)=>{
    let itime = 0 | Date.now()/1000;
    console.log("Job Run:", job.id, job.time, itime);
    cb();
},1);

// add job to time wheell job.time is offset of current time 
// job.time to run in second 
const comparer = (a,b)=>{ return b.time > a.time };

// add job to node 
const addNode = (cnode,job) => {
    let ojob = { job };
    if (cnode.last ) {
        cnode.last.next  = ojob;
    } else { // add to last 
        cnode.first = ojob;
    }

    cnode.last = ojob;
}

const addJob = (job)=>{
    let 
    inow      = (0 | Date.now()/1000),
    itomorrow = (0 | inow / 86400) * 86400 + 86400; 

    if (job.time > itomorrow) { // add to future jobs
        addNode(JOB_TODAY[0], job);
        return;
    } else if (job.time < inow) { // lasted
        // return; // not job
        job.time = inow + 2; // add 2next tick
    }

    // add to hour
    let ihour = 1 + (0 | inow / 3600) % 24; // index time hour
    let jhour = 1 + (0 | job.time / 3600) % 24; // index job hour
    if (ihour !=  jhour) {  // add to last 
        addNode(JOB_TODAY[jhour],job);
        console.log("Job Add Hour:", job.id, jhour);
        return;
    }

    // add to minite same hour
    let  iminute = 25 + ( 0 | inow / 60) % 60; // time hour
    let  jminute = 25 + ( 0 | job.time / 60) % 60; // job hour

    if (iminute !=  jminute) { // other minute
        addNode(JOB_TODAY[jminute],job);
        
        console.log("Job Add Minute:", job.id, job.time, jminute);
        return;
    };

    // current Minute check second
    let isecond = 85 + inow % 60; // time hour
    let jsecond = 85 + job.time % 60; // current job second
    
    if (isecond !=  jsecond) { // other minute
        addNode(JOB_TODAY[jsecond],job);

        console.log("Job Add Second:", job.id, jsecond);
        return;
    };

    // current second run job
    QUE_JOB.push(job);
    console.log("Job Add To Run:", job.id);
}

// check wheel by  
const tickTime = () =>{
    // set current timme
    let 
    itick = 0,
    itime = 0 | Date.now()/1000;

    if (itime == CUR_TICK.Time) return itick;
    
    // current time and index
    CUR_TICK.Time = itime;
    itick |= 1; // tick second

    CUR_TICK.Second = 85 + itime % 60;
    if (CUR_TICK.Second == 85) itick |= 2; // tick Minute
    
    CUR_TICK.Minute = 25 + ( 0 | itime / 60) % 60;
    if (CUR_TICK.Minute == 25) itick |= 4; // tick hour
    
    CUR_TICK.Hour   = 1  + ( 0 | itime / 3600) % 24;

    // return tick type
    return itick;
}

const rejob =()=>{
    let jlist1,jlist2,jhour,
    ibegin = 0 | Date.now() / 86400000 * 86400 + 86400,
    iend   = ibegin + 86400; 

    // travel future list job 
    let cnode = JOB_TODAY[0].first;
    let pnode = JOB_TODAY[0].first;
    while (cnode) {
        if (cnode.time > iend) { // remain in future
            pnode = cnode;
            cnode = cnode.next;
        } else { // add job list 
            jhour = 1 + (0 | cnode.time / 3600) % 24;
            addNode(JOB_TODAY[jhour],cnode.job);

            // first one remove
            if (cnode == JOB_TODAY[0].first) {
                JOB_TODAY[0].first = cnode.next;
                pnode = JOB_TODAY[0].first;
                cnode = JOB_TODAY[0].first;
            } else { // other remove
                pnode.next = cnode.next;
                cnode = cnode.next;
            }
        }
    }  

}

const chkWheel = ()=>{
    // realy tick 
    let itick = tickTime();
    if (itick == 0) return;
    // console.log("Tick", itick, CUR_TICK.Hour, CUR_TICK.Minute, CUR_TICK.Second);

    // current node, minute, second
    let cnode,iminute,isecond,itime;

    // move current hour to Minute
    if (itick & 4) {
        cnode = JOB_TODAY[CUR_TICK.Hour].first;
        while (cnode) {
            iminute = 25 + (0 | cnode.job.time / 60) % 60;             
            addNode(JOB_TODAY[iminute],cnode.job);
            cnode = cnode.next;
        }    
        // clean hour
        JOB_TODAY[CUR_TICK.Hour] = {};

        // reset future job 
        if (CUR_TICK.Hour == 1) rejob();
    }

    // move current minute to second
    if (itick & 2) {
        cnode = JOB_TODAY[CUR_TICK.Minute].first;
        while (cnode) {
            isecond = 85 + cnode.job.time % 60; 
            addNode(JOB_TODAY[isecond],cnode.job);
            cnode = cnode.next;
        }
        // clean Minute
        JOB_TODAY[CUR_TICK.Minute] = {};
    }

    // run current second job
    cnode = JOB_TODAY[CUR_TICK.Second].first;
    while (cnode) {
        QUE_JOB.push(cnode.job);
        cnode = cnode.next;
    }
    // clean second job
    JOB_TODAY[CUR_TICK.Second] = {};
}

const startWheel = (cb)=>{
    // init time
    tickTime();

    // start 
    setInterval(chkWheel, TM_INTERVAL);

    if (cb) CB_JOB = cb;
}

module.exports = { startWheel, addJob  }

// setTimeout(startWheel,1000);

/* Useage sample code

1 import function
const { addJob, startWheel} = require("./timewheel");

2 startwheel with callback function to headle job

startWheel(j=>{
    console.log("Job Fire:", j.title, j.time, 0 | Date.now()/1000);
});

3 addJob object, must set the fire time in second 

let itime =  0 | Date.now()/1000 + 5;
Array(100).fill().map((v,i)=>{
    addJob({ 
        id: "id-" + i, 
        title: "Title-" + i,
        time:   0 | Math.random() * 1000 + itime // some time in future 
    });
});

4 timeWheel


*/