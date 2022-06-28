
const
{ MinHeap } = require("./mheap"),
NUM_SLOT  = 32, // wheel slot number 
TM_WHEEL  = {}; // wheel array

let CB_JOB, 
TM_INTERVAL = 900;

// add job to time wheell job.time is offset of current time 
// job.time to run in second 
const comparer = (a,b)=>{ return b.time > a.time };
const addJob = (job)=>{
    // slot index 
    let ipos =  job.time % NUM_SLOT;

    // add to time wheel, use minheap foreach wheel item
    if (!TM_WHEEL[ipos]) TM_WHEEL[ipos] = new MinHeap(comparer);

    TM_WHEEL[ipos].add(job);

    console.log("Job added:", job.id, ipos);
}

// check wheel by  
const chkWheel = ()=>{
    let ipos = (0 | Date.now() / 1000) % NUM_SLOT;
    if (TM_WHEEL[ipos]) while (item = TM_WHEEL[ipos].pop({ time: 0 | Date.now()/1000 + 1 })) {
        if (CB_JOB ) CB_JOB(item);
    };
}

const startWheel = (cb)=>{
    setInterval(chkWheel, TM_INTERVAL);

    if (cb) CB_JOB = cb;
}

module.exports = { startWheel, addJob  }

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


*/
